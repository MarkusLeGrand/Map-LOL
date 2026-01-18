import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getLatestDDragonVersion, getChampionImageUrl } from '../../services/riotApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Champion {
  id: string;
  name: string;
  tags: string[];
}

interface DraftSlot {
  champion_id: string | null;
  champion_name: string | null;
}

interface DraftData {
  blue_picks: DraftSlot[];
  red_picks: DraftSlot[];
  blue_bans: DraftSlot[];
  red_bans: DraftSlot[];
}

interface SavedDraft {
  id: string;
  name: string;
  blue_team_name: string;
  red_team_name: string;
  draft_data: DraftData;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Champion classes from DDragon
const CHAMPION_CLASSES = ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support'] as const;

const createEmptyDraft = (): DraftData => ({
  blue_picks: Array(5).fill(null).map(() => ({ champion_id: null, champion_name: null })),
  red_picks: Array(5).fill(null).map(() => ({ champion_id: null, champion_name: null })),
  blue_bans: Array(5).fill(null).map(() => ({ champion_id: null, champion_name: null })),
  red_bans: Array(5).fill(null).map(() => ({ champion_id: null, champion_name: null })),
});

interface ScrimContext {
  scrimId: string;
  gameNumber: number;
  opponentName: string;
}

export default function DraftToolPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Scrim context from URL params
  const [scrimContext, setScrimContext] = useState<ScrimContext | null>(null);

