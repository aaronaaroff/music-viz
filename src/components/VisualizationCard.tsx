import React from "react";
import { IconButton } from "@/ui/components/IconButton";
import { Badge } from "@/ui/components/Badge";
import { FeatherPlay, FeatherTrash2, FeatherEdit2, FeatherImage, FeatherHeart, FeatherBookmark } from "@subframe/core";
import type { Database } from "@/lib/database.types";

type Visualization = Database['public']['Tables']['visualizations']['Row'] & {
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
};

interface VisualizationCardProps {
  visualization: Visualization;
  viewMode: "grid" | "list";
  onLoad?: (id: string) => void;
  onDelete?: (id: string) => void;
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  isOwner?: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  showCreator?: boolean;
}

export function VisualizationCard({
  visualization: viz,
  viewMode,
  onLoad,
  onDelete,
  onLike,
  onSave,
  isOwner = false,
  isLiked = false,
  isSaved = false,
  showCreator = false
}: VisualizationCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if clicking on the card itself, not on buttons
    if (viewMode === "grid" && 
        !(e.target as HTMLElement).closest('button') && 
        onLoad) {
      onLoad(viz.id);
    }
  };

  if (viewMode === "grid") {
    return (
      <div
        className="flex flex-col overflow-hidden rounded-md border border-solid border-neutral-border bg-default-background shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleCardClick}
      >
        {/* Visualization preview */}
        <div className="relative w-full h-48 bg-black rounded-t-md">
          {/* Placeholder for visualization preview */}
          <div className="absolute inset-0 flex items-center justify-center">
            <FeatherImage className="text-subtext-color text-2xl" />
          </div>
          
          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex gap-2">
            {onLoad && (
              <IconButton
                size="small"
                variant="inverse"
                icon={<FeatherPlay />}
                onClick={() => onLoad(viz.id)}
              />
            )}
            {isOwner && onDelete && (
              <IconButton
                size="small"
                variant="inverse"
                icon={<FeatherTrash2 />}
                onClick={() => onDelete(viz.id)}
              />
            )}
          </div>
          
          {/* Status badge */}
          {!viz.is_public && (
            <Badge className="absolute bottom-2 left-2" variant="neutral">
              Draft
            </Badge>
          )}
        </div>
        
        {/* Visualization info */}
        <div className="flex w-full flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="text-body-bold font-body-bold text-default-font truncate">
              {viz.title}
            </span>
          </div>
          
          {viz.description && (
            <span className="text-caption font-caption text-subtext-color line-clamp-2">
              {viz.description}
            </span>
          )}
          
          {/* Creator info (for explore page) */}
          {showCreator && viz.profiles && (
            <div className="flex items-center gap-2 text-caption font-caption text-subtext-color">
              <span>by {viz.profiles.username || viz.profiles.full_name || 'Anonymous'}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-caption font-caption text-subtext-color">
            <span>
              {viz.audio_file_name || 'No audio file'}
            </span>
            <span>
              {new Date(viz.updated_at || viz.created_at || '').toLocaleDateString()}
            </span>
          </div>
          
          {/* Social stats */}
          {!isOwner && (
            <div className="flex items-center gap-4 pt-2">
              {onLike && (
                <button
                  className="flex items-center gap-1 text-caption hover:text-brand-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(viz.id);
                  }}
                >
                  <FeatherHeart className={isLiked ? "fill-current" : ""} />
                  <span>{viz.likes_count || 0}</span>
                </button>
              )}
              {onSave && (
                <button
                  className="flex items-center gap-1 text-caption hover:text-brand-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave(viz.id);
                  }}
                >
                  <FeatherBookmark className={isSaved ? "fill-current" : ""} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="flex items-center gap-4 p-4 rounded-md border border-solid border-neutral-border bg-default-background shadow-sm">
      {/* Visualization preview */}
      <div className="relative w-24 h-24 bg-black rounded-md flex-shrink-0">
        {/* Placeholder for visualization preview */}
        <div className="absolute inset-0 flex items-center justify-center">
          <FeatherImage className="text-subtext-color" />
        </div>
        {!viz.is_public && (
          <Badge className="absolute -top-1 -left-1" variant="neutral">
            Draft
          </Badge>
        )}
      </div>
      
      {/* Visualization info */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-body-bold font-body-bold text-default-font truncate">
            {viz.title}
          </span>
          <div className="flex gap-1 flex-shrink-0">
            {onLoad && (
              <IconButton
                size="small"
                icon={isOwner ? <FeatherEdit2 /> : <FeatherPlay />}
                onClick={() => onLoad(viz.id)}
              />
            )}
            {isOwner && onDelete && (
              <IconButton
                size="small"
                icon={<FeatherTrash2 />}
                onClick={() => onDelete(viz.id)}
              />
            )}
            {!isOwner && onLike && (
              <IconButton
                size="small"
                icon={<FeatherHeart />}
                onClick={() => onLike(viz.id)}
                variant={isLiked ? "brand-primary" : "neutral-secondary"}
              />
            )}
            {!isOwner && onSave && (
              <IconButton
                size="small"
                icon={<FeatherBookmark />}
                onClick={() => onSave(viz.id)}
                variant={isSaved ? "brand-primary" : "neutral-secondary"}
              />
            )}
          </div>
        </div>
        
        {viz.description && (
          <span className="text-caption font-caption text-subtext-color line-clamp-1">
            {viz.description}
          </span>
        )}
        
        {/* Creator info (for explore page) */}
        {showCreator && viz.profiles && (
          <span className="text-caption font-caption text-subtext-color">
            by {viz.profiles.username || viz.profiles.full_name || 'Anonymous'}
          </span>
        )}
        
        <div className="flex items-center gap-4 text-caption font-caption text-subtext-color">
          <span>{viz.audio_file_name || 'No audio'}</span>
          <span>{new Date(viz.updated_at || viz.created_at || '').toLocaleDateString()}</span>
          {!isOwner && (
            <>
              <span>{viz.likes_count || 0} likes</span>
              <span>{viz.views_count || 0} views</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}