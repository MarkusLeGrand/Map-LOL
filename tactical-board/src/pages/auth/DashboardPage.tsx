import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ToolCard } from '../../components/ui/ToolCard';
import { ALL_TOOLS } from '../../config/tools';

export default function DashboardPage() {
  const { user, toggleFavoriteTool } = useAuth();
  const navigate = useNavigate();

  // Filter tools to only show favorited ones
  const favoriteTools = ALL_TOOLS.filter(tool =>
    user?.favorite_tools?.includes(tool.name)
  );

  const handleToolClick = (toolId: string) => {
    if (toolId === 'tacticalmap') {
      navigate('/tacticalmap');
    } else if (toolId === 'data-analytics') {
      navigate('/data-analytics');
    } else if (toolId === 'teams') {
      navigate('/teams');
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header
        brandName="OpenRift"
        tagline="PRO TOOLS FOR EVERYONE"
        showToolsLink={true}
      />

      {/* Dashboard Header */}
      <div className="border-b border-[#F5F5F5]/10 py-16">
        <div className="max-w-[1600px] mx-auto px-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[#F5F5F5] text-5xl font-semibold mb-4 tracking-tight">
                Your Favorite Tools
              </h1>
              <p className="text-[#F5F5F5]/50 text-lg">
                Quick access to the tools you use most
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Tools */}
      <div className="flex-1 py-16">
        <div className="max-w-[1600px] mx-auto px-12">
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
                showLikeButton={true}
                isLiked={true}
                onLikeToggle={() => toggleFavoriteTool(tool.name)}
              />
            ))}
          </div>

          {favoriteTools.length === 0 && (
            <div className="text-center py-16 border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02]">
              <p className="text-[#F5F5F5]/50 text-lg mb-4">No favorite tools yet</p>
              <p className="text-[#F5F5F5]/40 mb-6">Browse our tools and mark your favorites for quick access</p>
              <button
                onClick={() => navigate('/tools')}
                className="px-6 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors"
              >
                Browse Tools
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer
        copyright="© 2025 OpenRift — Professional Tools Platform"
        links={[
          { label: 'About', href: '#' },
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
        ]}
      />
    </div>
  );
}
