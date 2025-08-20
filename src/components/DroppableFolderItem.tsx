import React from 'react';
import { useDrop } from 'react-dnd';
import { VISUALIZATION_DRAG_TYPE } from './DraggableVisualizationCard';
import type { Database } from "@/lib/database.types";

type Visualization = Database['public']['Tables']['visualizations']['Row'] & {
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null; banner_url?: string | null } | null;
  saved_at?: string;
  likes_count?: number;
  comments_count?: number;
};

interface DroppableFolderItemProps {
  folderId: string;
  onDrop: (visualizationId: string, folderId: string) => void;
  children: React.ReactNode;
  isSelected?: boolean;
}

export function DroppableFolderItem({ 
  folderId, 
  onDrop, 
  children, 
  isSelected = false 
}: DroppableFolderItemProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: VISUALIZATION_DRAG_TYPE,
    drop: (item: { visualization: Visualization }) => {
      onDrop(item.visualization.id, folderId);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop as any}
      className={`
        transition-all duration-200
        ${isActive ? 'bg-brand-100 border-brand-300 scale-[1.02]' : ''}
        ${isOver && !canDrop ? 'bg-error-50 border-error-300' : ''}
        ${isSelected ? 'bg-brand-50' : ''}
        ${canDrop && !isOver ? 'border-dashed border-2 border-brand-200' : ''}
      `}
    >
      {children}
    </div>
  );
}