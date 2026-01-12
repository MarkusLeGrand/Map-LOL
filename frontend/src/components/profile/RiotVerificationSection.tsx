import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import {
  verifyRiotAccount,
  syncRiotData,
  getSummonerData,
  getDataDragonUrls,
  type SummonerData,
  type RiotAccount
} from '../../services/riotApi';

interface RiotVerificationSectionProps {
  riotGameName: string | null;
  riotTagLine: string | null;
  onUpdate: () => void;
}

const RANK_COLORS: Record<string, string> = {
  IRON: '#6B5B54',
  BRONZE: '#8D5524',
  SILVER: '#8A9BA8',
  GOLD: '#F0AD4E',
  PLATINUM: '#5CB85C',
  EMERALD: '#00A99D',
  DIAMOND: '#5BC0DE',
  MASTER: '#9B59B6',
  GRANDMASTER: '#E74C3C',
  CHALLENGER: '#F39C12',
};

export function RiotVerificationSection({ riotGameName, riotTagLine, onUpdate }: RiotVerificationSectionProps) {
  const toast = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [summoner, setSummoner] = useState<SummonerData | null>(null);
  const [riotAccount, setRiotAccount] = useState<RiotAccount | null>(null);

  const datadragon = getDataDragonUrls();

  useEffect(() => {
    loadSummonerData();
  }, [riotGameName, riotTagLine]);

  const loadSummonerData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await getSummonerData(token);
      setSummoner(data.summoner);
      setRiotAccount(data.riot_account);
    } catch (error) {
      console.error('Failed to load summoner data:', error);
    }
  };

  const handleVerify = async () => {
    if (!riotGameName || !riotTagLine) {
      toast?.error('Please set your Riot ID in your profile first');
      return;
    }

    setIsVerifying(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast?.error('Not authenticated');
        return;
      }

      await verifyRiotAccount(token, riotGameName, riotTagLine);
      toast?.success('Riot account verified successfully!');
      await loadSummonerData();
      onUpdate();
    } catch (error) {
      console.error('Failed to verify Riot account:', error);
      toast?.error(error instanceof Error ? error.message : 'Failed to verify account');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast?.error('Not authenticated');
        return;
      }

      await syncRiotData(token);
      toast?.success('Summoner data synced successfully!');
      await loadSummonerData();
    } catch (error) {
      console.error('Failed to sync data:', error);
      toast?.error(error instanceof Error ? error.message : 'Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };

  const getRankDisplay = (tier: string | null, rank: string | null, lp: string | null) => {
    if (!tier || !rank) return 'Unranked';
    return `${tier} ${rank} (${lp} LP)`;
  };

  const getWinRate = (wins: string | null, losses: string | null) => {
    if (!wins || !losses) return null;
    const w = parseInt(wins);
    const l = parseInt(losses);
    const total = w + l;
    if (total === 0) return null;
    return ((w / total) * 100).toFixed(1);
  };

  const needsUpdate = () => {
    if (!summoner?.last_synced) return false;
    const lastSync = new Date(summoner.last_synced);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    return hoursSinceSync >= 48; // 48 hours = 2 days
  };

  const getTimeSinceUpdate = () => {
    if (!summoner?.last_synced) return '';
    const lastSync = new Date(summoner.last_synced);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSync < 1) return 'Updated recently';
    if (hoursSinceSync < 24) return `Updated ${Math.floor(hoursSinceSync)}h ago`;
    const days = Math.floor(hoursSinceSync / 24);
    return `Updated ${days}d ago`;
  };

  if (!riotGameName || !riotTagLine) {
    return (
      <div style={{
        padding: '24px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ textAlign: 'center', color: 'rgba(245, 245, 245, 0.6)' }}>
          <p>Please set your Riot ID in your profile to verify your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Header with Riot ID and verification status */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#F5F5F5',
            marginBottom: '8px'
          }}>
            {riotGameName}#{riotTagLine}
          </h3>
          {riotAccount && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                color: riotAccount.verified ? '#3D7A5F' : 'rgba(245, 245, 245, 0.6)',
                fontSize: '14px'
              }}>
                {riotAccount.verified ? '✓ Verified' : '○ Not verified'}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!summoner && (
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3D7A5F',
                color: '#F5F5F5',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isVerifying ? 'not-allowed' : 'pointer',
                opacity: isVerifying ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Account'}
            </button>
          )}
          {summoner && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                style={{
                  padding: '8px 16px',
                  backgroundColor: needsUpdate() ? '#D4A855' : 'rgba(61, 122, 95, 0.2)',
                  color: needsUpdate() ? '#F5F5F5' : '#3D7A5F',
                  border: needsUpdate() ? '1px solid #D4A855' : '1px solid #3D7A5F',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isSyncing ? 'not-allowed' : 'pointer',
                  opacity: isSyncing ? 0.6 : 1,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {isSyncing ? 'Syncing...' : '↻ Sync Data'}
                {needsUpdate() && !isSyncing && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#E74C3C',
                    borderRadius: '50%',
                    border: '2px solid #1A1A1A'
                  }} />
                )}
              </button>
              {summoner.last_synced && (
                <span style={{
                  fontSize: '11px',
                  color: needsUpdate() ? '#D4A855' : 'rgba(245, 245, 245, 0.4)'
                }}>
                  {getTimeSinceUpdate()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summoner Data */}
      {summoner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile Info */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <ImageWithFallback
              src={datadragon.profileIcon(summoner.profile_icon_id)}
              alt="Profile Icon"
              fallbackType="profile"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: 'rgba(245, 245, 245, 0.6)', fontSize: '14px' }}>Level </span>
                <span style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: '600' }}>
                  {summoner.summoner_level}
                </span>
              </div>

              {/* Ranked Info */}
              {summoner.solo_tier && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ color: 'rgba(245, 245, 245, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                    Ranked Solo/Duo
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '6px',
                    border: `1px solid ${RANK_COLORS[summoner.solo_tier] || 'rgba(255, 255, 255, 0.1)'}40`
                  }}>
                    <div>
                      <div style={{
                        color: RANK_COLORS[summoner.solo_tier] || '#F5F5F5',
                        fontWeight: '600',
                        fontSize: '16px'
                      }}>
                        {getRankDisplay(summoner.solo_tier, summoner.solo_rank, summoner.solo_lp)}
                      </div>
                      {summoner.solo_wins && summoner.solo_losses && (
                        <div style={{ color: 'rgba(245, 245, 245, 0.6)', fontSize: '13px', marginTop: '4px' }}>
                          {summoner.solo_wins}W {summoner.solo_losses}L
                          {getWinRate(summoner.solo_wins, summoner.solo_losses) && (
                            <span style={{ marginLeft: '8px', color: '#3D7A5F' }}>
                              ({getWinRate(summoner.solo_wins, summoner.solo_losses)}% WR)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Champions */}
          {summoner.top_champions && summoner.top_champions.length > 0 && (
            <div>
              <h4 style={{
                color: '#F5F5F5',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px'
              }}>
                Top Champions
              </h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                {summoner.top_champions.map((champ, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      flex: 1
                    }}
                  >
                    <ImageWithFallback
                      src={datadragon.championImage(champ.championId)}
                      alt="Champion"
                      fallbackType="champion"
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        marginBottom: '8px'
                      }}
                    />
                    <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                      Mastery {champ.championLevel}
                    </div>
                    <div style={{ color: 'rgba(245, 245, 245, 0.6)', fontSize: '12px' }}>
                      {champ.championPoints.toLocaleString()} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Lane - Auto-detected */}
          {summoner.preferred_lane && (
            <div>
              <h4 style={{
                color: '#F5F5F5',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px'
              }}>
                Most Played Role
              </h4>
              <div style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#3D7A5F',
                color: '#F5F5F5',
                border: '1px solid #3D7A5F',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {summoner.preferred_lane}
              </div>
              <p style={{
                color: 'rgba(245, 245, 245, 0.5)',
                fontSize: '12px',
                marginTop: '8px'
              }}>
                Auto-detected from champion mastery
              </p>
            </div>
          )}

          {/* Last Synced */}
          {summoner.last_synced && (
            <div style={{
              color: 'rgba(245, 245, 245, 0.4)',
              fontSize: '12px',
              textAlign: 'right'
            }}>
              Last updated: {new Date(summoner.last_synced).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
