import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { COLORS } from '../../constants/theme';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AvailabilitySlot {
  id: string;
  user_id: string;
  team_id?: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  notes?: string;
}

interface TeamAvailability {
  user_id: string;
  username: string;
  slots: AvailabilitySlot[];
}

interface TeamEvent {
  id: string;
  team_id: string;
  created_by_id: string;
  title: string;
  event_type: 'scrim' | 'training' | 'soloq' | 'meeting';
  start_time: string;
  end_time: string;
  opponent_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function ScrimSchedulerPage() {
  const { user } = useAuth();
  const { teams } = useTeam();
  const navigate = useNavigate();

  // State
  const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mySlots, setMySlots] = useState<AvailabilitySlot[]>([]);
  const [teamAvailability, setTeamAvailability] = useState<TeamAvailability[]>([]);
  const [teamEvents, setTeamEvents] = useState<TeamEvent[]>([]);
  const [draggedSlot, setDraggedSlot] = useState<AvailabilitySlot | null>(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showTeamEventModal, setShowTeamEventModal] = useState(false);
  const [teamEventForm, setTeamEventForm] = useState({
    title: '',
    event_type: 'scrim' as 'scrim' | 'training' | 'soloq' | 'meeting',
    opponent_name: '',
    notes: '',
    start_time: new Date(),
    end_time: new Date(),
  });

  // Drag selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ day: Date; hour: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ day: Date; hour: number } | null>(null);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);

  // Recurring form
  const [recurringForm, setRecurringForm] = useState({
    day_of_week: '4', // Thursday by default
    start_time: '19:00',
    end_time: '22:00',
    duration_months: '3',
  });

  const myTeam = teams.length > 0 ? teams[0] : null;

  // Load my availability slots and team events
  useEffect(() => {
    if (user && myTeam) {
      loadMySlots();
      loadTeamAvailability();
      loadTeamEvents();
    }
  }, [user, myTeam]);

