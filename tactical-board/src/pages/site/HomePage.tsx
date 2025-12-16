import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ToolCard } from '../../components/ui/ToolCard';
import { COLORS } from '../../constants/theme';

// Featured tools for showcase (only a few)
const featuredTools = [
  {
    name: 'Tactical Map',
    description: 'Interactive vision control and strategy planning',
    status: 'Available' as const,
    color: COLORS.primary,
    onClick: 'tacticalmap',
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
];

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleToolClick = (toolId: string) => {
    if (toolId === 'tacticalmap') {
      navigate('/tacticalmap');
    }
  };

  return (
    <div className="w-screen min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header
        brandName="OpenRift"
        tagline="PRO TOOLS FOR EVERYONE"
        showToolsLink={true}
      />

      {/* Hero Section */}
      <div className="border-b border-[#F5F5F5]/10 py-20">
        <div className={`max-w-[1600px] mx-auto px-12 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-3xl">
            <h2 className="text-[#F5F5F5] text-6xl font-semibold mb-6 tracking-tight leading-tight">
              Professional Tools
              <br />
              <span className="text-[#F5F5F5]/50">For Competitive Teams</span>
            </h2>
            <p className="text-[#F5F5F5]/60 text-lg font-normal leading-relaxed mb-8">
              Everything you need to compete at the highest level. Strategic analysis, team management,
              and performance tracking — all in one place.
            </p>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#3D7A5F] rounded-full"></div>
                <span className="text-[#F5F5F5]/50">8+ Professional Tools</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#7A5F8E] rounded-full"></div>
                <span className="text-[#F5F5F5]/50">Team Collaboration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#5F7A8E] rounded-full"></div>
                <span className="text-[#F5F5F5]/50">Data-Driven Insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="flex-1 py-16">
        <div className="max-w-[1600px] mx-auto px-12">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h3 className="text-[#F5F5F5] text-2xl font-semibold mb-2">
                Featured Tools
              </h3>
              <p className="text-[#F5F5F5]/50 text-sm">
                Professional-grade utilities for competitive advantage
              </p>
            </div>
            <button
              onClick={() => navigate('/tools')}
              className="px-6 py-2.5 border border-[#F5F5F5]/20 text-[#F5F5F5]/80 text-sm font-medium hover:border-[#F5F5F5]/40 hover:text-[#F5F5F5] transition-colors"
            >
              View All Tools →
            </button>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {featuredTools.map((tool, index) => (
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
        </div>
      </div>

      {/* Team Features Section */}
      <div className="border-t border-[#F5F5F5]/10 py-16 bg-[#F5F5F5]/[0.02]">
        <div className="max-w-[1600px] mx-auto px-12">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h3 className="text-[#F5F5F5] text-3xl font-semibold mb-4">
                Build Your Team
              </h3>
              <p className="text-[#F5F5F5]/60 text-base leading-relaxed mb-6">
                Create and manage your competitive roster. Share tools, track progress,
                and coordinate practice sessions.
              </p>
              <ul className="space-y-3 text-[#F5F5F5]/50 text-sm">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#3D7A5F] rounded-full"></div>
                  Team dashboard with shared resources
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#3D7A5F] rounded-full"></div>
                  Collaborative analysis and planning
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#3D7A5F] rounded-full"></div>
                  Centralized performance metrics
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-[#F5F5F5] text-3xl font-semibold mb-4">
                Personal Dashboard
              </h3>
              <p className="text-[#F5F5F5]/60 text-base leading-relaxed mb-6">
                Access all your tools in one place. Track your individual performance
                and team statistics.
              </p>
              <ul className="space-y-3 text-[#F5F5F5]/50 text-sm">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#7A5F8E] rounded-full"></div>
                  Individual performance tracking
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#7A5F8E] rounded-full"></div>
                  Customizable tool layouts
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#7A5F8E] rounded-full"></div>
                  Quick access to team resources
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer
        copyright="© 2025 LeagueHub — Professional Tools Platform"
        links={[
          { label: 'About', href: '/about' },
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
        ]}
      />
    </div>
  );
}
