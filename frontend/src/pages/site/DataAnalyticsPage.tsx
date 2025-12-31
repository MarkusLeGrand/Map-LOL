import { useState, useCallback, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { AnalyticsDashboard } from '../../components/analytics/AnalyticsDashboard';

interface ChampionStats {
  champion: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
  kda: number;
}

interface PlayerStats {
  name: string;
  position: string;
  games_played: number;
  wins: number;
  losses: number;
  winrate: number;
  kda: number;
  avg_kill_participation?: number;
  per_min_damage?: number;
  per_min_gold?: number;
  per_min_cs?: number;
  top_champions?: ChampionStats[];
  champion_stats?: ChampionStats[];
}

interface AnalyticsData {
  players: PlayerStats[];
  total_players: number;
  team_stats: {
    avg_winrate: number;
    avg_kda: number;
    total_games: number;
  };
}

interface UploadResponse {
  success: boolean;
  file_path: string;
  matches_count?: number;
  players_count?: number;
  found_players?: string[];  // RIOT IDs found in matches
  team_id?: string;
  analysis_name?: string;
  uploaded_at: string;
}

interface SavedAnalytics {
  id: string;
  name: string;
  file_name: string;
  players_count: string;
  uploaded_at: string;
  created_by?: string;
  data_path: string;
  analysis_results: AnalyticsData;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type ViewMode = 'upload' | 'team';

export default function DataAnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const { teams } = useTeam();
  const toast = useToast();
  const myTeam = teams.length > 0 ? teams[0] : null;

  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadResponse | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  // Saved analytics
  const [teamAnalytics, setTeamAnalytics] = useState<SavedAnalytics[]>([]);
  const [teamLimit, setTeamLimit] = useState(10);

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Load saved analytics on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && myTeam) {
      loadTeamAnalytics();
    }
  }, [isAuthenticated, myTeam]);

  const loadTeamAnalytics = async () => {
    if (!myTeam) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/analytics/team/${myTeam.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeamAnalytics(data.analytics);
        setTeamLimit(data.limit);
      }
    } catch (err) {
      console.error('Failed to load team analytics:', err);
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/upload-scrim-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data: UploadResponse = await response.json();
      setUploadedFile(data);
      setCurrentFilePath(data.file_path);

      // Automatically analyze after upload with team filter
      await analyzeData(data.file_path, data.found_players || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const analyzeData = async (filePath: string, teamRiotIds: string[] = []) => {
    console.log('=== ANALYZE DATA CALLED ===');
    console.log('File path:', filePath);
    console.log('Team RIOT IDs:', teamRiotIds);
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('Calling backend API...');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/analyze-scrim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          file_path: filePath,
          team_riot_ids: teamRiotIds
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      console.log('Backend response:', result);

      if (result.success) {
        console.log('Analysis successful!');
        setAnalyticsData(result.data);
      } else {
        console.error('Analysis failed:', result.error);
        throw new Error(result.error || 'Analysis failed');
      }

    } catch (err) {
      console.error('CATCH ERROR:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAnalytics = async () => {
    if (!saveName.trim() || !analyticsData || !currentFilePath) {
      toast.warning('Please provide a name for this analysis');
      return;
    }

    if (!myTeam) {
      toast.error('You must be in a team to save analytics');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/analytics/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: saveName,
          file_path: currentFilePath,
          analysis_results: analyticsData,
          save_to_team: true,
          team_id: myTeam.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Save failed');
      }

      const result = await response.json();
      toast.success(result.message);
      setShowSaveModal(false);
      setSaveName('');

      // Reload team analytics
      loadTeamAnalytics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save analytics');
    }
  };

  const handleLoadSaved = (analytics: SavedAnalytics) => {
    setAnalyticsData(analytics.analysis_results);
    setCurrentFilePath(analytics.data_path);
    setViewMode('upload');
  };

  const handleDeleteTeam = async (id: string) => {
    setConfirmDialog({
      show: true,
      title: 'Delete Team Analysis',
      message: 'Are you sure you want to delete this team analysis? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, show: false });
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/api/analytics/team/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            toast.success('Analysis deleted successfully');
            loadTeamAnalytics();
          } else {
            throw new Error('Failed to delete');
          }
        } catch (err) {
          toast.error('Failed to delete analytics');
        }
      }
    });
  };


  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header
        brandName="OpenRift"
        tagline="PRO TOOLS FOR EVERYONE"
        showToolsLink={true}
      />

      {/* Page Header */}
      <div className="border-b border-[#F5F5F5]/10 py-12">
        <div className="max-w-[1600px] mx-auto px-12">
          <h1 className="text-[#F5F5F5] text-5xl font-semibold mb-4 tracking-tight">
            Data Analytics Dashboard
          </h1>
          <p className="text-[#F5F5F5]/50 text-lg">
            Upload, analyze, and save scrim data for your team
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      {isAuthenticated && (
        <div className="border-b border-[#F5F5F5]/10 bg-[#0E0E0E]/50 sticky top-[73px] z-40">
          <div className="max-w-[1600px] mx-auto px-12">
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('upload')}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  viewMode === 'upload'
                    ? 'text-[#F5F5F5] border-[#3D7A5F]'
                    : 'text-[#F5F5F5]/50 border-transparent hover:text-[#F5F5F5]/80'
                }`}
              >
                Upload & Analyze
              </button>
              <button
                onClick={() => setViewMode('team')}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  viewMode === 'team'
                    ? 'text-[#F5F5F5] border-[#3D7A5F]'
                    : 'text-[#F5F5F5]/50 border-transparent hover:text-[#F5F5F5]/80'
                }`}
              >
                Team Data ({myTeam ? `${teamAnalytics.length}/${teamLimit}` : 'No Team'})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 py-16">
        <div className="max-w-[1600px] mx-auto px-12">

          {/* Upload & Analyze View */}
          {viewMode === 'upload' && (
            <>
              {/* Upload Section - Hidden when data is loaded */}
              {!analyticsData && (
                <div className="mb-12">
                  <div className="bg-[#1a1a1a] border-2 border-dashed border-[#F5F5F5]/20 rounded-lg p-12 text-center hover:border-[#F5F5F5]/40 transition-colors">
                    <div className="mb-6">
                      <svg className="w-16 h-16 mx-auto text-[#F5F5F5]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>

                    <h3 className="text-[#F5F5F5] text-xl font-semibold mb-2">Upload Scrim Data</h3>
                    <p className="text-[#F5F5F5]/50 mb-6">Drop your analytics_data.json file here or click to browse</p>

                    <label className="inline-block">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <span className="px-8 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium cursor-pointer hover:bg-[#3D7A5F]/90 transition-colors inline-block rounded">
                        {isUploading ? 'Uploading...' : 'Select File'}
                      </span>
                    </label>

                    {uploadedFile && (
                      <div className="mt-6 text-[#F5F5F5]/70">
                        ✅ Uploaded: {uploadedFile.players_count} players detected
                      </div>
                    )}

                    {error && (
                      <div className="mt-6 text-red-400">
                        ❌ Error: {error}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isAnalyzing && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D7A5F]"></div>
                  <p className="text-[#F5F5F5]/50 mt-4">Analyzing data...</p>
                </div>
              )}

              {/* Analytics Results */}
              {analyticsData && !isAnalyzing && (
                <div className="space-y-12">

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setAnalyticsData(null);
                          setUploadedFile(null);
                          setCurrentFilePath(null);
                          setError(null);
                        }}
                        className="px-6 py-2 bg-[#1a1a1a] border border-[#F5F5F5]/20 text-[#F5F5F5] hover:border-[#F5F5F5]/40 transition-colors rounded"
                      >
                        Upload New Data
                      </button>
                    </div>
                    {isAuthenticated && (
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="px-6 py-2 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                      >
                        Save Analysis
                      </button>
                    )}
                  </div>

                  {/* Interactive Analytics Dashboard */}
                  {/* @ts-ignore - Type conflict between analytics data structures */}
                  <AnalyticsDashboard data={analyticsData} />

                </div>
              )}
            </>
          )}

          {/* Team Data View */}
          {viewMode === 'team' && (
            <div>
              {!myTeam ? (
                <div className="text-center py-24">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#F5F5F5]/5 flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#F5F5F5]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-[#F5F5F5] text-xl font-semibold mb-2">No Team Yet</h3>
                  <p className="text-[#F5F5F5]/50 mb-6">Create or join a team to access team analytics</p>
                  <button
                    onClick={() => window.location.href = '/teams'}
                    className="px-6 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                  >
                    Go to Teams
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-[#F5F5F5] text-3xl font-semibold mb-2">
                        <span style={{ color: myTeam.team_color }}>{myTeam.tag}</span> Team Analyses
                      </h2>
                      <p className="text-[#F5F5F5]/50">Your team has {teamAnalytics.length} of {teamLimit} saved analyses</p>
                    </div>
                  </div>

                  {teamAnalytics.length === 0 ? (
                    <div className="text-center py-24">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#F5F5F5]/5 flex items-center justify-center">
                        <svg className="w-12 h-12 text-[#F5F5F5]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-[#F5F5F5] text-xl font-semibold mb-2">No team analyses yet</h3>
                      <p className="text-[#F5F5F5]/50 mb-6">Upload and analyze data, then save it to your team to view here</p>
                      <button
                        onClick={() => setViewMode('upload')}
                        className="px-6 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
                      >
                        Go to Upload
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-6">
                      {teamAnalytics.map((analytics) => (
                        <div key={analytics.id} className="bg-[#1a1a1a] border border-[#F5F5F5]/10 p-6 hover:border-[#F5F5F5]/20 transition-colors rounded-lg group">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-[#F5F5F5] text-lg font-semibold">{analytics.name}</h3>
                            <button
                              onClick={() => handleDeleteTeam(analytics.id)}
                              className="text-[#F5F5F5]/40 hover:text-[#A85C5C] transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <div className="space-y-2 mb-4">
                            <p className="text-[#F5F5F5]/50 text-sm">{analytics.players_count} players</p>
                            <p className="text-[#F5F5F5]/40 text-xs">
                              By {analytics.created_by} • {new Date(analytics.uploaded_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <button
                            onClick={() => handleLoadSaved(analytics)}
                            className="w-full px-4 py-2 bg-[#3D7A5F]/20 text-[#3D7A5F] border border-[#3D7A5F]/30 hover:bg-[#3D7A5F]/30 transition-colors rounded"
                          >
                            View Analysis
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, show: false })}
          type="danger"
        />
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSaveModal(false)}>
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-8 max-w-md w-full rounded-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[#F5F5F5] text-2xl font-bold mb-2">Save Team Analysis</h2>
            <p className="text-[#F5F5F5]/50 text-sm mb-6">Save this analysis for your team</p>

            <div className="space-y-5">
              <div>
                <label className="block text-[#F5F5F5]/60 text-sm mb-2">Analysis Name *</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] rounded"
                  placeholder="e.g., Week 1 Scrims"
                  required
                />
              </div>

              {myTeam ? (
                <div className="p-4 bg-[#3D7A5F]/10 border border-[#3D7A5F]/20 rounded">
                  <div className="text-[#F5F5F5] text-sm font-medium mb-1">Team: {myTeam.name}</div>
                  <div className="text-[#F5F5F5]/40 text-xs">All team members can view this analysis ({teamAnalytics.length}/{teamLimit} used)</div>
                </div>
              ) : (
                <div className="p-4 bg-[#A85C5C]/10 border border-[#A85C5C]/20 rounded">
                  <div className="text-[#A85C5C] text-sm font-medium">You must join a team to save analytics</div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveName('');
                }}
                className="flex-1 px-6 py-3 bg-[#F5F5F5]/5 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAnalytics}
                className="flex-1 px-6 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer
        copyright="© 2025 LeagueHub — Professional Tools Platform"
        links={[
          { label: 'About', href: '#' },
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
        ]}
      />
    </div>
  );
}