  const loadMySlots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/availability/slots/me?team_id=${myTeam?.id || ''}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setMySlots(data);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const loadTeamAvailability = async () => {
    if (!myTeam) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/availability/team/${myTeam.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTeamAvailability(data);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const loadTeamEvents = async () => {
    if (!myTeam) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/team-events/${myTeam.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTeamEvents(data);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/availability/slots/${slotId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await loadMySlots();
        await loadTeamAvailability();
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleDeleteTeamEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/team-events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await loadTeamEvents();
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleDragStart = (slot: AvailabilitySlot) => {
    setDraggedSlot(slot);
  };

  const handleDragEnd = () => {
    setDraggedSlot(null);
  };

  const handleDrop = async (newDate: Date, newHour: number) => {
    if (!draggedSlot) return;

    const oldStart = new Date(draggedSlot.start_time);
    const oldEnd = new Date(draggedSlot.end_time);
    const duration = oldEnd.getTime() - oldStart.getTime();

    const newStart = new Date(newDate);
    newStart.setHours(newHour, oldStart.getMinutes(), 0, 0);

    const newEnd = new Date(newStart.getTime() + duration);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/availability/slots/${draggedSlot.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
          }),
        }
      );

      if (response.ok) {
        await loadMySlots();
        await loadTeamAvailability();
      }
    } catch (error) {
      // Silent fail
    }

    setDraggedSlot(null);
  };

  // Handle mouse down to start selection
  const handleMouseDown = (day: Date, hour: number) => {
    setIsSelecting(true);
    setSelectionStart({ day, hour });
    setSelectionEnd({ day, hour });
  };

  // Handle mouse enter while selecting
  const handleMouseEnter = (day: Date, hour: number) => {
    if (isSelecting && selectionStart) {
      setSelectionEnd({ day, hour });
    }
  };

  // Handle mouse up to finish selection and create slot/event
  const handleMouseUp = async () => {
    if (isSelecting && selectionStart && selectionEnd && !isCreatingSlot) {
      // Prevent multiple creations
      setIsCreatingSlot(true);

      // Create slot from selection
      const startDay = selectionStart.day < selectionEnd.day ? selectionStart.day : selectionEnd.day;
      const endDay = selectionStart.day < selectionEnd.day ? selectionEnd.day : selectionStart.day;

      const startHour = Math.min(selectionStart.hour, selectionEnd.hour);
      const endHour = Math.max(selectionStart.hour, selectionEnd.hour) + 1;

      // Only create if same day
      if (startDay.toDateString() === endDay.toDateString()) {
        // Create UTC dates to avoid timezone offset issues
        const year = startDay.getFullYear();
        const month = startDay.getMonth();
        const date = startDay.getDate();

        const startTime = new Date(Date.UTC(year, month, date, startHour, 0, 0, 0));
        const endTime = new Date(Date.UTC(year, month, date, endHour, 0, 0, 0));

        if (viewMode === 'team') {
          // Team mode: Open modal to create team event
          setTeamEventForm({
            title: '',
            event_type: 'scrim',
            opponent_name: '',
            notes: '',
            start_time: startTime,
            end_time: endTime,
          });
          setShowTeamEventModal(true);

          // Reset selection state immediately for team mode
          setIsSelecting(false);
          setSelectionStart(null);
          setSelectionEnd(null);
          setIsCreatingSlot(false);
          return;
        } else {
          // Personal mode: Create availability slot directly
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/availability/slots`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                team_id: myTeam?.id,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                is_recurring: false,
              }),
            });

            if (response.ok) {
              await loadMySlots();
              await loadTeamAvailability();
            }
          } catch (error) {
            // Silent fail
          }
        }
      }
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsCreatingSlot(false);
  };

  // Check if cell is in selection
  const isInSelection = (day: Date, hour: number) => {
    if (!isSelecting || !selectionStart || !selectionEnd) return false;

    const cellDay = day.toDateString();
    const startDay = selectionStart.day.toDateString();
    const endDay = selectionEnd.day.toDateString();

    if (cellDay !== startDay || cellDay !== endDay) return false;

    const minHour = Math.min(selectionStart.hour, selectionEnd.hour);
    const maxHour = Math.max(selectionStart.hour, selectionEnd.hour);

    return hour >= minHour && hour <= maxHour;
  };

  const createRecurringSlot = async () => {
    if (!user || !myTeam) return;

    const dayOfWeek = parseInt(recurringForm.day_of_week);
    const today = new Date();
    const daysUntilTarget = (dayOfWeek - today.getDay() + 7) % 7 || 7;
    const nextOccurrence = new Date(today);
    nextOccurrence.setDate(today.getDate() + daysUntilTarget);

    const [startHour, startMinute] = recurringForm.start_time.split(':').map(Number);
    const [endHour, endMinute] = recurringForm.end_time.split(':').map(Number);

    nextOccurrence.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(nextOccurrence);
    endTime.setHours(endHour, endMinute, 0, 0);

    const recurrenceEnd = new Date(nextOccurrence);
    recurrenceEnd.setMonth(recurrenceEnd.getMonth() + parseInt(recurringForm.duration_months));

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const recurrencePattern = `weekly_${dayNames[dayOfWeek]}`;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/availability/slots`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: myTeam.id,
          start_time: nextOccurrence.toISOString(),
          end_time: endTime.toISOString(),
          is_recurring: true,
          recurrence_pattern: recurrencePattern,
          recurrence_end_date: recurrenceEnd.toISOString(),
          notes: 'Weekly team practice',
        }),
      });

      if (response.ok) {
        await loadMySlots();
        await loadTeamAvailability();
        setShowRecurringModal(false);
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Create team event
  const handleCreateTeamEvent = async () => {
    if (!myTeam) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/team-events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: myTeam.id,
          title: teamEventForm.title,
          event_type: teamEventForm.event_type,
          start_time: teamEventForm.start_time.toISOString(),
          end_time: teamEventForm.end_time.toISOString(),
          opponent_name: teamEventForm.opponent_name || null,
          notes: teamEventForm.notes || null,
        }),
      });

      if (response.ok) {
        await loadTeamEvents();
        setShowTeamEventModal(false);
        setTeamEventForm({
          title: '',
          event_type: 'scrim',
          opponent_name: '',
          notes: '',
          start_time: new Date(),
          end_time: new Date(),
        });
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Get week days
  const getWeekDays = (startDate: Date) => {
    const monday = new Date(startDate);
    const dayOfWeek = monday.getDay();
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

  const weekDays = getWeekDays(selectedDate);
  const hours = Array.from({ length: 16 }, (_, i) => i + 8);

  const getSlotForCell = (slots: AvailabilitySlot[], day: Date, hour: number) => {
    return slots.filter((slot) => {
      const slotStart = new Date(slot.start_time);
      const slotEnd = new Date(slot.end_time);

      const cellStart = new Date(day);
      cellStart.setHours(hour, 0, 0, 0);
      const cellEnd = new Date(day);
      cellEnd.setHours(hour + 1, 0, 0, 0);

      return slotStart < cellEnd && slotEnd > cellStart;
    });
  };

  const getAvailableCount = (day: Date, hour: number) => {
    let count = 0;
    teamAvailability.forEach((member) => {
      const slotsInCell = getSlotForCell(member.slots, day, hour);
      if (slotsInCell.length > 0) count++;
    });
    return count;
  };

  const getTeamHeatMapColor = (day: Date, hour: number) => {
    const count = getAvailableCount(day, hour);
    const totalMembers = teamAvailability.length;

    if (totalMembers === 0) return '#1A1A1A';
    if (count === 0) return '#1A1A1A'; // Base color - nobody available

    const ratio = count / totalMembers;

    // Color coding with low opacity:
    // Red: 0-20% (ratio <= 0.2)
    // Orange: 20-80% (0.2 < ratio < 0.8)
    // Green: 80-100% (ratio >= 0.8)

    if (ratio <= 0.2) {
      // Red - very few people available
      return `rgba(199, 91, 91, 0.25)`; // #C75B5B with 25% opacity
    } else if (ratio < 0.8) {
      // Orange - some people available
      return `rgba(232, 197, 71, 0.25)`; // #E8C547 with 25% opacity
    } else {
      // Green - most/all people available
      return `rgba(61, 122, 95, 0.35)`; // #3D7A5F with 35% opacity
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate slot position and dimensions for absolute positioning
  const getSlotStyle = (slot: AvailabilitySlot, dayIndex: number) => {
    const startTime = new Date(slot.start_time);
    const endTime = new Date(slot.end_time);

    const startHour = startTime.getHours();
    const endHour = endTime.getHours();

    // Row index (0-15 for hours 8-23)
    const rowStart = startHour - 8;
    const rowEnd = endHour - 8;
    const rowSpan = rowEnd - rowStart;

    // Each cell is 60px tall, time column is 100px wide, each day column is calculated
    const dayColumnWidth = `calc((100% - 100px) / 7)`;
    const left = `calc(100px + ${dayIndex} * ${dayColumnWidth})`;
    const top = `${rowStart * 60}px`;
    const height = `${rowSpan * 60}px`;
    const width = dayColumnWidth;

    return {
      position: 'absolute' as const,
      left,
      top,
      width,
      height,
      zIndex: 10,
    };
  };

  if (!myTeam) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
        <Header brandName="OpenRift" tagline="PRO TOOLS FOR EVERYONE" showToolsLink={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-3">No Team Yet</h2>
            <p className="text-[#F5F5F5]/50 mb-6">Join or create a team to use the scheduler</p>
            <button
              onClick={() => navigate('/teams')}
              className="px-8 py-3 bg-[#3D7A5F] text-[#F5F5F5] font-medium hover:bg-[#3D7A5F]/90"
            >
              Browse Teams
            </button>
          </div>
        </div>
        <Footer copyright="© 2025 OpenRift" links={[]} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header brandName="OpenRift" tagline="PRO TOOLS FOR EVERYONE" showToolsLink={true} />

      {/* Page Header */}
      <div className="border-b border-[#F5F5F5]/10 py-8">
        <div className="max-w-[1800px] mx-auto px-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[#F5F5F5] text-4xl font-semibold mb-2">Team Availability</h1>
              <p className="text-[#F5F5F5]/50 text-lg">{myTeam.name} Schedule</p>
            </div>
            <div className="flex gap-3">
              {/* View Mode Toggle */}
              <div className="flex border border-[#F5F5F5]/20 overflow-hidden">
                <button
                  onClick={() => setViewMode('personal')}
                  className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                    viewMode === 'personal'
                      ? 'bg-[#3D7A5F] text-[#F5F5F5]'
                      : 'bg-transparent text-[#F5F5F5]/70 hover:text-[#F5F5F5]'
                  }`}
                >
                  Personal Calendar
                </button>
                <button
                  onClick={() => setViewMode('team')}
                  className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                    viewMode === 'team'
                      ? 'bg-[#3D7A5F] text-[#F5F5F5]'
                      : 'bg-transparent text-[#F5F5F5]/70 hover:text-[#F5F5F5]'
                  }`}
                >
                  Team Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-8">
        <div className="max-w-[1800px] mx-auto px-12">
          {/* Instructions */}
          <div className="mb-4 bg-[#1A1A1A] border border-[#F5F5F5]/10 p-4 rounded">
            {viewMode === 'personal' ? (
              <p className="text-[#F5F5F5]/70 text-sm">
                <strong>Click and drag</strong> on the calendar to create your availability slots. Drag existing slots to move them.
              </p>
            ) : (
              <p className="text-[#F5F5F5]/70 text-sm">
                <strong>Team calendar</strong> shows combined availability: <span className="text-[#C75B5B]">Red</span> (≤20% available) → <span className="text-[#E8C547]">Orange</span> (20-80% available) → <span className="text-[#3D7A5F]">Green</span> (≥80% available). <strong>Click and drag</strong> to create team events (scrims, training, etc.)
              </p>
            )}
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 7);
                setSelectedDate(newDate);
              }}
              className="px-4 py-2 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors"
            >
              ← Previous Week
            </button>
            <div className="text-[#F5F5F5] text-lg font-medium">
              {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -{' '}
              {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 7);
                setSelectedDate(newDate);
              }}
              className="px-4 py-2 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors"
            >
              Next Week →
            </button>
          </div>

          {/* Legend */}
          <div className="mb-4 flex items-center gap-4 text-sm text-[#F5F5F5]/60">
            {viewMode === 'team' ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#C75B5B] opacity-25"></div>
                  <span>≤20% available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#E8C547] opacity-25"></div>
                  <span>20-80% available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#3D7A5F] opacity-35"></div>
                  <span>≥80% available</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#3D7A5F]"></div>
                  <span>Your availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-[#F5F5F5]/20 bg-[#F5F5F5]/5"></div>
                  <span>Click & drag to create</span>
                </div>
              </>
            )}
          </div>

          {/* Calendar - Grid with CSS Grid positioning */}
          <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 overflow-auto select-none">
            <div
              className="grid relative select-none"
              style={{
                gridTemplateColumns: '100px repeat(7, 1fr)',
                gridTemplateRows: 'auto repeat(16, 60px)',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              {/* Header Row */}
              <div
                className="border-b border-[#F5F5F5]/10 bg-[#0E0E0E] p-3 text-left text-[#F5F5F5]/70 text-sm font-medium select-none"
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                onMouseDown={(e) => e.preventDefault()}
              >
                Time
              </div>
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className="border-l border-b border-[#F5F5F5]/10 bg-[#0E0E0E] p-3 text-center text-[#F5F5F5] text-sm select-none"
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="font-semibold">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="text-[#F5F5F5]/50 text-xs">{day.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</div>
                </div>
              ))}

              {/* Grid Body */}
              {hours.map((hour, hourIdx) => (
                <>
                  {/* Time Label */}
                  <div
                    key={`time-${hour}`}
                    className="border-b border-[#F5F5F5]/10 bg-[#0E0E0E] p-3 text-[#F5F5F5]/70 text-sm font-medium flex items-center select-none"
                    style={{ gridRow: hourIdx + 2, gridColumn: 1, userSelect: 'none', WebkitUserSelect: 'none' }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </div>

                  {/* Day Cells */}
                  {weekDays.map((day, dayIdx) => {
                    const inSelection = isInSelection(day, hour);

                    if (viewMode === 'personal') {
                      return (
                        <div
                          key={`${hour}-${dayIdx}`}
                          className="border-l border-b border-[#F5F5F5]/10 cursor-crosshair hover:bg-[#F5F5F5]/5 select-none"
                          style={{
                            gridRow: hourIdx + 2,
                            gridColumn: dayIdx + 2,
                            backgroundColor: inSelection ? 'rgba(61, 122, 95, 0.3)' : 'transparent',
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleMouseDown(day, hour);
                          }}
                          onMouseEnter={() => handleMouseEnter(day, hour)}
                          onMouseUp={handleMouseUp}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(day, hour)}
                        />
                      );
                    }

                    // Team mode - allow creating team events
                    const heatMapColor = getTeamHeatMapColor(day, hour);
                    return (
                      <div
                        key={`${hour}-${dayIdx}`}
                        className="border-l border-b border-[#F5F5F5]/10 p-1 flex items-center justify-center cursor-crosshair hover:bg-[#F5F5F5]/5 select-none"
                        style={{
                          gridRow: hourIdx + 2,
                          gridColumn: dayIdx + 2,
                          backgroundColor: inSelection ? 'rgba(180, 151, 90, 0.3)' : heatMapColor
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleMouseDown(day, hour);
                        }}
                        onMouseEnter={() => handleMouseEnter(day, hour)}
                        onMouseUp={handleMouseUp}
                      >
                        <div className="text-xs text-white font-semibold">
                          {getAvailableCount(day, hour) > 0 && `${getAvailableCount(day, hour)}/${teamAvailability.length}`}
                        </div>
                      </div>
                    );
                  })}
                </>
              ))}

              {/* Slots rendered as grid items in Personal Mode */}
              {viewMode === 'personal' && mySlots.map((slot) => {
                const startTime = new Date(slot.start_time);
                const endTime = new Date(slot.end_time);
                const slotDay = startTime.toDateString();
                const dayIndex = weekDays.findIndex(d => d.toDateString() === slotDay);

                if (dayIndex === -1) return null; // Slot not in current week

                const startHour = startTime.getHours();
                const endHour = endTime.getHours();
                const rowStart = (startHour - 8) + 2;
                const rowSpan = endHour - startHour;

                return (
                  <div
                    key={slot.id}
                    className="relative z-10 pointer-events-auto"
                    style={{
                      gridRow: `${rowStart} / span ${rowSpan}`,
                      gridColumn: dayIndex + 2,
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(slot);
                      }}
                      onDragEnd={handleDragEnd}
                      className="w-full h-full bg-[#3D7A5F] border-2 border-[#F5F5F5]/30 p-2 cursor-move hover:bg-[#3D7A5F]/80 group flex flex-col m-[1px]"
                    >
                      <div className="text-xs text-white font-medium">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </div>
                      {slot.is_recurring && (
                        <div className="text-xs text-[#F5F5F5]/60">♻ Weekly</div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlot(slot.id);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-[#C75B5B] text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center rounded"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Team Events rendered as grid items in Team Mode */}
              {viewMode === 'team' && teamEvents.map((event) => {
                const startTime = new Date(event.start_time);
                const endTime = new Date(event.end_time);
                const eventDay = startTime.toDateString();
                const dayIndex = weekDays.findIndex(d => d.toDateString() === eventDay);

                if (dayIndex === -1) return null; // Event not in current week

                const startHour = startTime.getHours();
                const endHour = endTime.getHours();
                const rowStart = (startHour - 8) + 2; // +2 because row 1 is header
                const rowSpan = endHour - startHour;

                // Color by event type
                const eventColors = {
                  scrim: '#B4975A',      // Gold
                  training: '#5B9FC7',   // Blue
                  soloq: '#A75BC7',      // Purple
                  meeting: '#C7865B',    // Orange
                };

                return (
                  <div
                    key={event.id}
                    className="relative z-10 pointer-events-auto"
                    style={{
                      gridRow: `${rowStart} / span ${rowSpan}`,
                      gridColumn: dayIndex + 2,
                    }}
                  >
                    <div
                      className="w-full h-full border-2 border-[#F5F5F5]/30 p-2 group flex flex-col m-[1px]"
                      style={{ backgroundColor: eventColors[event.event_type] }}
                    >
                      <div className="text-xs text-white font-semibold">
                        {event.event_type.toUpperCase()}
                      </div>
                      <div className="text-xs text-white font-medium truncate">
                        {event.title}
                      </div>
                      {event.opponent_name && (
                        <div className="text-xs text-[#F5F5F5]/80 truncate">vs {event.opponent_name}</div>
                      )}
                      <div className="text-xs text-[#F5F5F5]/60">
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTeamEvent(event.id);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-[#C75B5B] text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center rounded"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* My Slots List - Only show in personal mode */}
          {viewMode === 'personal' && (
            <div className="mt-8 bg-[#1A1A1A] border border-[#F5F5F5]/10 p-6">
              <h3 className="text-[#F5F5F5] text-lg font-semibold mb-4">My Availability Slots</h3>
              {mySlots.length === 0 ? (
                <p className="text-[#F5F5F5]/50 text-sm">Click and drag on the calendar to create slots</p>
              ) : (
                <div className="space-y-2">
                  {mySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 bg-[#0E0E0E] border border-[#F5F5F5]/10 hover:border-[#F5F5F5]/20 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="text-[#F5F5F5] font-medium">
                          {new Date(slot.start_time).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-[#F5F5F5]/70 text-sm">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          {slot.is_recurring && ' (♻ Recurring)'}
                        </div>
                        {slot.notes && <div className="text-[#F5F5F5]/50 text-xs mt-1">{slot.notes}</div>}
                      </div>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="px-3 py-1.5 text-xs border border-[#C75B5B]/50 text-[#C75B5B] hover:bg-[#C75B5B]/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team Availability Summary - Only show in team mode */}
          {viewMode === 'team' && (
            <div className="mt-8 bg-[#1A1A1A] border border-[#F5F5F5]/10 p-6">
              <h3 className="text-[#F5F5F5] text-lg font-semibold mb-4">Team Members</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {teamAvailability.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-2 p-3 bg-[#0E0E0E] border border-[#F5F5F5]/10"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#3D7A5F] flex items-center justify-center text-white text-sm font-semibold">
                      {member.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[#F5F5F5] text-sm font-medium truncate">{member.username}</div>
                      <div className="text-[#F5F5F5]/50 text-xs">
                        {member.slots.length} slot{member.slots.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recurring Slot Modal */}
      {showRecurringModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowRecurringModal(false)}
        >
          <div
            className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-6">Create Recurring Slot</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[#F5F5F5]/70 text-sm mb-2">Day of Week</label>
                <select
                  value={recurringForm.day_of_week}
                  onChange={(e) => setRecurringForm({ ...recurringForm, day_of_week: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                >
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                  <option value="0">Sunday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Start Time</label>
                  <input
                    type="time"
                    value={recurringForm.start_time}
                    onChange={(e) => setRecurringForm({ ...recurringForm, start_time: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                  />
                </div>
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">End Time</label>
                  <input
                    type="time"
                    value={recurringForm.end_time}
                    onChange={(e) => setRecurringForm({ ...recurringForm, end_time: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#F5F5F5]/70 text-sm mb-2">Repeat For</label>
                <select
                  value={recurringForm.duration_months}
                  onChange={(e) => setRecurringForm({ ...recurringForm, duration_months: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                >
                  <option value="1">1 month</option>
                  <option value="2">2 months</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRecurringModal(false)}
                className="flex-1 px-4 py-2.5 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createRecurringSlot}
                className="flex-1 px-4 py-2.5 bg-[#B4975A] text-[#F5F5F5] hover:bg-[#B4975A]/90 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Event Modal */}
      {showTeamEventModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowTeamEventModal(false)}
        >
          <div
            className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-6">Create Team Event</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[#F5F5F5]/70 text-sm mb-2">Event Type *</label>
                <select
                  value={teamEventForm.event_type}
                  onChange={(e) => setTeamEventForm({ ...teamEventForm, event_type: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                >
                  <option value="scrim">Scrim</option>
                  <option value="training">Training</option>
                  <option value="soloq">SoloQ Session</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>

              <div>
                <label className="block text-[#F5F5F5]/70 text-sm mb-2">Title *</label>
                <input
                  type="text"
                  value={teamEventForm.title}
                  onChange={(e) => setTeamEventForm({ ...teamEventForm, title: e.target.value })}
                  placeholder="e.g., Scrim vs Team ABC"
                  className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                />
              </div>

              {teamEventForm.event_type === 'scrim' && (
                <div>
                  <label className="block text-[#F5F5F5]/70 text-sm mb-2">Opponent Name</label>
                  <input
                    type="text"
                    value={teamEventForm.opponent_name}
                    onChange={(e) => setTeamEventForm({ ...teamEventForm, opponent_name: e.target.value })}
                    placeholder="e.g., Team XYZ"
                    className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#F5F5F5]/70 text-sm mb-2">Notes</label>
                <textarea
                  value={teamEventForm.notes}
                  onChange={(e) => setTeamEventForm({ ...teamEventForm, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#0E0E0E] border border-[#F5F5F5]/10 text-[#F5F5F5] focus:outline-none focus:border-[#3D7A5F] resize-none"
                />
              </div>

              <div className="text-[#F5F5F5]/50 text-sm">
                {teamEventForm.start_time.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {teamEventForm.end_time.toLocaleString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTeamEventModal(false)}
                className="flex-1 px-4 py-2.5 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeamEvent}
                disabled={!teamEventForm.title}
                className="flex-1 px-4 py-2.5 bg-[#3D7A5F] text-[#F5F5F5] hover:bg-[#3D7A5F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}

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
