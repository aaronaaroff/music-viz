import React, { useState, useEffect } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Button } from "@/ui/components/Button";
import { FeatherTrendingUp } from "@subframe/core";
import { Avatar } from "@/ui/components/Avatar";
import { FeatherShare2 } from "@subframe/core";
import { Tabs } from "@/ui/components/Tabs";
import { FeatherArrowUpDown } from "@subframe/core";
import { TextField } from "@/ui/components/TextField";
import { FeatherSearch } from "@subframe/core";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { FeatherLayoutGrid } from "@subframe/core";
import { FeatherLayoutList } from "@subframe/core";
import { FeatherImage } from "@subframe/core";
import { useAuth } from "@/components/auth/AuthContext";
import { getUserVisualizations } from "@/lib/api/visualizations";
import { toggleFollow, checkIsFollowing } from "@/lib/api/follows";
import { useNavigate, useParams } from "react-router-dom";
import type { Database } from "@/lib/database.types";
import { VisualizationCard } from "@/components/VisualizationCard";
import { supabase } from "@/lib/supabase";

type Visualization = Database['public']['Tables']['visualizations']['Row'] & {
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null; banner_url?: string | null } | null;
};

type PublicProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};

function PublicProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams();
  
  const [profileUser, setProfileUser] = useState<PublicProfile | null>(null);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [filteredVisualizations, setFilteredVisualizations] = useState<Visualization[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVisualizations, setLoadingVisualizations] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"updated_at" | "created_at" | "title">("updated_at");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Load profile user by username
  useEffect(() => {
    const loadProfileUser = async () => {
      if (!username) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, bio, avatar_url, banner_url')
          .eq('username', username)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setProfileUser(data);
          // Check if current user is following this profile
          if (user && user.id !== data.id) {
            checkFollowingStatus(data.id);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadProfileUser();
  }, [username, user]);

  const checkFollowingStatus = async (userId: string) => {
    try {
      const { isFollowing: following } = await checkIsFollowing(userId);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error checking following status:', error);
    }
  };

  const handleToggleFollow = async () => {
    if (!user || !profileUser) {
      navigate('/auth/signin');
      return;
    }
    
    setFollowLoading(true);
    try {
      const { isFollowing: newFollowingStatus, error } = await toggleFollow(profileUser.id);
      
      if (!error) {
        setIsFollowing(newFollowingStatus);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  // Load user's public visualizations
  useEffect(() => {
    const loadVisualizations = async () => {
      if (!profileUser) return;
      
      setLoadingVisualizations(true);
      try {
        const { data, error } = await getUserVisualizations(profileUser.id, false); // false = only public
        if (error) {
          console.error('Error loading visualizations:', error);
        } else {
          setVisualizations(data || []);
        }
      } catch (error) {
        console.error('Error loading visualizations:', error);
      } finally {
        setLoadingVisualizations(false);
      }
    };

    loadVisualizations();
  }, [profileUser]);

  // Filter and sort visualizations
  useEffect(() => {
    let filtered = [...visualizations];
    
    // Filter by search term (including tags)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(viz => 
        viz.title.toLowerCase().includes(searchLower) ||
        (viz.description && viz.description.toLowerCase().includes(searchLower)) ||
        (viz.tags && viz.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "created_at":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "updated_at":
        default:
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      }
    });
    
    setFilteredVisualizations(filtered);
  }, [visualizations, searchTerm, sortBy]);

  const handleLoadVisualization = (vizId: string) => {
    // Navigate to main page with visualization ID as query param
    navigate(`/?load=${vizId}`);
  };

  if (loading) {
    return (
      <DefaultPageLayout>
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-body font-body text-subtext-color">Loading profile...</span>
        </div>
      </DefaultPageLayout>
    );
  }

  if (notFound || !profileUser) {
    return (
      <DefaultPageLayout>
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="text-heading-2 font-heading-2 text-default-font">Profile Not Found</span>
            <span className="text-body font-body text-subtext-color">
              The user @{username} could not be found.
            </span>
            <Button onClick={() => navigate('/explore')}>
              Back to Explore
            </Button>
          </div>
        </div>
      </DefaultPageLayout>
    );
  }

  const displayName = profileUser.full_name || profileUser.username || 'User';

  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full flex-col items-start">
        {/* Top toolbar */}
        <div className="flex w-full items-center justify-end gap-2 border-b border-solid border-neutral-border px-8 py-2">
          <Button
            variant="neutral-tertiary"
            icon={<FeatherTrendingUp />}
            onClick={() => navigate('/explore')}
          >
            Explore
          </Button>
        </div>
        
        <div className="container max-w-none flex w-full grow shrink-0 basis-0 flex-col items-start gap-4 bg-default-background py-12 overflow-auto">
          <div className="flex w-full flex-col items-start gap-12">
            {/* Profile header */}
            <div className="flex w-full flex-col items-start gap-4 relative">
              <div className="relative h-60 w-full flex-none rounded-md overflow-hidden">
                <img
                  className="h-full w-full object-cover"
                  src={profileUser.banner_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                  alt="Profile banner"
                />
              </div>
              <div className="flex flex-col items-start gap-4 rounded-full border-2 border-solid border-default-background shadow-lg absolute left-4 -bottom-4">
                <Avatar
                  size="x-large"
                  image={profileUser.avatar_url || undefined}
                >
                  {displayName.charAt(0).toUpperCase()}
                </Avatar>
              </div>
            </div>
            
            <div className="flex w-full flex-col items-start gap-6">
              {/* Profile info section */}
              <div className="flex flex-wrap items-start gap-6">
                <div className="flex flex-col items-start gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-heading-1 font-heading-1 text-default-font">
                      {displayName}
                    </span>
                    {profileUser.username && (
                      <span className="text-body font-body text-subtext-color">
                        @{profileUser.username}
                      </span>
                    )}
                  </div>
                  
                  {profileUser.bio && (
                    <span className="text-body font-body text-subtext-color">
                      {profileUser.bio}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {user && user.id !== profileUser.id && (
                    <Button
                      variant={isFollowing ? "brand-secondary" : "brand-primary"}
                      loading={followLoading}
                      onClick={handleToggleFollow}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                  <Button
                    variant="neutral-secondary"
                    icon={<FeatherShare2 />}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `${displayName}'s Profile`,
                          url: window.location.href
                        });
                      }
                    }}
                  >
                    Share Profile
                  </Button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap items-start gap-12">
                <div className="flex flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Public Visualizations
                  </span>
                  <span className="text-body-bold font-body-bold text-default-font">
                    {visualizations.length}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Total Likes
                  </span>
                  <span className="text-body-bold font-body-bold text-default-font">
                    {visualizations.reduce((sum, v) => sum + (v.likes_count || 0), 0)}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-caption font-caption text-subtext-color">
                    Total Views
                  </span>
                  <span className="text-body-bold font-body-bold text-default-font">
                    {visualizations.reduce((sum, v) => sum + (v.views_count || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Visualizations section */}
          <div className="flex w-full flex-col items-start gap-6">
            <Tabs>
              <Tabs.Item active={true}>
                Public ({visualizations.length})
              </Tabs.Item>
            </Tabs>
            
            {/* Controls */}
            <div className="flex w-full flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="neutral-secondary"
                  icon={<FeatherArrowUpDown />}
                  onClick={() => {
                    const nextSort = sortBy === "updated_at" ? "created_at" : 
                                   sortBy === "created_at" ? "title" : "updated_at";
                    setSortBy(nextSort);
                  }}
                >
                  Sort by {sortBy === "updated_at" ? "updated" : 
                           sortBy === "created_at" ? "created" : "title"}
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <TextField label="" helpText="" icon={<FeatherSearch />} className="min-w-[300px]">
                  <TextField.Input
                    placeholder="Search by title, description, or tags..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setSearchTerm(e.target.value)}
                  />
                </TextField>
                <ToggleGroup 
                  value={viewMode} 
                  onValueChange={(value: string) => setViewMode(value as "grid" | "list")}
                >
                  <ToggleGroup.Item
                    icon={<FeatherLayoutGrid />}
                    value="grid"
                  >
                    Grid
                  </ToggleGroup.Item>
                  <ToggleGroup.Item
                    icon={<FeatherLayoutList />}
                    value="list"
                  >
                    List
                  </ToggleGroup.Item>
                </ToggleGroup>
              </div>
            </div>
            
            {/* Visualizations grid */}
            {loadingVisualizations ? (
              <div className="flex w-full items-center justify-center py-12">
                <span className="text-body font-body text-subtext-color">Loading visualizations...</span>
              </div>
            ) : filteredVisualizations.length === 0 ? (
              <div className="flex w-full items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <FeatherImage className="text-heading-1 font-heading-1 text-subtext-color" />
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-body-bold font-body-bold text-default-font">
                      {searchTerm ? 'No matching visualizations' : 'No public visualizations'}
                    </span>
                    <span className="text-body font-body text-subtext-color text-center">
                      {searchTerm 
                        ? 'Try adjusting your search criteria'
                        : `${displayName} hasn't shared any public visualizations yet`
                      }
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`w-full ${
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "flex flex-col gap-4"
              }`}>
                {filteredVisualizations.map((viz) => (
                  <VisualizationCard
                    key={viz.id}
                    visualization={viz}
                    viewMode={viewMode}
                    onLoad={handleLoadVisualization}
                    isOwner={false}
                    showCreator={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default PublicProfilePage;