import React, { useState, useRef, useEffect } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Button } from "@/ui/components/Button";
import { FeatherSave } from "@subframe/core";
import { FeatherExpand } from "@subframe/core";
import { Select } from "@/ui/components/Select";
import { FeatherMusic } from "@subframe/core";
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
import { KeyboardInput } from "@/components/KeyboardInput";
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
import { createVisualization, updateVisualization, getNextDraftNumber } from "@/lib/api/visualizations";
import { supabase } from "@/lib/supabase";

function MusicVizUpload() {
  const [currentSourceType, setCurrentSourceType] = useState<AudioSourceType>(AudioSourceType.FILE);
  const [activeTab, setActiveTab] = useState<string>("style");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: "" });
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [visualizationName, setVisualizationName] = useState<string>("Visualization 1");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [currentVisualizationId, setCurrentVisualizationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keyboardSourceRef = useRef<KeyboardSource | null>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { state, setSource, startAnalysis, stopAnalysis, setVolume } = useAudioManager();
  const { user } = useAuth();
  
  // Initialize draft number when user is available
  useEffect(() => {
    const initializeDraftNumber = async () => {
      if (user && visualizationName === "Visualization 1") {
        try {
          const nextNumber = await getNextDraftNumber(user.id);
          setVisualizationName(`Visualization ${nextNumber}`);
        } catch (error) {
          console.error('Error getting next draft number:', error);
        }
      }
    };

    initializeDraftNumber();
  }, [user, visualizationName]);
  
  // Visualization system
  const {
    settings: visualizationSettings,
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
    loadPreset,
  } = useVisualization();
  
  // Initialize keyboard source
  if (!keyboardSourceRef.current && typeof window !== 'undefined') {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    keyboardSourceRef.current = new KeyboardSource(audioContext);
  }

  const { playNote, stopNote, getActiveNotes, getKeyboardMapping } = useKeyboardInput(
    keyboardSourceRef.current,
    currentSourceType === AudioSourceType.KEYBOARD
  );

  const handleSourceChange = async (sourceType: AudioSourceType) => {
    // Stop current analysis
    if (state.isPlaying) {
      stopAnalysis();
    }

    // Reset file upload state when switching away from file source
    if (sourceType !== AudioSourceType.FILE) {
      setUploadedFileName("");
      setUploadFeedback({ type: null, message: "" });
      setCurrentTime(0);
      setDuration(0);
      stopTimeTracking();
    }

    setCurrentSourceType(sourceType);
    
    if (typeof window === 'undefined') return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
      switch (sourceType) {
        case AudioSourceType.FILE:
          // File source will be set when user uploads a file
          break;
          
        case AudioSourceType.MICROPHONE:
          const micSource = new MicrophoneSource(audioContext);
          const hasPermission = await micSource.requestPermission();
          if (hasPermission) {
            await setSource(micSource, sourceType);
          }
          break;
          
        case AudioSourceType.KEYBOARD:
          if (keyboardSourceRef.current) {
            await setSource(keyboardSourceRef.current, sourceType);
          }
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
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileSource = new FileSource(audioContext);
      await fileSource.loadFile(file);
      await setSource(fileSource, AudioSourceType.FILE);
      setCurrentSourceType(AudioSourceType.FILE);
      
      // Set file info
      setUploadedFileName(fileSource.getFileName());
      setDuration(fileSource.getDuration());
      setCurrentTime(0);
      
      setUploadFeedback({ 
        type: 'success', 
        message: `Successfully loaded ${file.name}` 
      });
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

  const activeNotes = getActiveNotes();
  const keyboardMapping = getKeyboardMapping();

  // Cleanup time tracking on unmount
  useEffect(() => {
    return () => {
      stopTimeTracking();
    };
  }, []);

  // Generate next available draft number
  const getNextDraftNumber = (): number => {
    // In a real app, this would check against saved drafts
    // For now, we'll simulate checking localStorage or a database
    const existingDrafts = [1, 2]; // Simulate existing drafts
    let nextNumber = 1;
    while (existingDrafts.includes(nextNumber)) {
      nextNumber++;
    }
    return nextNumber;
  };

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
    setSaveStatus({ type: null, message: "" });
    
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
      const visualizationData = {
        title: visualizationName,
        description: "Created with Music Visualizer",
        settings: {
          ...visualizationSettings,
          audioSource: currentSourceType,
          audioFileName: uploadedFileName || null,
        },
        audio_file_name: uploadedFileName || undefined,
        is_draft: true,
        is_public: false,
      };

      if (currentVisualizationId) {
        // Update existing visualization
        const { error } = await updateVisualization(currentVisualizationId, visualizationData);
        
        if (error) {
          throw new Error(error.message);
        }
        
        setSaveStatus({ type: 'success', message: 'Visualization updated successfully!' });
      } else {
        // Create new visualization
        const { data, error } = await createVisualization(visualizationData);
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data) {
          setCurrentVisualizationId(data.id);
          setSaveStatus({ type: 'success', message: 'Visualization saved successfully!' });
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
              variant="destructive-secondary"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Share
            </Button>
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
                  <FeatherMusic className="text-heading-1 font-heading-1 text-warning-700" />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-body font-body text-default-font text-center">
                      Microphone Input Active
                    </span>
                    <span className="text-caption font-caption text-subtext-color text-center">
                      Make sure to allow microphone access
                    </span>
                  </div>
                </div>
              )}

              {/* Keyboard Section */}
              {currentSourceType === AudioSourceType.KEYBOARD && (
                <div className="flex w-full flex-col items-center justify-center gap-4 rounded-md border border-dashed border-success-600 px-6 py-12">
                  <KeyboardInput
                    activeNotes={activeNotes}
                    onNoteStart={playNote}
                    onNoteStop={stopNote}
                    keyboardMapping={keyboardMapping}
                    className="w-full"
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
              <div className="flex w-full flex-col items-start gap-2">
                <span className="text-body-bold font-body-bold text-default-font">
                  Preset
                </span>
                <Select
                  className="h-auto w-full flex-none"
                  label=""
                  placeholder="Choose preset"
                  helpText=""
                  value=""
                  onValueChange={(value: string) => {
                    if (value) loadPreset(value);
                  }}
                >
                  <Select.Item value="minimal">Minimal</Select.Item>
                  <Select.Item value="spectrum">Spectrum</Select.Item>
                  <Select.Item value="particles">Particles</Select.Item>
                </Select>
              </div>
              <div className="flex w-full flex-col items-start gap-2">
                <span className="text-body-bold font-body-bold text-default-font">
                  Color Theme
                </span>
                <Select
                  className="h-auto w-full flex-none"
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
                    <TextField
                      className="h-auto w-full flex-none"
                      label="Title"
                      helpText="Name your visualization"
                    >
                      <TextField.Input
                        placeholder="My Visualization"
                        value=""
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => {}}
                      />
                    </TextField>
                  </div>
                  <TextArea
                    className="h-auto w-full flex-none"
                    label="Description"
                    helpText="Add details about your visualization"
                  >
                    <TextArea.Input
                      placeholder="Describe your visualization..."
                      value=""
                      onChange={(
                        event: React.ChangeEvent<HTMLTextAreaElement>
                      ) => {}}
                    />
                  </TextArea>
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