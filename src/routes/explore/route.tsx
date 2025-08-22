import React, { useState, useEffect, useRef } from "react";
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
import { Slider } from "@/ui/components/Slider";
import { FeatherX } from "@subframe/core";
import { FeatherChevronLeft } from "@subframe/core";
import { FeatherSend } from "@subframe/core";
import { FeatherUser } from "@subframe/core";
import { FeatherMusic } from "@subframe/core";
import { useAuth } from "@/components/auth/AuthContext";
import { getPublicVisualizations, toggleLike, toggleSave, createComment, getVisualizationComments, saveToFolder } from "@/lib/api/visualizations";
import { useNavigate } from "react-router-dom";
import { FolderSelectionPopover } from "@/components/FolderSelectionPopover";
import { getTrendingCreators, toggleFollow, checkIsFollowing, getFollowing } from "@/lib/api/follows";
import { useDocumentTitle, getPageTitle } from "@/hooks/useDocumentTitle";
import type { Database } from "@/lib/database.types";

type Visualization = Database['public']['Tables']['visualizations']['Row'] & {
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null; banner_url?: string | null } | null;
  user_liked?: { user_id: string }[];
  user_saved?: { user_id: string }[];
  likes_count?: number;
  comments_count?: number;
};

type Comment = Database['public']['Tables']['comments']['Row'] & {
  profiles?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Set document title
  useDocumentTitle(getPageTitle('Explore'));
  
  // State
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [filteredVisualizations, setFilteredVisualizations] = useState<Visualization[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"trending" | "recent" | "popular">("trending");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(true);
  const [expandedVisualizationId, setExpandedVisualizationId] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState("");
  const [filterByFollowing, setFilterByFollowing] = useState(false);
  const [filterBySaved, setFilterBySaved] = useState(false);
  const [trendingCreators, setTrendingCreators] = useState<any[]>([]);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);
  
  // Animation refs
  const expandedRef = useRef<HTMLDivElement>(null);
  
  // Categories
  const categories = ["all", "ambient", "electronic", "hip-hop", "rock", "jazz", "classical", "experimental"];
  
  // Load visualizations and following list
  useEffect(() => {
    loadVisualizations();
    loadTrendingCreators();
    if (user) {
      loadFollowing();
    }
  }, [sortBy, user]);
  
  const loadVisualizations = async () => {
    setLoading(true);
    try {
      const sortMap = {
        trending: 'likes_count',
        recent: 'created_at',
        popular: 'views_count'
      };
      
      const { data, error } = await getPublicVisualizations(
        0, 
        50, 
        sortMap[sortBy] as any
      );
      
      if (error) {
        console.error('Error loading visualizations:', error);
      } else {
        setVisualizations(data || []);
      }
    } catch (error) {
      console.error('Error loading visualizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingCreators = async () => {
    try {
      const { data, error } = await getTrendingCreators(5);
      
      if (!error && data) {
        setTrendingCreators(data);
        
        // Load following status for each creator
        if (user) {
          const statusPromises = data.map(async (creator: any) => {
            const { isFollowing } = await checkIsFollowing(creator.id);
            return { id: creator.id, isFollowing };
          });
          
          const statuses = await Promise.all(statusPromises);
          const statusMap = statuses.reduce((acc: Record<string, boolean>, status: any) => {
            acc[status.id] = status.isFollowing;
            return acc;
          }, {} as Record<string, boolean>);
          
          setFollowingStatus(statusMap);
        }
      }
    } catch (error) {
      console.error('Error loading trending creators:', error);
    }
  };

  const loadFollowing = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await getFollowing();
      
      if (!error && data) {
        const followingIds = data.map((profile: any) => profile.id);
        setFollowingUserIds(followingIds);
      }
    } catch (error) {
      console.error('Error loading following list:', error);
    }
  };
  
  // Filter visualizations
  useEffect(() => {
    let filtered = [...visualizations];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(viz => 
        viz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        viz.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        viz.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        viz.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Note: Category filter removed - using tags instead
    
    // Following filter
    if (filterByFollowing && user) {
      filtered = filtered.filter(viz => 
        viz.user_id && followingUserIds.includes(viz.user_id)
      );
    }
    
    // Saved filter
    if (filterBySaved && user) {
      filtered = filtered.filter(viz => 
        viz.user_saved && viz.user_saved.length > 0
      );
    }
    
    setFilteredVisualizations(filtered);
  }, [visualizations, searchTerm, selectedCategory, filterByFollowing, filterBySaved, user, followingUserIds]);
  
  // Handle like
  const handleLike = async (visualizationId: string) => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    
    try {
      const { isLiked, error } = await toggleLike(visualizationId);
      if (!error) {
        // Update local state
        setVisualizations(prev => prev.map(viz => {
          if (viz.id === visualizationId) {
            const currentLikes = viz.likes_count || 0;
            return {
              ...viz,
              likes_count: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
              user_liked: isLiked ? [{ user_id: user.id }] : []
            };
          }
          return viz;
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  // Handle save
  const handleSaveToFolder = async (visualizationId: string, folderId: string) => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    
    try {
      const { error } = await saveToFolder(visualizationId, folderId);
      if (!error) {
        // Update local state to show as saved
        setVisualizations(prev => prev.map(viz => {
          if (viz.id === visualizationId) {
            return {
              ...viz,
              user_saved: [{ user_id: user.id }]
            };
          }
          return viz;
        }));
      }
    } catch (error) {
      console.error('Error saving to folder:', error);
    }
  };

  const handleUnsave = async (visualizationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await toggleSave(visualizationId);
      if (!error) {
        // Update local state to show as unsaved
        setVisualizations(prev => prev.map(viz => {
          if (viz.id === visualizationId) {
            return {
              ...viz,
              user_saved: []
            };
          }
          return viz;
        }));
      }
    } catch (error) {
      console.error('Error unsaving visualization:', error);
    }
  };

  const handleToggleFollow = async (userId: string) => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    
    try {
      const { isFollowing, error } = await toggleFollow(userId);
      
      if (!error) {
        setFollowingStatus(prev => ({
          ...prev,
          [userId]: isFollowing ?? false
        }));
        
        // Update following list
        if (isFollowing) {
          setFollowingUserIds(prev => [...prev, userId]);
        } else {
          setFollowingUserIds(prev => prev.filter(id => id !== userId));
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };
  
  // Handle comment expansion
  const handleCommentClick = async (visualizationId: string) => {
    if (expandedVisualizationId === visualizationId) {
      setExpandedVisualizationId(null);
    } else {
      setExpandedVisualizationId(visualizationId);
      // Load comments from database
      if (!comments[visualizationId]) {
        const { data, error } = await getVisualizationComments(visualizationId);
        if (!error && data) {
          setComments(prev => ({
            ...prev,
            [visualizationId]: data
          }));
        }
      }
    }
  };
  
  // Handle add comment
  const handleAddComment = async (visualizationId: string) => {
    if (!user || !newComment.trim()) return;
    
    try {
      const { data, error } = await createComment(visualizationId, newComment);
      
      if (error) {
        console.error('Error creating comment:', error);
        // TODO: Show error toast
        return;
      }
      
      if (data) {
        // Add the new comment to the local state
        setComments(prev => ({
          ...prev,
          [visualizationId]: [data, ...(prev[visualizationId] || [])]
        }));
        
        // Clear the input
        setNewComment("");
        
        // Update the comment count on the visualization
        setVisualizations(prev => prev.map(viz => {
          if (viz.id === visualizationId) {
            return {
              ...viz,
              comments_count: (viz.comments_count || 0) + 1
            };
          }
          return viz;
        }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  
  const renderVisualizationCard = (viz: Visualization) => {
    const isExpanded = expandedVisualizationId === viz.id;
    const isLiked = user && viz.user_liked?.some((like: any) => like.user_id === user.id);
    const isSaved = user && viz.user_saved?.some((save: any) => save.user_id === user.id);
    
    const handleCardClick = (e: React.MouseEvent) => {
      // Only navigate if clicking on the card itself in grid mode, not on buttons
      if (viewMode === 'grid' && 
          !(e.target as HTMLElement).closest('button') && 
          !isExpanded) {
        navigate(`/?load=${viz.id}`);
      }
    };
    
    return (
      <div
        key={viz.id}
        className={`flex flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-4 transition-all duration-300 ${
          isExpanded ? 'col-span-full' : ''
        } ${viewMode === 'grid' && !isExpanded ? 'cursor-pointer hover:shadow-md' : ''}`}
        ref={isExpanded ? expandedRef : null}
        onClick={handleCardClick}
      >
        <div className={`flex ${isExpanded ? 'gap-6' : 'flex-col gap-4'} w-full`}>
          {/* Visualization preview */}
          <div className={`flex ${isExpanded ? 'w-1/2' : 'w-full'} flex-col gap-4`}>
            <div className="relative flex h-48 w-full flex-none items-center justify-center overflow-hidden rounded-md bg-black">
              <img
                className="grow shrink-0 basis-0 self-stretch object-cover opacity-50"
                src={viz.thumbnail_url || viz.profiles?.banner_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                alt={viz.title}
              />
              {viz.audio_file_name && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1">
                  <FeatherMusic className="text-caption font-caption text-white" />
                  <span className="text-caption font-caption text-white truncate max-w-[150px]">
                    {viz.audio_file_name}
                  </span>
                </div>
              )}
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
              <IconButton
                icon={<FeatherMoreVertical />}
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement more options menu
                }}
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={isLiked ? "brand-tertiary" : "neutral-tertiary"}
                  icon={<FeatherHeart />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(viz.id);
                  }}
                >
                  {viz.likes_count || 0}
                </Button>
                <Button
                  variant={isExpanded ? "brand-tertiary" : "neutral-tertiary"}
                  icon={<FeatherMessageCircle />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCommentClick(viz.id);
                  }}
                >
                  {viz.comments_count || 0}
                </Button>
              </div>
              {isSaved ? (
                <IconButton
                  variant="brand-primary"
                  icon={<FeatherBookmark />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnsave(viz.id);
                  }}
                />
              ) : (
                <FolderSelectionPopover
                  trigger={
                    <IconButton
                      variant="neutral-primary"
                      icon={<FeatherBookmark />}
                    />
                  }
                  onFolderSelect={(folderId: string) => handleSaveToFolder(viz.id, folderId)}
                  visualizationId={viz.id}
                  isSaved={isSaved ?? false}
                />
              )}
            </div>
          </div>
          
          {/* Comments section (expanded view) */}
          {isExpanded && (
            <div className="flex w-1/2 flex-col gap-4 border-l border-solid border-neutral-border pl-6">
              <div className="flex items-center justify-between">
                <span className="text-heading-3 font-heading-3 text-default-font">Comments</span>
                <IconButton
                  size="small"
                  icon={<FeatherX />}
                  onClick={() => setExpandedVisualizationId(null)}
                />
              </div>
              
              {/* Comment input */}
              {user && (
                <div className="flex items-center gap-2">
                  <TextField className="flex-1" label="" helpText="">
                    <TextField.Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' && newComment.trim()) {
                          handleAddComment(viz.id);
                        }
                      }}
                    />
                  </TextField>
                  <IconButton
                    icon={<FeatherSend />}
                    onClick={() => handleAddComment(viz.id)}
                    disabled={!newComment.trim()}
                  />
                </div>
              )}
              
              {/* Comments list with max height for scrolling */}
              <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-2">
                {comments[viz.id]?.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar size="small">
                      {(comment.profiles?.username?.[0] || comment.profiles?.full_name?.[0] || 'U').toUpperCase()}
                    </Avatar>
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-body-bold font-body-bold text-default-font">
                          {comment.profiles?.full_name || comment.profiles?.username || 'Anonymous'}
                        </span>
                        <span className="text-caption font-caption text-subtext-color">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-body font-body text-default-font">
                        {comment.content}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
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
              placeholder="Search visualizations, users, or music..."
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
                <span className="text-body font-body text-subtext-color">Loading visualizations...</span>
              </div>
            ) : filteredVisualizations.length === 0 ? (
              <div className="flex w-full h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <FeatherMusic className="text-heading-1 font-heading-1 text-subtext-color" />
                  <span className="text-body font-body text-subtext-color">
                    No visualizations found. Try adjusting your filters.
                  </span>
                </div>
              </div>
            ) : (
              <div className={`w-full items-start gap-6 grid ${
                viewMode === 'grid' && !expandedVisualizationId ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
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
                {/* Following filter */}
                {user && (
                  <div className="flex w-full items-center justify-between">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Show only following
                    </span>
                    <Button
                      variant={filterByFollowing ? "brand-primary" : "neutral-secondary"}
                      size="small"
                      onClick={() => setFilterByFollowing(!filterByFollowing)}
                    >
                      {filterByFollowing ? 'On' : 'Off'}
                    </Button>
                  </div>
                )}
                
                {/* Saved filter */}
                {user && (
                  <div className="flex w-full items-center justify-between">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Show only saved
                    </span>
                    <Button
                      variant={filterBySaved ? "brand-primary" : "neutral-secondary"}
                      size="small"
                      onClick={() => setFilterBySaved(!filterBySaved)}
                    >
                      {filterBySaved ? 'On' : 'Off'}
                    </Button>
                  </div>
                )}
                
                {/* Categories */}
                <div className="flex w-full flex-col items-start gap-3">
                  <span className="text-body-bold font-body-bold text-default-font">
                    Categories
                  </span>
                  <div className="flex w-full flex-wrap items-start gap-2">
                    {categories.map(cat => (
                      <Badge
                        key={cat}
                        variant={selectedCategory === cat ? "brand" : "neutral"}
                        onClick={() => setSelectedCategory(cat)}
                        className="cursor-pointer capitalize"
                      >
                        {cat === 'all' ? 'All' : cat.replace('-', ' ')}
                      </Badge>
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
                    <ToggleGroup.Item icon={null} value="trending">
                      Trending
                    </ToggleGroup.Item>
                    <ToggleGroup.Item icon={null} value="recent">
                      Recent
                    </ToggleGroup.Item>
                    <ToggleGroup.Item icon={null} value="popular">
                      Popular
                    </ToggleGroup.Item>
                  </ToggleGroup>
                </div>
                
                {/* Trending Creators */}
                <div className="flex w-full flex-col items-start gap-3">
                  <span className="text-body-bold font-body-bold text-default-font">
                    Trending Creators
                  </span>
                  <div className="flex w-full flex-col gap-2">
                    {trendingCreators.map((creator) => (
                      <div key={creator.id} className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded-md">
                        <div 
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => creator.username && navigate(`/profile/${creator.username}`)}
                        >
                          <Avatar
                            size="small"
                            image={creator.avatar_url || undefined}
                          >
                            {(creator.full_name?.[0] || creator.username?.[0] || 'U').toUpperCase()}
                          </Avatar>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-caption-bold font-caption-bold text-default-font truncate">
                              {creator.full_name || creator.username || 'Unknown'}
                            </span>
                            <span className="text-caption font-caption text-subtext-color">
                              {creator.followers_count || 0} followers • {creator.total_likes || 0} likes
                            </span>
                          </div>
                        </div>
                        {user && user.id !== creator.id && (
                          <Button
                            size="small"
                            variant={followingStatus[creator.id] ? "brand-secondary" : "brand-primary"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFollow(creator.id);
                            }}
                          >
                            {followingStatus[creator.id] ? 'Following' : 'Follow'}
                          </Button>
                        )}
                      </div>
                    ))}
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

export default ExplorePage;