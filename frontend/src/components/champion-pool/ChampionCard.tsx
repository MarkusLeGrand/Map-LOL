interface ChampionCardProps {
  championId: string;
  championName: string;
  tier?: string;
  notes?: string;
  isSelected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const DDRAGON_VERSION = '14.24.1';

export function ChampionCard({
  championId,
  championName,
  tier,
  notes,
  isSelected = false,
  onClick,
  onRemove,
  size = 'md'
}: ChampionCardProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${championId}.png`;

  return (
    <div
      className={`
        relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer
        ${sizeClasses[size]}
        ${isSelected ? 'border-[#3D7A5F] ring-2 ring-[#3D7A5F]/50' : 'border-[#F5F5F5]/20'}
        ${onClick ? 'hover:border-[#3D7A5F]/50' : ''}
      `}
      onClick={onClick}
      title={notes || championName}
    >
      <img
        src={imageUrl}
        alt={championName}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/Aatrox.png`;
        }}
      />

      {/* Tier badge */}
      {tier && (
        <div className={`
          absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-xs font-bold
          ${tier === 'S' ? 'bg-[#FFD700] text-black' : ''}
          ${tier === 'A' ? 'bg-[#3D7A5F] text-white' : ''}
          ${tier === 'B' ? 'bg-[#5F7A8E] text-white' : ''}
          ${tier === 'C' ? 'bg-[#A85C5C] text-white' : ''}
        `}>
          {tier}
        </div>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-0 left-0 w-5 h-5 bg-[#A85C5C] text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          x
        </button>
      )}

      {/* Champion name tooltip on hover */}
      <div className="absolute inset-x-0 bottom-0 bg-black/80 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
        {championName}
      </div>
    </div>
  );
}
