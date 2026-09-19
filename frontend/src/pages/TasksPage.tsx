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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="live-pulse" />
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-primary-400" />
              <span>Tasks & Roadmap Execution</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage deliverables, assignees, deadlines, and dependencies across workstreams.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Switcher */}
          <div className="flex items-center bg-background-card border border-border p-1 rounded-xl">
            <button
              onClick={() => setView('KANBAN')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                view === 'KANBAN' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setView('LIST')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                view === 'LIST' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setView('TIMELINE')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                view === 'TIMELINE' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Filter tasks by title or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedTeam('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap ${
              selectedTeam === 'ALL' ? 'bg-primary-600 text-white' : 'bg-background-card border border-border text-slate-400'
            }`}
          >
            All Teams
          </button>
          {teams.map((tm) => (
            <button
              key={tm.id}
              onClick={() => setSelectedTeam(tm.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap ${
                selectedTeam === tm.id ? 'bg-primary-600 text-white' : 'bg-background-card border border-border text-slate-400'
              }`}
            >
              {tm.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {view === 'KANBAN' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter(t => t.status === col);
            return (
              <div key={col} className="bg-background-card/70 border border-border rounded-3xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/80">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{col.replace('_', ' ')}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-background-subtle text-slate-300">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl bg-background-subtle border border-border hover:border-border-highlight transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-primary-400 font-semibold truncate max-w-[120px]">
                          {t.team?.name || 'General'}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          t.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-primary-500/20 text-primary-300'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white leading-snug">{t.title}</div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{new Date(t.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <span className="text-slate-300 truncate max-w-[80px]">
                          {t.assignee?.name || 'Unassigned'}
                        </span>
                      </div>

                      {/* Quick Status Shift Selector */}
                      <div className="pt-2 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Move:</span>
                        <div className="flex space-x-1">
                          {columns.filter(c => c !== col).map((targetCol) => (
                            <button
                              key={targetCol}
                              onClick={() => handleStatusChange(t.id, targetCol)}
                              className="px-1.5 py-0.5 rounded bg-background-hover hover:bg-primary-600/30 text-slate-400 hover:text-white transition-colors"
                            >
                              {targetCol === 'IN_PROGRESS' ? 'PROG' : targetCol}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-500">No tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: LIST TABLE */}
      {view === 'LIST' && (
        <div className="bg-background-card border border-border rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-background-subtle border-b border-border text-[11px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Workstream</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assignee</th>
                  <th className="p-4">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-background-hover/50 transition-colors">
                    <td className="p-4 font-semibold text-white max-w-xs truncate">{t.title}</td>
                    <td className="p-4 text-slate-400">{t.team?.name || 'General'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        t.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-primary-500/20 text-primary-300'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className="bg-background-subtle border border-border px-2 py-1 rounded-lg text-xs text-slate-200"
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </td>
                    <td className="p-4 text-slate-300">{t.assignee?.name || 'Unassigned'}</td>
                    <td className="p-4 text-slate-400">{new Date(t.deadline).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: TIMELINE ROADMAP */}
      {view === 'TIMELINE' && (
        <div className="bg-background-card border border-border rounded-3xl p-6 space-y-4">
          <div className="text-xs font-semibold text-slate-400">Sprint 3 Gantt Roadmap:</div>
          <div className="space-y-3">
            {filteredTasks.slice(0, 10).map((t, idx) => (
              <div key={t.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white truncate max-w-sm">{t.title}</span>
                  <span className="text-[10px] text-slate-400">{new Date(t.deadline).toLocaleDateString()}</span>
                </div>
                <div className="w-full bg-background-subtle h-3 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, (idx + 1) * 12)}%` }}
                    className={`h-full rounded-full transition-all ${
                      t.status === 'DONE' ? 'bg-emerald-500' : t.status === 'BLOCKED' ? 'bg-amber-500' : 'bg-primary-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
