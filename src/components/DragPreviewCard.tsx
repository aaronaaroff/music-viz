import React from 'react';
import { FeatherMusic } from '@subframe/core';
import type { Database } from "@/lib/database.types";

type Visualization = Database['public']['Tables']['visualizations']['Row'] & {
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null; banner_url?: string | null } | null;
  saved_at?: string;
  likes_count?: number;
  comments_count?: number;
};

interface DragPreviewCardProps {
  visualization: Visualization;
}

export function DragPreviewCard({ visualization }: DragPreviewCardProps) {
  return (
    <div className="flex items-center gap-3 bg-white border border-solid border-neutral-border rounded-md shadow-lg p-3 max-w-xs">
      {/* Small thumbnail */}
      <div className="relative flex h-12 w-16 flex-none items-center justify-center overflow-hidden rounded bg-black">
        <img
          className="h-full w-full object-cover opacity-50"
          src={visualization.thumbnail_url || visualization.profiles?.banner_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
          alt={visualization.title}
        />
        {visualization.audio_file_name && (
          <div className="absolute inset-0 flex items-center justify-center">
            <FeatherMusic className="text-white text-xs" />
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-caption-bold font-caption-bold text-default-font truncate">
          {visualization.title}
        </span>
        <span className="text-caption font-caption text-subtext-color truncate">
          by {visualization.profiles?.full_name || visualization.profiles?.username || 'Unknown'}
        </span>
      </div>
    </div>
  );
}