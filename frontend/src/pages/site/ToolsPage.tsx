import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolsGraphVisualizer from '../../components/graph/ToolsGraphVisualizer';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ToolCard } from '../../components/ui/ToolCard';
import { FilterButton } from '../../components/ui/FilterButton';
import { COLORS } from '../../constants/theme';
import { getToolsByCategory } from '../../config/tools';
import { useAuth } from '../../contexts/AuthContext';

export default function ToolsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, toggleFavoriteTool } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'graph'>('grid');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleToolClick = (toolId: string) => {
    if (toolId === 'tacticalmap') {
      navigate('/tacticalmap');
    } else if (toolId === 'data-analytics') {
      navigate('/data-analytics');
    } else if (toolId === 'teams') {
      navigate('/teams');
    } else if (toolId === 'scrim-scheduler') {
      navigate('/scrim-scheduler');
    } else if (toolId === 'champion-pool') {
      navigate('/champion-pool');
    }
  };

  const filteredTools = getToolsByCategory(selectedCategory)
    .sort((a, b) => {
      // "Available" comes before "Coming Soon"
      if (a.status === 'Available' && b.status === 'Coming Soon') return -1;
      if (a.status === 'Coming Soon' && b.status === 'Available') return 1;
      return 0;
    });

  const getCategoryCount = (category: string) => {
    return getToolsByCategory(category).length;
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
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
            <div className="grid grid-cols-4 gap-6 auto-rows-fr">
              {filteredTools.map((tool, index) => (
                <ToolCard
                  key={index}
                  name={tool.name}
                  description={tool.description}
                  status={tool.status}
                  color={tool.color}
                  onClick={() => tool.onClick && handleToolClick(tool.onClick)}
                  disabled={tool.status === 'Coming Soon'}
                  showLikeButton={isAuthenticated}
                  isLiked={user?.favorite_tools?.includes(tool.name) || false}
                  onLikeToggle={() => toggleFavoriteTool(tool.name)}
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
