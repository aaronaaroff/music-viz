import React, { useState, useRef, useEffect, useCallback } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Button } from "@/ui/components/Button";
import { FeatherSave } from "@subframe/core";
import { FeatherExpand } from "@subframe/core";
import { FeatherPlus } from "@subframe/core";
import { FeatherShare } from "@subframe/core";
import { FeatherLink } from "@subframe/core";
import { FeatherGlobe } from "@subframe/core";
import { Popover, PopoverItem } from "@/components/Popover";
import { Select } from "@/ui/components/Select";
import { FeatherMusic, FeatherMic } from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherSkipBack } from "@subframe/core";
import { FeatherPlay } from "@subframe/core";
import { FeatherPause } from "@subframe/core";
import { FeatherSkipForward } from "@subframe/core";
import { Slider } from "@/ui/components/Slider";
import { Tabs } from "@/ui/components/Tabs";
import { FeatherSettings } from "@subframe/core";
import { FeatherSliders } from "@subframe/core";
import { FeatherZap } from "@subframe/core";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { TextField } from "@/ui/components/TextField";
import { TextArea } from "@/ui/components/TextArea";
import { Switch } from "@/ui/components/Switch";
import { AudioSourceSelector } from "@/components/AudioSourceSelector";
import { AudioLevelMeter } from "@/components/AudioLevelMeter";
import { PianoKeyboard } from "@/components/PianoKeyboard";
import { useAudioManager } from "@/hooks/useAudioManager";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
import { useVisualization } from "@/hooks/useVisualization";
import { AudioSourceType } from "@/audio/types";
import { FileSource } from "@/audio/sources/FileSource";
import { MicrophoneSource } from "@/audio/sources/MicrophoneSource";
import { KeyboardSource } from "@/audio/sources/KeyboardSource";
import { VisualizationCanvas } from "@/visualizers/VisualizationCanvas";
import { VisualizationType, ColorTheme } from "@/visualizers/types";
import { useAuth } from "@/components/auth/AuthContext";
import { getNextDraftNumber, shareVisualization, unshareVisualization, generateShareableUrl } from "@/lib/api/visualizations";
import { robustCreateVisualization, robustUpdateVisualization } from "@/lib/api/robustOperations";
import { uploadAudioFile, loadAudioFileFromUrl } from "@/lib/api/audioFiles";
import { supabase } from "@/lib/supabase";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useDocumentTitle, getPageTitle } from "@/hooks/useDocumentTitle";

