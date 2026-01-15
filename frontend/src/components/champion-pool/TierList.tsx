import { TierRow } from './TierRow';

interface ChampionEntry {
  id?: string;
  championId: string;
  championName: string;
  tier: string;
  notes?: string;
}

interface TierListProps {
  entries: ChampionEntry[];
  onUpdateTier: (championId: string, newTier: string) => void;
  onRemove: (championId: string) => void;
  isEditable?: boolean;
}

export function TierList({ entries, onUpdateTier, onRemove, isEditable = true }: TierListProps) {
  const tiers: ('S' | 'A' | 'B' | 'C')[] = ['S', 'A', 'B', 'C'];

  const getChampionsByTier = (tier: string) => {
    return entries.filter((e) => e.tier === tier);
  };

  return (
    <div className="flex flex-col gap-3">
      {tiers.map((tier) => (
        <TierRow
          key={tier}
          tier={tier}
          champions={getChampionsByTier(tier)}
          onChangeTier={onUpdateTier}
          onRemove={onRemove}
          isEditable={isEditable}
        />
      ))}
    </div>
  );
}
