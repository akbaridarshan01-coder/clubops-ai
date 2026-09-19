import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  List, 
  Columns, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  ArrowRight,
  X,
  Loader2
} from 'lucide-react';
import { useEvent } from '../context/EventContext.js';
import { Task } from '../types/index.js';
import { api } from '../services/api.js';

export const TasksPage: React.FC = () => {
  const { currentEvent, refreshEvent } = useEvent();
  const [view, setView] = useState<'KANBAN' | 'LIST' | 'TIMELINE'>('KANBAN');
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    teamId: '',
    estimatedHours: 4,
  });
  const [creating, setCreating] = useState(false);

  const tasks: Task[] = currentEvent?.tasks || [];
  const teams = currentEvent?.club?.teams || [];

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      setToastMessage('Task status updated successfully!');
      refreshEvent();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !newTask.title.trim()) return;
    setCreating(true);
    try {
      await api.createTask({
        eventId: currentEvent.id,
        ...newTask,
        teamId: newTask.teamId || undefined,
      });
      setCreateModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        teamId: '',
        estimatedHours: 4,
      });
      setToastMessage('New operational task created!');
      refreshEvent();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    const matchesTeam = selectedTeam === 'ALL' || t.teamId === selectedTeam;
    return matchesSearch && matchesTeam;
  });

  const columns: ('TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE')[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAEFF7]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-[#191E35] flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-primary-600" />
              <span>Tasks & Deliverables</span>
            </h1>
            <span className="w-5 h-5 rounded-full bg-[#EDE9FE] text-primary-600 text-[11px] font-bold flex items-center justify-center">
              {tasks.length}
            </span>
          </div>
          <p className="text-xs text-[#7A829D] mt-0.5">
            Deliverables, deadlines, assignees, and roadmap timelines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Switcher (MeetCraft Pills) */}
          <div className="flex items-center bg-white border border-[#E4E8F2] p-1 rounded-xl shadow-2xs">
            <button
              onClick={() => setView('KANBAN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                view === 'KANBAN' ? 'bg-[#EDE9FE] text-primary-700 font-bold' : 'text-[#626A87] hover:text-[#191E35]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setView('LIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                view === 'LIST' ? 'bg-[#EDE9FE] text-primary-700 font-bold' : 'text-[#626A87] hover:text-[#191E35]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setView('TIMELINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                view === 'TIMELINE' ? 'bg-[#EDE9FE] text-primary-700 font-bold' : 'text-[#626A87] hover:text-[#191E35]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* No event selected */}
      {!currentEvent && (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center meet-card p-12">
          <CheckSquare className="w-10 h-10 text-[#CBD2E2]" />
          <p className="text-[#191E35] font-semibold">No event selected</p>
          <p className="text-xs text-[#7A829D]">Select an event from the top switcher to view its tasks and roadmap.</p>
        </div>
      )}

      {/* Event selected but no tasks yet */}
      {currentEvent && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center meet-card p-12">
          <CheckSquare className="w-10 h-10 text-[#CBD2E2]" />
          <p className="text-[#191E35] font-semibold">No tasks for "{currentEvent.name}" yet</p>
          <p className="text-xs text-[#7A829D]">Click <span className="text-primary-600 font-bold">+ New Task</span> to add the first deliverable for this event.</p>
        </div>
      )}

      {/* Filter Bar — only show when there are tasks */}
      {currentEvent && tasks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#8C93AE] absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter tasks by title or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#E4E8F2] focus:border-primary-500 rounded-xl pl-10 pr-4 py-2 text-xs text-[#191E35] placeholder-[#8C93AE] focus:outline-none shadow-2xs"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setSelectedTeam('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedTeam === 'ALL' ? 'bg-[#EDE9FE] text-primary-700 font-bold' : 'bg-white border border-[#E4E8F2] text-[#626A87]'
              }`}
            >
              All Teams
            </button>
            {teams.map((tm) => (
              <button
                key={tm.id}
                onClick={() => setSelectedTeam(tm.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedTeam === tm.id ? 'bg-[#EDE9FE] text-primary-700 font-bold' : 'bg-white border border-[#E4E8F2] text-[#626A87]'
                }`}
              >
                {tm.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 1: KANBAN BOARD */}
      {currentEvent && tasks.length > 0 && view === 'KANBAN' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter(t => t.status === col);
            return (
              <div key={col} className="bg-[#F8F9FE] border border-[#E9EDF7] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#EAEFF7]">
                  <span className="text-xs font-bold text-[#191E35] uppercase tracking-wider">{col.replace('_', ' ')}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-primary-700 shadow-2xs border border-[#E4E8F2]">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-white border border-[#E8ECF4] hover:shadow-sm hover:border-primary-200 transition-all space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-primary-600 font-bold truncate max-w-[120px] bg-primary-50 px-2 py-0.5 rounded-md">
                          {t.team?.name || 'General'}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          t.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#191E35] leading-snug">{t.title}</div>

                      <div className="pt-2 border-t border-[#F0F2F9] flex items-center justify-between text-[10px] text-[#7A829D]">
                        <span>{new Date(t.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <span className="text-[#323955] font-medium truncate max-w-[80px]">
                          {t.assignee?.name || 'Unassigned'}
                        </span>
                      </div>

                      {/* Quick Status Shift Selector */}
                      <div className="pt-2 flex items-center justify-between text-[10px]">
                        <span className="text-[#8C93AE]">Move:</span>
                        <div className="flex space-x-1">
                          {columns.filter(c => c !== col).map((targetCol) => (
                            <button
                              key={targetCol}
                              onClick={() => handleStatusChange(t.id, targetCol)}
                              className="px-1.5 py-0.5 rounded bg-[#F5F6FC] hover:bg-primary-50 text-[#626A87] hover:text-primary-600 font-medium transition-colors border border-[#E8ECF4]"
                            >
                              {targetCol === 'IN_PROGRESS' ? 'PROG' : targetCol}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="py-8 text-center text-xs text-[#8C93AE]">No tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: LIST TABLE */}
      {currentEvent && tasks.length > 0 && view === 'LIST' && (
        <div className="bg-white border border-[#EAEFF7] rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#323955]">
              <thead className="bg-[#F8F9FE] border-b border-[#EAEFF7] text-[11px] font-bold uppercase text-[#7A829D]">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Workstream</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assignee</th>
                  <th className="p-4">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F9]">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F8F9FE] transition-colors">
                    <td className="p-4 font-semibold text-[#191E35] max-w-xs truncate">{t.title}</td>
                    <td className="p-4 text-[#7A829D]">{t.team?.name || 'General'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-600' : 'bg-primary-50 text-primary-600'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className="bg-[#F5F6FC] border border-[#E4E8F2] px-2 py-1 rounded-lg text-xs text-[#191E35] font-medium"
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </td>
                    <td className="p-4 text-[#48506E] font-medium">{t.assignee?.name || 'Unassigned'}</td>
                    <td className="p-4 text-[#7A829D]">{new Date(t.deadline).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: TIMELINE — Chronological Event Timeline */}
      {currentEvent && tasks.length > 0 && view === 'TIMELINE' && (() => {
        const now = new Date();

        // Build unified timeline entries from all event data
        const entries: {
          date: Date;
          label: string;
          sublabel?: string;
          type: 'event_created' | 'task' | 'meeting' | 'risk' | 'event_day' | 'event_end';
          status?: string;
          priority?: string;
          isToday?: boolean;
          isPast?: boolean;
        }[] = [];

        // Event created
        if (currentEvent.createdAt) {
          entries.push({
            date: new Date(currentEvent.createdAt),
            label: `Event Created: "${currentEvent.name}"`,
            sublabel: `Type: ${currentEvent.type} · Location: ${currentEvent.location}`,
            type: 'event_created',
          });
        }

        // All task deadlines
        tasks.forEach(t => {
          entries.push({
            date: new Date(t.deadline),
            label: t.title,
            sublabel: `${t.team?.name || 'General'} · ${t.estimatedHours || '?'}h estimated`,
            type: 'task',
            status: t.status,
            priority: t.priority,
          });
        });

        // Meetings
        (currentEvent.meetings || []).forEach((m: any) => {
          entries.push({
            date: new Date(m.date),
            label: m.title || 'Team Meeting',
            sublabel: m.location || 'Meeting',
            type: 'meeting',
            status: m.status,
          });
        });

        // Risks (by createdAt)
        (currentEvent.risks || []).forEach((r: any) => {
          entries.push({
            date: new Date(r.createdAt),
            label: `⚠ Risk: ${r.title}`,
            sublabel: `${r.category} · ${r.severity} severity`,
            type: 'risk',
            status: r.status,
          });
        });

        // Event day
        entries.push({
          date: new Date(currentEvent.date),
          label: `🎯 EVENT DAY — ${currentEvent.name}`,
          sublabel: currentEvent.location,
          type: 'event_day',
        });

        // Event end (if provided)
        if (currentEvent.endDate) {
          entries.push({
            date: new Date(currentEvent.endDate),
            label: `🏁 Event Ends — ${currentEvent.name}`,
            sublabel: 'Wrap-up & post-event activities begin',
            type: 'event_end',
          });
        }

        // Sort all entries chronologically
        entries.sort((a, b) => a.date.getTime() - b.date.getTime());

        const typeConfig: Record<string, { color: string; dot: string; badge: string }> = {
          event_created: { color: 'text-sky-700',   dot: 'bg-sky-500',     badge: 'bg-sky-50 text-sky-700 border-sky-200' },
          task:          { color: 'text-[#191E35]', dot: 'bg-primary-600', badge: 'bg-primary-50 text-primary-700 border-primary-200' },
          meeting:       { color: 'text-violet-700',dot: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700 border-violet-200' },
          risk:          { color: 'text-amber-700', dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
          event_day:     { color: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          event_end:     { color: 'text-rose-700',  dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200' },
        };

        const statusBadge = (status?: string, priority?: string) => {
          if (!status) return null;
          const sColor: Record<string, string> = {
            DONE: 'bg-emerald-50 text-emerald-700', IN_PROGRESS: 'bg-blue-50 text-blue-700',
            BLOCKED: 'bg-rose-50 text-rose-700', TODO: 'bg-slate-100 text-slate-600',
            IDENTIFIED: 'bg-amber-50 text-amber-700', MITIGATING: 'bg-orange-50 text-orange-700',
            RESOLVED: 'bg-emerald-50 text-emerald-700',
          };
          const pColor: Record<string, string> = {
            CRITICAL: 'bg-rose-50 text-rose-700', HIGH: 'bg-orange-50 text-orange-700',
            MEDIUM: 'bg-yellow-50 text-yellow-700', LOW: 'bg-slate-100 text-slate-600',
          };
          return (
            <span className="flex items-center gap-1 flex-wrap">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${sColor[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
              {priority && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${pColor[priority] || ''}`}>{priority}</span>}
            </span>
          );
        };

        // Today marker position
        const todayIdx = entries.findIndex(e => e.date > now);

        return (
          <div className="bg-white border border-[#EAEFF7] rounded-2xl p-6 space-y-2 shadow-2xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEFF7]">
              <div>
                <h3 className="text-sm font-bold text-[#191E35]">{currentEvent.name} — Event Timeline</h3>
                <p className="text-[11px] text-[#7A829D] mt-0.5">{entries.length} key dates · sorted chronologically</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-[#626A87]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500 inline-block"/>Created</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-600 inline-block"/>Tasks</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block"/>Meetings</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"/>Risks</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Event Day</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative pt-2">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-4 bottom-4 w-px bg-[#EAEFF7]" />

              <div className="space-y-1">
                {entries.map((entry, idx) => {
                  const cfg = typeConfig[entry.type] || typeConfig.task;
                  const isPast = entry.date < now;
                  const isEventDay = entry.type === 'event_day';
                  const isTodayLine = todayIdx === idx;

                  return (
                    <React.Fragment key={idx}>
                      {/* "TODAY" marker */}
                      {isTodayLine && (
                        <div className="flex items-center gap-3 pl-10 py-1">
                          <div className="h-px flex-1 bg-emerald-400 border-dashed border-t border-emerald-400" />
                          <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200 shrink-0">TODAY ↓</span>
                          <div className="h-px flex-1 bg-emerald-400" />
                        </div>
                      )}

                      <div className={`relative flex items-start gap-4 px-1 py-2.5 rounded-xl transition-all ${
                        isEventDay ? 'bg-emerald-50/70 border border-emerald-200' :
                        isPast ? 'opacity-60' : 'hover:bg-[#F8F9FE]'
                      }`}>
                        {/* Dot */}
                        <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 ${
                          isEventDay ? 'border-emerald-500 bg-white' :
                          isPast && entry.type === 'task' && entry.status === 'DONE' ? 'border-emerald-500 bg-emerald-50' :
                          `border-[#E4E8F2] bg-white`
                        }`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${isPast && entry.type !== 'event_day' ? 'opacity-50' : ''}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <span className={`text-xs font-bold leading-snug ${isEventDay ? 'text-emerald-800 text-sm' : cfg.color} ${isPast && entry.status !== 'DONE' ? 'line-through opacity-70' : ''}`}>
                              {entry.label}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {statusBadge(entry.status, entry.priority)}
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${cfg.badge}`}>
                                {entry.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: entry.date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })}
                              </span>
                            </div>
                          </div>
                          {entry.sublabel && (
                            <p className="text-[10px] text-[#7A829D] mt-0.5 truncate">{entry.sublabel}</p>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create Task Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="fixed inset-0" onClick={() => setCreateModalOpen(false)} />
          <div className="relative w-full max-w-md bg-background-card border border-border rounded-3xl shadow-2xl p-6 z-10 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="text-base font-bold text-white">Create New Operational Task</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Confirm 50kVA backup diesel generator"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Workstream Team</label>
                  <select
                    value={newTask.teamId}
                    onChange={(e) => setNewTask({ ...newTask, teamId: e.target.value })}
                    className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- General --</option>
                    {teams.map((tm) => (
                      <option key={tm.id} value={tm.id}>{tm.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                    className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-1.5"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Deliverable</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
