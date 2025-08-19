import React, { useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import type { Database } from "@/lib/database.types";
import { DragPreviewCard } from './DragPreviewCard';

type Visualization = Database['public']['Tables']['visualizations']['Row'] & {
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null; banner_url?: string | null } | null;
  saved_at?: string;
  likes_count?: number;
  comments_count?: number;
};

interface DraggableVisualizationCardProps {
  visualization: Visualization;
  children: React.ReactNode;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const VISUALIZATION_DRAG_TYPE = 'visualization';

export function DraggableVisualizationCard({ 
  visualization, 
  children, 
  onDragStart, 
  onDragEnd 
}: DraggableVisualizationCardProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: VISUALIZATION_DRAG_TYPE,
    item: () => {
      onDragStart?.();
      return { visualization };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      onDragEnd?.();
    }
  });

  // Use custom drag preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <div
      ref={drag as any}
      className={`${isDragging ? 'opacity-50' : 'opacity-100'} cursor-move`}
      style={{ transform: isDragging ? 'rotate(5deg)' : 'none' }}
    >
      {children}
    </div>
  );
}