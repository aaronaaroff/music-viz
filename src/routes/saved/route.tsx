import React, { useState, useEffect } from "react";
import { Popover, PopoverItem, PopoverLabel, PopoverSeparator } from "@/components/Popover";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { DraggableVisualizationCard } from "@/components/DraggableVisualizationCard";
import { DroppableFolderItem } from "@/components/DroppableFolderItem";
import { CustomDragLayer } from "@/components/CustomDragLayer";
import { TextField } from "@/ui/components/TextField";
import { FeatherSearch } from "@subframe/core";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { FeatherGrid } from "@subframe/core";
import { FeatherList } from "@subframe/core";
import { Button } from "@/ui/components/Button";
import { FeatherPlus } from "@subframe/core";
import { FeatherFilter } from "@subframe/core";
import { Avatar } from "@/ui/components/Avatar";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherHeart } from "@subframe/core";
import { FeatherMessageCircle } from "@subframe/core";
import { FeatherBookmark } from "@subframe/core";
import { Badge } from "@/ui/components/Badge";
import { FeatherFolder } from "@subframe/core";
import { FeatherFolderPlus } from "@subframe/core";
import { FeatherEdit2 } from "@subframe/core";
import { FeatherTrash2 } from "@subframe/core";
import { FeatherX } from "@subframe/core";
import { FeatherCheck } from "@subframe/core";
import { FeatherPlay } from "@subframe/core";
import { FeatherMusic } from "@subframe/core";
import { FeatherChevronRight } from "@subframe/core";
import { FeatherChevronDown } from "@subframe/core";
import { useAuth } from "@/components/auth/AuthContext";
import { getSavedVisualizations, toggleSave } from "@/lib/api/visualizations";
import { getUserFolders, getFolderContents, createFolder as createFolderAPI, updateFolder as updateFolderAPI, deleteFolder as deleteFolderAPI, addVisualizationToFolder, removeVisualizationFromFolder } from "@/lib/api/folders";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle, getPageTitle } from "@/hooks/useDocumentTitle";
import type { Database } from "@/lib/database.types";

type Visualization = Database['public']['Tables']['visualizations']['Row'] & {
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null; banner_url?: string | null } | null;
  saved_at?: string;
  likes_count?: number;
  comments_count?: number;
};

interface Folder {
  id: string;
  name: string;
  color: string;
  visualizationIds: string[];
  isExpanded: boolean;
}

function SavedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Set document title
  useDocumentTitle(getPageTitle('Saved'));
  
  // State
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [filteredVisualizations, setFilteredVisualizations] = useState<Visualization[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date-saved" | "recent" | "alphabetical">("date-saved");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  // Folders state
  const [folders, setFolders] = useState<Folder[]>([
    { id: 'all', name: 'All Saved', color: 'neutral', visualizationIds: [], isExpanded: true },
    { id: 'favorites', name: 'Favorites', color: 'brand', visualizationIds: [], isExpanded: true },
    { id: 'inspiration', name: 'Inspiration', color: 'success', visualizationIds: [], isExpanded: true },
    { id: 'tutorials', name: 'Tutorials', color: 'warning', visualizationIds: [], isExpanded: true }
  ]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Redirect if not authenticated - only after auth is fully loaded
  useEffect(() => {
    if (!loading && !user) {
      // Store the current path so we can return here after signin
      sessionStorage.setItem('redirectPath', '/saved');
      navigate('/auth/signin');
    }
  }, [user, loading, navigate]);
  
  // Load saved visualizations and folders
  useEffect(() => {
    if (user) {
      loadSavedVisualizations();
      loadFolders();
    }
  }, [user]);
  
  const loadSavedVisualizations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await getSavedVisualizations(user.id);
      
      if (error) {
        console.error('Error loading saved visualizations:', error);
      } else {
        setVisualizations((data || []) as unknown as Visualization[]);
      }
    } catch (error) {
      console.error('Error loading saved visualizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    if (!user) return;
    
    try {
      // Load folders
      const { data: foldersData, error: foldersError } = await getUserFolders(user.id);
      
      if (foldersError) {
        console.error('Error loading folders:', foldersError);
        return;
      }
      
      // Load folder contents
      const { data: contentsData, error: contentsError } = await getFolderContents(user.id);
      
      if (contentsError) {
        console.error('Error loading folder contents:', contentsError);
      }
      
      if (foldersData) {
        const loadedFolders: Folder[] = [
          { id: 'all', name: 'All Saved', color: 'neutral', visualizationIds: [], isExpanded: true },
          ...foldersData.map((folder: any) => ({
            id: folder.id,
            name: folder.name,
            color: folder.color,
            visualizationIds: (contentsData as any)?.[folder.id] || [],
            isExpanded: true
          }))
        ];
        setFolders(loadedFolders);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };
  
  // Filter and sort visualizations
  useEffect(() => {
    let filtered = [...visualizations];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(viz => 
        viz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        viz.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        viz.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Folder filter
    if (selectedFolder && selectedFolder !== 'all') {
      const folder = folders.find(f => f.id === selectedFolder);
      if (folder) {
        filtered = filtered.filter(viz => folder.visualizationIds.includes(viz.id));
      }
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-saved":
          return new Date(b.saved_at || b.created_at || 0).getTime() - 
                 new Date(a.saved_at || a.created_at || 0).getTime();
        case "recent":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "alphabetical":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    setFilteredVisualizations(filtered);
  }, [visualizations, searchTerm, selectedFolder, folders, sortBy]);
  
  // Handle unsave with confirmation
  const handleUnsave = async (visualizationId: string) => {
    const confirmed = window.confirm('Are you sure you want to remove this from your saved items?');
    if (!confirmed) return;
    
    try {
      const { error } = await toggleSave(visualizationId);
      if (!error) {
        // Optimistic UI update
        setVisualizations(prev => prev.filter(viz => viz.id !== visualizationId));
        // Remove from all folders
        setFolders(prev => prev.map(folder => ({
          ...folder,
          visualizationIds: folder.visualizationIds.filter(id => id !== visualizationId)
        })));
      } else {
        // Revert on error
        alert('Failed to remove from saved. Please try again.');
      }
    } catch (error) {
      console.error('Error removing from saved:', error);
      alert('An error occurred. Please try again.');
    }
  };
  
  // Folder management
  const createFolder = async () => {
    if (!newFolderName.trim() || !user) return;
    
    try {
      const { data, error } = await createFolderAPI({
        name: newFolderName.trim(),
        color: '#6B7280'
      });
      
      if (!error && data) {
        const newFolder: Folder = {
          id: data.id,
          name: data.name,
          color: data.color,
          visualizationIds: [],
          isExpanded: true
        };
        
        setFolders(prev => [...prev, newFolder]);
        setNewFolderName("");
        setIsCreatingFolder(false);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };
  
  const updateFolder = async (folderId: string) => {
    if (!editingFolderName.trim() || !user) return;
    
    try {
      const { error } = await updateFolderAPI(folderId, {
        name: editingFolderName.trim()
      });
      
      if (!error) {
        setFolders(prev => prev.map(folder => 
          folder.id === folderId ? { ...folder, name: editingFolderName } : folder
        ));
        setEditingFolderId(null);
        setEditingFolderName("");
      }
    } catch (error) {
      console.error('Error updating folder:', error);
    }
  };
  
  const deleteFolder = async (folderId: string) => {
    if (folderId === 'all' || !user) return; // Protect "All Saved" folder
    
    try {
      const { error } = await deleteFolderAPI(folderId);
      
      if (!error) {
        setFolders(prev => prev.filter(folder => folder.id !== folderId));
        if (selectedFolder === folderId) {
          setSelectedFolder('all');
        }
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };
  
  const toggleFolderExpanded = (folderId: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, isExpanded: !folder.isExpanded } : folder
    ));
  };
  

  const handleDragDrop = async (visualizationId: string, folderId: string) => {
    if (!user || folderId === 'all') return; // Can't add to "All Saved"
    
    try {
      const { error } = await addVisualizationToFolder(visualizationId, folderId);
      
      if (!error) {
        // Update local state
        setFolders(prev => prev.map(folder => {
          if (folder.id === folderId && !folder.visualizationIds.includes(visualizationId)) {
            return { ...folder, visualizationIds: [...folder.visualizationIds, visualizationId] };
          }
          return folder;
        }));
      }
    } catch (error) {
      console.error('Error adding to folder:', error);
    }
  };
  
  const handleRemoveFromFolder = async (visualizationId: string, folderId: string) => {
    if (!user || folderId === 'all') return; // Can't remove from "All Saved"
    
    try {
      const { error } = await removeVisualizationFromFolder(visualizationId, folderId);
      
      if (!error) {
        // Update local state
        setFolders(prev => prev.map(folder => {
          if (folder.id === folderId) {
            return { 
              ...folder, 
              visualizationIds: folder.visualizationIds.filter(id => id !== visualizationId) 
            };
          }
          return folder;
        }));
      }
    } catch (error) {
      console.error('Error removing from folder:', error);
    }
  };
  
  const renderVisualizationCard = (viz: Visualization) => {
    const inFolders = folders.filter(f => f.id !== 'all' && f.visualizationIds.includes(viz.id));
    
    const handleCardClick = (e: React.MouseEvent) => {
      // Only navigate if clicking on the card itself in grid mode, not on buttons
      if (viewMode === 'grid' && 
          !(e.target as HTMLElement).closest('button') && 
          !(e.target as HTMLElement).closest('[role="button"]')) {
        navigate(`/?load=${viz.id}`);
      }
    };
    
    return (
      <DraggableVisualizationCard
        key={viz.id}
        visualization={viz}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
      >
        <div
          className={`flex flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-4 transition-shadow ${
            viewMode === 'grid' ? 'cursor-pointer hover:shadow-md' : ''
          } ${isDragging ? 'pointer-events-none' : ''}`}
          onClick={handleCardClick}
        >
        {/* Visualization preview */}
        <div className="relative flex h-48 w-full flex-none items-center justify-center overflow-visible rounded-md bg-black">
          <img
            className="grow shrink-0 basis-0 self-stretch object-cover opacity-50"
            src={viz.thumbnail_url || viz.profiles?.banner_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
            alt={viz.title}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <IconButton
              variant="inverse"
              size="large"
              icon={<FeatherPlay />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/?load=${viz.id}`);
              }}
            />
          </div>
          
          {/* Folder badges - moved inside preview container */}
          {inFolders.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[calc(100%-80px)] z-10">
              {inFolders.slice(0, 2).map(folder => (
                <Badge key={folder.id} variant="neutral" className="text-xs bg-black/70 backdrop-blur-sm">
                  <FeatherFolder className="w-2 h-2" />
                  {folder.name}
                </Badge>
              ))}
              {inFolders.length > 2 && (
                <Badge variant="neutral" className="text-xs bg-black/70 backdrop-blur-sm">
                  +{inFolders.length - 2}
                </Badge>
              )}
            </div>
          )}
          
          {viz.audio_file_name && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1">
              <FeatherMusic className="text-caption font-caption text-white" />
              <span className="text-caption font-caption text-white truncate max-w-[150px]">
                {viz.audio_file_name}
              </span>
            </div>
          )}
          <div className="absolute top-2 right-2 z-10">
            <Popover
              trigger={
                <IconButton
                  variant="inverse"
                  size="small"
                  icon={<FeatherX />}
                  className="bg-red-600/80 hover:bg-red-700/90"
                />
              }
              position="bottom-left"
              className="z-50"
            >
              {inFolders.length > 0 && (
                <>
                  <PopoverLabel>Remove from folder</PopoverLabel>
                  {inFolders.map(folder => (
                    <PopoverItem
                      key={folder.id}
                      onClick={() => handleRemoveFromFolder(viz.id, folder.id)}
                    >
                      {folder.name}
                    </PopoverItem>
                  ))}
                  <PopoverSeparator />
                </>
              )}
              <PopoverItem
                onClick={() => handleUnsave(viz.id)}
                variant="danger"
              >
                Remove from saved
              </PopoverItem>
            </Popover>
          </div>
        </div>
        
        {/* Info section */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar
              size="small"
              image={viz.profiles?.avatar_url || undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (viz.profiles?.username) {
                  navigate(`/profile/${viz.profiles.username}`);
                }
              }}
              className="cursor-pointer hover:opacity-80"
            >
              {(viz.profiles?.full_name?.[0] || viz.profiles?.username?.[0] || 'U').toUpperCase()}
            </Avatar>
            <div className="flex flex-col">
              <span className="text-body-bold font-body-bold text-default-font">
                {viz.title}
              </span>
              <span 
                className="text-caption font-caption text-subtext-color cursor-pointer hover:text-brand-700"
                onClick={(e) => {
                  e.stopPropagation();
                  if (viz.profiles?.username) {
                    navigate(`/profile/${viz.profiles.username}`);
                  }
                }}
              >
                by {viz.profiles?.full_name || viz.profiles?.username || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex w-full items-center justify-between text-caption font-caption text-subtext-color">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FeatherHeart className="w-3 h-3" />
              {viz.likes_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <FeatherMessageCircle className="w-3 h-3" />
              {viz.comments_count || 0}
            </span>
          </div>
          <span>
            Saved {viz.saved_at ? new Date(viz.saved_at).toLocaleDateString() : 'recently'}
          </span>
        </div>
        </div>
      </DraggableVisualizationCard>
    );
  };
  
  if (!user) {
    return null; // Will redirect
  }
  
  return (
    <DefaultPageLayout>
      <CustomDragLayer />
      <div className="flex h-full w-full flex-col items-start overflow-hidden">
        {/* Header */}
        <div className="flex w-full items-center justify-between border-b border-solid border-neutral-border px-8 py-2">
          <TextField
            className="h-auto grow shrink-0 basis-0 max-w-md"
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
          >
            <TextField.Input
              placeholder="Search saved visualizations..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </TextField>
          <div className="flex items-center gap-2">
            <ToggleGroup value={viewMode} onValueChange={(value: string) => setViewMode(value as "grid" | "list")}>
              <ToggleGroup.Item icon={<FeatherGrid />} value="grid" />
              <ToggleGroup.Item icon={<FeatherList />} value="list" />
            </ToggleGroup>
            <Button
              icon={<FeatherPlus />}
              onClick={() => navigate('/?new=true')}
            >
              Create New
            </Button>
            <Button
              variant={showFilters ? "brand-tertiary" : "neutral-tertiary"}
              icon={<FeatherFilter />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex w-full grow shrink-0 basis-0 items-start overflow-hidden">
          {/* Visualizations grid */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-6 self-stretch px-6 py-6 overflow-auto">
            {loading ? (
              <div className="flex w-full h-full items-center justify-center">
                <span className="text-body font-body text-subtext-color">Loading saved visualizations...</span>
              </div>
            ) : filteredVisualizations.length === 0 ? (
              <div className="flex w-full h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <FeatherBookmark className="text-heading-1 font-heading-1 text-subtext-color" />
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-body-bold font-body-bold text-default-font">
                      {searchTerm || selectedFolder !== 'all' ? 'No matching visualizations' : 'No saved visualizations yet'}
                    </span>
                    <span className="text-body font-body text-subtext-color">
                      {searchTerm || selectedFolder !== 'all' 
                        ? 'Try adjusting your search or filters' 
                        : 'Save visualizations from the Explore page to see them here'
                      }
                    </span>
                  </div>
                  {!searchTerm && selectedFolder === 'all' && (
                    <Button
                      variant="brand-primary"
                      onClick={() => navigate('/explore')}
                    >
                      Explore Visualizations
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className={`w-full items-start gap-6 grid ${
                viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              }`}>
                {filteredVisualizations.map(renderVisualizationCard)}
              </div>
            )}
          </div>
          
          {/* Filters sidebar */}
          <div className={`flex flex-col items-start gap-6 self-stretch border-l border-solid border-neutral-border px-6 py-6 overflow-auto transition-all duration-300 ${
            showFilters ? 'w-[320px] opacity-100' : 'w-0 opacity-0 px-0'
          } ${isDragging ? 'bg-brand-25' : ''}`}>
            {showFilters && (
              <>
                {/* Folders */}
                <div className="flex w-full flex-col items-start gap-3">
                  <div className="flex w-full items-center justify-between">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Folders
                    </span>
                    <IconButton
                      size="small"
                      icon={<FeatherFolderPlus />}
                      onClick={() => setIsCreatingFolder(true)}
                    />
                  </div>
                  
                  {/* Drag hint */}
                  {isDragging && (
                    <div className="w-full p-2 bg-brand-100 border border-brand-300 rounded-md">
                      <span className="text-caption font-caption text-brand-700">
                        Drop visualization on any folder to organize it
                      </span>
                    </div>
                  )}
                  
                  {/* Create new folder input */}
                  {isCreatingFolder && (
                    <div className="flex w-full items-center gap-2">
                      <TextField className="flex-1" label="" helpText="">
                        <TextField.Input
                          placeholder="Folder name..."
                          value={newFolderName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
                          onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === 'Enter') createFolder();
                            if (e.key === 'Escape') {
                              setIsCreatingFolder(false);
                              setNewFolderName("");
                            }
                          }}
                          autoFocus
                        />
                      </TextField>
                      <IconButton
                        size="small"
                        icon={<FeatherCheck />}
                        onClick={createFolder}
                      />
                      <IconButton
                        size="small"
                        icon={<FeatherX />}
                        onClick={() => {
                          setIsCreatingFolder(false);
                          setNewFolderName("");
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Folders list */}
                  <div className="flex w-full flex-col items-start gap-1">
                    {folders.map(folder => (
                      <div key={folder.id} className="flex w-full flex-col">
                        <DroppableFolderItem
                          folderId={folder.id}
                          onDrop={handleDragDrop}
                          isSelected={selectedFolder === folder.id}
                        >
                          <div
                            className={`flex w-full items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-50 ${
                              selectedFolder === folder.id ? 'bg-brand-50' : ''
                            }`}
                            onClick={() => setSelectedFolder(folder.id === selectedFolder ? 'all' : folder.id)}
                          >
                          <div className="flex items-center gap-2">
                            {folder.id !== 'all' && (
                              <IconButton
                                size="small"
                                icon={folder.isExpanded ? <FeatherChevronDown /> : <FeatherChevronRight />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFolderExpanded(folder.id);
                                }}
                              />
                            )}
                            <FeatherFolder className="text-body font-body text-default-font" />
                            {editingFolderId === folder.id ? (
                              <TextField className="flex-1" label="" helpText="">
                                <TextField.Input
                                  value={editingFolderName}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingFolderName(e.target.value)}
                                  onKeyDown={(e: React.KeyboardEvent) => {
                                    if (e.key === 'Enter') updateFolder(folder.id);
                                    if (e.key === 'Escape') {
                                      setEditingFolderId(null);
                                      setEditingFolderName("");
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                              </TextField>
                            ) : (
                              <span className="text-body font-body text-default-font">
                                {folder.name}
                              </span>
                            )}
                          </div>
                          {folder.id !== 'all' && folder.id !== 'favorites' && (
                            <div className="flex items-center gap-1">
                              <IconButton
                                size="small"
                                icon={<FeatherEdit2 />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFolderId(folder.id);
                                  setEditingFolderName(folder.name);
                                }}
                              />
                              <IconButton
                                size="small"
                                icon={<FeatherTrash2 />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete folder "${folder.name}"?`)) {
                                    deleteFolder(folder.id);
                                  }
                                }}
                              />
                            </div>
                          )}
                          </div>
                        </DroppableFolderItem>
                        {folder.isExpanded && folder.visualizationIds.length > 0 && (
                          <div className="ml-8 text-caption font-caption text-subtext-color">
                            {folder.visualizationIds.length} items
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Sort by */}
                <div className="flex w-full flex-col items-start gap-3">
                  <span className="text-body-bold font-body-bold text-default-font">
                    Sort by
                  </span>
                  <ToggleGroup
                    className="h-auto w-full flex-none"
                    value={sortBy}
                    onValueChange={(value: string) => setSortBy(value as any)}
                  >
                    <ToggleGroup.Item icon={null} value="date-saved">
                      Date Saved
                    </ToggleGroup.Item>
                    <ToggleGroup.Item icon={null} value="recent">
                      Recently Created
                    </ToggleGroup.Item>
                    <ToggleGroup.Item icon={null} value="alphabetical">
                      A-Z
                    </ToggleGroup.Item>
                  </ToggleGroup>
                </div>
                
                {/* Stats */}
                <div className="flex w-full flex-col items-start gap-3">
                  <span className="text-body-bold font-body-bold text-default-font">
                    Statistics
                  </span>
                  <div className="flex w-full flex-col items-start gap-2">
                    <div className="flex w-full items-center justify-between">
                      <span className="text-body font-body text-subtext-color">Total saved</span>
                      <span className="text-body-bold font-body-bold text-default-font">
                        {visualizations.length}
                      </span>
                    </div>
                    <div className="flex w-full items-center justify-between">
                      <span className="text-body font-body text-subtext-color">In folders</span>
                      <span className="text-body-bold font-body-bold text-default-font">
                        {folders.reduce((acc, f) => acc + (f.id !== 'all' ? f.visualizationIds.length : 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default SavedPage;