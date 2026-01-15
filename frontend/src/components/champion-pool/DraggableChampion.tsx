import { useDraggable } from '@dnd-kit/core';

const DDRAGON_VERSION = '14.24.1';

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
          src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${championId}.png`}
          alt={championName}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

    </div>
  );
}
