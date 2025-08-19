import React from 'react';
import { useDragLayer } from 'react-dnd';
import { DragPreviewCard } from './DragPreviewCard';
import { VISUALIZATION_DRAG_TYPE } from './DraggableVisualizationCard';
import type { Database } from "@/lib/database.types";

type Visualization = Database['public']['Tables']['visualizations']['Row'] & {
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null; banner_url?: string | null } | null;
  saved_at?: string;
  likes_count?: number;
  comments_count?: number;
};

export function CustomDragLayer() {
  const {
    itemType,
    isDragging,
    item,
    currentOffset,
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || itemType !== VISUALIZATION_DRAG_TYPE) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[1000]">
      <div
        className="absolute"
        style={{
          left: currentOffset?.x,
          top: currentOffset?.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <DragPreviewCard visualization={item.visualization} />
      </div>
    </div>
  );
}