function MusicVizUpload() {
  const [currentSourceType, setCurrentSourceType] = useState<AudioSourceType>(AudioSourceType.FILE);
  const [activeTab, setActiveTab] = useState<string>("style");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: "" });
  const [currentAudioFile, setCurrentAudioFile] = useState<File | null>(null);
  const [currentAudioFileUrl, setCurrentAudioFileUrl] = useState<string>("");
  const [currentAudioFilePath, setCurrentAudioFilePath] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [visualizationName, setVisualizationName] = useState<string>("Visualization 1");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [currentVisualizationId, setCurrentVisualizationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: "" });
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: "" });
  const [isCurrentVizPublic, setIsCurrentVizPublic] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keyboardSourceRef = useRef<KeyboardSource | null>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track tab focus for better save UX
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        (window as any).lastTabReturn = Date.now();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  const { state, setSource, startAnalysis, stopAnalysis, setVolume } = useAudioManager();
  
  const { user } = useAuth();
  const { saveSession, loadSession, clearSession } = useSessionPersistence();
  const { preferences } = useUserPreferences();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Update document title based on visualization name
  const documentTitle = visualizationName 
    ? getPageTitle(visualizationName)
    : getPageTitle('Create');
  useDocumentTitle(documentTitle);
  
  // Visualization system
  const {
    settings: visualizationSettings,
    updateSettings,
    setVisualizationType,
    setColorTheme,
    setSensitivity,
    setSmoothing,
    setSizeScale,
    setParticleCount,
    setGlowIntensity,
    setBackgroundOpacity,
    setRotationSpeed,
    togglePulseBeatSync,
    toggleFlashOnset,
  } = useVisualization();
  
  const {
    activeNote,
    activeNotes,
    startKeyboard,
    stopKeyboard,
    handleNoteOn,
    handleNoteOff,
    keyboardMapping,
    keyboardSource,
    keyboardSourceRef: hookKeyboardSourceRef,
    isKeyboardEnabled,
  } = useKeyboardInput();
  
  const handleCreateNew = useCallback(() => {
    if (user) {
      const shouldSave = window.confirm("Would you like to save your current project before creating a new one?");
      if (shouldSave) {
        return; // User can save manually and then click Create New again
      }
    }
    
    // Navigate to main page with new project parameter
    navigate('/?new=true');
  }, [user, navigate]);
  
  // Load saved session on mount or load visualization from URL
  useEffect(() => {
    const handleInitialLoad = async () => {
      // Check for load parameter in URL
      const urlParams = new URLSearchParams(location.search);
      const loadVisualizationId = urlParams.get('load');
      const shouldCreateNew = urlParams.get('new') === 'true';
      
      if (loadVisualizationId) {
        try {
          
          // Fetch the visualization from database
          let visualization = null;
          let error = null;
          
          if (user) {
            // If user is logged in, try to load their own visualization first
            const userResult = await supabase
              .from('visualizations')
              .select('*')
              .eq('id', loadVisualizationId)
              .eq('user_id', user.id)
              .single();
              
            if (!userResult.error) {
              visualization = userResult.data;
            } else {
              // Fall back to public visualizations
              const publicResult = await supabase
                .from('visualizations')
                .select('*')
                .eq('id', loadVisualizationId)
                .eq('is_public', true)
                .single();
                
              visualization = publicResult.data;
              error = publicResult.error;
            }
          } else {
            // If user is not logged in, only try public visualizations
            const publicResult = await supabase
              .from('visualizations')
              .select('*')
              .eq('id', loadVisualizationId)
              .eq('is_public', true)
              .single();
              
            visualization = publicResult.data;
            error = publicResult.error;
          }
          
          if (error) {
            console.error('Error loading visualization:', error);
            setSaveStatus({ type: 'error', message: 'Failed to load visualization' });
          } else if (visualization) {
            
            // Clear any existing session first
            clearSession();
            
            // Load the visualization data
            const isOwnedByUser = user && visualization.user_id === user.id;
            
            if (isOwnedByUser) {
              // User owns this visualization - allow editing
              setCurrentVisualizationId(visualization.id);
              setVisualizationName(visualization.title);
              setIsCurrentVizPublic(visualization.is_public);
              
              // Restore tags
              if (visualization.tags && Array.isArray(visualization.tags)) {
                setSelectedTags(visualization.tags);
              }
              
              // Apply visualization settings
              if (updateSettings) {
                updateSettings(visualization.settings);
              }
              
              // Save as current session for editing
              saveSession({
                visualizationId: visualization.id,
                visualizationName: visualization.title,
                settings: visualization.settings,
                tags: visualization.tags || [],
                isPublic: visualization.is_public,
                audioSource: visualization.audio_file_name ? {
                  type: 'file' as any,
                  fileName: visualization.audio_file_name,
                  audioFileUrl: visualization.audio_file_url
                } : undefined
              });
            } else {
              // Public visualization not owned by user - view only
              setCurrentVisualizationId(null);
              setVisualizationName(visualization.title + " (View Only)");
              
              // Apply visualization settings for view-only mode too
              if (updateSettings) {
                updateSettings(visualization.settings);
              }
              
              // Apply tags and other settings for view-only mode
              if (visualization.tags && Array.isArray(visualization.tags)) {
                setSelectedTags(visualization.tags);
              }
              
              // Don't save to session for view-only mode
              clearSession();
            }
            
            if (visualization.audio_file_name) {
              setUploadedFileName(visualization.audio_file_name);
              setCurrentAudioFileUrl(visualization.audio_file_url || '');
              // Clear any pending file upload since we're loading from URL
              setCurrentAudioFile(null);
              
              // Restore audio file from Supabase Storage if available
              if (visualization.audio_file_url) {
                try {
                  // Load audio file from URL and recreate audio source
                  const audioFile = await loadAudioFileFromUrl(
                    visualization.audio_file_url, 
                    visualization.audio_file_name,
                    visualization.audio_file_hash || undefined
                  );
                  
                  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const fileSource = new FileSource(audioContext);
                  await fileSource.loadFile(audioFile);
                  await setSource(fileSource, AudioSourceType.FILE);
                  setCurrentSourceType(AudioSourceType.FILE);
                  setDuration(fileSource.getDuration());
                  setCurrentTime(0);
                } catch (audioError) {
                  console.warn('Failed to restore audio file:', audioError);
                  // Continue without audio - user can re-upload if needed
                }
              }
            }
            
            setSaveStatus({ type: 'success', message: 'Visualization loaded successfully!' });
            
            // Clear the URL parameter
            window.history.replaceState({}, '', '/');
          }
        } catch (error) {
          console.error('Error loading visualization:', error);
          setSaveStatus({ type: 'error', message: 'Failed to load visualization' });
        }
      } else if (shouldCreateNew && !loadVisualizationId) {
        // Create new project ONLY if not loading an existing one
        clearSession();
        setCurrentVisualizationId(null);
        setUploadedFileName("");
        setCurrentAudioFile(null);
        setCurrentAudioFileUrl("");
        setCurrentAudioFilePath("");
        setCurrentTime(0);
        setDuration(0);
        setUploadFeedback({ type: null, message: "" });
        setSaveStatus({ type: null, message: "" });
        setCurrentSourceType(AudioSourceType.FILE);
        // Use user preference for default privacy, fallback to false
        setIsCurrentVizPublic(preferences?.default_viz_privacy === 'public' || false);
        
        // Stop any current audio
        if (state.currentSource) {
          stopAnalysis();
        }
        
        // Generate unique name for new project
        if (user) {
          try {
            const nextNumber = await getNextDraftNumber(user.id);
            setVisualizationName(`Visualization ${nextNumber}`);
          } catch (error) {
            console.error('Error getting next draft number:', error);
            setVisualizationName(`Visualization ${Date.now()}`);
          }
        } else {
          setVisualizationName("Visualization 1");
        }
        
        // Reset visualization settings using user preferences or defaults
        if (updateSettings) {
          updateSettings({
            type: (preferences?.default_visualization_type as VisualizationType) || VisualizationType.CIRCLE,
            colorTheme: (preferences?.default_color_theme as ColorTheme) || ColorTheme.NEON,
            sensitivity: preferences?.default_sensitivity || 0.7,
            smoothing: preferences?.default_smoothing || 0.8,
            sizeScale: 0.8,
            particleCount: 64,
            glowIntensity: 0.6,
            backgroundOpacity: 0.05,
            rotationSpeed: 0.2,
            pulseBeatSync: true,
            flashOnset: true
          });
        }
        
        // Clean up URL by removing the new parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('new');
        window.history.replaceState({}, '', newUrl.toString());
      } else {
        // No URL parameter, try to load saved session
        const savedSession = loadSession();
        if (savedSession) {
          
          // Restore visualization state
          if (savedSession.visualizationId) {
            setCurrentVisualizationId(savedSession.visualizationId);
          }
          if (savedSession.visualizationName) {
            setVisualizationName(savedSession.visualizationName);
          }
          if (savedSession.tags) {
            setSelectedTags(savedSession.tags);
          }
          if (savedSession.isPublic !== undefined) {
            setIsCurrentVizPublic(savedSession.isPublic);
          }
          if (savedSession.audioSource?.fileName) {
            setUploadedFileName(savedSession.audioSource.fileName);
            if (savedSession.audioSource.audioFileUrl) {
              setCurrentAudioFileUrl(savedSession.audioSource.audioFileUrl);
              // Clear any pending file upload since we're loading from URL
              setCurrentAudioFile(null);
              
              // Restore audio file from Supabase Storage
              const restoreAudioFromSession = async () => {
                try {
                  if (savedSession.audioSource?.audioFileUrl) {
                    const audioFile = await loadAudioFileFromUrl(
                      savedSession.audioSource.audioFileUrl,
                      savedSession.audioSource.fileName || 'audio.mp3'
                    );
                  
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const fileSource = new FileSource(audioContext);
                    await fileSource.loadFile(audioFile);
                    await setSource(fileSource, AudioSourceType.FILE);
                    setCurrentSourceType(AudioSourceType.FILE);
                    setDuration(fileSource.getDuration());
                    setCurrentTime(0);
                  }
                } catch (audioError) {
                  console.warn('Failed to restore audio from session:', audioError);
                }
              };
              
              // Run async restoration
              restoreAudioFromSession();
            }
          }
          // Settings will be restored after visualization hook is initialized
        }
      }
    };
    
    handleInitialLoad();
  }, [location.search, user]);

  // Initialize draft number when user is available
  useEffect(() => {
    const initializeDraftNumber = async () => {
      // Only initialize if we don't have a saved session
      const savedSession = loadSession();
      if (user && visualizationName === "Visualization 1" && !savedSession) {
        try {
          const nextNumber = await getNextDraftNumber(user.id);
          setVisualizationName(`Visualization ${nextNumber}`);
        } catch (error) {
          console.error('Error getting next draft number:', error);
        }
      }
    };

    initializeDraftNumber();
  }, [user, loadSession]);
  

  // Restore visualization settings from saved session or loaded visualization
  useEffect(() => {
    const savedSession = loadSession();
    if (savedSession?.settings && updateSettings) {
      updateSettings(savedSession.settings);
    }
  }, [updateSettings, loadSession, currentVisualizationId]);

  // TODO: Restore audio file from Supabase Storage when visualization is loaded

  // Auto-save session state
  useEffect(() => {
    const saveCurrentSession = () => {
      saveSession({
        visualizationId: currentVisualizationId,
        visualizationName,
        settings: visualizationSettings,
        tags: selectedTags,
        isPublic: isCurrentVizPublic,
        audioSource: uploadedFileName ? {
          type: currentSourceType as any,
          fileName: uploadedFileName,
          audioFileUrl: currentAudioFileUrl
        } : undefined
      });
    };

    // Save on state changes (debounced)
    const timeoutId = setTimeout(saveCurrentSession, 500);

    // Also save when tab is hidden
    const handleSaveEvent = () => saveCurrentSession();
    window.addEventListener('saveSessionState', handleSaveEvent);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('saveSessionState', handleSaveEvent);
    };
  }, [
    currentVisualizationId, 
    visualizationName, 
    visualizationSettings, 
    uploadedFileName, 
    currentSourceType, 
    selectedTags,
    isCurrentVizPublic,
    currentAudioFileUrl,
    saveSession
  ]);
  
  // Keyboard source is managed by the useKeyboardInput hook


  const handleSourceChange = async (sourceType: AudioSourceType) => {
    // Stop current analysis
    if (state.isPlaying) {
      stopAnalysis();
    }

    // Don't reset file upload state - preserve it for when user switches back
    if (sourceType !== AudioSourceType.FILE) {
      // Only clear feedback, not the file name
      setUploadFeedback({ type: null, message: "" });
      stopTimeTracking();
    }

    setCurrentSourceType(sourceType);
    
    if (typeof window === 'undefined') return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
      switch (sourceType) {
        case AudioSourceType.FILE:
          // If we have a saved audio file URL, restore it
          if (currentAudioFileUrl && uploadedFileName) {
            try {
              const audioFile = await loadAudioFileFromUrl(currentAudioFileUrl, uploadedFileName);
              const fileSource = new FileSource(audioContext);
              await fileSource.loadFile(audioFile);
              await setSource(fileSource, AudioSourceType.FILE);
              setDuration(fileSource.getDuration());
              setCurrentTime(0);
              setUploadFeedback({ 
                type: 'success', 
                message: `Restored ${uploadedFileName}` 
              });
            } catch (error) {
              console.warn('Failed to restore audio file:', error);
              // If restoration fails, clear the file state
              setUploadedFileName("");
              setCurrentAudioFileUrl("");
            }
          }
          break;
          
        case AudioSourceType.MICROPHONE:
          // Create microphone source exactly like file upload does
          const micSource = new MicrophoneSource(audioContext);
          const hasPermission = await micSource.requestPermission();
          if (hasPermission) {
            await micSource.start(); // Start the microphone source
            await setSource(micSource, sourceType);
            // Auto-start analysis for microphone (unlike file which requires play button)
            await startAnalysis();
          }
          break;
          
        case AudioSourceType.KEYBOARD:
          // Create keyboard source exactly like file upload does
          const kbSource = new KeyboardSource(audioContext);
          await kbSource.start();
          await setSource(kbSource, sourceType);
          // Auto-start analysis for keyboard (unlike file which requires play button)
          await startAnalysis();
          break;
      }
    } catch (error) {
      console.error('Failed to set audio source:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || typeof window === 'undefined') return;

    // Reset feedback
    setUploadFeedback({ type: null, message: "" });

    // File size validation (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setUploadFeedback({ 
        type: 'error', 
        message: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.` 
      });
      return;
    }

    // File type validation
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(mp3|wav|ogg|m4a)$/)) {
      setUploadFeedback({ 
        type: 'error', 
        message: 'Unsupported file format. Please use MP3, WAV, OGG, or M4A files.' 
      });
      return;
    }

    try {
      // Create audio source first
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileSource = new FileSource(audioContext);
      await fileSource.loadFile(file);
      await setSource(fileSource, AudioSourceType.FILE);
      setCurrentSourceType(AudioSourceType.FILE);
      
      // Set file info
      setUploadedFileName(fileSource.getFileName());
      setDuration(fileSource.getDuration());
      setCurrentTime(0);
      
      // Store the file for upload when saving
      setCurrentAudioFile(file);
      
      // Clear old audio file URL since we have a new file to upload
      setCurrentAudioFileUrl("");
      setCurrentAudioFilePath("");
      
      setUploadFeedback({ 
        type: 'success', 
        message: `Successfully loaded ${file.name}` 
      });

      // File loaded successfully, will upload to storage on save
    } catch (error) {
      setUploadFeedback({ 
        type: 'error', 
        message: `Failed to load audio file: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      console.error('Failed to load audio file:', error);
    }
  };

  // Helper function to format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update current time for file playback
  const updateCurrentTime = () => {
    if (state.currentSource && currentSourceType === AudioSourceType.FILE) {
      const fileSource = state.currentSource as FileSource;
      if (fileSource.getCurrentTime && fileSource.getDuration) {
        setCurrentTime(fileSource.getCurrentTime());
        setDuration(fileSource.getDuration());
      }
    }
  };

  // Start time tracking when playing
  const startTimeTracking = () => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
    }
    timeUpdateIntervalRef.current = setInterval(updateCurrentTime, 100);
  };

  // Stop time tracking
  const stopTimeTracking = () => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  };

  const handlePlayPause = async () => {
    if (state.isPlaying) {
      stopAnalysis();
      stopTimeTracking();
    } else if (state.currentSource) {
      try {
        await startAnalysis();
        if (currentSourceType === AudioSourceType.FILE) {
          startTimeTracking();
        }
      } catch (error) {
        console.error('Failed to start audio analysis:', error);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (state.currentSource && currentSourceType === AudioSourceType.FILE) {
      const fileSource = state.currentSource as FileSource;
      if (fileSource.seek) {
        const seekTime = (value[0] / 100) * duration;
        fileSource.seek(seekTime);
        setCurrentTime(seekTime);
      }
    }
  };


  // Cleanup time tracking on unmount
  useEffect(() => {
    return () => {
      stopTimeTracking();
    };
  }, []);

  // Handle name editing
  const handleNameClick = () => {
    setIsEditingName(true);
  };

  const handleNameChange = (newName: string) => {
    if (newName.trim()) {
      setVisualizationName(newName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      handleNameChange(target.value);
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setSaveStatus({ type: 'error', message: 'Please sign in to save your visualization' });
      return;
    }

    setIsSaving(true);
    setSaveStatus({ type: null, message: "Preparing to save..." });
    
    // First check if tables exist
    try {
      const { error: tableError } = await supabase.from('visualizations').select('count').limit(1);
      if (tableError && tableError.code === '42P01') {
        setSaveStatus({ 
          type: 'error', 
          message: 'Database not set up. Please see SUPABASE_SETUP_COMPLETE.md' 
        });
        setIsSaving(false);
        return;
      }
    } catch (err) {
      console.error('Database check error:', err);
    }

    try {
      // Upload audio file to storage if we have one and it's not already uploaded
      let audioFileUrl = currentAudioFileUrl;
      let audioFileHash: string | undefined;
      let audioFileId: string | undefined;
      
      // Upload if we have a new file and no current URL (URL gets cleared when new file is uploaded)
      if (currentAudioFile && !currentAudioFileUrl) {
        try {
          const uploadResult = await uploadAudioFile({
            file: currentAudioFile,
            userId: user.id,
            visualizationId: currentVisualizationId ?? undefined
          });
          
          audioFileUrl = uploadResult.url;
          audioFileHash = uploadResult.fileHash;
          audioFileId = uploadResult.fileId;
          setCurrentAudioFileUrl(uploadResult.url);
          setCurrentAudioFilePath(uploadResult.path);
        } catch (uploadError) {
          console.error('Failed to upload audio file:', uploadError);
          // Continue with save but without audio URL
        }
      }

      const visualizationData = {
        title: visualizationName,
        description: "Created with Music Visualizer",
        settings: {
          ...visualizationSettings,
          audioSource: currentSourceType,
          audioFileName: uploadedFileName || null,
        },
        audio_file_name: uploadedFileName ?? undefined,
        audio_file_url: audioFileUrl || undefined,
        audio_file_hash: audioFileHash,
        audio_file_id: audioFileId,
        is_public: isCurrentVizPublic,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      };

      if (currentVisualizationId) {
        // Update existing visualization with retry logic
        const { error } = await robustUpdateVisualization(currentVisualizationId, visualizationData);
        
        if (error) {
          throw new Error(error.message);
        }
        
        setSaveStatus({ type: 'success', message: 'Visualization updated successfully!' });
      } else {
        // Create new visualization with retry logic
        const { data, error } = await robustCreateVisualization(visualizationData);
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data) {
          setCurrentVisualizationId(data.id);
          setSaveStatus({ type: 'success', message: 'Visualization saved successfully!' });
          
          // Update session with new ID
          saveSession({
            visualizationId: data.id,
            visualizationName,
            settings: visualizationSettings,
            tags: selectedTags,
            audioSource: uploadedFileName ? {
              type: currentSourceType as any,
              fileName: uploadedFileName,
              audioFileUrl: currentAudioFileUrl
            } : undefined
          });
        }
      }
    } catch (error) {
      console.error('Error saving visualization:', error);
      setSaveStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to save visualization' 
      });
    } finally {
      setIsSaving(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus({ type: null, message: "" });
      }, 3000);
    }
  };

  const handleGenerateViewLink = async () => {
    if (!user) {
      setShareStatus({ type: 'error', message: 'Please sign in to generate a share link' });
      return;
    }

    if (!currentVisualizationId) {
      setShareStatus({ type: 'error', message: 'Please save your visualization before generating a link' });
      return;
    }

    // Generate view-only link without making it public
    const shareUrl = generateShareableUrl(currentVisualizationId);
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus({ 
        type: 'success', 
        message: 'View-only link copied to clipboard!' 
      });
    } catch (clipboardError) {
      setShareStatus({ 
        type: 'success', 
        message: `View-only link: ${shareUrl}` 
      });
    }

    // Clear status message after 3 seconds
    setTimeout(() => {
      setShareStatus({ type: null, message: "" });
    }, 3000);
  };

  const handleSetToPublic = async () => {
    if (!user) {
      setShareStatus({ type: 'error', message: 'Please sign in to manage your visualization' });
      return;
    }

    if (!currentVisualizationId) {
      setShareStatus({ type: 'error', message: 'Please save your visualization first' });
      return;
    }

    setIsSharing(true);
    
    try {
      if (isCurrentVizPublic) {
        // Make private
        setShareStatus({ type: null, message: "Returning to draft..." });
        const { error } = await unshareVisualization(currentVisualizationId);
        
        if (error) {
          setShareStatus({ 
            type: 'error', 
            message: error.message || 'Failed to return to draft' 
          });
        } else {
          setIsCurrentVizPublic(false);
          setShareStatus({ 
            type: 'success', 
            message: 'Visualization returned to draft' 
          });
        }
      } else {
        // Make public
        setShareStatus({ type: null, message: "Publishing visualization..." });
        const { error } = await shareVisualization(currentVisualizationId);
        
        if (error) {
          setShareStatus({ 
            type: 'error', 
            message: error.message || 'Failed to publish visualization' 
          });
        } else {
          setIsCurrentVizPublic(true);
          const shareUrl = generateShareableUrl(currentVisualizationId);
        
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShareStatus({ 
            type: 'success', 
            message: 'Visualization published! Now visible in Explore. Link copied to clipboard.' 
          });
        } catch (clipboardError) {
          setShareStatus({ 
            type: 'success', 
            message: `Visualization published! Now visible in Explore. Share URL: ${shareUrl}` 
          });
        }
        }
      }
    } catch (error) {
      console.error('Error publishing visualization:', error);
      setShareStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to publish visualization' 
      });
    } finally {
      setIsSharing(false);
      
      // Clear status message after 5 seconds
      setTimeout(() => {
        setShareStatus({ type: null, message: "" });
      }, 5000);
    }
  };

  return (
    <DefaultPageLayout>
      <div className="container max-w-none flex h-full w-full flex-col items-start gap-8 bg-default-background py-12">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col items-start">
            {isEditingName ? (
              <input
                type="text"
                defaultValue={visualizationName}
                className="text-heading-1 font-heading-1 text-default-font bg-transparent border-b-2 border-brand-600 outline-none"
                autoFocus
                onBlur={(e) => handleNameChange(e.target.value)}
                onKeyDown={handleNameKeyPress}
              />
            ) : (
              <span 
                className="text-heading-1 font-heading-1 text-default-font cursor-pointer hover:text-brand-700 transition-colors"
                onClick={handleNameClick}
              >
                {visualizationName}
              </span>
            )}
            <span className="text-body font-body text-subtext-color">
              Upload music and customize your visualization
            </span>
            {saveStatus.type && (
              <div className={`text-caption font-caption mt-2 px-3 py-2 rounded-md border ${
                saveStatus.type === 'success' 
                  ? 'text-success-600 bg-success-50 border-success-200' 
                  : 'text-error-700 bg-error-50 border-error-200'
              }`}>
                {saveStatus.message}
              </div>
            )}
            {shareStatus.type && (
              <div className={`text-caption font-caption mt-2 px-3 py-2 rounded-md border ${
                shareStatus.type === 'success' 
                  ? 'text-success-600 bg-success-50 border-success-200' 
                  : 'text-error-700 bg-error-50 border-error-200'
              }`}>
                {shareStatus.message}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="brand-tertiary"
              icon={<FeatherExpand />}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            />
            <Button
              variant="neutral-secondary"
              icon={<FeatherSave />}
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving}
            >
              {currentVisualizationId ? 'Update' : 'Save draft'}
            </Button>
            <Button
              variant="brand-tertiary"
              icon={<FeatherPlus />}
              onClick={handleCreateNew}
            >
              Create New
            </Button>
            <Popover
              trigger={
                <Button
                  variant="destructive-secondary"
                  disabled={!currentVisualizationId}
                >
                  Share
                </Button>
              }
            >
              <PopoverItem
                onClick={handleGenerateViewLink}
                icon={<FeatherLink />}
              >
                Generate View-Only Link
              </PopoverItem>
              <PopoverItem
                onClick={handleSetToPublic}
                icon={<FeatherGlobe />}
              >
                {isCurrentVizPublic ? 'Return to Draft' : 'Set to Public'}
              </PopoverItem>
            </Popover>
          </div>
        </div>
        <div className="flex w-full grow shrink-0 basis-0 items-start gap-6">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-6">
            <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
              <AudioSourceSelector
                currentSource={currentSourceType}
                onSourceChange={handleSourceChange}
              />
              
              {/* File Upload Section */}
              {currentSourceType === AudioSourceType.FILE && (
                <div className="flex w-full flex-col gap-4">
                  {/* Upload feedback */}
                  {uploadFeedback.type && (
                    <div className={`px-4 py-3 rounded-md text-sm ${
                      uploadFeedback.type === 'success' 
                        ? 'bg-success-50 text-success-900 border border-success-200' 
                        : 'bg-error-50 text-error-900 border border-error-200'
                    }`}>
                      {uploadFeedback.message}
                    </div>
                  )}
                  
                  {!uploadedFileName ? (
                    /* Upload prompt */
                    <div className="flex w-full flex-col items-center justify-center gap-4 rounded-md border border-dashed border-brand-600 px-6 py-12">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div 
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FeatherMusic className="text-heading-1 font-heading-1 text-brand-700" />
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-body font-body text-default-font text-center">
                            Drop your audio file here or click to browse
                          </span>
                          <span className="text-caption font-caption text-subtext-color text-center">
                            Supports MP3, WAV, OGG, M4A up to 50MB
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Playback controls after file upload */
                    <div className="flex w-full flex-col gap-4 rounded-md border border-solid border-neutral-border px-6 py-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-body-bold font-body-bold text-default-font">
                          Now Playing
                        </span>
                        <span className="text-body font-body text-subtext-color">
                          {uploadedFileName}
                        </span>
                      </div>
                      
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconButton
                            icon={<FeatherSkipBack />}
                            onClick={() => handleSeek([0])}
                          />
                          <IconButton
                            icon={state.isPlaying ? <FeatherPause /> : <FeatherPlay />}
                            onClick={handlePlayPause}
                          />
                          <IconButton
                            icon={<FeatherSkipForward />}
                            onClick={() => handleSeek([100])}
                          />
                        </div>
                        <Slider
                          className="h-5 w-96 flex-none"
                          value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                          onValueChange={handleSeek}
                          onValueCommit={handleSeek}
                        />
                        <span className="text-caption font-caption text-subtext-color">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                      
                      <Button
                        variant="neutral-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        className="self-start"
                      >
                        Change File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Microphone Section */}
              {currentSourceType === AudioSourceType.MICROPHONE && (
                <div className="flex w-full flex-col items-center justify-center gap-4 rounded-md border border-dashed border-warning-600 px-6 py-12">
                  <FeatherMic className="text-heading-1 font-heading-1 text-warning-700" />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-body font-body text-default-font text-center">
                      Microphone Active
                    </span>
                    <span className="text-caption font-caption text-subtext-color text-center">
                      Visualizing your microphone input in real-time
                    </span>
                  </div>
                </div>
              )}

              {/* Keyboard Section */}
              {currentSourceType === AudioSourceType.KEYBOARD && (
                <div className="flex w-full flex-col items-center justify-center gap-4 rounded-md border border-dashed border-success-600 px-6 py-12">
                  <PianoKeyboard
                    activeNotes={activeNotes}
                    onNoteStart={handleNoteOn}
                    onNoteStop={handleNoteOff}
                    keyboardMapping={keyboardMapping}
                    keyboardSource={currentSourceType === AudioSourceType.KEYBOARD ? state.currentSource : keyboardSource}
                  />
                </div>
              )}
            </div>
            <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Visualization Preview
              </span>
              <div className="flex h-96 w-full flex-none rounded-md overflow-hidden bg-black">
                <VisualizationCanvas
                  audioData={state.analysisData}
                  settings={visualizationSettings}
                  isPlaying={state.isPlaying}
                  className="w-full h-full"
                  key={`viz-${currentSourceType}-${state.isPlaying}`} // Force re-render on source/play state change
                />
              </div>
            </div>
          </div>
          <div className="flex w-80 flex-none flex-col items-start gap-6 self-stretch">
            <Tabs>
              <Tabs.Item 
                active={activeTab === "style"} 
                icon={<FeatherSettings />}
                onClick={() => setActiveTab("style")}
              >
                Style
              </Tabs.Item>
              <Tabs.Item 
                active={activeTab === "effects"} 
                icon={<FeatherSliders />}
                onClick={() => setActiveTab("effects")}
              >
                Effects
              </Tabs.Item>
              <Tabs.Item 
                active={activeTab === "motion"} 
                icon={<FeatherZap />}
                onClick={() => setActiveTab("motion")}
              >
                Motion
              </Tabs.Item>
            </Tabs>
            <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-4">
              {/* Style Tab Content */}
              {activeTab === "style" && (
                <>
                  <div className="flex w-full flex-col items-start gap-2">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Base Shape
                    </span>
                    <ToggleGroup 
                      value={visualizationSettings.type} 
                      onValueChange={(value: string) => {
                        setVisualizationType(value as VisualizationType);
                      }}
                    >
                      <ToggleGroup.Item icon={null} value={VisualizationType.CIRCLE}>
                        Circle
                      </ToggleGroup.Item>
                      <ToggleGroup.Item icon={null} value={VisualizationType.BARS}>
                        Bars
                      </ToggleGroup.Item>
                      <ToggleGroup.Item icon={null} value={VisualizationType.WAVE}>
                        Wave
                      </ToggleGroup.Item>
                    </ToggleGroup>
                  </div>
              <div className="flex w-full flex-col items-start gap-2 relative">
                <span className="text-body-bold font-body-bold text-default-font">
                  Color Theme
                </span>
                <Select
                  className="h-auto w-full flex-none relative z-50"
                  label=""
                  placeholder="Select theme"
                  helpText=""
                  value={visualizationSettings.colorTheme}
                  onValueChange={(value: string) => {
                    setColorTheme(value as ColorTheme);
                  }}
                >
                  <Select.Item value={ColorTheme.NEON}>Neon</Select.Item>
                  <Select.Item value={ColorTheme.SUNSET}>Sunset</Select.Item>
                  <Select.Item value={ColorTheme.MONO}>Mono</Select.Item>
                </Select>
              </div>
              <div className="flex w-full flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Sensitivity
                </span>
                <Slider
                  value={[visualizationSettings.sensitivity * 100]}
                  onValueChange={(value: number[]) => {
                    setSensitivity(value[0] / 100);
                  }}
                  onValueCommit={(value: number[]) => {
                    setSensitivity(value[0] / 100);
                  }}
                />
              </div>
              <div className="flex w-full flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Smoothing
                </span>
                <Slider
                  value={[visualizationSettings.smoothing * 100]}
                  onValueChange={(value: number[]) => {
                    setSmoothing(value[0] / 100);
                  }}
                  onValueCommit={(value: number[]) => {
                    setSmoothing(value[0] / 100);
                  }}
                />
              </div>
              <div className="flex w-full flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Size Scale
                </span>
                <Slider
                  value={[visualizationSettings.sizeScale * 100]}
                  onValueChange={(value: number[]) => {
                    setSizeScale(value[0] / 100);
                  }}
                  onValueCommit={(value: number[]) => {
                    setSizeScale(value[0] / 100);
                  }}
                />
              </div>
                  <div className="flex w-full flex-col items-start gap-2">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Tags
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Add tags to help others discover your visualization
                    </span>
                    
                    {/* Selected tags */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedTags.map(tag => (
                          <div
                            key={tag}
                            className="flex items-center gap-1 px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-caption"
                          >
                            <span>{tag}</span>
                            <button
                              onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                              className="ml-1 hover:text-brand-900"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Popular tags */}
                    <div className="flex flex-wrap gap-2">
                      {["Electronic", "Rock", "Jazz", "Ambient", "Classical", "Hip Hop", "Dance", "Chill"].map(tag => (
                        <Button
                          key={tag}
                          variant={selectedTags.includes(tag) ? "brand-primary" : "neutral-secondary"}
                          size="small"
                          className="h-auto px-3 py-1 text-caption"
                          onClick={() => {
                            if (selectedTags.includes(tag)) {
                              setSelectedTags(prev => prev.filter(t => t !== tag));
                            } else if (selectedTags.length < 5) {
                              setSelectedTags(prev => [...prev, tag]);
                            }
                          }}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Custom tag input */}
                    <TextField
                      className="h-auto w-full flex-none"
                      label={`Add Custom Tags (${selectedTags.length}/5 tags)`}
                      helpText={`${customTagInput.length}/15 characters. No URLs allowed.`}
                    >
                      <TextField.Input
                        placeholder="Add custom tags (press Enter to add)..."
                        value={customTagInput}
                        onChange={(e) => {
                          // Limit input to 15 characters
                          if (e.target.value.length <= 15) {
                            setCustomTagInput(e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customTagInput.trim()) {
                            e.preventDefault();
                            const newTag = customTagInput.trim();
                            
                            // Tag validation
                            if (newTag.length > 15) {
                              // Show error feedback (optional - could use toast)
                              return;
                            }
                            
                            // Check for URLs (basic validation)
                            if (newTag.includes('http') || newTag.includes('www.') || newTag.includes('.com') || newTag.includes('.org') || newTag.includes('.net')) {
                              // Show error feedback (optional - could use toast)  
                              return;
                            }
                            
                            if (!selectedTags.includes(newTag) && selectedTags.length < 5) {
                              setSelectedTags(prev => [...prev, newTag]);
                            }
                            setCustomTagInput("");
                          }
                        }}
                      />
                    </TextField>
                  </div>
                </>
              )}

              {/* Effects Tab Content */}
              {activeTab === "effects" && (
                <>
                  <div className="flex w-full flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Glow Intensity
                    </span>
                    <Slider
                      value={[visualizationSettings.glowIntensity * 100]}
                      onValueChange={(value: number[]) => {
                        setGlowIntensity(value[0] / 100);
                      }}
                    />
                  </div>
                  <div className="flex w-full flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Background Trail
                    </span>
                    <Slider
                      value={[visualizationSettings.backgroundOpacity * 100]}
                      onValueChange={(value: number[]) => {
                        setBackgroundOpacity(value[0] / 100);
                      }}
                    />
                  </div>
                  <div className="flex w-full flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Particle Count
                    </span>
                    <Slider
                      value={[visualizationSettings.particleCount]}
                      min={8}
                      max={256}
                      step={8}
                      onValueChange={(value: number[]) => {
                        setParticleCount(value[0]);
                      }}
                    />
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Beat Pulse Sync
                    </span>
                    <Switch
                      checked={visualizationSettings.pulseBeatSync}
                      onCheckedChange={togglePulseBeatSync}
                    />
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Flash on Onset
                    </span>
                    <Switch
                      checked={visualizationSettings.flashOnset}
                      onCheckedChange={toggleFlashOnset}
                    />
                  </div>
                </>
              )}

              {/* Motion Tab Content */}
              {activeTab === "motion" && (
                <>
                  <div className="flex w-full flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Rotation Speed
                    </span>
                    <Slider
                      value={[(visualizationSettings.rotationSpeed + 2) * 25]} // Convert -2 to 2 range to 0-100
                      onValueChange={(value: number[]) => {
                        setRotationSpeed((value[0] / 25) - 2); // Convert back to -2 to 2
                      }}
                    />
                  </div>
                  <div className="flex w-full flex-col items-start gap-2">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Animation Info
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Current rotation: {visualizationSettings.rotationSpeed.toFixed(2)}x speed
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Beat sync: {visualizationSettings.pulseBeatSync ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </>
              )}
              
              {/* Audio Level Meter */}
              {state.isPlaying && (
                <AudioLevelMeter analysisData={state.analysisData} />
              )}
            </div>
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default MusicVizUpload;