import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  AlertTriangle, 
  CheckSquare, 
  Users, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Network, 
  ShieldAlert, 
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { useEvent } from '../context/EventContext.js';
import { api } from '../services/api.js';
import { ProposedAction } from '../types/index.js';
import { ActionConfirmationModal } from '../components/common/ActionConfirmationModal.js';

interface MissionControlProps {
  onOpenCopilot: () => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({ onOpenCopilot }) => {
  const { currentClub, currentEvent, events, healthScore, refreshEvent } = useEvent();
  const navigate = useNavigate();

  const [selectedAction, setSelectedAction] = useState<ProposedAction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [volunteerCount, setVolunteerCount] = useState<number>(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (currentClub?.id) {
      api.getVolunteers(currentClub.id)
        .then((vols: any) => setVolunteerCount(Array.isArray(vols) ? vols.length : 0))
        .catch(() => setVolunteerCount(0));
    } else {
      setVolunteerCount(0);
    }
  }, [currentClub?.id]);

  // Tasks & Meetings from currentEvent
  const tasks = currentEvent?.tasks || [];
  const meetings = currentEvent?.meetings || [];
  const risks = currentEvent?.risks || [];

  const handleToggleTaskCheck = async (taskId: string, currentStatus: string) => {
    const isDone = currentStatus === 'DONE' || completedTaskIds[taskId];
    const newStatus = isDone ? 'TODO' : 'DONE';
    setCompletedTaskIds(prev => ({ ...prev, [taskId]: !isDone }));
    try {
      await api.updateTask(taskId, { status: newStatus });
      refreshEvent();
    } catch {
      // Revert on error
      setCompletedTaskIds(prev => ({ ...prev, [taskId]: isDone }));
    }
  };

