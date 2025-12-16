import { useState, useCallback } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { COLORS } from '../../constants/theme';

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
  players_count: number;
  uploaded_at: string;
}

const API_BASE_URL = 'http://localhost:8000';

export default function DataAnalyticsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadResponse | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/upload-scrim-data`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data: UploadResponse = await response.json();
      setUploadedFile(data);

      // Automatically analyze after upload
      await analyzeData(data.file_path);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const analyzeData = async (filePath: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-scrim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path: filePath }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();

      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const StatCard = ({ label, value, color = COLORS.primary }: { label: string; value: string | number; color?: string }) => (
    <div className="bg-[#1a1a1a] border border-[#F5F5F5]/10 p-6 hover:border-[#F5F5F5]/20 transition-colors">
      <div className="text-[#F5F5F5]/50 text-sm mb-2">{label}</div>
      <div className="text-[#F5F5F5] text-3xl font-semibold" style={{ color }}>{value}</div>
    </div>
  );

  return (
    <div className="w-screen min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header
        brandName="OpenRift"
        tagline="PRO TOOLS FOR EVERYONE"
        showToolsLink={true}
      />

      {/* Page Header */}
      <div className="border-b border-[#F5F5F5]/10 py-16">
        <div className="max-w-[1600px] mx-auto px-12">
          <h1 className="text-[#F5F5F5] text-5xl font-semibold mb-4 tracking-tight">
            Data Analytics
          </h1>
          <p className="text-[#F5F5F5]/50 text-lg">
            Analyze your scrim data and track team performance
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-16">
        <div className="max-w-[1600px] mx-auto px-12">

          {/* Upload Section - Hidden when data is loaded */}
          {!analyticsData && (
            <div className="mb-12">
              <div className="bg-[#1a1a1a] border-2 border-dashed border-[#F5F5F5]/20 p-12 text-center hover:border-[#F5F5F5]/40 transition-colors">
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
                  <span className="px-8 py-3 bg-[#F5F5F5] text-[#0E0E0E] font-medium cursor-pointer hover:bg-[#F5F5F5]/90 transition-colors inline-block">
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5F5F5]"></div>
              <p className="text-[#F5F5F5]/50 mt-4">Analyzing data...</p>
            </div>
          )}

          {/* Analytics Results */}
          {analyticsData && !isAnalyzing && (
            <div className="space-y-12">

              {/* Upload New File Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setAnalyticsData(null);
                    setUploadedFile(null);
                    setError(null);
                  }}
                  className="px-6 py-2 bg-[#1a1a1a] border border-[#F5F5F5]/20 text-[#F5F5F5] hover:border-[#F5F5F5]/40 transition-colors"
                >
                  Upload New Data
                </button>
              </div>

              {/* Team Overview */}
              <div>
                <h2 className="text-[#F5F5F5] text-3xl font-semibold mb-6">Team Overview</h2>
                <div className="grid grid-cols-4 gap-6">
                  <StatCard
                    label="Total Players"
                    value={analyticsData.total_players}
                    color={COLORS.primary}
                  />
                  <StatCard
                    label="Avg Winrate"
                    value={`${analyticsData.team_stats.avg_winrate.toFixed(1)}%`}
                    color={COLORS.gold}
                  />
                  <StatCard
                    label="Avg KDA"
                    value={analyticsData.team_stats.avg_kda.toFixed(2)}
                    color={COLORS.blue}
                  />
                  <StatCard
                    label="Total Games"
                    value={analyticsData.team_stats.total_games}
                    color={COLORS.purple}
                  />
                </div>
              </div>

              {/* Radar Chart - Full Width */}
              <div>
                <h2 className="text-[#F5F5F5] text-3xl font-semibold mb-6">Player Performance Radar</h2>
                <div className="bg-[#1a1a1a] border border-[#F5F5F5]/10 p-8">
                  <img
                    src={`${API_BASE_URL}/exports/charts/radar_players.png?t=${Date.now()}`}
                    alt="Radar Chart"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Charts */}
              <div>
                <h2 className="text-[#F5F5F5] text-3xl font-semibold mb-6">Performance Charts</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#1a1a1a] border border-[#F5F5F5]/10 p-6">
                    <h3 className="text-[#F5F5F5] text-xl font-semibold mb-4">Winrate by Player</h3>
                    <img
                      src={`${API_BASE_URL}/exports/charts/winrate_by_player.png?t=${Date.now()}`}
                      alt="Winrate Chart"
                      className="w-full"
                    />
                  </div>
                  <div className="bg-[#1a1a1a] border border-[#F5F5F5]/10 p-6">
                    <h3 className="text-[#F5F5F5] text-xl font-semibold mb-4">KDA vs DPM</h3>
                    <img
                      src={`${API_BASE_URL}/exports/charts/kda_vs_dpm.png?t=${Date.now()}`}
                      alt="KDA Chart"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Player Stats Table */}
              <div>
                <h2 className="text-[#F5F5F5] text-3xl font-semibold mb-6">Player Statistics</h2>
                <div className="bg-[#1a1a1a] border border-[#F5F5F5]/10 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#0E0E0E]">
                      <tr className="border-b border-[#F5F5F5]/10">
                        <th className="text-left text-[#F5F5F5] font-semibold p-4">Player</th>
                        <th className="text-left text-[#F5F5F5] font-semibold p-4">Position</th>
                        <th className="text-right text-[#F5F5F5] font-semibold p-4">Games</th>
                        <th className="text-right text-[#F5F5F5] font-semibold p-4">W/L</th>
                        <th className="text-right text-[#F5F5F5] font-semibold p-4">Winrate</th>
                        <th className="text-right text-[#F5F5F5] font-semibold p-4">KDA</th>
                        <th className="text-right text-[#F5F5F5] font-semibold p-4">DPM</th>
                        <th className="text-right text-[#F5F5F5] font-semibold p-4">GPM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.players.map((player, index) => (
                        <tr key={index} className="border-b border-[#F5F5F5]/5 hover:bg-[#F5F5F5]/5">
                          <td className="text-[#F5F5F5] p-4 font-medium">{player.name}</td>
                          <td className="text-[#F5F5F5]/70 p-4">{player.position}</td>
                          <td className="text-[#F5F5F5]/70 p-4 text-right">{player.games_played}</td>
                          <td className="text-[#F5F5F5]/70 p-4 text-right">{player.wins}W / {player.losses}L</td>
                          <td className="text-[#F5F5F5]/70 p-4 text-right">
                            <span style={{ color: player.winrate >= 50 ? COLORS.gold : COLORS.danger }}>
                              {player.winrate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-[#F5F5F5]/70 p-4 text-right">{player.kda.toFixed(2)}</td>
                          <td className="text-[#F5F5F5]/70 p-4 text-right">
                            {player.per_min_damage?.toFixed(0) || 'N/A'}
                          </td>
                          <td className="text-[#F5F5F5]/70 p-4 text-right">
                            {player.per_min_gold?.toFixed(0) || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

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
