import { useDroppable } from '@dnd-kit/core';
import { DraggableChampion } from './DraggableChampion';

interface Champion {
  id: string;
  name: string;
}

interface ChampionGridDropZoneProps {
  champions: Champion[];
  isOver: boolean;
}

export function ChampionGridDropZone({ champions, isOver }: ChampionGridDropZoneProps) {
  const { setNodeRef } = useDroppable({
    id: 'champion-grid',
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-wrap gap-2 p-4 bg-[#1A1A1A] border rounded-lg transition-all
        ${isOver ? 'border-[#A85C5C] bg-[#A85C5C]/10' : 'border-[#F5F5F5]/10'}
      `}
    >
      {champions.map((champion) => (
        <DraggableChampion
          key={champion.id}
          id={`grid-${champion.id}`}
          championId={champion.id}
          championName={champion.name}
        />
      ))}
      {champions.length === 0 && (
        <div className="text-[#F5F5F5]/30 text-sm py-8 w-full text-center">
          All champions are in your tier list!
        </div>
      )}
    </div>
  );
}
