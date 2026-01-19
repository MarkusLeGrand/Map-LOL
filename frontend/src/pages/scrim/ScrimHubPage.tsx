import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { useToast } from '../../contexts/ToastContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ScrimGame {
  id: string;
  game_number: number;
  result: string | null;
  coach_notes: string | null;
  improvement_notes: string | null;
  draft_id: string | null;
  analytics_id: string | null;
  draft: {
    id: string;
    name: string;
    blue_team_name: string;
    red_team_name: string;
  } | null;
}

interface Scrim {
  id: string;
  team_id: string;
  opponent_name: string;
  scheduled_at: string;
  duration_minutes: string;
  notes: string | null;
  status: string;
  total_games: number;
  wins: number;
  losses: number;
  games?: ScrimGame[];
  created_at: string;
}

export default function ScrimHubPage() {
  const { scrimId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { teams } = useTeam();
  const toast = useToast();

  // Get user's first team (if any)
  const myTeam = teams.length > 0 ? teams[0] : null;

  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [currentScrim, setCurrentScrim] = useState<Scrim | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if we're viewing a specific scrim
  const isDetailMode = scrimId && scrimId !== 'new';

  // Scrim creation state
  const [isCreating, setIsCreating] = useState(false);

  // States for modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteGameConfirm, setShowDeleteGameConfirm] = useState<string | null>(null);

  // Game editing states
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const textareasRef = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  // Local state for notes editing (to avoid saving on every keystroke)
  const [localNotes, setLocalNotes] = useState<{ [key: string]: string }>({});

  // Auto-resize textarea
  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  // Auto-resize textareas when game is expanded
  useEffect(() => {
    if (expandedGame) {
      setTimeout(() => {
        Object.values(textareasRef.current).forEach(textarea => {
          if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
          }
        });
      }, 10);
    }
  }, [expandedGame]);

  useEffect(() => {
    if (isAuthenticated && myTeam) {
      fetchScrims();
    }
  }, [isAuthenticated, myTeam, token]);

  useEffect(() => {
    if (isDetailMode && token) {
      fetchScrimDetail(scrimId);
    } else {
      setCurrentScrim(null);
    }
  }, [scrimId, token]);

  const fetchScrims = async () => {
    if (!token || !myTeam) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrim-hub/scrims/team/${myTeam.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setScrims(data.scrims || []);
      }
    } catch (error) {
      console.error('Failed to fetch scrims:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScrimDetail = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrim-hub/scrims/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentScrim(data);
      }
    } catch (error) {
      console.error('Failed to fetch scrim detail:', error);
    }
  };

  // Create a new scrim instantly with auto-generated name
  const createScrim = async () => {
    if (!token || isCreating) return;
    setIsCreating(true);
    try {
      // Auto-generate scrim number based on existing scrims count
      const scrimNumber = scrims.length + 1;

      const response = await fetch(`${API_BASE_URL}/api/scrim-hub/scrims`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          opponent_name: `Scrim ${scrimNumber}`,
          scheduled_at: new Date().toISOString(),
          notes: null
        })
      });
      if (response.ok) {
        const data = await response.json();
        toast?.success('Scrim created!');
        // Navigate directly to the new scrim dashboard
        navigate(`/scrim/${data.id}`);
      } else {
        const errorData = await response.json();
        toast?.error(errorData.detail || 'Error creating scrim');
      }
    } catch (error) {
      toast?.error('Error creating scrim');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteScrim = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrim-hub/scrims/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast?.success('Scrim deleted');
        setShowDeleteConfirm(null);
        navigate('/scrim');
        fetchScrims();
      }
    } catch (error) {
      toast?.error('Error deleting scrim');
    }
  };

  const addGame = async () => {
    if (!token || !currentScrim) return;
    const nextGameNumber = (currentScrim.games?.length || 0) + 1;
    if (nextGameNumber > 5) {
      toast?.error('Maximum 5 games per scrim (Bo5)');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrim-hub/scrims/${currentScrim.id}/games`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          game_number: nextGameNumber,
          result: null,
          coach_notes: null
        })
      });
      if (response.ok) {
        toast?.success(`Game ${nextGameNumber} added!`);
        fetchScrimDetail(currentScrim.id);
        fetchScrims();
      } else {
        const data = await response.json();
        toast?.error(data.detail || 'Error');
      }
    } catch (error) {
      toast?.error('Error adding game');
    }
  };

  const updateGameResult = async (gameId: string, result: string) => {
    if (!token || !currentScrim) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrim-hub/games/${gameId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ result })
      });
      if (response.ok) {
        fetchScrimDetail(currentScrim.id);
        fetchScrims();
      }
    } catch (error) {
      toast?.error('Error');
    }
  };

  // Get the current value for a notes field (local state or from game data)
  const getNotesValue = (gameId: string, field: 'coach_notes' | 'improvement_notes', gameValue: string | null) => {
    const key = `${gameId}_${field}`;
    return localNotes[key] !== undefined ? localNotes[key] : (gameValue || '');
  };

  // Handle local notes change (no API call)
  const handleNotesChange = (gameId: string, field: 'coach_notes' | 'improvement_notes', value: string) => {
    const key = `${gameId}_${field}`;
    setLocalNotes(prev => ({ ...prev, [key]: value }));
  };

  // Save notes on blur (when leaving the textarea)
  const saveNotesOnBlur = async (gameId: string, field: 'coach_notes' | 'improvement_notes', originalValue: string | null) => {
    if (!token || !currentScrim) return;

    const key = `${gameId}_${field}`;
    const currentValue = localNotes[key];

    // Only save if value was changed
    if (currentValue === undefined || currentValue === (originalValue || '')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/scrim-hub/games/${gameId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [field]: currentValue })
      });
      if (response.ok) {
        // Update the scrim data without refetching (to avoid cursor issues)
        setCurrentScrim(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            games: prev.games?.map(g =>
              g.id === gameId ? { ...g, [field]: currentValue } : g
            )
          };
        });
        // Clear local state for this field
        setLocalNotes(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      }
    } catch (error) {
      toast?.error('Failed to save notes');
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!token || !currentScrim) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrim-hub/games/${gameId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast?.success('Game deleted');
        setShowDeleteGameConfirm(null);
        fetchScrimDetail(currentScrim.id);
        fetchScrims();
      }
    } catch (error) {
      toast?.error('Error');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Check if user has access
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-[#F5F5F5] text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-[#8B949E] mb-6">You must be logged in to access scrims.</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-[#3D7A5F] text-white rounded-lg font-medium hover:bg-[#3D7A5F]/90"
            >
              Log In
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-[#F5F5F5] text-2xl font-bold mb-4">Team Required</h2>
            <p className="text-[#8B949E] mb-6">You must be part of a team to access scrims.</p>
            <button
              onClick={() => navigate('/teams')}
              className="px-6 py-3 bg-[#3D7A5F] text-white rounded-lg font-medium hover:bg-[#3D7A5F]/90"
            >
              Find a Team
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ============================================================
  // SCRIM DETAIL DASHBOARD - Full dashboard for existing scrim
  // ============================================================
  if (isDetailMode && currentScrim) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex flex-col">
        <Header />
        <div className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-8">
          {/* Back button */}
          <button
            onClick={() => navigate('/scrim')}
            className="flex items-center gap-2 text-[#8B949E] hover:text-[#F5F5F5] mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to scrims
          </button>

          {/* ===== HEADER SECTION ===== */}
          <div className="bg-gradient-to-r from-[#3D7A5F]/20 to-[#1A1A1A] border border-[#3D7A5F]/30 rounded-2xl p-8 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[#F5F5F5] text-4xl font-bold mb-2">{currentScrim.opponent_name}</h1>
                <p className="text-[#8B949E] text-lg">{formatDate(currentScrim.scheduled_at)}</p>
              </div>

              {/* Score Summary */}
              <div className="text-right">
                <div className="text-[#8B949E] text-sm mb-1">Score</div>
                <div className="text-4xl font-bold">
                  <span className="text-[#3D7A5F]">{currentScrim.wins}</span>
                  <span className="text-[#F5F5F5]/30 mx-3">-</span>
                  <span className="text-[#EF4444]">{currentScrim.losses}</span>
                </div>
                <div className="text-[#8B949E] text-sm mt-1">{currentScrim.total_games} game{currentScrim.total_games !== 1 ? 's' : ''} played</div>
              </div>
            </div>
          </div>

          {/* ===== QUICK ACTIONS BAR ===== */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {/* Add Game Button */}
              {(currentScrim.games?.length || 0) < 5 && (
                <button
                  onClick={addGame}
                  className="px-5 py-3 bg-[#3D7A5F] text-white rounded-xl font-medium hover:bg-[#3D7A5F]/90 flex items-center gap-2 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Game {(currentScrim.games?.length || 0) + 1}
                </button>
              )}

              {/* Link to Data Analytics */}
              <button
                onClick={() => navigate(`/data-analytics?scrimId=${currentScrim.id}&scrimName=${encodeURIComponent(currentScrim.opponent_name)}`)}
                className="px-5 py-3 bg-[#1A1A1A] border border-[#F5F5F5]/20 text-[#F5F5F5] rounded-xl font-medium hover:bg-[#F5F5F5]/5 flex items-center gap-2 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analyze Data
              </button>
            </div>

            {/* Delete Scrim */}
            <button
              onClick={() => setShowDeleteConfirm(currentScrim.id)}
              className="px-4 py-2 text-[#EF4444]/60 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete scrim
            </button>
          </div>

          {/* ===== GAMES SECTION ===== */}
          <div className="mb-8">
            <h2 className="text-[#F5F5F5] text-2xl font-bold mb-6 flex items-center gap-3">
              <svg className="w-7 h-7 text-[#3D7A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Games
            </h2>

            {currentScrim.games && currentScrim.games.length > 0 ? (
              <div className={`grid gap-4 ${currentScrim.games.length >= 4 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {currentScrim.games.map((game) => (
                  <div
                    key={game.id}
                    className={`bg-[#1A1A1A] border rounded-2xl overflow-hidden transition-all ${
                      expandedGame === game.id ? 'border-[#3D7A5F]/50' : 'border-[#F5F5F5]/10'
                    }`}
                  >
                    {/* Game Header */}
                    <div
                      className="p-6 cursor-pointer hover:bg-[#F5F5F5]/[0.02]"
                      onClick={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          {/* Game Number Badge */}
                          <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-xl ${
                            game.result === 'win' ? 'bg-[#3D7A5F]/20 text-[#3D7A5F]' :
                            game.result === 'lose' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                            'bg-[#F5F5F5]/10 text-[#F5F5F5]/60'
                          }`}>
                            G{game.game_number}
                          </div>

                          {/* Result Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); updateGameResult(game.id, game.result === 'win' ? '' : 'win'); }}
                              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                                game.result === 'win'
                                  ? 'bg-[#3D7A5F] text-white shadow-lg shadow-[#3D7A5F]/20'
                                  : 'bg-[#0E0E0E] text-[#8B949E] hover:text-[#3D7A5F] hover:bg-[#3D7A5F]/10'
                              }`}
                            >
                              WIN
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateGameResult(game.id, game.result === 'lose' ? '' : 'lose'); }}
                              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                                game.result === 'lose'
                                  ? 'bg-[#EF4444] text-white shadow-lg shadow-[#EF4444]/20'
                                  : 'bg-[#0E0E0E] text-[#8B949E] hover:text-[#EF4444] hover:bg-[#EF4444]/10'
                              }`}
                            >
                              LOSS
                            </button>
                          </div>

                          {/* Draft Link */}
                          <div onClick={(e) => e.stopPropagation()}>
                            {game.draft ? (
                              <button
                                onClick={() => navigate(`/draft?loadDraft=${game.draft_id}`)}
                                className="px-5 py-3 bg-[#7A5F8E]/20 text-[#9B7FB8] rounded-xl text-sm font-medium hover:bg-[#7A5F8E]/30 flex items-center gap-2 transition-all"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {game.draft.name}
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/draft?scrimId=${currentScrim.id}&gameNumber=${game.game_number}&opponent=${currentScrim.opponent_name}`)}
                                className="px-5 py-3 bg-[#0E0E0E] text-[#8B949E] rounded-xl text-sm font-medium hover:text-[#9B7FB8] hover:bg-[#7A5F8E]/10 flex items-center gap-2 transition-all"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Draft
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Expand indicator */}
                          <svg
                            className={`w-6 h-6 text-[#8B949E] transition-transform ${expandedGame === game.id ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Game Details */}
                    {expandedGame === game.id && (
                      <div className="px-6 pb-6 border-t border-[#F5F5F5]/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                          {/* Coach Notes */}
                          <div className="bg-[#0E0E0E] rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-[#F5F5F5] font-medium flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#3D7A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Coach Notes
                              </h4>
                            </div>
                            <textarea
                              ref={(el) => { textareasRef.current[`coach_${game.id}`] = el; }}
                              value={getNotesValue(game.id, 'coach_notes', game.coach_notes)}
                              onChange={(e) => {
                                autoResize(e);
                                handleNotesChange(game.id, 'coach_notes', e.target.value);
                              }}
                              onBlur={() => saveNotesOnBlur(game.id, 'coach_notes', game.coach_notes)}
                              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg text-[#F5F5F5] text-sm focus:border-[#3D7A5F] focus:outline-none min-h-[80px] resize-none overflow-y-hidden"
                              placeholder="Notes about this game..."
                            />
                          </div>

                          {/* Review/Solution */}
                          <div className="bg-[#0E0E0E] rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-[#F5F5F5] font-medium flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Review / Solution
                              </h4>
                            </div>
                            <textarea
                              ref={(el) => { textareasRef.current[`improvement_${game.id}`] = el; }}
                              value={getNotesValue(game.id, 'improvement_notes', game.improvement_notes)}
                              onChange={(e) => {
                                autoResize(e);
                                handleNotesChange(game.id, 'improvement_notes', e.target.value);
                              }}
                              onBlur={() => saveNotesOnBlur(game.id, 'improvement_notes', game.improvement_notes)}
                              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg text-[#F5F5F5] text-sm focus:border-[#F59E0B] focus:outline-none min-h-[80px] resize-none overflow-y-hidden"
                              placeholder="Review and solutions..."/>
                          </div>
                        </div>

                        {/* Delete game button */}
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => setShowDeleteGameConfirm(game.id)}
                            className="text-[#EF4444]/60 hover:text-[#EF4444] text-sm flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete this game
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 border-dashed rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-[#F5F5F5]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#8B949E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-[#8B949E] mb-4">No games yet</p>
                <button
                  onClick={addGame}
                  className="px-5 py-2.5 bg-[#3D7A5F] text-white rounded-lg font-medium hover:bg-[#3D7A5F]/90"
                >
                  Add Game 1
                </button>
              </div>
            )}
          </div>
        </div>
        <Footer />

        {/* Delete Scrim Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#1A1A1A] border border-[#F5F5F5]/20 rounded-xl p-6 max-w-sm mx-4">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-2">Delete Scrim</h3>
              <p className="text-[#8B949E] text-sm mb-6">
                Are you sure you want to delete this scrim? All games and data will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-[#F5F5F5]/20 text-[#F5F5F5]/60 rounded-lg font-medium hover:bg-[#F5F5F5]/5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteScrim(showDeleteConfirm)}
                  className="flex-1 py-2.5 bg-[#EF4444] text-white rounded-lg font-medium hover:bg-[#EF4444]/90"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Game Confirmation Modal */}
        {showDeleteGameConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#1A1A1A] border border-[#F5F5F5]/20 rounded-xl p-6 max-w-sm mx-4">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-2">Delete Game</h3>
              <p className="text-[#8B949E] text-sm mb-6">
                Are you sure you want to delete this game?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteGameConfirm(null)}
                  className="flex-1 py-2.5 border border-[#F5F5F5]/20 text-[#F5F5F5]/60 rounded-lg font-medium hover:bg-[#F5F5F5]/5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteGame(showDeleteGameConfirm)}
                  className="flex-1 py-2.5 bg-[#EF4444] text-white rounded-lg font-medium hover:bg-[#EF4444]/90"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // SCRIM LIST VIEW - Main page showing all scrims
  // ============================================================
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col">
      <Header />

      <div className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#F5F5F5] text-3xl font-bold">Scrims</h1>
            <p className="text-[#8B949E] mt-1">Manage your practice matches with {myTeam.name}</p>
          </div>

          <button
            onClick={createScrim}
            disabled={isCreating}
            className="px-6 py-3 bg-[#3D7A5F] text-white rounded-xl font-bold hover:bg-[#3D7A5F]/90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-[#3D7A5F]/20"
          >
            {isCreating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Scrim
              </>
            )}
          </button>
        </div>

        {/* Scrim List */}
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 mx-auto text-[#3D7A5F]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-[#8B949E] mt-4">Loading scrims...</p>
          </div>
        ) : scrims.length > 0 ? (
          <div className="grid gap-4">
            {scrims.map((scrim) => (
              <div
                key={scrim.id}
                onClick={() => navigate(`/scrim/${scrim.id}`)}
                className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-2xl p-6 hover:border-[#3D7A5F]/30 hover:bg-[#1A1A1A]/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    {/* Scrim Name & Date */}
                    <div>
                      <h3 className="text-[#F5F5F5] font-bold text-xl group-hover:text-[#3D7A5F] transition-colors">
                        {scrim.opponent_name}
                      </h3>
                      <p className="text-[#8B949E] text-sm">{formatDate(scrim.scheduled_at)}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <span className="text-[#8B949E] text-xs block">Games</span>
                        <p className="text-[#F5F5F5] font-bold text-lg">{scrim.total_games}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-[#8B949E] text-xs block">Score</span>
                        <p className="font-bold text-lg">
                          <span className="text-[#3D7A5F]">{scrim.wins}</span>
                          <span className="text-[#F5F5F5]/30 mx-1">-</span>
                          <span className="text-[#EF4444]">{scrim.losses}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <svg className="w-6 h-6 text-[#8B949E] group-hover:text-[#3D7A5F] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 border-dashed rounded-2xl p-16 text-center">
            <div className="w-20 h-20 bg-[#3D7A5F]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#3D7A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-[#F5F5F5] text-xl font-bold mb-2">No scrims</h3>
            <p className="text-[#8B949E] mb-6 max-w-md mx-auto">
              Create your first scrim to start tracking your practice matches.
            </p>
            <button
              onClick={createScrim}
              disabled={isCreating}
              className="px-6 py-3 bg-[#3D7A5F] text-white rounded-xl font-bold hover:bg-[#3D7A5F]/90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create a Scrim
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
