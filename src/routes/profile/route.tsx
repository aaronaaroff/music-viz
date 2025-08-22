import React, { useState, useEffect } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Button } from "@/ui/components/Button";
import { FeatherTrendingUp } from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { Avatar } from "@/ui/components/Avatar";
import { FeatherShare2 } from "@subframe/core";
import { Tabs } from "@/ui/components/Tabs";
import { FeatherArrowUpDown } from "@subframe/core";
import { TextField } from "@/ui/components/TextField";
import { FeatherSearch } from "@subframe/core";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { FeatherLayoutGrid } from "@subframe/core";
import { FeatherLayoutList } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { FeatherImage } from "@subframe/core";
import { FeatherEdit3 } from "@subframe/core";
import { useAuth } from "@/components/auth/AuthContext";
import { getUserVisualizations, deleteVisualization } from "@/lib/api/visualizations";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle, getPageTitle } from "@/hooks/useDocumentTitle";
import type { Database } from "@/lib/database.types";
import { VisualizationCard } from "@/components/VisualizationCard";
import { uploadImage } from "@/lib/api/imageFiles";

type Visualization = Database['public']['Tables']['visualizations']['Row'] & {
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
};

function UserProfileHub() {
  const { user, profile, loading, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  // Set document title based on user profile
  const profileTitle = profile?.full_name || profile?.username || 'Profile';
  useDocumentTitle(getPageTitle('Profile', profileTitle));
  
  const [activeTab, setActiveTab] = useState<string>("collection");
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [filteredVisualizations, setFilteredVisualizations] = useState<Visualization[]>([]);
  const [loadingVisualizations, setLoadingVisualizations] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"updated_at" | "created_at" | "title">("updated_at");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "",
    bio: ""
  });
  
  // File upload refs
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);
  
  // Upload status states
  const [uploadStatus, setUploadStatus] = useState<{ type: 'error' | 'success' | null; message: string }>({ type: null, message: '' });
  const [isUploading, setIsUploading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/signin');
    }
  }, [user, loading, navigate]);

  // Initialize edit form with profile data
  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || ""
      });
    }
  }, [profile]);

  // Load user's visualizations
  useEffect(() => {
    const loadVisualizations = async () => {
      if (!user) return;
      
      setLoadingVisualizations(true);
      try {
        const { data, error } = await getUserVisualizations(user.id, true);
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
  }, [user]);

  // Filter and sort visualizations
  useEffect(() => {
    let filtered = [...visualizations];
    
    // Filter by search term (including tags)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(viz => 
        viz.title.toLowerCase().includes(searchLower) ||
        (viz.description && viz.description.toLowerCase().includes(searchLower)) ||
        (viz.tags && viz.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    // Filter by tab
    if (activeTab === "collection") {
      // Show all visualizations (both drafts and published)
    } else if (activeTab === "drafts") {
      filtered = filtered.filter(viz => !viz.is_public);
    } else if (activeTab === "published") {
      filtered = filtered.filter(viz => viz.is_public);
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
  }, [visualizations, searchTerm, activeTab, sortBy]);

  const handleEditProfile = async () => {
    if (!isEditingProfile) {
      setIsEditingProfile(true);
      return;
    }

    try {
      const { error } = await updateProfile(editForm);
      if (error) {
        console.error('Error updating profile:', error);
        // You could add a toast notification here
      } else {
        setIsEditingProfile(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleDeleteVisualization = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visualization? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await deleteVisualization(id);
      if (error) {
        console.error('Error deleting visualization:', error);
      } else {
        setVisualizations(prev => prev.filter(viz => viz.id !== id));
      }
    } catch (error) {
      console.error('Error deleting visualization:', error);
    }
  };

  const handleLoadVisualization = (vizId: string) => {
    // Navigate to main page with visualization ID as query param
    navigate(`/?load=${vizId}`);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Clear any previous status
    setUploadStatus({ type: null, message: '' });
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({ 
        type: 'error', 
        message: 'Image must be less than 5MB. Please choose a smaller file.' 
      });
      // Clear the file input
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadStatus({ 
        type: 'error', 
        message: 'Please select a valid image file (JPEG, PNG, GIF, etc.)' 
      });
      // Clear the file input
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadImage({
        file,
        userId: user.id,
        type: 'avatar'
      });

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: result.url });
      setUploadStatus({ 
        type: 'success', 
        message: 'Avatar updated successfully!' 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      setUploadStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to upload avatar. Please try again.' 
      });
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Clear any previous status
    setUploadStatus({ type: null, message: '' });
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({ 
        type: 'error', 
        message: 'Image must be less than 5MB. Please choose a smaller file.' 
      });
      // Clear the file input
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadStatus({ 
        type: 'error', 
        message: 'Please select a valid image file (JPEG, PNG, GIF, etc.)' 
      });
      // Clear the file input
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadImage({
        file,
        userId: user.id,
        type: 'banner'
      });

      // Update profile with new banner URL
      await updateProfile({ banner_url: result.url });
      setUploadStatus({ 
        type: 'success', 
        message: 'Banner updated successfully!' 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error('Banner upload failed:', error);
      setUploadStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to upload banner. Please try again.' 
      });
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
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

  if (!user) {
    return null; // Will redirect
  }

  const displayName = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'User';

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
          <Button
            variant="brand-secondary"
            icon={<FeatherSettings />}
            onClick={handleEditProfile}
            loading={isEditingProfile && loading}
          >
            {isEditingProfile ? 'Save Profile' : 'Edit Profile'}
          </Button>
        </div>
        
        <div className="container max-w-none flex w-full grow shrink-0 basis-0 flex-col items-start gap-4 bg-default-background py-12 overflow-auto">
          <div className="flex w-full flex-col items-start gap-12">
            {/* Upload status message */}
            {uploadStatus.type && (
              <div className={`w-full p-4 rounded-md ${
                uploadStatus.type === 'error' ? 'bg-error-50 text-error-700' : 'bg-success-50 text-success-700'
              }`}>
                {uploadStatus.message}
              </div>
            )}
            
            {/* Profile header */}
            <div className="flex w-full flex-col items-start gap-4 relative">
              <div 
                className={`relative h-60 w-full flex-none rounded-md overflow-hidden ${
                  isEditingProfile ? 'cursor-pointer group' : ''
                }`}
                onClick={() => isEditingProfile && bannerInputRef.current?.click()}
              >
                <img
                  className="h-full w-full object-cover"
                  src={profile?.banner_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                  alt="Profile banner"
                />
                {isEditingProfile && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                    {isUploading ? (
                      <div className="text-white animate-spin">⟳</div>
                    ) : (
                      <FeatherEdit3 className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-2xl" />
                    )}
                  </div>
                )}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
              <div className={`flex flex-col items-start gap-4 rounded-full border-2 border-solid border-default-background shadow-lg absolute left-4 -bottom-4 ${
                isEditingProfile ? 'cursor-pointer group' : ''
              }`}
              onClick={() => isEditingProfile && avatarInputRef.current?.click()}
              >
                <div className="relative">
                  <Avatar
                    size="x-large"
                    image={profile?.avatar_url || undefined}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </Avatar>
                  {isEditingProfile && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center rounded-full">
                      {isUploading ? (
                        <div className="text-white animate-spin">⟳</div>
                      ) : (
                        <FeatherEdit3 className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="flex w-full flex-col items-start gap-6">
              {/* Profile info section */}
              <div className="flex flex-wrap items-start gap-6">
                <div className="flex flex-col items-start gap-2 flex-1 min-w-0">
                  {isEditingProfile ? (
                    <div className="flex flex-col gap-4 w-full max-w-md">
                      <TextField label="Full Name" helpText="">
                        <TextField.Input
                          placeholder="Your full name"
                          value={editForm.full_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                      </TextField>
                      <TextField label="Username" helpText="">
                        <TextField.Input
                          placeholder="Your username"
                          value={editForm.username}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        />
                      </TextField>
                      <TextField label="Bio" helpText="Tell others about yourself">
                        <TextField.Input
                          placeholder="A brief description about you..."
                          value={editForm.bio}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        />
                      </TextField>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-heading-1 font-heading-1 text-default-font">
                        {displayName}
                      </span>
                      {profile?.username && (
                        <span className="text-body font-body text-subtext-color">
                          @{profile.username}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {profile?.bio && !isEditingProfile && (
                    <span className="text-body font-body text-subtext-color">
                      {profile.bio}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <IconButton
                    icon={<FeatherShare2 />}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `${displayName}'s Profile`,
                          url: window.location.href
                        });
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap items-start gap-12">
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
                    Followers
                  </span>
                  <span className="text-body-bold font-body-bold text-default-font">
                    {profile?.followers_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Visualizations section */}
          <div className="flex w-full flex-col items-start gap-6">
            <Tabs>
              <Tabs.Item 
                active={activeTab === "collection"}
                onClick={() => setActiveTab("collection")}
              >
                All ({visualizations.length})
              </Tabs.Item>
              <Tabs.Item 
                active={activeTab === "published"}
                onClick={() => setActiveTab("published")}
              >
                Published ({visualizations.filter(v => v.is_public).length})
              </Tabs.Item>
              <Tabs.Item 
                active={activeTab === "drafts"}
                onClick={() => setActiveTab("drafts")}
              >
                Drafts ({visualizations.filter(v => !v.is_public).length})
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
                      {searchTerm ? 'No matching visualizations' : 'No visualizations yet'}
                    </span>
                    <span className="text-body font-body text-subtext-color text-center">
                      {searchTerm 
                        ? 'Try adjusting your search or filter criteria'
                        : 'Create your first visualization to get started!'
                      }
                    </span>
                  </div>
                  {!searchTerm && (
                    <Button
                      variant="brand-primary"
                      onClick={() => navigate('/')}
                    >
                      Create Visualization
                    </Button>
                  )}
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
                    onDelete={handleDeleteVisualization}
                    isOwner={true}
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

export default UserProfileHub;