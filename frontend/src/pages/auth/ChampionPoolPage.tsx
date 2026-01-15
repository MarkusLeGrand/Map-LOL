import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ChampionPoolEditor, TeamPoolOverview } from '../../components/champion-pool';

export default function ChampionPoolPage() {
  const { user } = useAuth();
  const { teams } = useTeam();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');

  const myTeam = teams.length > 0 ? teams[0] : null;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header brandName="OpenRift" tagline="PRO TOOLS FOR EVERYONE" showToolsLink={true} />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#1A1A1A] to-[#0E0E0E] py-8 border-b border-[#F5F5F5]/10">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#F5F5F5] mb-2">Champion Pool</h1>
              <p className="text-[#F5F5F5]/50">
                Build your tier list by dragging champions into tiers
              </p>
            </div>
            <div className="flex gap-3">
              {/* View Mode Toggle */}
              <div className="flex border border-[#F5F5F5]/20 overflow-hidden rounded">
                <button
                  onClick={() => setViewMode('personal')}
                  className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                    viewMode === 'personal'
                      ? 'bg-[#3D7A5F] text-[#F5F5F5]'
                      : 'bg-transparent text-[#F5F5F5]/70 hover:text-[#F5F5F5]'
                  }`}
                >
                  My Pool
                </button>
                <button
                  onClick={() => setViewMode('team')}
                  disabled={!myTeam}
                  className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                    viewMode === 'team'
                      ? 'bg-[#3D7A5F] text-[#F5F5F5]'
                      : 'bg-transparent text-[#F5F5F5]/70 hover:text-[#F5F5F5]'
                  } ${!myTeam ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Team Pools
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-8">
        <div className="max-w-[1400px] mx-auto px-8">
          {viewMode === 'personal' ? (
            <ChampionPoolEditor />
          ) : myTeam ? (
            <TeamPoolOverview teamId={myTeam.id} />
          ) : (
            <div className="text-center text-[#F5F5F5]/50 py-16">
              <p className="mb-4">Join a team to view team champion pools</p>
              <button
                onClick={() => navigate('/teams')}
                className="px-6 py-2 bg-[#3D7A5F] text-white rounded hover:bg-[#3D7A5F]/80 transition-colors"
              >
                Browse Teams
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
