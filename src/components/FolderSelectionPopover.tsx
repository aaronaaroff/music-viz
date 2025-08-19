import React, { useState, useEffect } from 'react';
import { Popover, PopoverItem, PopoverLabel, PopoverSeparator } from '@/components/Popover';
import { IconButton } from '@/ui/components/IconButton';
import { TextField } from '@/ui/components/TextField';
import { Button } from '@/ui/components/Button';
import { FeatherFolder, FeatherFolderPlus, FeatherCheck, FeatherX } from '@subframe/core';
import { useAuth } from '@/components/auth/AuthContext';
import { toggleSave } from '@/lib/api/visualizations';
import { getUserFolders, createFolder as createFolderAPI, getFoldersForVisualization } from '@/lib/api/folders';

interface Folder {
  id: string;
  name: string;
  color: string;
  saves_count: number;
}

interface FolderSelectionPopoverProps {
  trigger: React.ReactNode;
  onFolderSelect: (folderId: string) => Promise<void>;
  selectedFolders?: string[];
  visualizationId: string;
  isSaved?: boolean;
}

export function FolderSelectionPopover({ 
  trigger, 
  onFolderSelect, 
  selectedFolders = [],
  visualizationId,
  isSaved = false
}: FolderSelectionPopoverProps) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Load user's folders
  useEffect(() => {
    if (user) {
      loadFolders();
      if (isSaved) {
        loadSelectedFolders();
      }
    }
  }, [user, visualizationId, isSaved]);

  const loadFolders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await getUserFolders(user.id);
      
      if (error) {
        console.error('Error loading folders:', error);
        // Fallback to default folders
        const defaultFolders: Folder[] = [
          { id: 'default', name: 'My Favorites', color: '#4F46E5', saves_count: 0 }
        ];
        setFolders(defaultFolders);
      } else {
        // Add "All Saved" as the first option and convert data to our interface
        const allFolders: Folder[] = [
          { id: 'all-saved', name: 'All Saved', color: '#6B7280', saves_count: 0 },
          ...data.map((folder: any) => ({
            id: folder.id,
            name: folder.name,
            color: folder.color,
            saves_count: folder.saves_count || 0
          }))
        ];
        setFolders(allFolders);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedFolders = async () => {
    if (!user) return;
    
    try {
      const { data } = await getFoldersForVisualization(visualizationId);
      // Update selected folders if needed based on the data
    } catch (error) {
      console.error('Error loading selected folders:', error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim() || !user) return;
    
    try {
      const { data, error } = await createFolderAPI({
        name: newFolderName.trim(),
        color: '#6B7280'
      });
      
      if (error) {
        console.error('Error creating folder:', error);
      } else if (data) {
        const newFolder: Folder = {
          id: data.id,
          name: data.name,
          color: data.color,
          saves_count: data.saves_count || 0
        };
        
        setFolders(prev => [...prev, newFolder]);
        setNewFolderName('');
        setIsCreatingFolder(false);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleFolderToggle = async (folderId: string) => {
    try {
      if (!isSaved) {
        // If not saved yet, save it first (this will save to the basic saves table)
        const { error } = await toggleSave(visualizationId);
        if (error) {
          console.error('Error saving visualization:', error);
          return;
        }
      }
      
      // Now add to the specific folder
      await onFolderSelect(folderId);
      
      // Update local folder state if needed
    } catch (error) {
      console.error('Error toggling folder:', error);
    }
  };

  return (
    <Popover trigger={trigger} position="bottom-left">
      <PopoverLabel>{isSaved ? 'Add to folder' : 'Save to folder'}</PopoverLabel>
      
      {!isSaved && (
        <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
          <span className="text-caption font-caption text-blue-700">
            This will save the visualization and add it to your selected folder
          </span>
        </div>
      )}
      
      {loading ? (
        <div className="px-3 py-2">
          <span className="text-caption font-caption text-subtext-color">Loading folders...</span>
        </div>
      ) : (
        <>
          {/* Existing folders */}
          {folders.map(folder => (
            <PopoverItem
              key={folder.id}
              onClick={() => handleFolderToggle(folder.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <FeatherFolder 
                    className="w-4 h-4" 
                    style={{ color: folder.color }}
                  />
                  <span>{folder.name}</span>
                  <span className="text-caption font-caption text-subtext-color">
                    ({folder.saves_count})
                  </span>
                </div>
                {selectedFolders.includes(folder.id) && (
                  <FeatherCheck className="w-4 h-4 text-success-600" />
                )}
              </div>
            </PopoverItem>
          ))}
          
          <PopoverSeparator />
          
          {/* Create new folder */}
          {isCreatingFolder ? (
            <div className="flex flex-col gap-2 p-2">
              <TextField className="flex-1" label="" helpText="">
                <TextField.Input
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') createFolder();
                    if (e.key === 'Escape') {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }
                  }}
                  autoFocus
                />
              </TextField>
              <div className="flex items-center gap-2">
                <Button 
                  size="small" 
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                >
                  Create
                </Button>
                <Button 
                  size="small" 
                  variant="neutral-secondary"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <PopoverItem
              onClick={() => setIsCreatingFolder(true)}
            >
              <div className="flex items-center gap-2">
                <FeatherFolderPlus className="w-4 h-4" />
                <span>Create new folder</span>
              </div>
            </PopoverItem>
          )}
        </>
      )}
    </Popover>
  );
}