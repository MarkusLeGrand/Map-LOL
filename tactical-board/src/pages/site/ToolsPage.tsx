import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolsGraphVisualizer from '../../components/graph/ToolsGraphVisualizer';

// All tools with colors (brightened)
const allTools = [
  {
    name: 'Tactical Map',
    description: 'Interactive vision control and strategy planning',
    status: 'Available',
    color: '#3D7A5F', // Brighter Green
    onClick: 'map',
    category: 'tactics'
  },
  {
    name: 'Looser Tracker',
    description: 'Daily battles to crown the ultimate King of Losers.',
    status: 'Avalable',
    color: '#A85C5C', // Brighter Red
    category: 'data'
  },
  {
    name: 'Drafter',
    description: "A drafting tool that helps teams build optimal compositions and plan counter-picks in real time.",
    status: 'Coming Soon',
    color: '#7A5F8E', // Brighter Purple
    category: 'tactics'
  },
  {
    name: 'Data Analytics',
    description: 'Performance metrics and trend analysis',
    status: 'Coming Soon',
    color: '#5F7A8E', // Brighter Blue
    category: 'data'
  },
  {
    name: 'Team Manager',
    description: 'Roster management and scheduling tools',
    status: 'Coming Soon',
    color: '#B8945E', // Brighter Gold
    category: 'organization'
  },
  {
    name: 'Scrim Organizer',
    description: 'Schedule and manage practice matches',
    status: 'Coming Soon',
    color: '#3D7A5F', // Brighter Green
    category: 'organization'
  },
  {
    name: 'VOD Review',
    description: 'Collaborative replay analysis and annotations',
    status: 'Coming Soon',
    color: '#7A5F8E', // Brighter Purple
    category: 'tactics'
  },
  {
    name: 'Meta Insights',
    description: 'Patch notes breakdown and tier lists',
    status: 'Coming Soon',
    color: '#5F7A8E', // Brighter Blue
    category: 'data'
  },
  {
    name: 'Champion Pool Builder',
    description: 'Build and optimize your champion pool',
    status: 'Coming Soon',
    color: '#7A5F8E', // Purple
    category: 'tactics'
  }
];

