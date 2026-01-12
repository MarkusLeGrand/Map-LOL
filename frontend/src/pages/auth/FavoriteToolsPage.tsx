import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ToolCard } from '../../components/ui/ToolCard';
import { ALL_TOOLS } from '../../config/tools';
import { useAuth } from '../../contexts/AuthContext';

export default function FavoriteToolsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, toggleFavoriteTool } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);

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
    }
  };

  // Filter to show only favorite tools
  const favoriteTools = ALL_TOOLS.filter(tool =>
    user?.favorite_tools?.includes(tool.name)
  ).sort((a, b) => {
    // "Available" comes before "Coming Soon"
    if (a.status === 'Available' && b.status === 'Coming Soon') return -1;
    if (a.status === 'Coming Soon' && b.status === 'Available') return 1;
    return 0;
  });

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
                Favorite Tools
              </h1>
              <p className="text-[#F5F5F5]/50 text-lg">
                Your personalized collection of most-used tools
              </p>
            </div>

            {/* Browse All Tools Button */}
            <button
              onClick={() => navigate('/tools')}
              className="px-6 py-3 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/5 transition-all"
            >
              Browse All Tools
            </button>
          </div>
        </div>
      </div>

      {/* Favorite Tools Grid */}
      <div className="flex-1 py-16">
        <div className="max-w-[1600px] mx-auto px-12">
          {favoriteTools.length > 0 ? (
            <div className="grid grid-cols-4 gap-6 auto-rows-fr">
              {favoriteTools.map((tool, index) => (
                <ToolCard
                  key={index}
                  name={tool.name}
                  description={tool.description}
                  status={tool.status}
                  color={tool.color}
                  onClick={() => tool.onClick && handleToolClick(tool.onClick)}
                  disabled={tool.status === 'Coming Soon'}
                  showLikeButton={isAuthenticated}
                  isLiked={true}
                  onLikeToggle={() => toggleFavoriteTool(tool.name)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24">
              <svg className="w-16 h-16 text-[#F5F5F5]/20 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-2">No Favorite Tools Yet</h2>
              <p className="text-[#F5F5F5]/50 text-center mb-8">
                Browse all tools and click the heart icon to add them to your favorites
              </p>
              <button
                onClick={() => navigate('/tools')}
                className="px-8 py-3 bg-[#3D7A5F] text-[#F5F5F5] hover:bg-[#3D7A5F]/90 transition-colors"
              >
                Browse All Tools
              </button>
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
