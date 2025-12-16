import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolsGraphVisualizer from '../../components/graph/ToolsGraphVisualizer';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ToolCard } from '../../components/ui/ToolCard';
import { FilterButton } from '../../components/ui/FilterButton';
import { COLORS } from '../../constants/theme';

// All tools with colors (brightened)
const allTools = [
  {
    name: 'Tactical Map',
    description: 'Interactive vision control and strategy planning',
    status: 'Available' as const,
    color: COLORS.primary,
    onClick: 'map',
    category: 'tactics'
  },
  {
    name: 'Looser Tracker',
    description: 'Daily battles to crown the ultimate King of Losers.',
    status: 'Avalable' as const,
    color: COLORS.danger,
    category: 'data'
  },
  {
    name: 'Drafter',
    description: "A drafting tool that helps teams build optimal compositions and plan counter-picks in real time.",
    status: 'Coming Soon' as const,
    color: COLORS.purple,
    category: 'tactics'
  },
  {
    name: 'Data Analytics',
    description: 'Performance metrics and trend analysis',
    status: 'Coming Soon' as const,
    color: COLORS.blue,
    category: 'data'
  },
  {
    name: 'Team Manager',
    description: 'Roster management and scheduling tools',
    status: 'Coming Soon' as const,
    color: COLORS.gold,
    category: 'organization'
  },
  {
    name: 'Scrim Organizer',
    description: 'Schedule and manage practice matches',
    status: 'Coming Soon' as const,
    color: COLORS.primary,
    category: 'organization'
  },
  {
    name: 'VOD Review',
    description: 'Collaborative replay analysis and annotations',
    status: 'Coming Soon' as const,
    color: COLORS.purple,
    category: 'tactics'
  },
  {
    name: 'Meta Insights',
    description: 'Patch notes breakdown and tier lists',
    status: 'Coming Soon' as const,
    color: COLORS.blue,
    category: 'data'
  },
  {
    name: 'Champion Pool Builder',
    description: 'Build and optimize your champion pool',
    status: 'Coming Soon' as const,
    color: COLORS.purple,
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
      <Header
        brandName="OpenRift"
        tagline="PRO TOOLS FOR EVERYONE"
        showToolsLink={true}
      />

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
                <FilterButton
                  label="All"
                  count={getCategoryCount('all')}
                  isActive={selectedCategory === 'all'}
                  onChange={() => setSelectedCategory('all')}
                />
                <FilterButton
                  label="Tactics"
                  count={getCategoryCount('tactics')}
                  isActive={selectedCategory === 'tactics'}
                  onChange={() => setSelectedCategory('tactics')}
                  color={COLORS.primary}
                />
                <FilterButton
                  label="Data"
                  count={getCategoryCount('data')}
                  isActive={selectedCategory === 'data'}
                  onChange={() => setSelectedCategory('data')}
                  color={COLORS.blue}
                />
                <FilterButton
                  label="Organization"
                  count={getCategoryCount('organization')}
                  isActive={selectedCategory === 'organization'}
                  onChange={() => setSelectedCategory('organization')}
                  color={COLORS.gold}
                />
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
                <ToolCard
                  key={index}
                  name={tool.name}
                  description={tool.description}
                  status={tool.status}
                  color={tool.color}
                  onClick={() => tool.onClick && handleToolClick(tool.onClick)}
                  disabled={tool.status === 'Coming Soon'}
                />
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
