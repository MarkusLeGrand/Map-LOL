import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DDRAGON_VERSION = '14.24.1';

interface SortableChampionProps {
  id: string;
  championId: string;
  championName: string;
  tier: string;
}

export function SortableChampion({ id, championId, championName, tier }: SortableChampionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      tier,
      championId,
      championName,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50 z-50' : ''}
      `}
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