  // Days left calculation
  const getDaysLeft = (dateStr?: string | Date) => {
    if (!dateStr) return 'Upcoming';
    const target = new Date(dateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    return `${diffDays} days left`;
  };

  // Recent Templates data (from MeetCraft reference)
  const templates = [
    { title: 'Event Budget Tracker', tag: 'Finance', desc: 'Track and manage expenses across key operational categories.' },
    { title: 'Guest Seating Plan', tag: 'Guest Management', desc: 'Plan guest and VIP seating with drag & drop layout zones.' },
    { title: 'Vendor Onboarding Checklist', tag: 'Vendors', desc: 'Step-by-step tasks to onboard caterers, AV and decor vendors.' },
    { title: 'Volunteer Roster & RSVP', tag: 'Volunteers', desc: 'Real-time attendance check, meal choices & shift tracking.' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ─────────────────────────────────────────────────────────────
          ROW 1: Today's Tasks | Today's Meetings | Projects Worked (Donut)
      ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 1. Today's Tasks */}
        <div className="lg:col-span-4 meet-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-[#191E35]">Today's Tasks</h2>
                <span className="w-5 h-5 rounded-full bg-[#EDE9FE] text-primary-600 text-[11px] font-bold flex items-center justify-center">
                  {tasks.length}
                </span>
              </div>
              <button 
                onClick={() => navigate('/tasks')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                See All
              </button>
            </div>

            <div className="space-y-3.5">
              {tasks.slice(0, 3).map((t) => {
                const isChecked = t.status === 'DONE' || completedTaskIds[t.id];
                return (
                  <div key={t.id} className="flex items-start space-x-3 group">
                    <button
                      onClick={() => handleToggleTaskCheck(t.id, t.status)}
                      className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isChecked 
                          ? 'bg-primary-600 border-primary-600 text-white' 
                          : 'border-[#CBD2E2] hover:border-primary-500'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-snug truncate ${isChecked ? 'line-through text-[#9BA2BA]' : 'text-[#191E35]'}`}>
                        {t.title}
                      </p>
                      <p className="text-[11px] font-medium text-primary-600 truncate mt-0.5">
                        {currentEvent?.name || 'Main Event'}
                      </p>
                    </div>
                  </div>
                );
              })}

              {tasks.length === 0 && (
                <div className="py-8 text-center text-xs text-[#8C93AE]">
                  No tasks scheduled for today.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#F0F2F9]">
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center space-x-1"
            >
              <span>+ Add Task</span>
            </button>
          </div>
        </div>

        {/* 2. Today's Meetings */}
        <div className="lg:col-span-4 meet-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-[#191E35]">Today's Meetings</h2>
                <span className="w-5 h-5 rounded-full bg-[#EDE9FE] text-primary-600 text-[11px] font-bold flex items-center justify-center">
                  {meetings.length || 2}
                </span>
              </div>
              <button 
                onClick={() => navigate('/meetings')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                See All
              </button>
            </div>

            <div className="space-y-4">
              {/* Meeting Item 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#191E35] truncate">
                    {meetings[0]?.title || 'Seating & Venue Coordination Sync'}
                  </p>
                  <p className="text-[11px] text-[#7A829D] mt-0.5">10:00 AM – 10:30 AM</p>
                  <p className="text-[11px] text-[#9AA1B9] truncate">Venue Coordinator – Sophia Reynolds</p>
                </div>
              </div>

              {/* Meeting Item 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#191E35] truncate">
                    {meetings[1]?.title || 'Volunteer Briefing & Walkthrough'}
                  </p>
                  <p className="text-[11px] text-[#7A829D] mt-0.5">11:15 AM – 12:00 PM</p>
                  <p className="text-[11px] text-[#9AA1B9] truncate">Lead Organizer – ClubOps Core</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#F0F2F9]">
            <button
              onClick={() => navigate('/meetings')}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center space-x-1"
            >
              <span>+ Schedule Meeting</span>
            </button>
          </div>
        </div>

        {/* 3. Projects Worked (MeetCraft Donut Chart Card) */}
        <div className="lg:col-span-4 meet-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-[#191E35]">Projects Worked</h2>
            <button 
              onClick={() => navigate('/tasks')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              See All
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            {/* SVG Donut Chart */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="42" stroke="#EDE9FE" strokeWidth="10" fill="transparent" />
                <circle
                  cx="56" cy="56" r="42"
                  stroke="#4F46E5" strokeWidth="10"
                  strokeDasharray="264"
                  strokeDashoffset="65"
                  strokeLinecap="round"
                  fill="transparent"
                />
                <circle
                  cx="56" cy="56" r="42"
                  stroke="#06B6D4" strokeWidth="10"
                  strokeDasharray="264"
                  strokeDashoffset="180"
                  strokeLinecap="round"
                  fill="transparent"
                />
                <circle
                  cx="56" cy="56" r="42"
                  stroke="#F59E0B" strokeWidth="10"
                  strokeDasharray="264"
                  strokeDashoffset="220"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-[#191E35]">{events.length || 4}</span>
                <span className="text-[10px] text-[#7A829D] font-medium">events</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-1.5 text-[11px] text-[#48506E] pr-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-primary-600" />
                <span className="truncate max-w-[110px] font-medium">{events[0]?.name || "Annual Tech Fest"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="truncate max-w-[110px] font-medium">{events[1]?.name || "Cultural Night"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="truncate max-w-[110px] font-medium">{events[2]?.name || "Hackathon Sprint"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span className="truncate max-w-[110px] font-medium">{events[3]?.name || "Alumni Mixer"}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F0F2F9] text-[11px] text-[#7A829D] flex items-center justify-between">
            <span>Overall Operations Velocity</span>
            <span className="font-bold text-emerald-600">{healthScore}% on track</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: Upcoming Events (Carousel) | Alerts (Status list)
      ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 1. Upcoming Events Card (Left 8 cols) */}
        <div className="lg:col-span-8 meet-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#191E35]">Upcoming Events</h2>
            <button 
              onClick={() => navigate('/tasks')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              See All
            </button>
          </div>

          {/* Horizontal Event Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="p-4 rounded-2xl bg-[#F8F9FE] border border-[#E9EDF7] flex flex-col justify-between hover:bg-white hover:shadow-sm transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  {/* Avatar stack */}
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">S</div>
                    <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">A</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#7A829D] border border-[#E5E9F2]">
                    {getDaysLeft(events[0]?.date)}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#191E35] truncate">
                  {events[0]?.name || "Annual Tech Fest 2026"}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EAEFF7]">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-[#7A829D]">Progress</span>
                  <span className="font-bold text-[#191E35]">83%</span>
                </div>
                <div className="w-full h-1.5 bg-[#E2E8F4] rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600 rounded-full" style={{ width: '83%' }} />
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-4 rounded-2xl bg-[#F8F9FE] border border-[#E9EDF7] flex flex-col justify-between hover:bg-white hover:shadow-sm transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">M</div>
                    <div className="w-6 h-6 rounded-full bg-rose-400 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">K</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#7A829D] border border-[#E5E9F2]">
                    {getDaysLeft(events[1]?.date || new Date(Date.now() + 12 * 86400000))}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#191E35] truncate">
                  {events[1]?.name || "Annual Cultural Gala"}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EAEFF7]">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-[#7A829D]">Progress</span>
                  <span className="font-bold text-[#191E35]">67%</span>
                </div>
                <div className="w-full h-1.5 bg-[#E2E8F4] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '67%' }} />
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-4 rounded-2xl bg-[#F8F9FE] border border-[#E9EDF7] flex flex-col justify-between hover:bg-white hover:shadow-sm transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">D</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#7A829D] border border-[#E5E9F2]">
                    {getDaysLeft(events[2]?.date || new Date(Date.now() + 18 * 86400000))}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#191E35] truncate">
                  {events[2]?.name || "Hackathon Grand Finale"}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EAEFF7]">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-[#7A829D]">Progress</span>
                  <span className="font-bold text-[#191E35]">48%</span>
                </div>
                <div className="w-full h-1.5 bg-[#E2E8F4] rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: '48%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Alerts Card (Right 4 cols) */}
        <div className="lg:col-span-4 meet-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#191E35]">Alerts</h2>
              <button 
                onClick={() => navigate('/risks')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                See All
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Alert 1 */}
              <div className="flex items-start space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="leading-snug">
                  <span className="font-semibold text-[#191E35]">Seating plan needs approval</span>{' '}
                  <span className="text-primary-600 font-medium">for {currentEvent?.name || 'Main Event'}</span>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="flex items-start space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <div className="leading-snug">
                  <span className="font-semibold text-[#191E35]">Sponsorship disbursement pending</span>{' '}
                  <span className="text-primary-600 font-medium">Title Sponsor contract</span>
                </div>
              </div>

              {/* Alert 3 */}
              <div className="flex items-start space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div className="leading-snug">
                  <span className="font-semibold text-[#191E35]">AV contractor not confirmed</span>{' '}
                  <span className="text-primary-600 font-medium">Soundcheck stage</span>
                </div>
              </div>

              {/* Alert 4 */}
              <div className="flex items-start space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <div className="leading-snug">
                  <span className="font-semibold text-[#191E35]">Volunteer shift reply pending</span>{' '}
                  <span className="text-primary-600 font-medium">Morning entry desk</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0F2F9] text-[11px] text-[#7A829D] flex items-center justify-between">
            <span>Risk Radar</span>
            <span className="font-bold text-amber-600">{risks.length} logged</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 3: Recent Templates (4 Columns as seen in MeetCraft)
      ────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#191E35]">Recent Templates</h2>
          <button 
            onClick={() => navigate('/brain')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            See All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((tpl, i) => (
            <div 
              key={i} 
              onClick={() => navigate('/tasks')}
              className="meet-card p-5 cursor-pointer hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F5F6FC] text-[#7A829D] border border-[#EAEFF7]">
                    {tpl.tag}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-[#F5F6FC] group-hover:bg-primary-50 text-[#7A829D] group-hover:text-primary-600 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 transform -rotate-45" />
                  </div>
                </div>

                <h3 className="text-xs font-bold text-[#191E35] mb-1">
                  {tpl.title}
                </h3>
                <p className="text-[11px] text-[#7A829D] leading-relaxed line-clamp-2">
                  {tpl.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F0F2F9] flex items-center justify-between text-[10px] text-[#8C93AE]">
                <span>1-Click Apply</span>
                <span className="font-semibold text-primary-600 group-hover:underline">Use Template &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Approval Modal */}
      <ActionConfirmationModal
        action={selectedAction}
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onSuccess={() => {
          refreshEvent();
        }}
      />
    </div>
  );
};
