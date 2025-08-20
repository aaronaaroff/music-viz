import React, { useState, useEffect } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Button } from "@/ui/components/Button";
import { FeatherArrowLeft } from "@subframe/core";
import { Tabs } from "@/ui/components/Tabs";
import { TextField } from "@/ui/components/TextField";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { Slider } from "@/ui/components/Slider";
import { FeatherUser } from "@subframe/core";
import { FeatherShield } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { FeatherDownload } from "@subframe/core";
import { useAuth } from "@/components/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  getUserPreferences, 
  updateUserPreferences, 
  changePassword,
  deleteAccount,
  type UserPreferences 
} from "@/lib/api/userPreferences";
import { supabase } from "@/lib/supabase";

function SettingsPage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: "" });
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  
  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  
  // Profile settings
  const [profileSettings, setProfileSettings] = useState({
    isPublic: true,
    showEmail: false,
    showFullName: true
  });
  
  // Visualization defaults
  const [vizDefaults, setVizDefaults] = useState({
    defaultPrivacy: "private" as 'private' | 'public',
    defaultSensitivity: 0.5,
    defaultSmoothing: 0.3,
    defaultColorTheme: "neon"
  });

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      setIsLoadingPrefs(true);
      const { data, error } = await getUserPreferences(user.id);
      
      if (data && !error) {
        setProfileSettings({
          isPublic: data.profile_is_public,
          showEmail: data.show_email,
          showFullName: data.show_full_name
        });
        
        setVizDefaults({
          defaultPrivacy: data.default_viz_privacy,
          defaultSensitivity: data.default_sensitivity,
          defaultSmoothing: data.default_smoothing,
          defaultColorTheme: data.default_color_theme
        });
      }
      
      setIsLoadingPrefs(false);
    };
    
    if (user) {
      loadPreferences();
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/signin');
    }
  }, [user, loading, navigate]);

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setSaveStatus({ type: null, message: "" });
    
    try {
      const updates: Partial<UserPreferences> = {
        profile_is_public: profileSettings.isPublic,
        show_email: profileSettings.showEmail,
        show_full_name: profileSettings.showFullName,
        default_viz_privacy: vizDefaults.defaultPrivacy,
        default_sensitivity: vizDefaults.defaultSensitivity,
        default_smoothing: vizDefaults.defaultSmoothing,
        default_color_theme: vizDefaults.defaultColorTheme
      };
      
      const { error } = await updateUserPreferences(user.id, updates);
      
      if (error) {
        throw error;
      }
      
      setSaveStatus({ type: 'success', message: 'Settings saved successfully!' });
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 3000);
    } catch (error) {
      setSaveStatus({ 
        type: 'error', 
        message: 'Failed to save settings. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setSaveStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    
    if (newPassword.length < 6) {
      setSaveStatus({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }
    
    setIsSaving(true);
    const { success, error } = await changePassword(currentPassword, newPassword);
    
    if (success) {
      setSaveStatus({ type: 'success', message: 'Password changed successfully!' });
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setSaveStatus({ type: 'error', message: error || 'Failed to change password' });
    }
    
    setIsSaving(false);
    setTimeout(() => setSaveStatus({ type: null, message: "" }), 3000);
  };
  
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    setIsSaving(true);
    const { success, error } = await deleteAccount(deletePassword);
    
    if (success) {
      navigate('/');
    } else {
      setSaveStatus({ type: 'error', message: error || 'Failed to delete account' });
      setIsSaving(false);
    }
    
    setShowDeleteDialog(false);
    setDeletePassword("");
  };

  const handleExportData = async () => {
    if (!user) return;
    
    try {
      // Fetch all user data
      const [vizResult, prefsResult] = await Promise.all([
        supabase.from('visualizations').select('*').eq('user_id', user.id),
        getUserPreferences(user.id)
      ]);
      
      const exportData = {
        profile: profile,
        preferences: prefsResult.data,
        visualizations: vizResult.data || [],
        settings: {
          profile: profileSettings,
          visualization: vizDefaults
        },
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `music-viz-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      setSaveStatus({ type: 'success', message: 'Data exported successfully!' });
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 3000);
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Failed to export data' });
    }
  };

  if (loading) {
    return (
      <DefaultPageLayout>
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-body font-body text-subtext-color">Loading settings...</span>
        </div>
      </DefaultPageLayout>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full flex-col items-start">
        {/* Header */}
        <div className="flex w-full items-center gap-4 border-b border-solid border-neutral-border px-8 py-4">
          <Button
            variant="neutral-tertiary"
            icon={<FeatherArrowLeft />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <span className="text-heading-2 font-heading-2 text-default-font">Settings</span>
        </div>
        
        <div className="container max-w-4xl flex w-full grow shrink-0 basis-0 flex-col items-start gap-6 bg-default-background py-8 overflow-auto">
          {/* Save status */}
          {saveStatus.type && (
            <div className={`w-full p-4 rounded-md ${
              saveStatus.type === 'error' ? 'bg-error-50 text-error-700' : 'bg-success-50 text-success-700'
            }`}>
              {saveStatus.message}
            </div>
          )}
          
          {/* Settings Tabs */}
          <div className="flex w-full flex-col gap-6">
            <Tabs>
              <Tabs.Item 
                active={activeTab === "profile"}
                icon={<FeatherUser />}
                onClick={() => setActiveTab("profile")}
              >
                Profile
              </Tabs.Item>
              <Tabs.Item 
                active={activeTab === "privacy"}
                icon={<FeatherShield />}
                onClick={() => setActiveTab("privacy")}
              >
                Privacy
              </Tabs.Item>
              <Tabs.Item 
                active={activeTab === "defaults"}
                icon={<FeatherSettings />}
                onClick={() => setActiveTab("defaults")}
              >
                Defaults
              </Tabs.Item>
              <Tabs.Item 
                active={activeTab === "data"}
                icon={<FeatherDownload />}
                onClick={() => setActiveTab("data")}
              >
                Data
              </Tabs.Item>
            </Tabs>
            
            {/* Tab Content */}
            <div className="flex w-full flex-col gap-6 rounded-md border border-solid border-neutral-border bg-default-background p-6">
              
              {/* Profile Settings */}
              {activeTab === "profile" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-heading-3 font-heading-3 text-default-font">
                      Profile Visibility
                    </span>
                    <span className="text-body font-body text-subtext-color">
                      Control who can see your profile and visualizations
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-body-bold font-body-bold text-default-font">
                          Public Profile
                        </span>
                        <span className="text-caption font-caption text-subtext-color">
                          Allow others to find and view your profile
                        </span>
                      </div>
                      <ToggleGroup 
                        value={profileSettings.isPublic ? "public" : "private"}
                        onValueChange={(value) => setProfileSettings(prev => ({ ...prev, isPublic: value === "public" }))}
                      >
                        <ToggleGroup.Item value="public">Public</ToggleGroup.Item>
                        <ToggleGroup.Item value="private">Private</ToggleGroup.Item>
                      </ToggleGroup>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-body-bold font-body-bold text-default-font">
                          Show Full Name
                        </span>
                        <span className="text-caption font-caption text-subtext-color">
                          Display your full name on your public profile
                        </span>
                      </div>
                      <ToggleGroup 
                        value={profileSettings.showFullName ? "show" : "hide"}
                        onValueChange={(value) => setProfileSettings(prev => ({ ...prev, showFullName: value === "show" }))}
                      >
                        <ToggleGroup.Item value="show">Show</ToggleGroup.Item>
                        <ToggleGroup.Item value="hide">Hide</ToggleGroup.Item>
                      </ToggleGroup>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-body-bold font-body-bold text-default-font">
                          Show Email
                        </span>
                        <span className="text-caption font-caption text-subtext-color">
                          Display your email address on your profile
                        </span>
                      </div>
                      <ToggleGroup 
                        value={profileSettings.showEmail ? "show" : "hide"}
                        onValueChange={(value) => setProfileSettings(prev => ({ ...prev, showEmail: value === "show" }))}
                      >
                        <ToggleGroup.Item value="show">Show</ToggleGroup.Item>
                        <ToggleGroup.Item value="hide">Hide</ToggleGroup.Item>
                      </ToggleGroup>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Privacy Settings */}
              {activeTab === "privacy" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-heading-3 font-heading-3 text-default-font">
                      Privacy & Security
                    </span>
                    <span className="text-body font-body text-subtext-color">
                      Manage your privacy preferences and data sharing
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-body-bold font-body-bold text-default-font">
                          Default Visualization Privacy
                        </span>
                        <span className="text-caption font-caption text-subtext-color">
                          Choose the default privacy setting for new visualizations
                        </span>
                      </div>
                      <ToggleGroup 
                        value={vizDefaults.defaultPrivacy}
                        onValueChange={(value) => setVizDefaults(prev => ({ ...prev, defaultPrivacy: value }))}
                      >
                        <ToggleGroup.Item value="private">Private</ToggleGroup.Item>
                        <ToggleGroup.Item value="public">Public</ToggleGroup.Item>
                      </ToggleGroup>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4 pt-4 border-t border-neutral-border">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Account Actions
                    </span>
                    <div className="flex gap-3">
                      <Button 
                        variant="neutral-secondary"
                        onClick={() => setShowPasswordDialog(true)}
                      >
                        Change Password
                      </Button>
                      <Button 
                        variant="error-secondary"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                  
                  {/* Password Change Dialog */}
                  {showPasswordDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-default-background p-6 rounded-lg max-w-md w-full mx-4">
                        <h3 className="text-heading-3 font-heading-3 mb-4">Change Password</h3>
                        <div className="flex flex-col gap-4">
                          <TextField
                            label="Current Password"
                            helpText=""
                          >
                            <TextField.Input
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Enter current password"
                            />
                          </TextField>
                          <TextField
                            label="New Password"
                            helpText="Must be at least 6 characters"
                          >
                            <TextField.Input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                            />
                          </TextField>
                          <TextField
                            label="Confirm New Password"
                            helpText=""
                          >
                            <TextField.Input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                            />
                          </TextField>
                          <div className="flex gap-3 justify-end mt-4">
                            <Button
                              variant="neutral-secondary"
                              onClick={() => {
                                setShowPasswordDialog(false);
                                setCurrentPassword("");
                                setNewPassword("");
                                setConfirmPassword("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="brand-primary"
                              onClick={handleChangePassword}
                              loading={isSaving}
                            >
                              Change Password
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Delete Account Dialog */}
                  {showDeleteDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-default-background p-6 rounded-lg max-w-md w-full mx-4">
                        <h3 className="text-heading-3 font-heading-3 mb-4 text-error-700">Delete Account</h3>
                        <p className="text-body font-body text-subtext-color mb-4">
                          This action cannot be undone. All your data will be permanently deleted.
                        </p>
                        <TextField
                          label="Enter your password to confirm"
                          helpText=""
                        >
                          <TextField.Input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter password"
                          />
                        </TextField>
                        <div className="flex gap-3 justify-end mt-6">
                          <Button
                            variant="neutral-secondary"
                            onClick={() => {
                              setShowDeleteDialog(false);
                              setDeletePassword("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="error-primary"
                            onClick={handleDeleteAccount}
                            loading={isSaving}
                          >
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Visualization Defaults */}
              {activeTab === "defaults" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-heading-3 font-heading-3 text-default-font">
                      Visualization Defaults
                    </span>
                    <span className="text-body font-body text-subtext-color">
                      Set default values for new visualizations
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-body-bold font-body-bold text-default-font">
                        Default Color Theme
                      </span>
                      <ToggleGroup 
                        value={vizDefaults.defaultColorTheme}
                        onValueChange={(value) => setVizDefaults(prev => ({ ...prev, defaultColorTheme: value }))}
                      >
                        <ToggleGroup.Item value="neon">Neon</ToggleGroup.Item>
                        <ToggleGroup.Item value="sunset">Sunset</ToggleGroup.Item>
                        <ToggleGroup.Item value="mono">Mono</ToggleGroup.Item>
                      </ToggleGroup>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <span className="text-body-bold font-body-bold text-default-font">
                        Default Sensitivity
                      </span>
                      <Slider
                        value={[vizDefaults.defaultSensitivity * 100]}
                        onValueChange={(value) => setVizDefaults(prev => ({ ...prev, defaultSensitivity: value[0] / 100 }))}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <span className="text-body-bold font-body-bold text-default-font">
                        Default Smoothing
                      </span>
                      <Slider
                        value={[vizDefaults.defaultSmoothing * 100]}
                        onValueChange={(value) => setVizDefaults(prev => ({ ...prev, defaultSmoothing: value[0] / 100 }))}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Data Management */}
              {activeTab === "data" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-heading-3 font-heading-3 text-default-font">
                      Data Management
                    </span>
                    <span className="text-body font-body text-subtext-color">
                      Export your data or manage your account information
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="text-body-bold font-body-bold text-default-font">
                          Export Your Data
                        </span>
                        <span className="text-caption font-caption text-subtext-color">
                          Download all your profile data, settings, and visualizations
                        </span>
                      </div>
                      <Button 
                        variant="neutral-secondary"
                        icon={<FeatherDownload />}
                        onClick={handleExportData}
                      >
                        Export Data
                      </Button>
                    </div>
                    
                    <div className="flex items-start justify-between pt-4 border-t border-neutral-border">
                      <div className="flex flex-col">
                        <span className="text-body-bold font-body-bold text-default-font">
                          Account Information
                        </span>
                        <span className="text-caption font-caption text-subtext-color">
                          Email: {user.email}
                        </span>
                        <span className="text-caption font-caption text-subtext-color">
                          Member since: {new Date(user.created_at || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                variant="brand-primary"
                onClick={handleSaveSettings}
                loading={isSaving}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default SettingsPage;