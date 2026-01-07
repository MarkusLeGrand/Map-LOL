import { useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { COLORS } from '../../constants/theme';

interface ChampionStats {
  name: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
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
  is_team_member?: boolean;  // Flag to identify team members vs opponents
  avg_kill_participation?: number;
  per_min_damage?: number;
  per_min_gold?: number;
  per_min_cs?: number;
  avg_vision?: number;
  avg_wards_placed?: number;
  avg_wards_destroyed?: number;
  per_min_damage_to_objectives?: number;
  per_min_damage_to_buildings?: number;
  per_min_damage_taken?: number;
  champions?: ChampionStats[];
  top_champions?: ChampionStats[];
  champion_stats?: ChampionStats[];
}

interface AnalyticsData {
  players: PlayerStats[];
  all_players?: PlayerStats[];
  total_players: number;
  team_stats: {
    avg_winrate: number;
    avg_kda: number;
    total_games: number;
  };
}

interface Props {
  data: AnalyticsData;
}

export function AnalyticsDashboard({ data }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<'kda' | 'winrate' | 'gold' | 'damage' | 'cs' | 'killParticipation'>('gold');
  const [currentRadarIndex, setCurrentRadarIndex] = useState(0);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [currentChampionPlayerIndex, setCurrentChampionPlayerIndex] = useState(0);
  const [scatterXAxis, setScatterXAxis] = useState<'gold' | 'damage' | 'cs' | 'kp' | 'kda'>('gold');
  const [scatterYAxis, setScatterYAxis] = useState<'damage' | 'gold' | 'cs' | 'kp' | 'kda'>('damage');
  const [showAllPlayers, setShowAllPlayers] = useState(true); // Toggle for all players vs team only

  // FIXED: Total games is the MAX not the SUM
  const actualTotalGames = Math.max(...data.players.map(p => p.games_played));

  // Performance metrics data - Toggle between all players and team only
  const allPlayersForComparison = data.all_players || data.players;
  const selectedPlayers = showAllPlayers ? allPlayersForComparison : data.players;
  const performanceData = selectedPlayers.map(p => ({
    name: p.name,
    position: p.position,
    kda: p.kda,
    winrate: p.winrate,
    gold: p.per_min_gold || 0,
    damage: p.per_min_damage || 0,
    cs: p.per_min_cs || 0,
    killParticipation: p.avg_kill_participation || 0,
    isTeam: p.is_team_member !== false  // For coloring
  }));

  // Scatter plot data - Dynamic mapping
  const getScatterValue = (player: PlayerStats, metric: 'gold' | 'damage' | 'cs' | 'kp' | 'kda') => {
    switch (metric) {
      case 'gold':
        return player.per_min_gold || 0;
      case 'damage':
        return player.per_min_damage || 0;
      case 'cs':
        return player.per_min_cs || 0;
      case 'kp':
        return player.avg_kill_participation || 0;
      case 'kda':
        return player.kda || 0;
    }
  };

  const getScatterLabel = (metric: 'gold' | 'damage' | 'cs' | 'kp' | 'kda') => {
    switch (metric) {
      case 'gold':
        return { short: 'GPM', long: 'Gold per minute' };
      case 'damage':
        return { short: 'DPM', long: 'Damage per minute' };
      case 'cs':
        return { short: 'CS/min', long: 'CS per minute' };
      case 'kp':
        return { short: 'KP%', long: 'Kill Participation %' };
      case 'kda':
        return { short: 'KDA', long: 'Kill/Death/Assist Ratio' };
    }
  };

  // Scatter data - Toggle between all players and team only
  // First, map all data
  const scatterDataRaw = selectedPlayers.map(p => ({
    name: p.name,
    position: p.position,
    x: getScatterValue(p, scatterXAxis),
    y: getScatterValue(p, scatterYAxis),
    z: p.kda || 1,
    isTeam: p.is_team_member !== false
  }));

  // Filter outliers using 95th percentile (remove extreme 2.5% on each side)
  const filterOutliers = (data: typeof scatterDataRaw, key: 'x' | 'y') => {
    const values = data.map(d => d[key]).sort((a, b) => a - b);
    const p2_5 = values[Math.floor(values.length * 0.025)];
    const p97_5 = values[Math.floor(values.length * 0.975)];
    return data.filter(d => d[key] >= p2_5 && d[key] <= p97_5);
  };

  // Apply outlier filtering for both axes
  let scatterDataFiltered = filterOutliers(scatterDataRaw, 'x');
  scatterDataFiltered = filterOutliers(scatterDataFiltered, 'y');

  // Sort so opponents (red) are drawn first, then team (green) on top
  const scatterData = scatterDataFiltered.sort((a, b) => {
    return (a.isTeam ? 1 : 0) - (b.isTeam ? 1 : 0);
  });

  // Win/Loss distribution
  const totalWins = data.players.reduce((acc, p) => acc + p.wins, 0);
  const totalLosses = data.players.reduce((acc, p) => acc + p.losses, 0);

  const winLossData = [
    { name: 'Wins', value: totalWins, color: '#3D7A5F' },
    { name: 'Losses', value: totalLosses, color: '#C75B5B' }
  ];

  // Individual radar charts with global average (all players, not just team)
  const radarPlayers = [...data.players];

  const createRadarData = (player: PlayerStats) => {
    // Calculate GLOBAL averages and ranges from all players (team + opponents)
    const allPlayersData = data.all_players || data.players;

    // Helper function to normalize based on actual data range
    const normalizeMetric = (value: number, allValues: number[]) => {
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      const range = max - min;
      if (range === 0) return 50; // If all values are the same, return middle
      return ((value - min) / range) * 100;
    };

    // Extract all values for each metric
    const allKDA = allPlayersData.map(p => p.kda);
    const allKP = allPlayersData.map(p => p.avg_kill_participation || 0);
    const allGPM = allPlayersData.map(p => p.per_min_gold || 0);
    const allDPM = allPlayersData.map(p => p.per_min_damage || 0);
    const allCS = allPlayersData.map(p => p.per_min_cs || 0);

    // Calculate global averages
    const globalAvgKDA = allKDA.reduce((a, b) => a + b, 0) / allKDA.length;
    const globalAvgKP = allKP.reduce((a, b) => a + b, 0) / allKP.length;
    const globalAvgGPM = allGPM.reduce((a, b) => a + b, 0) / allGPM.length;
    const globalAvgDPM = allDPM.reduce((a, b) => a + b, 0) / allDPM.length;
    const globalAvgCS = allCS.reduce((a, b) => a + b, 0) / allCS.length;

    // Normalize to 0-100 scale based on actual data range
    return [
      {
        metric: 'KDA',
        player: normalizeMetric(player.kda, allKDA),
        average: normalizeMetric(globalAvgKDA, allKDA)
      },
      {
        metric: 'KP%',
        player: normalizeMetric(player.avg_kill_participation || 0, allKP),
        average: normalizeMetric(globalAvgKP, allKP)
      },
      {
        metric: 'GPM',
        player: normalizeMetric(player.per_min_gold || 0, allGPM),
        average: normalizeMetric(globalAvgGPM, allGPM)
      },
      {
        metric: 'DPM',
        player: normalizeMetric(player.per_min_damage || 0, allDPM),
        average: normalizeMetric(globalAvgDPM, allDPM)
      },
      {
        metric: 'CS/min',
        player: normalizeMetric(player.per_min_cs || 0, allCS),
        average: normalizeMetric(globalAvgCS, allCS)
      }
    ];
  };

  // Champion pool data
  const allChampions = data.players.flatMap(p =>
    (p.champions || p.top_champions || []).map(c => ({
      ...c,
      player: p.name,
      position: p.position
    }))
  );

  const nextRadar = () => {
    setCurrentRadarIndex((prev) => (prev + 1) % radarPlayers.length);
  };

  const prevRadar = () => {
    setCurrentRadarIndex((prev) => (prev - 1 + radarPlayers.length) % radarPlayers.length);
  };

  // Insights carousel data
  const insights = [
    {
      title: "MVP",
      subtitle: "Best overall player",
      value: (() => {
        const mvp = [...data.players].sort((a, b) => {
          const scoreA = (a.kda * 0.4) + (a.winrate * 0.3) + ((a.avg_kill_participation || 0) * 0.3);
          const scoreB = (b.kda * 0.4) + (b.winrate * 0.3) + ((b.avg_kill_participation || 0) * 0.3);
          return scoreB - scoreA;
        })[0];
        return `${mvp.name} (${mvp.position})`;
      })(),
      description: "Based on KDA, Winrate and Kill Participation",
      color: "#B4975A"
    },
    {
      title: "Main Carry",
      subtitle: "Most damage",
      value: (() => {
        const carry = [...data.players].sort((a, b) => (b.per_min_damage || 0) - (a.per_min_damage || 0))[0];
        return `${carry.name} - ${(carry.per_min_damage || 0).toFixed(0)} DPM`;
      })(),
      description: "Damage per minute champion",
      color: "#C75B5B"
    },
    {
      title: "Farm King",
      subtitle: "Best CS/min",
      value: (() => {
        const farmer = [...data.players].sort((a, b) => (b.per_min_cs || 0) - (a.per_min_cs || 0))[0];
        return `${farmer.name} - ${(farmer.per_min_cs || 0).toFixed(1)} CS/min`;
      })(),
      description: "Farming mastery",
      color: "#5B8FB9"
    },
    {
      title: "Clutch Player",
      subtitle: "Highest KP",
      value: (() => {
        const clutch = [...data.players].sort((a, b) => (b.avg_kill_participation || 0) - (a.avg_kill_participation || 0))[0];
        return `${clutch.name} - ${(clutch.avg_kill_participation || 0).toFixed(1)}%`;
      })(),
      description: "Always in the action",
      color: "#3D7A5F"
    }
  ];

  const nextInsight = () => {
    setCurrentInsightIndex((prev) => (prev + 1) % insights.length);
  };

  const prevInsight = () => {
    setCurrentInsightIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  const nextChampionPlayer = () => {
    setCurrentChampionPlayerIndex((prev) => (prev + 1) % data.players.length);
  };

  const prevChampionPlayer = () => {
    setCurrentChampionPlayerIndex((prev) => (prev - 1 + data.players.length) % data.players.length);
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-6 rounded-lg">
          <div className="text-[#F5F5F5]/50 text-sm mb-2">Total Players</div>
          <div className="text-[#F5F5F5] text-4xl font-bold">{data.total_players}</div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-6 rounded-lg">
          <div className="text-[#F5F5F5]/50 text-sm mb-2">Avg Winrate</div>
          <div className="text-4xl font-bold" style={{ color: COLORS.primary }}>
            {data.team_stats.avg_winrate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-6 rounded-lg">
          <div className="text-[#F5F5F5]/50 text-sm mb-2">Avg KDA</div>
          <div className="text-4xl font-bold" style={{ color: COLORS.blue }}>
            {data.team_stats.avg_kda.toFixed(1)}
          </div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-6 rounded-lg">
          <div className="text-[#F5F5F5]/50 text-sm mb-2">Total Games</div>
          <div className="text-[#F5F5F5] text-4xl font-bold">{actualTotalGames}</div>
        </div>
      </div>

      {/* Insights Carousel */}
      <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[#F5F5F5]/10 flex items-center justify-between">
          <div>
            <h3 className="text-[#F5F5F5] text-2xl font-bold mb-1">Highlights</h3>
            <p className="text-[#F5F5F5]/50 text-sm">Key statistics</p>
          </div>

          {/* Carousel Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={prevInsight}
              className="p-3 bg-[#F5F5F5]/5 hover:bg-[#F5F5F5]/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#F5F5F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex gap-2">
              {insights.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentInsightIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentInsightIndex
                      ? 'bg-[#3D7A5F] w-8'
                      : 'bg-[#F5F5F5]/20 hover:bg-[#F5F5F5]/40'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextInsight}
              className="p-3 bg-[#F5F5F5]/5 hover:bg-[#F5F5F5]/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#F5F5F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 text-center">
          <p className="text-[#F5F5F5]/50 text-xs mb-1">{insights[currentInsightIndex].subtitle}</p>
          <h4 className="text-[#F5F5F5] text-xl font-bold mb-1">{insights[currentInsightIndex].title}</h4>
          <p className="text-3xl font-bold mb-2" style={{ color: insights[currentInsightIndex].color }}>
            {insights[currentInsightIndex].value}
          </p>
          <p className="text-[#F5F5F5]/70 text-xs">{insights[currentInsightIndex].description}</p>
        </div>
      </div>

      {/* Champion Pool Section - Player Carousel */}
      {allChampions.length > 0 && (
        <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-[#F5F5F5]/10 flex items-center justify-between">
            <div>
              <h3 className="text-[#F5F5F5] text-2xl font-bold mb-1">Champion Pool</h3>
              <p className="text-[#F5F5F5]/50 text-sm">
                {data.players[currentChampionPlayerIndex]?.name} • {data.players[currentChampionPlayerIndex]?.position}
              </p>
            </div>

            {/* Player Carousel Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={prevChampionPlayer}
                className="p-3 bg-[#F5F5F5]/5 hover:bg-[#F5F5F5]/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-[#F5F5F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex gap-2">
                {data.players.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentChampionPlayerIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentChampionPlayerIndex
                        ? 'bg-[#3D7A5F] w-8'
                        : 'bg-[#F5F5F5]/20 hover:bg-[#F5F5F5]/40'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextChampionPlayer}
                className="p-3 bg-[#F5F5F5]/5 hover:bg-[#F5F5F5]/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-[#F5F5F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-8">
            {(() => {
              const currentPlayer = data.players[currentChampionPlayerIndex];
              const champions = currentPlayer?.champions || currentPlayer?.top_champions || currentPlayer?.champion_stats || [];
              const displayChampions = champions.slice(0, 6);

              // Helper to normalize based on range across all champions for this player
              const normalizeChampMetric = (value: number, allValues: number[], inverse = false) => {
                const min = Math.min(...allValues);
                const max = Math.max(...allValues);
                const range = max - min;
                if (range === 0) return 50;
                const normalized = ((value - min) / range) * 100;
                return inverse ? 100 - normalized : normalized;
              };

              // Extract all values for normalization
              const allKills = displayChampions.map(c => c.avg_kills);
              const allAssists = displayChampions.map(c => c.avg_assists);
              const allDamage = displayChampions.map(c => c.avg_damage);
              const allDeaths = displayChampions.map(c => c.avg_deaths);
              const allKDAs = displayChampions.map(c => c.avg_deaths > 0 ? (c.avg_kills + c.avg_assists) / c.avg_deaths : (c.avg_kills + c.avg_assists));

              return (
                <div className="grid grid-cols-3 gap-6">
                  {displayChampions.slice(0, 3).map((champ: ChampionStats, idx: number) => {
                    // Calculate KDA from averages: (Kills + Assists) / Deaths
                    const kda = champ.avg_deaths > 0
                      ? (champ.avg_kills + champ.avg_assists) / champ.avg_deaths
                      : (champ.avg_kills + champ.avg_assists);

                    // Create radar data for this champion - normalize based on player's champion pool
                    const championRadarData = [
                      { metric: 'Kills', value: normalizeChampMetric(champ.avg_kills, allKills) },
                      { metric: 'Assists', value: normalizeChampMetric(champ.avg_assists, allAssists) },
                      { metric: 'DMG', value: normalizeChampMetric(champ.avg_damage, allDamage) },
                      { metric: 'KDA', value: normalizeChampMetric(kda, allKDAs) },
                      { metric: 'Deaths', value: normalizeChampMetric(champ.avg_deaths, allDeaths, true) } // Inverse - less deaths is better
                    ];

                    return (
                      <div
                        key={idx}
                        className="bg-[#0E0E0E] border border-[#F5F5F5]/10 rounded-lg p-4 hover:border-[#3D7A5F]/50 transition-all"
                      >
                        <div className="mb-2">
                          <div className="text-[#F5F5F5] font-semibold text-lg truncate text-center mb-1">{champ.name}</div>
                          <div className="flex justify-center gap-4 text-xs">
                            <span className="text-[#F5F5F5]/50">{champ.games}G</span>
                            <span className={champ.winrate >= 50 ? 'text-[#3D7A5F]' : 'text-[#C75B5B]'}>
                              {champ.winrate.toFixed(0)}% WR
                            </span>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={championRadarData}>
                            <PolarGrid stroke="#F5F5F5" opacity={0.1} />
                            <PolarAngleAxis dataKey="metric" stroke="#F5F5F5" tick={{ fontSize: 10 }} />
                            <PolarRadiusAxis stroke="#F5F5F5" opacity={0.3} domain={[0, 100]} />
                            <Radar
                              dataKey="value"
                              stroke={COLORS.primary}
                              fill={COLORS.primary}
                              fillOpacity={0.6}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-center">
                          <div>
                            <div className="text-[#F5F5F5]/50">K/D/A</div>
                            <div className="text-[#F5F5F5] font-medium">{kda.toFixed(1)}</div>
                          </div>
                          <div>
                            <div className="text-[#F5F5F5]/50">Kills</div>
                            <div className="text-[#F5F5F5] font-medium">{champ.avg_kills.toFixed(1)}</div>
                          </div>
                          <div>
                            <div className="text-[#F5F5F5]/50">DMG</div>
                            <div className="text-[#F5F5F5] font-medium">{(champ.avg_damage / 1000).toFixed(1)}k</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2 COLUMN LAYOUT */}
      <div className="grid grid-cols-2 gap-8">

        {/* LEFT COLUMN */}
        <div className="space-y-8">

          {/* Performance Overview */}
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#F5F5F5]/10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-[#F5F5F5] text-2xl font-bold mb-1">Performance Overview</h3>
                  <p className="text-[#F5F5F5]/50 text-sm">Compare key metrics across players</p>
                </div>
                {/* Toggle All/Team */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAllPlayers(true)}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                      showAllPlayers
                        ? 'bg-[#3D7A5F] text-[#F5F5F5]'
                        : 'bg-[#F5F5F5]/5 text-[#F5F5F5]/70 hover:bg-[#F5F5F5]/10'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setShowAllPlayers(false)}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                      !showAllPlayers
                        ? 'bg-[#3D7A5F] text-[#F5F5F5]'
                        : 'bg-[#F5F5F5]/5 text-[#F5F5F5]/70 hover:bg-[#F5F5F5]/10'
                    }`}
                  >
                    Team
                  </button>
                </div>
              </div>

              {/* Metric Selector - Integrated */}
              <div className="space-y-3">
                <label className="block text-[#F5F5F5]/70 text-xs font-medium">Metric</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'gold', label: 'Gold/min' },
                    { key: 'damage', label: 'DMG/min' },
                    { key: 'cs', label: 'CS/min' },
                    { key: 'killParticipation', label: 'KP%' }
                  ].map((metric) => (
                    <button
                      key={metric.key}
                      onClick={() => setSelectedMetric(metric.key as any)}
                      className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                        selectedMetric === metric.key
                          ? 'bg-[#3D7A5F] text-[#F5F5F5]'
                          : 'bg-[#F5F5F5]/5 text-[#F5F5F5]/70 hover:bg-[#F5F5F5]/10'
                      }`}
                    >
                      {metric.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-8">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" opacity={0.1} />
                  <XAxis
                    dataKey="name"
                    stroke="#F5F5F5"
                    opacity={0.7}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      const entry = performanceData[payload.index];
                      // Only show name if it's a team member
                      if (entry?.isTeam) {
                        return (
                          <text x={x} y={y + 10} textAnchor="middle" fill="#F5F5F5" opacity={0.7} fontSize={12}>
                            {payload.value}
                          </text>
                        );
                      }
                      return null;
                    }}
                  />
                  <YAxis stroke="#F5F5F5" opacity={0.7} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(245,245,245,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#F5F5F5' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const entry = performanceData.find(p => p.name === label);
                        return (
                          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-3 rounded-lg">
                            <p className="text-[#F5F5F5] font-semibold">{label}</p>
                            {entry?.position && (
                              <p className="text-[#F5F5F5]/50 text-xs mb-2">{entry.position}</p>
                            )}
                            <p className="text-[#F5F5F5]/70">
                              {payload[0].name}: <span className="text-[#F5F5F5] font-medium">{payload[0].value.toFixed(1)}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey={selectedMetric} radius={[8, 8, 0, 0]}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isTeam ? COLORS.primary : COLORS.danger} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vision & Map Control */}
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#F5F5F5]/10">
              <h3 className="text-[#F5F5F5] text-2xl font-bold mb-1">Vision & Map Control</h3>
              <p className="text-[#F5F5F5]/50 text-sm">Warding and vision score comparison</p>
            </div>
            <div className="p-8">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.players.map(p => ({
                  name: p.name,
                  vision: p.avg_vision || 0,
                  wards: p.avg_wards_placed || 0,
                  destroyed: p.avg_wards_destroyed || 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#F5F5F5" opacity={0.7} />
                  <YAxis stroke="#F5F5F5" opacity={0.7} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="vision" fill="#5B8FB9" name="Vision Score" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="wards" fill="#3D7A5F" name="Wards Placed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="destroyed" fill="#C75B5B" name="Wards Destroyed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dynamic Scatter Plot */}
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#F5F5F5]/10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-[#F5F5F5] text-2xl font-bold mb-1">Metric Comparison</h3>
                  <p className="text-[#F5F5F5]/50 text-sm">Bi-dimensional performance analysis</p>
                </div>
                {/* Toggle All/Team */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAllPlayers(true)}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                      showAllPlayers
                        ? 'bg-[#3D7A5F] text-[#F5F5F5]'
                        : 'bg-[#F5F5F5]/5 text-[#F5F5F5]/70 hover:bg-[#F5F5F5]/10'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setShowAllPlayers(false)}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                      !showAllPlayers
                        ? 'bg-[#3D7A5F] text-[#F5F5F5]'
                        : 'bg-[#F5F5F5]/5 text-[#F5F5F5]/70 hover:bg-[#F5F5F5]/10'
                    }`}
                  >
                    Team
                  </button>
                </div>
              </div>

              {/* Metric Selectors */}
              <div className="grid grid-cols-2 gap-4">
                {/* X-Axis Selector */}
                <div className="space-y-2">
                  <label className="block text-[#F5F5F5]/70 text-xs font-medium">X Axis</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'gold', label: 'Gold/min' },
                      { key: 'damage', label: 'DMG/min' },
                      { key: 'cs', label: 'CS/min' },
                      { key: 'kp', label: 'KP%' },
                      { key: 'kda', label: 'KDA' }
                    ].map((metric) => (
                      <button
                        key={metric.key}
                        onClick={() => setScatterXAxis(metric.key as any)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                          scatterXAxis === metric.key
                            ? 'bg-[#5B8FB9] text-[#F5F5F5]'
                            : 'bg-[#F5F5F5]/5 text-[#F5F5F5]/70 hover:bg-[#F5F5F5]/10'
                        }`}
                      >
                        {metric.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Y-Axis Selector */}
                <div className="space-y-2">
                  <label className="block text-[#F5F5F5]/70 text-xs font-medium">Y Axis</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'damage', label: 'DMG/min' },
                      { key: 'gold', label: 'Gold/min' },
                      { key: 'cs', label: 'CS/min' },
                      { key: 'kp', label: 'KP%' },
                      { key: 'kda', label: 'KDA' }
                    ].map((metric) => (
                      <button
                        key={metric.key}
                        onClick={() => setScatterYAxis(metric.key as any)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                          scatterYAxis === metric.key
                            ? 'bg-[#C75B5B] text-[#F5F5F5]'
                            : 'bg-[#F5F5F5]/5 text-[#F5F5F5]/70 hover:bg-[#F5F5F5]/10'
                        }`}
                      >
                        {metric.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8">
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" opacity={0.1} />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={getScatterLabel(scatterXAxis).short}
                    stroke="#F5F5F5"
                    opacity={0.7}
                    label={{
                      value: getScatterLabel(scatterXAxis).long,
                      position: 'insideBottom',
                      offset: -5,
                      fill: '#F5F5F5',
                      opacity: 0.7
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={getScatterLabel(scatterYAxis).short}
                    stroke="#F5F5F5"
                    opacity={0.7}
                    label={{
                      value: getScatterLabel(scatterYAxis).long,
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#F5F5F5',
                      opacity: 0.7
                    }}
                  />
                  <ZAxis type="number" dataKey="z" range={[100, 400]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(245,245,245,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#F5F5F5' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-3 rounded-lg">
                            <p className="text-[#F5F5F5] font-semibold mb-1">{data.name}</p>
                            <p className="text-[#F5F5F5]/70 text-sm">{data.position}</p>
                            <div className="mt-2 space-y-1 text-xs">
                              <p className="text-[#F5F5F5]/70">{getScatterLabel(scatterXAxis).short}: <span className="text-[#F5F5F5] font-medium">{data.x.toFixed(1)}</span></p>
                              <p className="text-[#F5F5F5]/70">{getScatterLabel(scatterYAxis).short}: <span className="text-[#F5F5F5] font-medium">{data.y.toFixed(1)}</span></p>
                              <p className="text-[#F5F5F5]/70">KDA: <span className="text-[#F5F5F5] font-medium">{data.z.toFixed(1)}</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    data={scatterData}
                    fillOpacity={0.6}
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      const fill = payload.isTeam ? COLORS.primary : COLORS.danger;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={8}
                          fill={fill}
                          fillOpacity={0.7}
                          stroke={fill}
                          strokeWidth={2}
                        />
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">

          {/* Win/Loss Ratio */}
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#F5F5F5]/10">
              <h3 className="text-[#F5F5F5] text-2xl font-bold mb-1">Win/Loss Ratio</h3>
              <p className="text-[#F5F5F5]/50 text-sm">Overall team performance</p>
            </div>
            <div className="p-8">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={150}
                    paddingAngle={3}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {winLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(245,245,245,0.1)', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Player Radar Carousel */}
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#F5F5F5]/10 flex items-center justify-between">
              <div>
                <h3 className="text-[#F5F5F5] text-2xl font-bold mb-1">
                  {radarPlayers[currentRadarIndex]?.name}
                </h3>
                <p className="text-[#F5F5F5]/50 text-sm">vs Team Average</p>
              </div>

              {/* Carousel Navigation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={prevRadar}
                  className="p-3 bg-[#F5F5F5]/5 hover:bg-[#F5F5F5]/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-[#F5F5F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex gap-2">
                  {radarPlayers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentRadarIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentRadarIndex
                          ? 'bg-[#3D7A5F] w-8'
                          : 'bg-[#F5F5F5]/20 hover:bg-[#F5F5F5]/40'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextRadar}
                  className="p-3 bg-[#F5F5F5]/5 hover:bg-[#F5F5F5]/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-[#F5F5F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={createRadarData(radarPlayers[currentRadarIndex])}>
                  <PolarGrid stroke="#F5F5F5" opacity={0.2} />
                  <PolarAngleAxis dataKey="metric" stroke="#F5F5F5" />
                  <PolarRadiusAxis stroke="#F5F5F5" opacity={0.5} domain={[0, 100]} />
                  <Radar
                    name="Global Avg"
                    dataKey="average"
                    stroke="#888888"
                    fill="#888888"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name={radarPlayers[currentRadarIndex]?.name}
                    dataKey="player"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.5}
                  />
                  <Legend />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(245,245,245,0.1)', borderRadius: '8px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Objectives Impact */}
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#F5F5F5]/10">
              <h3 className="text-[#F5F5F5] text-2xl font-bold mb-1">Objectives Impact</h3>
              <p className="text-[#F5F5F5]/50 text-sm">Damage to objectives and buildings per minute</p>
            </div>
            <div className="p-8">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.players.map(p => ({
                  name: p.name,
                  objectives: p.per_min_damage_to_objectives || 0,
                  buildings: p.per_min_damage_to_buildings || 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#F5F5F5" opacity={0.7} />
                  <YAxis stroke="#F5F5F5" opacity={0.7} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="objectives" fill="#B4975A" name="Objectives DMG/min" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="buildings" fill="#8B5A9F" name="Buildings DMG/min" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
