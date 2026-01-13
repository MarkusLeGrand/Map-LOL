import { useState, useCallback, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { AnalyticsDashboard } from '../../components/analytics/AnalyticsDashboard';

interface ChampionStats {
  name: string;
  champion?: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
  kda?: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
  avg_damage: number;
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

const API_BASE_URL = 'http://localhost:8000';

type ViewMode = 'guide' | 'upload' | 'team';

export default function DataAnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const { teams } = useTeam();
  const toast = useToast();
  const myTeam = teams.length > 0 ? teams[0] : null;

  const [viewMode, setViewMode] = useState<ViewMode>('guide');
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

    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Validate file type
      if (!file.name.endsWith('.json')) {
        throw new Error('Invalid file type. Please upload a .json file containing match data.');
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new Error('File is too large. Maximum size is 50MB.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to upload data.');
      }

      const response = await fetch(`${API_BASE_URL}/api/upload-scrim-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Provide user-friendly error messages
        let errorMessage = 'Upload failed';
        if (errorData.detail) {
          if (errorData.detail.includes('must be part of a team')) {
            errorMessage = 'You need to join or create a team before uploading scrim data.';
          } else if (errorData.detail.includes('No team member has configured their Riot ID')) {
            errorMessage = 'No team members have set their Riot ID. Please add your Riot ID in settings to link matches.';
          } else if (errorData.detail.includes('Invalid JSON format')) {
            errorMessage = 'Invalid file format. The file must contain valid JSON match data from Riot API.';
          } else if (errorData.detail.includes('must contain a \'matches\' array')) {
            errorMessage = 'Invalid data structure. The file must contain a "matches" array with Riot API match data.';
          } else if (errorData.detail.includes('No matches found')) {
            errorMessage = 'The file does not contain any match data.';
          } else if (errorData.detail.includes('No team members were found in the matches')) {
            errorMessage = 'No team members found in the match data. Make sure the Riot IDs in settings match the players in the uploaded matches.';
          } else {
            errorMessage = errorData.detail;
          }
        }

        throw new Error(errorMessage);
      }

      const data: UploadResponse = await response.json();
      setUploadedFile(data);
      setCurrentFilePath(data.file_path);

      toast?.success(`Upload successful! Found ${data.matches_count} matches with ${data.found_players?.length || 0} team members.`);

      // Automatically analyze after upload with team filter
      await analyzeData(data.file_path, data.found_players || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(errorMessage);
      toast?.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const analyzeData = async (filePath: string, teamRiotIds: string[] = []) => {



    setIsAnalyzing(true);
    setError(null);

    try {

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('You must be logged in to analyze data.');
      }

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
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = 'Analysis failed';

        if (errorData.detail) {
          if (errorData.detail.includes('File not found')) {
            errorMessage = 'The uploaded file could not be found. Please try uploading again.';
          } else if (errorData.detail.includes('No matches')) {
            errorMessage = 'No valid match data found in the file.';
          } else {
            errorMessage = errorData.detail;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {

        setAnalyticsData(result.data);
        toast?.success('Analysis completed successfully!');
      } else {

        const errorMessage = result.error || 'Analysis failed. Please check the uploaded data format.';
        throw new Error(errorMessage);
      }

    } catch (err) {

      const errorMessage = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(errorMessage);
      toast?.error(errorMessage);
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
            Scrim Data Analytics Dashboard
          </h1>
          <p className="text-[#F5F5F5]/50 text-lg">
            Upload, analyze, and save scrim data for your team
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#F5F5F5]/10 bg-[#0E0E0E]/50 sticky top-[73px] z-40">
        <div className="max-w-[1600px] mx-auto px-12">
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('guide')}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                viewMode === 'guide'
                  ? 'text-[#F5F5F5] border-[#3D7A5F]'
                  : 'text-[#F5F5F5]/50 border-transparent hover:text-[#F5F5F5]/80'
              }`}
            >
              ROFL Parser Guide
            </button>
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
            {isAuthenticated && (
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
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-16">
        <div className="max-w-[1600px] mx-auto px-12">

          {/* ROFL Parser Guide View */}
          {viewMode === 'guide' && (
            <div className="max-w-5xl mx-auto">
              {/* Hero Section */}
              <div className="mb-10">
                <h1 className="text-4xl font-bold text-[#F5F5F5] mb-3">ROFL to JSON Converter</h1>
                <p className="text-[#F5F5F5]/60 text-lg">Transform your League of Legends replay files into analyzable data</p>
              </div>

              {/* Quick Stats Bar */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-[#F5F5F5]/10 to-[#F5F5F5]/5 border border-[#F5F5F5]/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#F5F5F5] mb-1">4</div>
                  <div className="text-xs text-[#F5F5F5]/60">Simple Steps</div>
                </div>
                <div className="bg-gradient-to-br from-[#F5F5F5]/10 to-[#F5F5F5]/5 border border-[#F5F5F5]/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#F5F5F5] mb-1">15min</div>
                  <div className="text-xs text-[#F5F5F5]/60">Setup Time</div>
                </div>
              </div>

              {/* Why This Matters */}
              <div className="bg-gradient-to-r from-[#3D7A5F]/10 to-transparent border-l-4 border-[#3D7A5F] rounded-r-lg p-6 mb-8">
                <h3 className="text-[#F5F5F5] font-semibold text-lg mb-2 flex items-center gap-2">
                  <span>⚡</span> Why use .rofl files?
                </h3>
                <p className="text-[#F5F5F5]/80 leading-relaxed">
                  <strong className="text-[#3D7A5F]">Scrim matches are custom games</strong> that aren't tracked by Riot's public API.
                  Your local replay files (.rofl) contain all the match data you need. This tool extracts and converts that data
                  into JSON format for deep analysis of your team's performance.
                </p>
              </div>

              <div className="space-y-6">
                {/* STEP 1 */}
                <div className="bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#F5F5F5]/10">
                  <div className="bg-gradient-to-r from-[#3D7A5F]/10 to-transparent p-5 border-b border-[#F5F5F5]/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#3D7A5F] flex items-center justify-center text-white font-bold text-xl">
                        1
                      </div>
                      <div>
                        <h3 className="text-[#F5F5F5] font-bold text-xl">Organize Your Files</h3>
                        <p className="text-[#F5F5F5]/50 text-sm">Set up your folder structure</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-[450px,1fr] gap-8">
                      {/* Image */}
                      <div className="space-y-3">
                        <div className="rounded-lg overflow-hidden border-2 border-[#3D7A5F]/20">
                          <img src="/tuto.png" alt="Folder structure" className="w-full" />
                        </div>
                        <p className="text-[#F5F5F5]/40 text-xs text-center italic">Example: Organized scrim folders</p>
                      </div>

                      {/* Steps */}
                      <div className="flex flex-col justify-center space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded bg-[#3D7A5F]/20 flex items-center justify-center">
                              <span className="text-[#3D7A5F] text-sm font-bold">A</span>
                            </div>
                            <span className="text-[#F5F5F5] font-semibold">Navigate to replays folder</span>
                          </div>
                          <div className="bg-[#0E0E0E] rounded-lg p-3 border border-[#3D7A5F]/20">
                            <code className="text-[#3D7A5F] text-xs font-mono">
                              C:\Users\[YourName]\Documents\League of Legends\Replays\
                            </code>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded bg-[#3D7A5F]/20 flex items-center justify-center">
                              <span className="text-[#3D7A5F] text-sm font-bold">B</span>
                            </div>
                            <span className="text-[#F5F5F5] font-semibold">Create scrim folders</span>
                          </div>
                          <div className="flex gap-2">
                            {['Scrim1', 'Scrim2', 'Scrim3', '...'].map((folder, i) => (
                              <div key={i} className="bg-[#0E0E0E] border border-[#3D7A5F]/20 rounded px-3 py-1.5">
                                <span className="text-[#3D7A5F] text-xs font-mono">{folder}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded bg-[#3D7A5F]/20 flex items-center justify-center">
                              <span className="text-[#3D7A5F] text-sm font-bold">C</span>
                            </div>
                            <span className="text-[#F5F5F5] font-semibold">Move .rofl files into folders</span>
                          </div>
                          <p className="text-[#F5F5F5]/60 text-sm pl-9">Organize each scrim session's replays into its own folder</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEP 2 */}
                <div className="bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#F5F5F5]/10">
                  <div className="bg-gradient-to-r from-[#3D7A5F]/10 to-transparent p-5 border-b border-[#F5F5F5]/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#3D7A5F] flex items-center justify-center text-white font-bold text-xl">
                        2
                      </div>
                      <div>
                        <h3 className="text-[#F5F5F5] font-bold text-xl">Install Python</h3>
                        <p className="text-[#F5F5F5]/50 text-sm">Get the required software</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#3D7A5F]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🐍</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[#F5F5F5] mb-3">
                          Download and install <strong className="text-[#3D7A5F]">Python 3.8+</strong> from{' '}
                          <a
                            href="https://www.python.org/downloads/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3D7A5F] underline font-semibold"
                          >
                            python.org
                          </a>
                        </p>
                        <div className="bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 rounded-lg p-4">
                          <p className="text-[#F5F5F5]/60 text-sm mb-3">Then install the required package:</p>
                          <div className="bg-[#0E0E0E] rounded-lg p-4 border border-[#3D7A5F]/20">
                            <code className="text-[#3D7A5F] font-mono">pip install requests</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEP 3 */}
                <div className="bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#F5F5F5]/10">
                  <div className="bg-gradient-to-r from-[#3D7A5F]/10 to-transparent p-5 border-b border-[#F5F5F5]/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#3D7A5F] flex items-center justify-center text-white font-bold text-xl">
                        3
                      </div>
                      <div>
                        <h3 className="text-[#F5F5F5] font-bold text-xl">Run the Parser</h3>
                        <p className="text-[#F5F5F5]/50 text-sm">Convert your files to JSON</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-[1fr,280px] gap-6">
                      <div className="space-y-5">
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#3D7A5F]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#3D7A5F] font-bold">1</span>
                          </div>
                          <div>
                            <p className="text-[#F5F5F5] font-semibold mb-1">Download the script</p>
                            <p className="text-[#F5F5F5]/60 text-sm">Get it from the download card →</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#3D7A5F]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#3D7A5F] font-bold">2</span>
                          </div>
                          <div>
                            <p className="text-[#F5F5F5] font-semibold mb-1">Place the script</p>
                            <p className="text-[#F5F5F5]/60 text-sm">Put it in the same folder as your Scrim folders</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#3D7A5F]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#3D7A5F] font-bold">3</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[#F5F5F5] font-semibold mb-2">Execute the script</p>
                            <div className="bg-[#0E0E0E] rounded-lg p-3 border border-[#3D7A5F]/20">
                              <code className="text-[#3D7A5F] text-sm font-mono">python parse_rofl_direct.py</code>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#3D7A5F]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#3D7A5F] font-bold">4</span>
                          </div>
                          <div>
                            <p className="text-[#F5F5F5] font-semibold mb-1">Get your results</p>
                            <p className="text-[#F5F5F5]/60 text-sm">
                              Find JSON files in the <code className="text-[#3D7A5F] bg-[#0E0E0E] px-2 py-0.5 rounded">outputs/</code> folder
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Download Card */}
                      <div className="bg-gradient-to-br from-[#0E0E0E] to-[#1A1A1A] border-2 border-[#3D7A5F]/20 rounded-xl p-5">
                        <div className="text-center space-y-4">
                          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-[#3D7A5F]/30 to-[#3D7A5F]/10 flex items-center justify-center">
                            <svg className="w-7 h-7 text-[#3D7A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-[#F5F5F5] font-bold text-base mb-1">ROFL Parser</h4>
                            <p className="text-[#F5F5F5]/50 text-xs">Python conversion script</p>
                          </div>
                          <a
                            href={`${API_BASE_URL}/api/download/parse_rofl_direct.py`}
                            download="parse_rofl_direct.py"
                            className="block w-full py-3 bg-[#3D7A5F] text-white font-semibold rounded-lg"
                          >
                            Download
                          </a>
                          <div className="text-[#F5F5F5]/40 text-xs">v1.0 • Python 3.8+</div>
                          <div className="pt-3 border-t border-[#F5F5F5]/10 space-y-2 text-xs">
                            <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" className="block text-[#3D7A5F]">
                              Get Python →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEP 4 */}
                <div className="bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#F5F5F5]/10">
                  <div className="bg-gradient-to-r from-[#3D7A5F]/10 to-transparent p-5 border-b border-[#F5F5F5]/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#3D7A5F] flex items-center justify-center text-white font-bold text-xl">
                        4
                      </div>
                      <div>
                        <h3 className="text-[#F5F5F5] font-bold text-xl">Upload & Analyze</h3>
                        <p className="text-[#F5F5F5]/50 text-sm">View your team statistics</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#3D7A5F]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[#F5F5F5] text-base mb-4">
                          Navigate to the <strong className="text-[#3D7A5F]">Upload & Analyze</strong> tab and upload your{' '}
                          <code className="bg-[#0E0E0E] border border-[#3D7A5F]/20 px-2 py-1 rounded text-[#3D7A5F] text-sm">global_matches.json</code> file
                        </p>
                        <button
                          onClick={() => setViewMode('upload')}
                          className="px-6 py-3 bg-[#3D7A5F] text-white font-semibold rounded-lg inline-flex items-center gap-2"
                        >
                          <span>Start Analyzing</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="bg-gradient-to-r from-[#3D7A5F]/10 to-transparent border-l-4 border-[#3D7A5F] rounded-r-xl p-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#3D7A5F]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">💡</span>
                    </div>
                    <div>
                      <h4 className="text-[#F5F5F5] font-bold text-lg mb-2">Pro Tip</h4>
                      <p className="text-[#F5F5F5]/80 leading-relaxed">
                        The parser creates both <strong className="text-[#3D7A5F]">individual JSON files</strong> for each scrim folder and a{' '}
                        <strong className="text-[#3D7A5F]">combined global_matches.json</strong>.
                        Use the global file to analyze all your scrims together for comprehensive team insights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
        copyright="© 2025 OpenRift — Professional Tools Platform"
        links={[
          { label: 'About', href: '/about' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
        ]}
      />
    </div>
  );
}