export default function ToolsPage() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'graph'>('grid');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleToolClick = (toolId: string) => {
    if (toolId === 'map') {
      navigate('/map');
    }
  };

  const filteredTools = selectedCategory === 'all'
    ? allTools
    : allTools.filter(tool => tool.category === selectedCategory);

  const getCategoryCount = (category: string) => {
    if (category === 'all') return allTools.length;
    return allTools.filter(tool => tool.category === category).length;
  };

  return (
    <div className="w-screen min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="border-b border-[#F5F5F5]/10 sticky top-0 bg-[#0E0E0E] z-50">
        <div className="max-w-[1600px] mx-auto px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-[#F5F5F5] text-xl font-semibold tracking-wide hover:text-[#F5F5F5]/80 transition-colors"
              style={{ letterSpacing: '0.02em' }}
            >
              LEAGUEHUB
            </button>
            <span className="text-[#F5F5F5]/40 text-xs font-medium tracking-wider">
              PRO TOOLS FOR EVERYONE
            </span>
            <button
              onClick={() => navigate('/tools')}
              className="ml-6 text-sm font-medium text-[#F5F5F5]/50 hover:text-[#F5F5F5] transition-colors"
            >
              Tools
            </button>
          </div>
          <nav className="flex gap-4">
            <button className="px-5 py-2 text-[#F5F5F5]/60 text-sm font-medium hover:text-[#F5F5F5] transition-colors">
              Login
            </button>
            <button className="px-5 py-2 bg-[#3D7A5F] text-[#F5F5F5] text-sm font-medium hover:bg-[#4A9170] transition-colors">
              Sign Up
            </button>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <div className="border-b border-[#F5F5F5]/10 py-16">
        <div className={`max-w-[1600px] mx-auto px-12 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[#F5F5F5] text-5xl font-semibold mb-4 tracking-tight">
                All Tools
              </h1>
              <p className="text-[#F5F5F5]/50 text-lg">
                Professional-grade utilities for competitive advantage
              </p>
            </div>

            {/* View Toggle and Filter Buttons */}
            <div className="flex gap-6 items-center">
              {/* View Toggle */}
              <div className="flex gap-2 border border-[#F5F5F5]/10 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-[#F5F5F5] text-[#0E0E0E]'
                      : 'bg-transparent text-[#F5F5F5]/60 hover:text-[#F5F5F5]'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    viewMode === 'graph'
                      ? 'bg-[#F5F5F5] text-[#0E0E0E]'
                      : 'bg-transparent text-[#F5F5F5]/60 hover:text-[#F5F5F5]'
                  }`}
                >
                  Graph
                </button>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-6 py-3 text-sm font-medium transition-all border ${
                    selectedCategory === 'all'
                      ? 'bg-[#F5F5F5] text-[#0E0E0E] border-[#F5F5F5]'
                      : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#F5F5F5]/30'
                  }`}
                >
                  All ({getCategoryCount('all')})
                </button>
                <button
                  onClick={() => setSelectedCategory('tactics')}
                  className={`px-6 py-3 text-sm font-medium transition-all border ${
                    selectedCategory === 'tactics'
                      ? 'text-[#0E0E0E] border-[#3D7A5F]'
                      : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#3D7A5F]/50'
                  }`}
                  style={selectedCategory === 'tactics' ? { backgroundColor: '#3D7A5F' } : {}}
                >
                  Tactics ({getCategoryCount('tactics')})
                </button>
                <button
                  onClick={() => setSelectedCategory('data')}
                  className={`px-6 py-3 text-sm font-medium transition-all border ${
                    selectedCategory === 'data'
                      ? 'text-[#0E0E0E] border-[#5F7A8E]'
                      : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#5F7A8E]/50'
                  }`}
                  style={selectedCategory === 'data' ? { backgroundColor: '#5F7A8E' } : {}}
                >
                  Data ({getCategoryCount('data')})
                </button>
                <button
                  onClick={() => setSelectedCategory('organization')}
                  className={`px-6 py-3 text-sm font-medium transition-all border ${
                    selectedCategory === 'organization'
                      ? 'text-[#0E0E0E] border-[#B8945E]'
                      : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#B8945E]/50'
                  }`}
                  style={selectedCategory === 'organization' ? { backgroundColor: '#B8945E' } : {}}
                >
                  Organization ({getCategoryCount('organization')})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tools View (Grid or Graph) */}
      <div className="flex-1 py-16">
        <div className="max-w-[1600px] mx-auto px-12">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-4 gap-6">
              {filteredTools.map((tool, index) => (
                <button
                  key={index}
                  onClick={() => tool.onClick && handleToolClick(tool.onClick)}
                  disabled={tool.status === 'Coming Soon'}
                  className={`text-left p-6 border border-[#F5F5F5]/10 hover:border-[#F5F5F5]/20 transition-all group ${
                    tool.status === 'Coming Soon' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${tool.color}15 0%, transparent 100%)`
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tool.color }}
                    ></div>
                    <span className="text-[#F5F5F5]/30 text-xs font-medium tracking-wider">
                      {tool.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-[#F5F5F5] text-base font-medium mb-2 group-hover:text-[#F5F5F5] transition-colors">
                    {tool.name}
                  </h4>
                  <p className="text-[#F5F5F5]/50 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="w-full h-[800px]">
              <ToolsGraphVisualizer
                tools={filteredTools}
                onToolClick={handleToolClick}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#F5F5F5]/10 py-8">
        <div className="max-w-[1600px] mx-auto px-12 flex items-center justify-between">
          <p className="text-[#F5F5F5]/30 text-xs tracking-wide">
            © 2025 LeagueHub — Professional Tools Platform
          </p>
          <div className="flex gap-6 text-xs text-[#F5F5F5]/40">
            <a href="#" className="hover:text-[#F5F5F5]/60 transition-colors">About</a>
            <a href="#" className="hover:text-[#F5F5F5]/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#F5F5F5]/60 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
