import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, pointerWithin, rectIntersection, useDroppable } from '@dnd-kit/core';
import type { CollisionDetection } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { TierDropZone } from './TierDropZone';
import { DraggableChampion } from './DraggableChampion';
import { getChampionImageUrl, getLatestDDragonVersion } from '../../services/riotApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ChampionEntry {
  id?: string;
  champion_id: string;
  champion_name: string;
  tier: string;
  position?: number;
  notes?: string;
}

interface Pool {
  id: string;
  entries: ChampionEntry[];
}

interface Champion {
  id: string;
  name: string;
  tags: string[];
}

interface ChampionPoolEditorProps {
  teamId?: string;
}

const TIERS = ['S', 'A', 'B', 'C'] as const;

// Droppable grid component
function DroppableChampionGrid({ children, isDraggingFromTier }: { children: React.ReactNode; isDraggingFromTier: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'champion-grid',
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-wrap gap-2 p-4 bg-[#1A1A1A] border rounded-lg transition-all min-h-[100px]
        ${isOver && isDraggingFromTier ? 'border-[#A85C5C] bg-[#A85C5C]/10 scale-[1.01]' : 'border-[#F5F5F5]/10'}
      `}
    >
      {children}
    </div>
  );
}

export function ChampionPoolEditor({ teamId }: ChampionPoolEditorProps) {
  const [pool, setPool] = useState<Pool | null>(null);
  const [savedPool, setSavedPool] = useState<Pool | null>(null); // Track saved state
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChampion, setActiveChampion] = useState<Champion | ChampionEntry | null>(null);
  const [isDraggingFromTier, setIsDraggingFromTier] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Custom collision detection that handles both tier zones and champion reordering
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length === 0) {
      return rectIntersection(args);
    }

    // Check if we're dragging from a tier (for reordering)
    const dragId = args.active.id as string;
    const isDraggingFromTier = !dragId.startsWith('grid-');

    if (isDraggingFromTier) {
      // When dragging from tier, prioritize champions for reordering
      // But also allow dropping on tier zones for moving between tiers
      const championCollision = pointerCollisions.find(
        c => !['S', 'A', 'B', 'C', 'champion-grid'].includes(c.id as string)
      );
      if (championCollision) {
        return [championCollision];
      }
    }

    // For grid drags or when no champion collision, prioritize tier zones
    const tierZone = pointerCollisions.find(
      c => ['S', 'A', 'B', 'C', 'champion-grid'].includes(c.id as string)
    );
    if (tierZone) {
      return [tierZone];
    }

    return pointerCollisions;
  }, []);

  // Check if there are unsaved changes
  const hasChanges = useCallback(() => {
    if (!pool || !savedPool) return pool !== savedPool;
    if (pool.entries.length !== savedPool.entries.length) return true;

    // Compare entries
    const poolStr = JSON.stringify(pool.entries.map(e => ({
      champion_id: e.champion_id,
      tier: e.tier,
      position: e.position
    })).sort((a, b) => a.champion_id.localeCompare(b.champion_id)));

    const savedStr = JSON.stringify(savedPool.entries.map(e => ({
      champion_id: e.champion_id,
      tier: e.tier,
      position: e.position
    })).sort((a, b) => a.champion_id.localeCompare(b.champion_id)));

    return poolStr !== savedStr;
  }, [pool, savedPool]);

  // Load champions from Data Dragon
  useEffect(() => {
    const loadChampions = async () => {
      try {
        const version = await getLatestDDragonVersion();
        const response = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
        );
        const data = await response.json();

        const champList: Champion[] = Object.values(data.data).map((champ: any) => ({
          id: champ.id,
          name: champ.name,
          tags: champ.tags,
        }));

        // Sort alphabetically
        champList.sort((a, b) => a.name.localeCompare(b.name));
        setChampions(champList);
      } catch (err) {
        console.error('Failed to load champions:', err);
      }
    };

    loadChampions();
  }, []);

  // Load user's pool
  useEffect(() => {
    const loadPool = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/champion-pool/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setPool(data);
          setSavedPool(JSON.parse(JSON.stringify(data))); // Deep copy for comparison
        }
      } catch (err) {
        console.error('Failed to load pool:', err);
        setError('Failed to load champion pool');
      } finally {
        setLoading(false);
      }
    };

    loadPool();
  }, []);

  const getEntriesByTier = useCallback((tier: string) => {
    if (!pool) return [];
    return pool.entries
      .filter((e) => e.tier === tier)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [pool]);

  const getSelectedChampionIds = useCallback(() => {
    if (!pool) return [];
    return pool.entries.map((e) => e.champion_id);
  }, [pool]);

  // Add champion locally (no API call)
  const addChampionToPool = (championId: string, championName: string, tier: string) => {
    const tierEntries = pool?.entries.filter(e => e.tier === tier) || [];
    const newEntry: ChampionEntry = {
      id: `local-${championId}-${Date.now()}`,
      champion_id: championId,
      champion_name: championName,
      tier: tier,
      position: tierEntries.length,
    };

    setPool((prev) => {
      if (!prev) {
        return { id: 'new', entries: [newEntry] };
      }
      return { ...prev, entries: [...prev.entries, newEntry] };
    });
  };

  // Update tier locally (no API call)
  const updateChampionTier = (entryId: string, newTier: string) => {
    setPool((prev) => {
      if (!prev) return prev;
      const tierEntries = prev.entries.filter(e => e.tier === newTier);
      return {
        ...prev,
        entries: prev.entries.map((e) =>
          e.id === entryId ? { ...e, tier: newTier, position: tierEntries.length } : e
        ),
      };
    });
  };

  // Remove champion locally (no API call)
  const removeChampion = (entryId: string) => {
    setPool((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.filter((e) => e.id !== entryId),
      };
    });
  };

  // Save all changes to backend
  const savePool = async () => {
    if (!pool) return;

    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      // Prepare entries with positions
      const entriesWithPositions = TIERS.flatMap(tier => {
        const tierEntries = pool.entries.filter(e => e.tier === tier);
        return tierEntries.map((e, idx) => ({
          champion_id: e.champion_id,
          champion_name: e.champion_name,
          tier: e.tier,
          position: idx,
          notes: e.notes,
        }));
      });

      const response = await fetch(`${API_BASE_URL}/api/champion-pool/bulk-update`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entriesWithPositions),
      });

      if (response.ok) {
        // Reload pool to get real IDs
        const poolResponse = await fetch(`${API_BASE_URL}/api/champion-pool/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (poolResponse.ok) {
          const data = await poolResponse.json();
          setPool(data);
          setSavedPool(JSON.parse(JSON.stringify(data)));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to save');
      }
    } catch (err) {
      console.error('Failed to save pool:', err);
      setError('Failed to save champion pool');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const dragId = active.id as string;

    if (dragId.startsWith('grid-')) {
      const champId = dragId.replace('grid-', '');
      const champion = champions.find((c) => c.id === champId);
      if (champion) {
        setActiveChampion(champion);
        setIsDraggingFromTier(false);
      }
    } else {
      const entry = pool?.entries.find((e) => e.id === dragId);
      if (entry) {
        setActiveChampion(entry);
        setIsDraggingFromTier(true);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveChampion(null);
    setIsDraggingFromTier(false);

    if (!over) return;

    const dragId = active.id as string;
    const dropTarget = over.id as string;

    // Get tier from over data (if dropping on a champion) or from dropTarget (if dropping on tier zone)
    const overTier = over.data.current?.tier as string | undefined;
    const targetTier = TIERS.includes(dropTarget as typeof TIERS[number]) ? dropTarget : overTier;

    // Drop on champion grid = remove
    if (dropTarget === 'champion-grid') {
      if (!dragId.startsWith('grid-')) {
        const entry = pool?.entries.find((e) => e.id === dragId);
        if (entry?.id) {
          removeChampion(entry.id);
        }
      }
      return;
    }

    // Drag from grid to tier = add
    if (dragId.startsWith('grid-')) {
      if (!targetTier) return;

      const champId = dragId.replace('grid-', '');
      const champion = champions.find((c) => c.id === champId);

      if (getSelectedChampionIds().includes(champId)) return;

      if (champion) {
        addChampionToPool(champId, champion.name, targetTier);
      }
    } else {
      // Drag within tiers
      const dragEntry = pool?.entries.find((e) => e.id === dragId);
      if (!dragEntry) return;

      // Reorder within same tier (dropping on another champion in same tier)
      const overEntry = pool?.entries.find((e) => e.id === dropTarget);
      if (overEntry && dragEntry.tier === overEntry.tier) {
        const tierEntries = pool!.entries
          .filter((e) => e.tier === dragEntry.tier)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const oldIndex = tierEntries.findIndex((e) => e.id === dragId);
        const newIndex = tierEntries.findIndex((e) => e.id === dropTarget);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reorderedTierEntries = arrayMove(tierEntries, oldIndex, newIndex)
            .map((e, idx) => ({ ...e, position: idx }));

          setPool((prev) => {
            if (!prev) return prev;
            const otherEntries = prev.entries.filter((e) => e.tier !== dragEntry.tier);
            return {
              ...prev,
              entries: [...otherEntries, ...reorderedTierEntries],
            };
          });
        }
        return;
      }

      // Move between tiers (drop on tier zone OR on champion of different tier)
      if (targetTier && dragEntry.tier !== targetTier && dragEntry.id) {
        updateChampionTier(dragEntry.id, targetTier);
      }
    }
  };

  const filteredChampions = champions.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const notInPool = !getSelectedChampionIds().includes(c.id);
    return matchesSearch && notInPool;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#F5F5F5]/50">Loading...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-8">
        {error && (
          <div className="p-3 bg-[#A85C5C]/20 border border-[#A85C5C]/30 rounded text-[#A85C5C]">
            {error}
          </div>
        )}

        {/* Tier List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#F5F5F5] font-medium">Your Tier List</h3>
            <button
              onClick={savePool}
              disabled={saving || !hasChanges()}
              className={`
                px-4 py-2 rounded font-medium transition-all
                ${hasChanges()
                  ? 'bg-[#3D7A5F] text-white hover:bg-[#4A9A72]'
                  : 'bg-[#F5F5F5]/10 text-[#F5F5F5]/30 cursor-not-allowed'}
              `}
            >
              {saving ? 'Saving...' : hasChanges() ? 'Save Changes' : 'Saved'}
            </button>
          </div>
          {TIERS.map((tier) => (
            <TierDropZone
              key={tier}
              tier={tier}
              entries={getEntriesByTier(tier)}
              onRemove={removeChampion}
            />
          ))}
        </div>

        {/* Champion Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#F5F5F5] font-medium">
              {isDraggingFromTier ? 'Drop here to remove from tier list' : 'Drag Champions to Add'}
            </h3>
            <input
              type="text"
              placeholder="Search champions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-[#1A1A1A] border border-[#F5F5F5]/20 rounded text-[#F5F5F5] placeholder-[#F5F5F5]/30 focus:outline-none focus:border-[#3D7A5F]"
            />
          </div>
          <DroppableChampionGrid isDraggingFromTier={isDraggingFromTier}>
            {filteredChampions.map((champion) => (
              <DraggableChampion
                key={champion.id}
                id={`grid-${champion.id}`}
                championId={champion.id}
                championName={champion.name}
              />
            ))}
            {filteredChampions.length === 0 && (
              <div className="text-[#F5F5F5]/30 text-sm py-8 w-full text-center">
                {searchQuery ? 'No champions found' : 'All champions are in your tier list!'}
              </div>
            )}
          </DroppableChampionGrid>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeChampion && (
          <div className="w-14 h-14 rounded-lg overflow-hidden shadow-2xl border-2 border-[#3D7A5F]">
            <img
              src={getChampionImageUrl('champion_id' in activeChampion ? activeChampion.champion_id : activeChampion.id)}
              alt={'champion_name' in activeChampion ? activeChampion.champion_name : activeChampion.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
