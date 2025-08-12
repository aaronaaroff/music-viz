import React, { useState, useEffect } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
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
import { FeatherMoreVertical } from "@subframe/core";
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
import { useNavigate } from "react-router-dom";
import type { Database } from "@/lib/database.types";
import { DropdownMenu } from "@/ui/components/DropdownMenu";

type Visualization = Database['public']['Tables']['visualizations']['Row'] & {
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
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
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/signin');
    }
  }, [user, loading, navigate]);
  
  // Load saved visualizations
  useEffect(() => {
    if (user) {
      loadSavedVisualizations();
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
        setVisualizations(data || []);
      }
    } catch (error) {
      console.error('Error loading saved visualizations:', error);
    } finally {
      setLoading(false);
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
  
  // Handle unsave
  const handleUnsave = async (visualizationId: string) => {
    try {
      const { error } = await toggleSave(visualizationId);
      if (!error) {
        setVisualizations(prev => prev.filter(viz => viz.id !== visualizationId));
        // Remove from all folders
        setFolders(prev => prev.map(folder => ({
          ...folder,
          visualizationIds: folder.visualizationIds.filter(id => id !== visualizationId)
        })));
      }
    } catch (error) {
      console.error('Error removing from saved:', error);
    }
  };
  
  // Folder management
  const createFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName,
      color: 'neutral',
      visualizationIds: [],
      isExpanded: true
    };
    
    setFolders(prev => [...prev, newFolder]);
    setNewFolderName("");
    setIsCreatingFolder(false);
  };
  
  const updateFolder = (folderId: string) => {
    if (!editingFolderName.trim()) return;
    
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, name: editingFolderName } : folder
    ));
    setEditingFolderId(null);
    setEditingFolderName("");
  };
  
  const deleteFolder = (folderId: string) => {
    if (folderId === 'all' || folderId === 'favorites') return; // Protect default folders
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
    if (selectedFolder === folderId) {
      setSelectedFolder('all');
    }
  };
  
  const toggleFolderExpanded = (folderId: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, isExpanded: !folder.isExpanded } : folder
    ));
  };
  
  const addToFolder = (visualizationId: string, folderId: string) => {
    setFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        const newIds = folder.visualizationIds.includes(visualizationId)
          ? folder.visualizationIds.filter(id => id !== visualizationId)
          : [...folder.visualizationIds, visualizationId];
        return { ...folder, visualizationIds: newIds };
      }
      return folder;
    }));
  };
  
  const renderVisualizationCard = (viz: Visualization) => {
    const inFolders = folders.filter(f => f.id !== 'all' && f.visualizationIds.includes(viz.id));
    
    return (
      <div
        key={viz.id}
        className="flex flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-4 hover:shadow-md transition-shadow"
      >
        {/* Visualization preview */}
        <div className="relative flex h-48 w-full flex-none items-center justify-center overflow-hidden rounded-md bg-black">
          <img
            className="grow shrink-0 basis-0 self-stretch object-cover opacity-50"
            src={viz.thumbnail_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
            alt={viz.title}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <IconButton
              variant="inverse"
              size="large"
              icon={<FeatherPlay />}
              onClick={() => navigate(`/?load=${viz.id}`)}
            />
          </div>
          {viz.audio_file_name && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1">
              <FeatherMusic className="text-caption font-caption text-white" />
              <span className="text-caption font-caption text-white truncate max-w-[150px]">
                {viz.audio_file_name}
              </span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton
                  variant="inverse"
                  size="small"
                  icon={<FeatherMoreVertical />}
                />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Label>Add to folder</DropdownMenu.Label>
                {folders.filter(f => f.id !== 'all').map(folder => (
                  <DropdownMenu.Item
                    key={folder.id}
                    onClick={() => addToFolder(viz.id, folder.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{folder.name}</span>
                      {folder.visualizationIds.includes(viz.id) && (
                        <FeatherCheck className="text-success-600" />
                      )}
                    </div>
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator />
                <DropdownMenu.Item onClick={() => handleUnsave(viz.id)}>
                  <span className="text-error-600">Remove from saved</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Info section */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar
              size="small"
              image={viz.profiles?.avatar_url || undefined}
              onClick={() => navigate(`/profile/${viz.profiles?.username}`)}
              className="cursor-pointer hover:opacity-80"
            >
              {(viz.profiles?.full_name?.[0] || viz.profiles?.username?.[0] || 'U').toUpperCase()}
            </Avatar>
            <div className="flex flex-col">
              <span className="text-body-bold font-body-bold text-default-font">
                {viz.title}
              </span>
              <span className="text-caption font-caption text-subtext-color">
                by {viz.profiles?.full_name || viz.profiles?.username || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Folder badges */}
        {inFolders.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {inFolders.map(folder => (
              <Badge key={folder.id} size="small" variant="neutral">
                <FeatherFolder className="w-3 h-3" />
                {folder.name}
              </Badge>
            ))}
          </div>
        )}
        
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
    );
  };
  
  if (!user) {
    return null; // Will redirect
  }
  
  return (
    <DefaultPageLayout>
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
          }`}>
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
                  
                  {/* Create new folder input */}
                  {isCreatingFolder && (
                    <div className="flex w-full items-center gap-2">
                      <TextField className="flex-1" label="" helpText="">
                        <TextField.Input
                          placeholder="Folder name..."
                          value={newFolderName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
                          onKeyPress={(e: React.KeyboardEvent) => {
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
                        <div
                          className={`flex w-full items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-50 ${
                            selectedFolder === folder.id ? 'bg-brand-50' : ''
                          }`}
                          onClick={() => setSelectedFolder(folder.id === selectedFolder ? 'all' : folder.id)}
                        >
                          <div className="flex items-center gap-2">
                            <IconButton
                              size="small"
                              icon={folder.isExpanded ? <FeatherChevronDown /> : <FeatherChevronRight />}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFolderExpanded(folder.id);
                              }}
                            />
                            <FeatherFolder className="text-body font-body text-default-font" />
                            {editingFolderId === folder.id ? (
                              <TextField className="flex-1" label="" helpText="">
                                <TextField.Input
                                  value={editingFolderName}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingFolderName(e.target.value)}
                                  onKeyPress={(e: React.KeyboardEvent) => {
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