  const [champions, setChampions] = useState<Champion[]>([]);
  const [loadingChampions, setLoadingChampions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [blueTeamName, setBlueTeamName] = useState('Blue Team');
  const [redTeamName, setRedTeamName] = useState('Red Team');
  const [bluePicks, setBluePicks] = useState<DraftSlot[]>(createEmptyDraft().blue_picks);
  const [redPicks, setRedPicks] = useState<DraftSlot[]>(createEmptyDraft().red_picks);
  const [blueBans, setBlueBans] = useState<DraftSlot[]>(createEmptyDraft().blue_bans);
  const [redBans, setRedBans] = useState<DraftSlot[]>(createEmptyDraft().red_bans);

  const [selectedSlot, setSelectedSlot] = useState<{
    team: 'blue' | 'red';
    type: 'pick' | 'ban';
    index: number;
  } | null>(null);

  // Mode: either select a slot first, or select a champion first
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load scrim context from URL params
  useEffect(() => {
    const scrimId = searchParams.get('scrimId');
    const gameNumber = searchParams.get('gameNumber');
    const opponentName = searchParams.get('opponent');

    if (scrimId && gameNumber && opponentName) {
      setScrimContext({
        scrimId,
        gameNumber: parseInt(gameNumber, 10),
        opponentName: decodeURIComponent(opponentName)
      });
      // Auto-fill draft name
      setDraftName(`vs ${decodeURIComponent(opponentName)} - Game ${gameNumber}`);
    }
  }, [searchParams]);

  // Load draft from URL param (when clicking on draft link from scrim)
  useEffect(() => {
    const loadDraftId = searchParams.get('loadDraft');
    if (loadDraftId && drafts.length > 0) {
      const draftToLoad = drafts.find(d => d.id === loadDraftId);
      if (draftToLoad) {
        setEditingDraftId(draftToLoad.id);
        setDraftName(draftToLoad.name);
        setBlueTeamName(draftToLoad.blue_team_name);
        setRedTeamName(draftToLoad.red_team_name);
        setBluePicks(draftToLoad.draft_data.blue_picks);
        setRedPicks(draftToLoad.draft_data.red_picks);
        setBlueBans(draftToLoad.draft_data.blue_bans);
        setRedBans(draftToLoad.draft_data.red_bans);
        setSelectedSlot(null);
      }
    }
  }, [searchParams, drafts]);

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
        champList.sort((a, b) => a.name.localeCompare(b.name));
        setChampions(champList);
      } catch (err) {
        console.error('Failed to load champions:', err);
      } finally {
        setLoadingChampions(false);
      }
    };
    loadChampions();
  }, []);

  useEffect(() => {
    if (token) fetchDrafts();
  }, [token]);

  const fetchDrafts = async () => {
    if (!token) return;
    setLoadingDrafts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drafts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.drafts);
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setLoadingDrafts(false);
    }
  };

  const getUsedChampions = () => {
    const used = new Set<string>();
    [...bluePicks, ...redPicks, ...blueBans, ...redBans].forEach(slot => {
      if (slot.champion_id) used.add(slot.champion_id);
    });
    return used;
  };

  const usedChampions = getUsedChampions();

  const filteredChampions = champions.filter(champ => {
    const matchesSearch = champ.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!selectedClass) return matchesSearch;
    const matchesClass = champ.tags.includes(selectedClass);
    return matchesSearch && matchesClass;
  });

  const handleChampionClick = (champion: Champion) => {
    if (usedChampions.has(champion.id)) return;

    // If a slot is already selected, place champion there
    if (selectedSlot) {
      placeChampionInSlot(champion, selectedSlot.team, selectedSlot.type, selectedSlot.index);
      setSelectedSlot(null);
      setSelectedChampion(null);
    } else {
      // Otherwise, select this champion and wait for slot click
      setSelectedChampion(selectedChampion?.id === champion.id ? null : champion);
    }
  };

  const placeChampionInSlot = (champion: Champion, team: 'blue' | 'red', type: 'pick' | 'ban', index: number) => {
    const slot: DraftSlot = { champion_id: champion.id, champion_name: champion.name };

    if (type === 'pick') {
      if (team === 'blue') {
        const newPicks = [...bluePicks];
        newPicks[index] = slot;
        setBluePicks(newPicks);
      } else {
        const newPicks = [...redPicks];
        newPicks[index] = slot;
        setRedPicks(newPicks);
      }
    } else {
      if (team === 'blue') {
        const newBans = [...blueBans];
        newBans[index] = slot;
        setBlueBans(newBans);
      } else {
        const newBans = [...redBans];
        newBans[index] = slot;
        setRedBans(newBans);
      }
    }
  };

  const handleSlotClick = (team: 'blue' | 'red', type: 'pick' | 'ban', index: number) => {
    // If a champion is selected, place it in this slot
    if (selectedChampion) {
      placeChampionInSlot(selectedChampion, team, type, index);
      setSelectedChampion(null);
      setSelectedSlot(null);
    } else {
      // Otherwise, select this slot and wait for champion click
      const isSameSlot = selectedSlot?.team === team && selectedSlot?.type === type && selectedSlot?.index === index;
      setSelectedSlot(isSameSlot ? null : { team, type, index });
    }
  };

  const clearSlot = (team: 'blue' | 'red', type: 'pick' | 'ban', index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const emptySlot: DraftSlot = { champion_id: null, champion_name: null };
    if (type === 'pick') {
      if (team === 'blue') {
        const newPicks = [...bluePicks];
        newPicks[index] = emptySlot;
        setBluePicks(newPicks);
      } else {
        const newPicks = [...redPicks];
        newPicks[index] = emptySlot;
        setRedPicks(newPicks);
      }
    } else {
      if (team === 'blue') {
        const newBans = [...blueBans];
        newBans[index] = emptySlot;
        setBlueBans(newBans);
      } else {
        const newBans = [...redBans];
        newBans[index] = emptySlot;
        setRedBans(newBans);
      }
    }
  };

  const resetDraft = () => {
    setEditingDraftId(null);
    setDraftName('');
    setBlueTeamName('Blue Team');
    setRedTeamName('Red Team');
    const empty = createEmptyDraft();
    setBluePicks(empty.blue_picks);
    setRedPicks(empty.red_picks);
    setBlueBans(empty.blue_bans);
    setRedBans(empty.red_bans);
    setSelectedSlot(null);
  };

  const loadDraft = (draft: SavedDraft) => {
    setEditingDraftId(draft.id);
    setDraftName(draft.name);
    setBlueTeamName(draft.blue_team_name);
    setRedTeamName(draft.red_team_name);
    setBluePicks(draft.draft_data.blue_picks);
    setRedPicks(draft.draft_data.red_picks);
    setBlueBans(draft.draft_data.blue_bans);
    setRedBans(draft.draft_data.red_bans);
    setSelectedSlot(null);
  };

  const saveDraft = async () => {
    if (!token || !draftName.trim()) {
      toast?.error('Please enter a draft name');
      return;
    }
    setSaving(true);
    try {
      const url = editingDraftId ? `${API_BASE_URL}/api/drafts/${editingDraftId}` : `${API_BASE_URL}/api/drafts`;

      // Build request body, including scrim context if present
      const requestBody: Record<string, unknown> = {
        name: draftName.trim(),
        blue_team_name: blueTeamName.trim() || 'Blue Team',
        red_team_name: redTeamName.trim() || 'Red Team',
        draft_data: { blue_picks: bluePicks, red_picks: redPicks, blue_bans: blueBans, red_bans: redBans },
      };

      // Add scrim context if coming from scrim hub
      if (scrimContext) {
        requestBody.scrim_id = scrimContext.scrimId;
        requestBody.scrim_game_number = scrimContext.gameNumber;
      }

      const response = await fetch(url, {
        method: editingDraftId ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        toast?.success(editingDraftId ? 'Draft updated!' : 'Draft saved!');
        await fetchDrafts();

        if (!editingDraftId) {
          setEditingDraftId(data.id);
        }

        // If coming from scrim context, update the scrim game with draft_id and navigate back
        if (scrimContext && data.id) {
          try {
            // Find the game by scrim_id and game_number, then update it with draft_id
            const gameResponse = await fetch(`${API_BASE_URL}/api/scrim-hub/scrims/${scrimContext.scrimId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (gameResponse.ok) {
              const scrimData = await gameResponse.json();
              const game = scrimData.games?.find((g: { game_number: number }) => g.game_number === scrimContext.gameNumber);

              if (game) {
                await fetch(`${API_BASE_URL}/api/scrim-hub/games/${game.id}`, {
                  method: 'PATCH',
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ draft_id: data.id })
                });
              }
            }

            toast?.success('Draft linked to scrim!');
            // Navigate back to scrim hub after linking
            navigate(`/scrim/${scrimContext.scrimId}`);
          } catch (linkError) {
            console.error('Failed to link draft to scrim:', linkError);
            // Draft was saved successfully, just couldn't link it
          }
        }
      } else {
        toast?.error('Failed to save draft');
      }
    } catch (error) {
      toast?.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteDraft = async () => {
    if (!token || !deleteConfirmId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/drafts/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        toast?.success('Draft deleted');
        setDrafts(drafts.filter(d => d.id !== deleteConfirmId));
        if (editingDraftId === deleteConfirmId) resetDraft();
      }
    } catch (error) {
      toast?.error('Failed to delete draft');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const renderBanSlot = (slot: DraftSlot, index: number, team: 'blue' | 'red') => {
    const isSelected = selectedSlot?.team === team && selectedSlot?.type === 'ban' && selectedSlot?.index === index;
    const canPlace = selectedChampion && !slot.champion_id;
    return (
      <div
        key={`${team}-ban-${index}`}
        onClick={() => handleSlotClick(team, 'ban', index)}
        className={`w-12 h-12 rounded-lg bg-[#1A1A1A] overflow-hidden cursor-pointer relative group border-2 ${
          isSelected ? 'border-[#F5F5F5] ring-2 ring-[#F5F5F5]/30' : canPlace ? 'border-[#3D7A5F] ring-2 ring-[#3D7A5F]/30' : 'border-transparent hover:border-[#F5F5F5]/30'
        }`}
      >
        {slot.champion_id ? (
          <>
            <img src={getChampionImageUrl(slot.champion_id)} alt="" className="w-full h-full object-cover grayscale brightness-50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-red-500 rotate-45" />
            </div>
            <button
              onClick={(e) => clearSlot(team, 'ban', index, e)}
              className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : canPlace && (
          <div className="w-full h-full flex items-center justify-center bg-[#3D7A5F]/20">
            <svg className="w-5 h-5 text-[#3D7A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  const renderPickSlot = (slot: DraftSlot, index: number, team: 'blue' | 'red') => {
    const isSelected = selectedSlot?.team === team && selectedSlot?.type === 'pick' && selectedSlot?.index === index;
    const canPlace = selectedChampion && !slot.champion_id;
    const label = team === 'blue' ? `B${index + 1}` : `R${index + 1}`;

    return (
      <div key={`${team}-pick-${index}`} className="flex flex-col items-center gap-1">
        <span className={`text-sm font-bold ${team === 'blue' ? 'text-[#3B82F6]' : 'text-[#EF4444]'}`}>{label}</span>
        <div
          onClick={() => handleSlotClick(team, 'pick', index)}
          className={`w-16 h-16 rounded-lg bg-[#1A1A1A] overflow-hidden cursor-pointer relative group border-2 ${
            isSelected ? 'border-[#F5F5F5] ring-2 ring-[#F5F5F5]/30' : canPlace ? 'border-[#3D7A5F] ring-2 ring-[#3D7A5F]/30' : 'border-transparent hover:border-[#F5F5F5]/30'
          }`}
        >
          {slot.champion_id ? (
            <>
              <img src={getChampionImageUrl(slot.champion_id)} alt="" className="w-full h-full object-cover" />
              <button
                onClick={(e) => clearSlot(team, 'pick', index, e)}
                className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : canPlace ? (
            <div className="w-full h-full flex items-center justify-center bg-[#3D7A5F]/20">
              <svg className="w-7 h-7 text-[#3D7A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-10 h-10 text-[#F5F5F5]/10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col">
      <Header />

      <div className="flex-1 flex">
        {/* LEFT SIDEBAR */}
        <div className="w-56 bg-[#0a0a0a] border-r border-[#F5F5F5]/10 flex flex-col">
          {/* Scrim Context Banner */}
          {scrimContext && (
            <div className="p-3 bg-[#3D7A5F]/20 border-b border-[#3D7A5F]/30">
              <button
                onClick={() => navigate(`/scrim/${scrimContext.scrimId}`)}
                className="flex items-center gap-2 text-[#3D7A5F] text-xs font-medium hover:text-[#3D7A5F]/80 transition-colors mb-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Scrim
              </button>
              <div className="text-[#F5F5F5] text-sm font-medium">
                vs {scrimContext.opponentName}
              </div>
              <div className="text-[#F5F5F5]/60 text-xs">
                Game {scrimContext.gameNumber}
              </div>
            </div>
          )}

          {/* Save section - styled */}
          <div className="p-4 border-b border-[#F5F5F5]/10">
            <span className="text-[#F5F5F5]/80 text-xs font-semibold uppercase tracking-wider mb-3 block">Draft</span>
            <div className="relative">
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Enter draft name..."
                className="w-full px-3 py-2.5 bg-[#151515] border border-[#F5F5F5]/10 rounded-lg text-[#F5F5F5] placeholder-[#8B949E]/50 text-sm focus:outline-none focus:border-[#3D7A5F]/50 transition-colors"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={resetDraft}
                className="flex-1 py-2 px-3 bg-[#151515] border border-[#F5F5F5]/10 text-[#F5F5F5]/60 rounded-lg text-xs font-medium hover:bg-[#1A1A1A] hover:text-[#F5F5F5]/80 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
              <button
                onClick={saveDraft}
                disabled={!token || !draftName.trim() || saving}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  token && draftName.trim() && !saving
                    ? 'bg-[#3D7A5F] text-[#F5F5F5] hover:bg-[#3D7A5F]/80'
                    : 'bg-[#151515] text-[#8B949E]/50 cursor-not-allowed'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saving ? '...' : editingDraftId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>

          {/* Saved drafts header */}
          <div className="p-3 border-b border-[#F5F5F5]/10">
            <h2 className="text-[#F5F5F5]/60 font-medium text-xs uppercase tracking-wide">Saved Drafts</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!token ? (
              <div className="p-3 text-center text-[#8B949E] text-xs">Login to save</div>
            ) : loadingDrafts ? (
              <div className="p-3 text-center text-[#8B949E] text-xs">Loading...</div>
            ) : drafts.length === 0 ? (
              <div className="p-3 text-center text-[#8B949E] text-xs">No drafts</div>
            ) : (
              drafts.map((draft) => (
                <div
                  key={draft.id}
                  onClick={() => loadDraft(draft)}
                  className={`p-2 cursor-pointer border-b border-[#F5F5F5]/5 ${editingDraftId === draft.id ? 'bg-[#3D7A5F]/20' : 'hover:bg-[#F5F5F5]/5'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[#F5F5F5] text-xs font-medium truncate">{draft.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(draft.id); }} className="text-[#F5F5F5]/30 hover:text-[#EF4444]">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-0.5 mt-1">
                    {draft.draft_data.blue_picks.map((s, i) => (
                      <div key={i} className="w-4 h-4 rounded bg-[#1A1A1A] overflow-hidden">
                        {s.champion_id && <img src={getChampionImageUrl(s.champion_id)} alt="" className="w-full h-full object-cover" />}
                      </div>
                    ))}
                    <span className="text-[#8B949E] text-[8px] mx-0.5">vs</span>
                    {draft.draft_data.red_picks.map((s, i) => (
                      <div key={i} className="w-4 h-4 rounded bg-[#1A1A1A] overflow-hidden">
                        {s.champion_id && <img src={getChampionImageUrl(s.champion_id)} alt="" className="w-full h-full object-cover" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col">
          {/* BANS ROW */}
          <div className="flex items-center justify-center py-4 gap-6 border-b border-[#F5F5F5]/10">
            <div className="bg-[#3B82F6] px-4 py-1.5 rounded-lg">
              <input
                type="text"
                value={blueTeamName}
                onChange={(e) => setBlueTeamName(e.target.value)}
                className="bg-transparent text-white font-bold text-sm w-28 text-center"
                placeholder="BLUE TEAM"
              />
            </div>
            <div className="flex gap-2">{blueBans.map((s, i) => renderBanSlot(s, i, 'blue'))}</div>
            <div className="text-[#F5F5F5]/20 text-lg font-bold">BANS</div>
            <div className="flex gap-2">{redBans.map((s, i) => renderBanSlot(s, i, 'red'))}</div>
            <div className="bg-[#EF4444] px-4 py-1.5 rounded-lg">
              <input
                type="text"
                value={redTeamName}
                onChange={(e) => setRedTeamName(e.target.value)}
                className="bg-transparent text-white font-bold text-sm w-28 text-center"
                placeholder="RED TEAM"
              />
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex items-center justify-center gap-4 px-4 py-3 border-b border-[#F5F5F5]/10">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search champion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-[#1A1A1A] border border-[#F5F5F5]/20 rounded-lg text-white placeholder-[#8B949E] text-sm w-48 focus:outline-none focus:border-[#3D7A5F]"
              />
            </div>
            <div className="flex gap-1 bg-[#1A1A1A] rounded-lg p-1">
              {CHAMPION_CLASSES.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(selectedClass === cls ? null : cls)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedClass === cls ? 'bg-[#3D7A5F] text-white' : 'text-[#F5F5F5]/50 hover:text-[#F5F5F5] hover:bg-[#F5F5F5]/10'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* PICKS + GRID */}
          <div className="flex-1 flex overflow-hidden">
            {/* Blue picks - fixed position, not affected by grid content */}
            <div className="w-36 flex flex-col items-center justify-start pt-8 gap-3 p-4">
              {bluePicks.map((s, i) => renderPickSlot(s, i, 'blue'))}
            </div>

            {/* Champion grid - fixed 10 columns, max 8 rows visible, hidden scrollbar */}
            <div className="flex-1 flex justify-center items-start p-4">
              {loadingChampions ? (
                <div className="text-[#8B949E] text-center py-8">Loading...</div>
              ) : (
                <div
                  className="overflow-y-auto scrollbar-hide"
                  style={{ maxHeight: 'calc(7 * 80px)', width: 'fit-content', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(10, 64px)' }}>
                    {filteredChampions.map((champion) => {
                      const isUsed = usedChampions.has(champion.id);
                      const isChampSelected = selectedChampion?.id === champion.id;
                      return (
                        <button
                          key={champion.id}
                          onClick={() => handleChampionClick(champion)}
                          disabled={isUsed}
                          className={`flex flex-col items-center p-1 rounded ${
                            isUsed ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-[#F5F5F5]/10 cursor-pointer'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-lg overflow-hidden ${
                            isChampSelected ? 'ring-2 ring-[#3D7A5F] ring-offset-2 ring-offset-[#0E0E0E]' : !isUsed ? 'hover:ring-2 hover:ring-[#F5F5F5]/30' : ''
                          }`}>
                            <img src={getChampionImageUrl(champion.id)} alt={champion.name} className="w-full h-full object-cover" />
                          </div>
                          <span className={`text-[10px] text-center truncate w-14 mt-1 ${isChampSelected ? 'text-[#3D7A5F] font-medium' : isUsed ? 'text-[#F5F5F5]/30' : 'text-[#F5F5F5]/50'}`}>
                            {champion.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Red picks - fixed position, not affected by grid content */}
            <div className="w-36 flex flex-col items-center justify-start pt-8 gap-3 p-4">
              {redPicks.map((s, i) => renderPickSlot(s, i, 'red'))}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/20 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-[#F5F5F5] font-bold text-lg mb-2">Delete Draft</h3>
            <p className="text-[#8B949E] text-sm mb-6">
              Are you sure you want to delete this draft? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-[#F5F5F5]/20 text-[#F5F5F5]/60 rounded-lg text-sm font-medium hover:bg-[#F5F5F5]/5"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDraft}
                className="px-4 py-2 bg-[#EF4444] text-white rounded-lg text-sm font-medium hover:bg-[#EF4444]/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hide scrollbar for webkit browsers */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
