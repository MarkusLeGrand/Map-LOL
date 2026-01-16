import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { getChampionImageUrl } from '../../services/riotApi';

interface ChampionEntry {
  id?: string;
  champion_id: string;
  champion_name: string;
  tier: string;
  position?: number;
  notes?: string;
}

interface TierDropZoneProps {
  tier: 'S' | 'A' | 'B' | 'C';
  entries: ChampionEntry[];
  onRemove: (entryId: string) => void;
}

const tierColors = {
  S: { bg: 'bg-[#FFD700]/10', border: 'border-[#FFD700]/30', text: 'text-[#FFD700]', activeBg: 'bg-[#FFD700]/20' },
  A: { bg: 'bg-[#3D7A5F]/10', border: 'border-[#3D7A5F]/30', text: 'text-[#3D7A5F]', activeBg: 'bg-[#3D7A5F]/20' },
  B: { bg: 'bg-[#5F7A8E]/10', border: 'border-[#5F7A8E]/30', text: 'text-[#5F7A8E]', activeBg: 'bg-[#5F7A8E]/20' },
  C: { bg: 'bg-[#A85C5C]/10', border: 'border-[#A85C5C]/30', text: 'text-[#A85C5C]', activeBg: 'bg-[#A85C5C]/20' },
};

// Draggable AND droppable champion for tier list (allows reordering)
function TierChampion({ id, championId, championName, tier }: { id: string; championId: string; championName: string; tier: string }) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id,
    data: { tier, championId, championName, fromTier: true }
  });

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id,
    data: { tier, championId, championName }
  });

  if (isDragging) {
    return <div ref={setDragRef} className="w-14 h-14" />;
  }

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing"
    >
      <div className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-transform ${isOver ? 'border-[#3D7A5F] scale-110' : 'border-transparent hover:scale-110'}`}>
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

export function TierDropZone({ tier, entries, onRemove }: TierDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: tier,
    data: { tier }
  });

  const colors = tierColors[tier];

  return (
    <div
      ref={setNodeRef}
      className={`
        flex items-stretch border rounded-lg overflow-hidden transition-all
        ${colors.border} ${isOver ? colors.activeBg : colors.bg}
        ${isOver ? 'ring-2 ring-[#3D7A5F] scale-[1.01]' : ''}
      `}
    >
      {/* Tier label */}
      <div className={`
        w-16 flex-shrink-0 flex items-center justify-center font-bold text-2xl
        ${colors.text} border-r ${colors.border}
      `}>
        {tier}
      </div>

      {/* Champions */}
      <div className="flex-1 flex flex-wrap gap-2 p-3 min-h-[80px]">
        {entries.length === 0 ? (
          <div className={`text-[#F5F5F5]/30 text-sm flex items-center w-full ${isOver ? 'text-[#3D7A5F]' : ''}`}>
            {isOver ? 'Drop here!' : 'Drag champions here'}
          </div>
        ) : (
          entries.map((entry) => (
            <TierChampion
              key={entry.id || entry.champion_id}
              id={entry.id || entry.champion_id}
              championId={entry.champion_id}
              championName={entry.champion_name}
              tier={tier}
            />
          ))
        )}
      </div>
    </div>
  );
}
