import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { COLORS } from '../../constants/theme';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ScrimSchedulerPage() {
  const { user } = useAuth();
  const { teams, invites, scrims, createTeam, getMyTeams, getMyInvites, acceptInvite, inviteToTeam, getScrims, createScrim } = useTeam();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showScrimModal, setShowScrimModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState(new Date());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ day: number; hour: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ day: number; hour: number } | null>(null);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    tag: '',
    description: '',
    team_color: '#3D7A5F',
  });
  const [inviteFormData, setInviteFormData] = useState({
    user_id: '',
  });
  const [scrimFormData, setScrimFormData] = useState({
    opponent_name: '',
    scheduled_at: '',
    duration_minutes: '60',
    notes: '',
  });

  useEffect(() => {
    getMyTeams();
    getMyInvites();
  }, []);

  // Load scrims for all teams
  useEffect(() => {
    teams.forEach(team => {
      getScrims(team.id);
    });
  }, [teams]);

  // Handle global mouseup to end selection if mouse is released outside calendar
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const team = await createTeam(createFormData);
    if (team) {
      setShowCreateModal(false);
      setCreateFormData({ name: '', tag: '', description: '', team_color: '#3D7A5F' });
      getMyTeams();
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    const invite = await inviteToTeam(selectedTeam, inviteFormData);
    if (invite) {
      setShowInviteModal(false);
      setInviteFormData({ user_id: '' });
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    const team = await acceptInvite(inviteId);
    if (team) {
      getMyTeams();
      getMyInvites();
    }
  };

  const handleCreateScrim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    const scrim = await createScrim(selectedTeam, {
      opponent_name: scrimFormData.opponent_name,
      scheduled_at: scrimFormData.scheduled_at,
      duration_minutes: scrimFormData.duration_minutes,
      notes: scrimFormData.notes,
    });

    if (scrim) {
      setShowScrimModal(false);
      setScrimFormData({ opponent_name: '', scheduled_at: '', duration_minutes: '60', notes: '' });
      getScrims(selectedTeam);
    }
  };

  // Get user's team
  const myTeam = teams.length > 0 ? teams[0] : null;

  // Get all upcoming scrims from all teams
  const allUpcomingScrims = Array.from(scrims.entries()).flatMap(([teamId, teamScrims]) => {
    const team = teams.find(t => t.id === teamId);
    return teamScrims
      .filter(scrim => new Date(scrim.scheduled_at) > new Date() && scrim.status === 'scheduled')
      .map(scrim => ({ ...scrim, teamName: team?.name, teamColor: team?.team_color }));
  }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const formatScrimTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Get week days for weekly calendar based on selected date
  const getWeekDays = (startDate: Date) => {
    const monday = new Date(startDate);
    const dayOfWeek = monday.getDay();
    // Get Monday of the week (0 = Sunday, 1 = Monday, etc.)
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(monday.getDate() + daysToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays(selectedWeekStart);

  // Generate hour slots from 8h to 1h (next day) - skip 2h to 7h
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1];

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header
        brandName="OpenRift"
        tagline="PRO TOOLS FOR EVERYONE"
        showToolsLink={true}
      />

      {/* Page Header */}
      <div className="border-b border-[#F5F5F5]/10 py-12">
        <div className="max-w-[1600px] mx-auto px-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[#F5F5F5] text-4xl font-semibold mb-2">
                Scrim Scheduler
              </h1>
              <p className="text-[#F5F5F5]/50 text-lg">
                {myTeam ? `${myTeam.name} Schedule` : 'Create and manage your teams'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-16">
        <div className="max-w-[1600px] mx-auto px-12">
          {!myTeam ? (
            // No team - show create team message
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#F5F5F5]/5 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#F5F5F5]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-3">No Team Yet</h2>
                <p className="text-[#F5F5F5]/50 mb-6">Create or join a team to start scheduling scrims and managing your roster</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors"
                >
                  Create Your First Team
                </button>
              </div>
            </div>
          ) : (
            // Has team - show calendars
            <div className="grid grid-cols-3 gap-8">

              {/* Monthly Calendar - Left */}
              <div className="col-span-1 border border-[#F5F5F5]/10 p-6 bg-[#F5F5F5]/[0.02]">
                <h3 className="text-[#F5F5F5] text-lg font-semibold mb-6">Monthly View</h3>

                {/* Month Calendar */}
                <div className="grid grid-cols-7 gap-2 text-center text-xs mb-6">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-[#F5F5F5]/40 font-medium py-2">{day}</div>
                  ))}
                  {Array.from({ length: 35 }, (_, i) => {
                    const today = new Date();
                    const currentMonth = today.getMonth();
                    const currentYear = today.getFullYear();

                    // Calculate the day number for this calendar cell
                    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
                    const firstDayWeekday = firstDayOfMonth.getDay();
                    const daysFromMonday = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

                    const dayNum = i - daysFromMonday + 1;
                    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

                    const isValidDay = dayNum >= 1 && dayNum <= daysInMonth;
                    const dayDate = isValidDay ? new Date(currentYear, currentMonth, dayNum) : null;
                    const isToday = dayDate?.toDateString() === today.toDateString();

                    const hasScrim = isValidDay && allUpcomingScrims.some(scrim => {
                      const scrimDate = new Date(scrim.scheduled_at);
                      return scrimDate.toDateString() === dayDate?.toDateString();
                    });

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (isValidDay && dayDate) {
                            setSelectedWeekStart(dayDate);
                          }
                        }}
                        disabled={!isValidDay}
                        className={`aspect-square flex items-center justify-center rounded transition-colors ${
                          !isValidDay
                            ? 'text-[#F5F5F5]/10 cursor-default'
                            : isToday
                            ? 'bg-[#3D7A5F] text-[#F5F5F5] font-semibold'
                            : hasScrim
                            ? 'bg-[#3D7A5F]/30 text-[#F5F5F5] hover:bg-[#3D7A5F]/50'
                            : 'text-[#F5F5F5]/60 hover:bg-[#F5F5F5]/10'
                        }`}
                      >
                        {isValidDay ? dayNum : ''}
                      </button>
                    );
                  })}
                </div>

                {/* Upcoming Scrims List */}
                <div className="pt-6 border-t border-[#F5F5F5]/10">
                  <h4 className="text-[#F5F5F5]/70 text-sm font-medium mb-3">Upcoming Scrims</h4>
                  <div className="space-y-2">
                    {allUpcomingScrims.length === 0 ? (
                      <p className="text-[#F5F5F5]/40 text-xs text-center py-4">No upcoming scrims</p>
                    ) : (
                      allUpcomingScrims.slice(0, 5).map((scrim) => (
                        <div key={scrim.id} className="flex items-center gap-3 p-2 hover:bg-[#F5F5F5]/5 rounded transition-colors group">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: myTeam.team_color || '#3D7A5F' }}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#F5F5F5] text-sm truncate">vs {scrim.opponent_name}</p>
                            <p className="text-[#F5F5F5]/40 text-xs">{formatScrimTime(scrim.scheduled_at)}</p>
                          </div>
                          <button
                            onClick={async () => {
                              const token = localStorage.getItem('token');
                              try {
                                const response = await fetch(`${API_BASE_URL}/api/scrims/${scrim.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${token}` },
                                });
                                if (response.ok) {
                                  const teamId = teams.find(t => t.id === scrim.team_id)?.id;
                                  if (teamId) getScrims(teamId);
                                }
                              } catch (error) {
                                console.error('Failed to delete scrim:', error);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded flex-shrink-0"
                            style={{ color: COLORS.danger }}
                            title="Delete scrim"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Weekly Calendar - Center */}
              <div className="col-span-2 border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02]">
                <div className="p-6 border-b border-[#F5F5F5]/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[#F5F5F5] text-lg font-semibold">Weekly Schedule</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newDate = new Date(selectedWeekStart);
                          newDate.setDate(newDate.getDate() - 7);
                          setSelectedWeekStart(newDate);
                        }}
                        className="px-3 py-1 text-[#F5F5F5]/60 hover:text-[#F5F5F5] transition-colors"
                      >
                        ←
                      </button>
                      <span className="text-[#F5F5F5]/60 text-sm">
                        {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <button
                        onClick={() => {
                          const newDate = new Date(selectedWeekStart);
                          newDate.setDate(newDate.getDate() + 7);
                          setSelectedWeekStart(newDate);
                        }}
                        className="px-3 py-1 text-[#F5F5F5]/60 hover:text-[#F5F5F5] transition-colors"
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div>
                  <div className="grid grid-cols-8">
                    {/* Header row with days */}
                    <div className="sticky top-0 bg-[#F5F5F5]/[0.02] border-b border-[#F5F5F5]/10 p-2">
                      <span className="text-[#F5F5F5]/40 text-xs">Time</span>
                    </div>
                    {weekDays.map((day, i) => {
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <div key={i} className={`sticky top-0 bg-[#F5F5F5]/[0.02] border-b border-l border-[#F5F5F5]/10 p-2 text-center ${isToday ? 'bg-[#3D7A5F]/10' : ''}`}>
                          <div className="text-[#F5F5F5]/40 text-xs font-medium mb-1">
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className={`text-sm font-semibold ${isToday ? 'text-[#3D7A5F]' : 'text-[#F5F5F5]'}`}>
                            {day.getDate()}
                          </div>
                        </div>
                      );
                    })}

                    {/* Hour rows */}
                    {hours.map((hour) => (
                      <>
                        {/* Hour label */}
                        <div key={`hour-${hour}`} className="border-b border-[#F5F5F5]/10 p-2 text-right">
                          <span className="text-[#F5F5F5]/40 text-xs">{hour.toString().padStart(2, '0')}:00</span>
                        </div>

                        {/* Day cells for this hour */}
                        {weekDays.map((day, dayIndex) => {
                          const isToday = day.toDateString() === new Date().toDateString();

                          // Find scrims that START in this cell
                          const cellScrims = allUpcomingScrims.filter(scrim => {
                            const scrimDate = new Date(scrim.scheduled_at);
                            return scrimDate.toDateString() === day.toDateString() &&
                                   scrimDate.getHours() === hour;
                          });

                          // Check if this cell is covered by any scrim (not just starting scrims)
                          const isCoveredByScrim = allUpcomingScrims.some(scrim => {
                            const scrimDate = new Date(scrim.scheduled_at);
                            const scrimStartHour = scrimDate.getHours();
                            const durationHours = Math.ceil(parseInt(scrim.duration_minutes) / 60);
                            const scrimEndHourIndex = hours.indexOf(scrimStartHour) + durationHours;
                            const currentHourIndex = hours.indexOf(hour);

                            return scrimDate.toDateString() === day.toDateString() &&
                                   currentHourIndex >= hours.indexOf(scrimStartHour) &&
                                   currentHourIndex < scrimEndHourIndex;
                          });

                          // Check if this cell is in the current selection
                          const isSelected = isSelecting && selectionStart && selectionEnd && (() => {
                            const startDay = Math.min(selectionStart.day, selectionEnd.day);
                            const endDay = Math.max(selectionStart.day, selectionEnd.day);
                            const startHourIndex = Math.min(
                              hours.indexOf(selectionStart.hour),
                              hours.indexOf(selectionEnd.hour)
                            );
                            const endHourIndex = Math.max(
                              hours.indexOf(selectionStart.hour),
                              hours.indexOf(selectionEnd.hour)
                            );
                            const currentHourIndex = hours.indexOf(hour);

                            return dayIndex >= startDay && dayIndex <= endDay &&
                                   currentHourIndex >= startHourIndex && currentHourIndex <= endHourIndex;
                          })();

                          return (
                            <div
                              key={`${hour}-${dayIndex}`}
                              className={`relative border-b border-l border-[#F5F5F5]/10 p-1 min-h-[40px] transition-colors ${
                                isCoveredByScrim ? '' : 'cursor-pointer'
                              } ${
                                isToday ? 'bg-[#3D7A5F]/5' : ''
                              } ${
                                isSelected ? 'bg-[#3D7A5F]/30 ring-1 ring-[#3D7A5F]' : isCoveredByScrim ? '' : 'hover:bg-[#F5F5F5]/5'
                              }`}
                              onMouseDown={(e) => {
                                if (!isCoveredByScrim) {
                                  e.preventDefault();
                                  setIsSelecting(true);
                                  setSelectionStart({ day: dayIndex, hour });
                                  setSelectionEnd({ day: dayIndex, hour });
                                }
                              }}
                              onMouseEnter={() => {
                                if (isSelecting && !isCoveredByScrim) {
                                  setSelectionEnd({ day: dayIndex, hour });
                                }
                              }}
                              onMouseUp={() => {
                                if (isSelecting && selectionStart && selectionEnd && !isCoveredByScrim) {
                                  setIsSelecting(false);

                                  // Only open modal if selection is valid
                                  const startDay = Math.min(selectionStart.day, selectionEnd.day);
                                  const startHourIndex = Math.min(
                                    hours.indexOf(selectionStart.hour),
                                    hours.indexOf(selectionEnd.hour)
                                  );
                                  const endHourIndex = Math.max(
                                    hours.indexOf(selectionStart.hour),
                                    hours.indexOf(selectionEnd.hour)
                                  );

                                  // Create start date/time
                                  const startDate = new Date(weekDays[startDay]);
                                  startDate.setHours(hours[startHourIndex], 0, 0, 0);

                                  // Calculate duration in minutes
                                  const durationHours = endHourIndex - startHourIndex + 1;
                                  const durationMinutes = durationHours * 60;

                                  // Set form data and open modal
                                  setScrimFormData({
                                    ...scrimFormData,
                                    scheduled_at: startDate.toISOString().slice(0, 16),
                                    duration_minutes: durationMinutes.toString()
                                  });
                                  setSelectedTeam(myTeam.id);
                                  setShowScrimModal(true);

                                  // Reset selection
                                  setSelectionStart(null);
                                  setSelectionEnd(null);
                                }
                              }}
                            >
                              {/* Render scrims that START in this cell */}
                              {cellScrims.map((scrim) => {
                                const durationHours = Math.ceil(parseInt(scrim.duration_minutes) / 60);
                                const heightMultiplier = durationHours;

                                return (
                                  <div
                                    key={scrim.id}
                                    className="absolute inset-x-1 top-1 p-2 bg-[#3D7A5F]/30 border-l-2 border-[#3D7A5F] rounded text-xs group hover:bg-[#3D7A5F]/40 transition-colors z-10"
                                    style={{
                                      height: `calc(${heightMultiplier * 40}px - 0.5rem)`,
                                      minHeight: '36px'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[#F5F5F5] font-medium truncate">vs {scrim.opponent_name}</p>
                                        <p className="text-[#F5F5F5]/60 text-[10px]">
                                          {(() => {
                                            const date = new Date(scrim.scheduled_at);
                                            const hours = date.getHours();
                                            const minutes = date.getMinutes();
                                            const durationMinutes = parseInt(scrim.duration_minutes);
                                            const durationHours = Math.floor(durationMinutes / 60);
                                            const remainingMinutes = durationMinutes % 60;
                                            let timeStr = `${hours}h${minutes.toString().padStart(2, '0')}`;
                                            if (durationHours > 0 || remainingMinutes > 0) {
                                              timeStr += ` (${durationHours > 0 ? `${durationHours}h` : ''}${remainingMinutes > 0 ? `${remainingMinutes}` : ''})`;
                                            }
                                            return timeStr;
                                          })()}
                                        </p>
                                        {scrim.notes && (
                                          <p className="text-[#F5F5F5]/40 text-[10px] mt-1 line-clamp-2">{scrim.notes}</p>
                                        )}
                                      </div>
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const token = localStorage.getItem('token');
                                          try {
                                            const response = await fetch(`${API_BASE_URL}/api/scrims/${scrim.id}`, {
                                              method: 'DELETE',
                                              headers: { 'Authorization': `Bearer ${token}` },
                                            });
                                            if (response.ok) {
                                              // Refresh scrims for this team
                                              const teamId = teams.find(t => t.id === scrim.team_id)?.id;
                                              if (teamId) getScrims(teamId);
                                            }
                                          } catch (error) {
                                            console.error('Failed to delete scrim:', error);
                                          }
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                                        style={{ color: COLORS.danger }}
                                        title="Delete scrim"
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-6">Create Team</h2>
            <form onSubmit={handleCreateTeam}>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Team Name *</label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Team Tag</label>
                  <input
                    type="text"
                    value={createFormData.tag}
                    onChange={(e) => setCreateFormData({ ...createFormData, tag: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                    maxLength={5}
                    placeholder="e.g., T1, G2"
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Description</label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Team Color</label>
                  <div className="flex gap-3">
                    {['#3D7A5F', '#5B8FB9', '#B4975A', '#8B5A9F', '#C75B5B'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCreateFormData({ ...createFormData, team_color: color })}
                        className={`w-10 h-10 rounded transition-all ${createFormData.team_color === color ? 'ring-2 ring-[#F5F5F5] scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-2.5 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-6">Invite User</h2>
            <form onSubmit={handleInviteUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">User ID *</label>
                  <input
                    type="text"
                    value={inviteFormData.user_id}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, user_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                    required
                    placeholder="Enter user ID"
                  />
                  <p className="text-[#F5F5F5]/40 text-xs mt-1">The user will be added as a team member</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-6 py-2.5 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Scrim Modal */}
      {showScrimModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowScrimModal(false)}>
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-6">Schedule Scrim</h2>
            <form onSubmit={handleCreateScrim}>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Team</label>
                  <select
                    value={selectedTeam || ''}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                    required
                  >
                    <option value="">Select a team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Opponent Name *</label>
                  <input
                    type="text"
                    value={scrimFormData.opponent_name}
                    onChange={(e) => setScrimFormData({ ...scrimFormData, opponent_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                    required
                    placeholder="e.g., Team Alpha"
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={scrimFormData.scheduled_at}
                    onChange={(e) => setScrimFormData({ ...scrimFormData, scheduled_at: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Notes</label>
                  <textarea
                    value={scrimFormData.notes}
                    onChange={(e) => setScrimFormData({ ...scrimFormData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] resize-none"
                    rows={3}
                    placeholder="Additional notes or details..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowScrimModal(false)}
                  className="flex-1 px-6 py-2.5 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90 transition-colors"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
