import { useDraggable } from '@dnd-kit/core';
import { getChampionImageUrl } from '../../services/riotApi';

interface DraggableChampionProps {
  id: string;
  championId: string;
  championName: string;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function DraggableChampion({ id, championId, championName, onRemove, showRemove = false }: DraggableChampionProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  });

  if (isDragging) {
    return <div ref={setNodeRef} className="w-14 h-14" />;
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="relative group cursor-grab active:cursor-grabbing"
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-transparent hover:scale-110 transition-transform">
        <img
          src={getChampionImageUrl(championId)}
          alt={championName}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

    </div>
  );
}
