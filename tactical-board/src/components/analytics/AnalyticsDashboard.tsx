import { useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { COLORS } from '../../constants/theme';

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

interface Props {
  data: AnalyticsData;
}

const CHART_COLORS = ['#3D7A5F', '#5B8FB9', '#B4975A', '#8B5A9F', '#C75B5B', '#6B9B7A', '#7A8FB5'];

export function AnalyticsDashboard({ data }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<'kda' | 'winrate' | 'gold' | 'damage' | 'cs'>('kda');
  const [currentRadarIndex, setCurrentRadarIndex] = useState(0);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [currentChampionPlayerIndex, setCurrentChampionPlayerIndex] = useState(0);
  const [scatterXAxis, setScatterXAxis] = useState<'gold' | 'damage' | 'cs' | 'kp'>('gold');
  const [scatterYAxis, setScatterYAxis] = useState<'damage' | 'gold' | 'cs' | 'kp'>('damage');

  // FIXED: Total games is the MAX not the SUM
  const actualTotalGames = Math.max(...data.players.map(p => p.games_played));

  // Performance metrics data
  const performanceData = data.players.map(p => ({
    name: p.name,
    kda: p.kda,
    winrate: p.winrate,
    gold: p.per_min_gold || 0,
    damage: p.per_min_damage || 0,
    cs: p.per_min_cs || 0,
    killParticipation: p.avg_kill_participation || 0
  }));

  // Scatter plot data - Dynamic mapping
  const getScatterValue = (player: PlayerStats, metric: 'gold' | 'damage' | 'cs' | 'kp') => {
    switch (metric) {
      case 'gold':
        return player.per_min_gold || 0;
      case 'damage':
        return player.per_min_damage || 0;
      case 'cs':
        return player.per_min_cs || 0;
      case 'kp':
        return player.avg_kill_participation || 0;
    }
  };

  const getScatterLabel = (metric: 'gold' | 'damage' | 'cs' | 'kp') => {
    switch (metric) {
      case 'gold':
        return { short: 'GPM', long: 'Gold par minute' };
      case 'damage':
        return { short: 'DPM', long: 'Dégâts par minute' };
      case 'cs':
        return { short: 'CS/min', long: 'CS par minute' };
      case 'kp':
        return { short: 'KP%', long: 'Kill Participation %' };
    }
  };

  const scatterData = data.players.map(p => ({
    name: p.name,
    position: p.position,
    x: getScatterValue(p, scatterXAxis),
    y: getScatterValue(p, scatterYAxis),
    z: p.kda || 1
  }));

  // Win/Loss distribution
  const totalWins = data.players.reduce((acc, p) => acc + p.wins, 0);
  const totalLosses = data.players.reduce((acc, p) => acc + p.losses, 0);

  const winLossData = [
    { name: 'Wins', value: totalWins, color: '#3D7A5F' },
    { name: 'Losses', value: totalLosses, color: '#C75B5B' }
  ];

  // Individual radar charts with team average - FIXED: Same scale for all players
  const radarPlayers = [...data.players];

  // Calculate global min/max for consistent scaling
  const allKDA = data.players.map(p => p.kda);
  const allKP = data.players.map(p => p.avg_kill_participation || 0);
  const allGold = data.players.map(p => p.per_min_gold || 0);
  const allDMG = data.players.map(p => p.per_min_damage || 0);
  const allCS = data.players.map(p => p.per_min_cs || 0);

  const maxKDA = Math.max(...allKDA);
  const maxGold = Math.max(...allGold);
  const maxDMG = Math.max(...allDMG);
  const maxCS = Math.max(...allCS);

  const createRadarData = (player: PlayerStats) => {
    // Calculate team averages
    const teamAvgKDA = data.players.reduce((acc, p) => acc + p.kda, 0) / data.players.length;
    const teamAvgKP = data.players.reduce((acc, p) => acc + (p.avg_kill_participation || 0), 0) / data.players.length;
    const teamAvgGold = data.players.reduce((acc, p) => acc + (p.per_min_gold || 0), 0) / data.players.length;
    const teamAvgDMG = data.players.reduce((acc, p) => acc + (p.per_min_damage || 0), 0) / data.players.length;
    const teamAvgCS = data.players.reduce((acc, p) => acc + (p.per_min_cs || 0), 0) / data.players.length;

    // Normalize to 0-100 scale using global max values
    return [
      {
        metric: 'KDA',
        player: (player.kda / maxKDA) * 100,
        team: (teamAvgKDA / maxKDA) * 100
      },
      {
        metric: 'KP%',
        player: player.avg_kill_participation || 0,
        team: teamAvgKP
      },
      {
        metric: 'Gold/min',
        player: ((player.per_min_gold || 0) / maxGold) * 100,
        team: (teamAvgGold / maxGold) * 100
      },
      {
        metric: 'DMG/min',
        player: ((player.per_min_damage || 0) / maxDMG) * 100,
        team: (teamAvgDMG / maxDMG) * 100
      },
      {
        metric: 'CS/min',
        player: ((player.per_min_cs || 0) / maxCS) * 100,
        team: (teamAvgCS / maxCS) * 100
      }
    ];
  };

  // Champion pool data
  const allChampions = data.players.flatMap(p =>
    (p.top_champions || []).map(c => ({
      ...c,
      player: p.name,
      position: p.position
    }))
  );

  // Most played champions across the team
  const championFrequency = allChampions.reduce((acc, champ) => {
    if (!acc[champ.champion]) {
      acc[champ.champion] = { champion: champ.champion, games: 0, wins: 0, players: new Set() };
    }
    acc[champ.champion].games += champ.games;
    acc[champ.champion].wins += champ.wins;
    acc[champ.champion].players.add(champ.player);
    return acc;
  }, {} as Record<string, { champion: string; games: number; wins: number; players: Set<string> }>);

  const topTeamChampions = Object.values(championFrequency)
    .map(c => ({
      champion: c.champion,
      games: c.games,
      wins: c.wins,
      winrate: (c.wins / c.games) * 100,
      playerCount: c.players.size
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 10);

  const nextRadar = () => {
    setCurrentRadarIndex((prev) => (prev + 1) % radarPlayers.length);
  };

  const prevRadar = () => {
    setCurrentRadarIndex((prev) => (prev - 1 + radarPlayers.length) % radarPlayers.length);
  };

  // Insights carousel data
  const insights = [
    {
      title: "MVP du Split",
      subtitle: "Meilleur joueur global",
      value: (() => {
        const mvp = [...data.players].sort((a, b) => {
          const scoreA = (a.kda * 0.4) + (a.winrate * 0.3) + ((a.avg_kill_participation || 0) * 0.3);
          const scoreB = (b.kda * 0.4) + (b.winrate * 0.3) + ((b.avg_kill_participation || 0) * 0.3);
          return scoreB - scoreA;
        })[0];
        return `${mvp.name} (${mvp.position})`;
      })(),
      description: "Basé sur KDA, Winrate et Kill Participation",
      color: "#B4975A"
    },
    {
      title: "Carry Principal",
      subtitle: "Plus de dégâts",
      value: (() => {
        const carry = [...data.players].sort((a, b) => (b.per_min_damage || 0) - (a.per_min_damage || 0))[0];
        return `${carry.name} - ${(carry.per_min_damage || 0).toFixed(0)} DPM`;
      })(),
      description: "Champion des dégâts par minute",
      color: "#C75B5B"
    },
    {
      title: "Farm King",
      subtitle: "Meilleur CS/min",
      value: (() => {
        const farmer = [...data.players].sort((a, b) => (b.per_min_cs || 0) - (a.per_min_cs || 0))[0];
        return `${farmer.name} - ${(farmer.per_min_cs || 0).toFixed(1)} CS/min`;
      })(),
      description: "Maîtrise du farming",
      color: "#5B8FB9"
    },
    {
      title: "Clutch Player",
      subtitle: "Plus haute KP",
      value: (() => {
        const clutch = [...data.players].sort((a, b) => (b.avg_kill_participation || 0) - (a.avg_kill_participation || 0))[0];
        return `${clutch.name} - ${(clutch.avg_kill_participation || 0).toFixed(1)}%`;
      })(),
      description: "Toujours dans l'action",
      color: "#3D7A5F"
    },
    {
      title: "Champion Pool",
      subtitle: "Champion le plus joué",
      value: topTeamChampions[0] ? `${topTeamChampions[0].champion} (${topTeamChampions[0].games} games)` : "N/A",
      description: topTeamChampions[0] ? `${topTeamChampions[0].winrate.toFixed(1)}% winrate` : "",
      color: "#8B5A9F"
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
            {data.team_stats.avg_kda.toFixed(2)}
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
            <p className="text-[#F5F5F5]/50 text-sm">Statistiques clés du split</p>
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

        <div className="p-12 text-center">
          <p className="text-[#F5F5F5]/50 text-sm mb-2">{insights[currentInsightIndex].subtitle}</p>
          <h4 className="text-[#F5F5F5] text-3xl font-bold mb-2">{insights[currentInsightIndex].title}</h4>
          <p className="text-5xl font-bold mb-4" style={{ color: insights[currentInsightIndex].color }}>
            {insights[currentInsightIndex].value}
          </p>
          <p className="text-[#F5F5F5]/70 text-sm">{insights[currentInsightIndex].description}</p>
        </div>
      </div>

      {/* 2 COLUMN LAYOUT */}
      <div className="grid grid-cols-2 gap-8">

        {/* LEFT COLUMN */}
        <div className="space-y-8">

          {/* Performance Overview */}
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#F5F5F5]/10">
              <div className="mb-4">
                <h3 className="text-[#F5F5F5] text-2xl font-bold mb-1">Performance Overview</h3>
                <p className="text-[#F5F5F5]/50 text-sm mb-4">Compare key metrics across players</p>
              </div>

              {/* Metric Selector - Integrated */}
              <div className="space-y-3">
                <label className="block text-[#F5F5F5]/70 text-xs font-medium">Metric</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'kda', label: 'KDA' },
                    { key: 'winrate', label: 'Winrate %' },
                    { key: 'gold', label: 'Gold/min' },
                    { key: 'damage', label: 'DMG/min' },
                    { key: 'cs', label: 'CS/min' }
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
                  <XAxis dataKey="name" stroke="#F5F5F5" opacity={0.7} angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#F5F5F5" opacity={0.7} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(245,245,245,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#F5F5F5' }}
                  />
                  <Legend />
                  <Bar dataKey={selectedMetric} fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dynamic Scatter Plot */}
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#F5F5F5]/10">
              <div className="mb-4">
                <h3 className="text-[#F5F5F5] text-2xl font-bold mb-1">Comparaison Métrique</h3>
                <p className="text-[#F5F5F5]/50 text-sm">Analyse bi-dimensionnelle des performances</p>
              </div>

              {/* Metric Selectors */}
              <div className="grid grid-cols-2 gap-4">
                {/* X-Axis Selector */}
                <div className="space-y-2">
                  <label className="block text-[#F5F5F5]/70 text-xs font-medium">Axe X</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'gold', label: 'Gold/min' },
                      { key: 'damage', label: 'DMG/min' },
                      { key: 'cs', label: 'CS/min' },
                      { key: 'kp', label: 'KP%' }
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
                  <label className="block text-[#F5F5F5]/70 text-xs font-medium">Axe Y</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'damage', label: 'DMG/min' },
                      { key: 'gold', label: 'Gold/min' },
                      { key: 'cs', label: 'CS/min' },
                      { key: 'kp', label: 'KP%' }
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
                              <p className="text-[#F5F5F5]/70">KDA: <span className="text-[#F5F5F5] font-medium">{data.z.toFixed(2)}</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    data={scatterData}
                    fill={COLORS.primary}
                    fillOpacity={0.6}
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
                  <PolarRadiusAxis stroke="#F5F5F5" opacity={0.5} />
                  <Radar
                    name="Team Avg"
                    dataKey="team"
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
              const champions = currentPlayer?.champion_stats || currentPlayer?.top_champions || [];
              const displayChampions = champions.slice(0, 6);

              return (
                <div className="grid grid-cols-6 gap-4">
                  {displayChampions.map((champ: ChampionStats, idx: number) => (
                    <div
                      key={idx}
                      className="bg-[#0E0E0E] border border-[#F5F5F5]/10 rounded-lg p-4 hover:border-[#3D7A5F]/50 transition-all"
                    >
                      <div className="text-[#F5F5F5] font-semibold mb-3 truncate text-center">{champ.champion}</div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#F5F5F5]/50">Games:</span>
                          <span className="text-[#F5F5F5] font-medium">{champ.games}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#F5F5F5]/50">WR:</span>
                          <span className="font-medium" style={{ color: champ.winrate >= 50 ? COLORS.primary : COLORS.danger }}>
                            {champ.winrate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#F5F5F5]/50">KDA:</span>
                          <span className="text-[#F5F5F5] font-medium">{champ.kda.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Fill remaining slots if less than 6 champions */}
                  {Array.from({ length: Math.max(0, 6 - displayChampions.length) }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="bg-[#0E0E0E]/30 border border-[#F5F5F5]/5 rounded-lg p-4 flex items-center justify-center">
                      <span className="text-[#F5F5F5]/20 text-xs">No data</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
