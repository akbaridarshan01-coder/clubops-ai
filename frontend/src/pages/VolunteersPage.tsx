import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Sparkles, 
  Star, 
  CheckCircle2, 
  Search, 
  Check,
  UserPlus,
  X,
  Loader2,
  AlertCircle,
  Briefcase,
  Edit2,
  Trash2
} from 'lucide-react';
import { useEvent } from '../context/EventContext.js';
import { Volunteer } from '../types/index.js';
import { api } from '../services/api.js';

export const VolunteersPage: React.FC = () => {
  const { currentClub, currentEvent, refreshEvent } = useEvent();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selectedTaskForMatch, setSelectedTaskForMatch] = useState<string>('');
  const [matchedResults, setMatchedResults] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [matching, setMatching] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add/Edit Volunteer Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    teamId: '',
    skills: '',
    experienceYears: '',
  });

  const loadVolunteers = async () => {
    if (!currentClub?.id) return;
    try {
      const data: any = await api.getVolunteers(currentClub.id);
      setVolunteers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load volunteers:', err);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, [currentClub?.id]);

  const tasks = currentEvent?.tasks || [];
  const teams = currentClub?.teams || [];

  const handleMatchForTask = async (taskId: string) => {
    setSelectedTaskForMatch(taskId);
    if (!taskId) {
      setMatchedResults([]);
      return;
    }
    setMatching(true);
    try {
      const results: any = await api.matchVolunteersForTask(taskId);
      setMatchedResults(Array.isArray(results) ? results : []);
    } catch (err: any) {
      console.error(err);
      setToastMessage(`Error matching volunteers: ${err.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setMatching(false);
    }
  };

  const handleAssignVolunteer = async (volunteerId: string) => {
    if (!selectedTaskForMatch) return;
    setAssigningId(volunteerId);
    try {
      await api.assignTask(selectedTaskForMatch, volunteerId);
      setToastMessage('✅ Volunteer assigned successfully to task!');
      await refreshEvent();
      await loadVolunteers();
      // Re-run matching to update workload and status
      const results: any = await api.matchVolunteersForTask(selectedTaskForMatch);
      setMatchedResults(Array.isArray(results) ? results : []);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setToastMessage(`❌ Failed to assign: ${err.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setAssigningId(null);
    }
  };

  const handleOpenAdd = () => {
    setEditingVolunteer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      teamId: '',
      skills: '',
      experienceYears: '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (vol: Volunteer) => {
    setEditingVolunteer(vol);
    let skillsStr = '';
    if (vol.skills) {
      try {
        const parsed = JSON.parse(vol.skills);
        skillsStr = Array.isArray(parsed) ? parsed.join(', ') : String(parsed);
      } catch {
        skillsStr = String(vol.skills);
      }
    }
    setFormData({
      name: vol.name || '',
      email: vol.email || '',
      phone: vol.phone || '',
      teamId: vol.teamId || '',
      skills: skillsStr,
      experienceYears: vol.experienceYears !== undefined && vol.experienceYears !== null ? String(vol.experienceYears) : '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleDeleteVolunteer = async (vol: Volunteer) => {
    if (!window.confirm(`Are you sure you want to remove "${vol.name}" from the roster?`)) {
      return;
    }
    setDeletingId(vol.id);
    try {
      await api.deleteVolunteer(vol.id);
      setToastMessage(`🗑️ Volunteer "${vol.name}" removed successfully.`);
      setTimeout(() => setToastMessage(null), 4000);
      await loadVolunteers();
      if (selectedTaskForMatch) {
        handleMatchForTask(selectedTaskForMatch);
      }
    } catch (err: any) {
      setToastMessage(`❌ Failed to remove volunteer: ${err.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClub?.id) {
      setFormError('Please select or create a club first.');
      return;
    }
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const skillsArray = formData.skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const expNum = formData.experienceYears.trim() === '' ? 0 : Number(formData.experienceYears);

      if (editingVolunteer) {
        await api.updateVolunteer(editingVolunteer.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          teamId: formData.teamId || null,
          skills: skillsArray,
          experienceYears: isNaN(expNum) ? 0 : expNum,
        });
        setToastMessage(`✅ Volunteer "${formData.name.trim()}" updated successfully!`);
      } else {
        await api.createVolunteer({
          clubId: currentClub.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          teamId: formData.teamId || undefined,
          skills: skillsArray,
          experienceYears: isNaN(expNum) ? 0 : expNum,
        });
        setToastMessage(`✅ Volunteer "${formData.name.trim()}" added successfully!`);
      }

      setTimeout(() => setToastMessage(null), 4000);
      setIsAddModalOpen(false);
      setEditingVolunteer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        teamId: '',
        skills: '',
        experienceYears: '',
      });
      await loadVolunteers();
      if (selectedTaskForMatch) {
        handleMatchForTask(selectedTaskForMatch);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save volunteer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVolunteers = volunteers.filter((v) => {
    const skillsText = typeof v.skills === 'string' ? v.skills : JSON.stringify(v.skills || []);
    return (
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      skillsText.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getWorkloadBadge = (wl: string) => {
    switch (wl) {
      case 'LOW': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'MEDIUM': return 'bg-primary-500/20 text-primary-300 border-primary-500/30';
      case 'HIGH': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'OVERLOADED': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="live-pulse" />
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary-400" />
              <span>Smart Volunteer Matching & Directory</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            AI evaluated skill rankings, availability status, and workload balancing across club operations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search volunteers by skill or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-glow transition-all flex items-center space-x-1.5 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Volunteer</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AI Task Matcher Trigger Bar */}
      <div className="p-5 rounded-3xl bg-background-card border border-primary-500/30 shadow-glass space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-accent-cyan" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Run Smart Volunteer Match for a Task
            </span>
          </div>
          {matching && (
            <span className="text-xs text-primary-400 flex items-center space-x-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing skills & workload...</span>
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={selectedTaskForMatch}
            onChange={(e) => handleMatchForTask(e.target.value)}
            className="flex-1 bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
          >
            <option value="">-- Select an unassigned or priority task to match --</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.priority}] • {t.title} {t.assignee ? `(Assigned: ${t.assignee.name})` : '(Unassigned)'}
              </option>
            ))}
          </select>
        </div>

        {/* Matched Volunteers Showcase */}
        {selectedTaskForMatch && matchedResults.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
            <div className="text-xs font-semibold text-primary-300">
              Top Recommended Candidates (Ranked by Skill Overlap & Workload Capacity):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {matchedResults.map((m) => (
                <div key={m.volunteer.id} className="p-4 rounded-2xl bg-background-subtle border border-border-highlight space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{m.volunteer.name}</span>
                    <span className="text-xs font-extrabold text-emerald-400 font-mono">
                      {m.matchPercentage}% Match
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-mono border ${getWorkloadBadge(m.workload)}`}>
                      Workload: {m.workload}
                    </span>
                    <span className="text-slate-400">★ {Number(m.volunteer.rating || 4.5).toFixed(1)}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {m.explanation}
                  </p>
                  <button
                    onClick={() => handleAssignVolunteer(m.volunteer.id)}
                    disabled={assigningId === m.volunteer.id}
                    className="w-full mt-2 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                  >
                    {assigningId === m.volunteer.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Assigning...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Assign to Task</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTaskForMatch && matchedResults.length === 0 && !matching && (
          <div className="mt-3 text-xs text-slate-400 p-3 rounded-xl bg-background-subtle border border-border">
            {volunteers.length === 0
              ? 'No volunteers registered in this club yet. Click "+ Add Volunteer" to add candidates for smart matching.'
              : 'No matching volunteers found for this task criteria.'}
          </div>
        )}
      </div>

      {/* Volunteer Directory Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Active Volunteer Roster ({filteredVolunteers.length})
        </h2>
      </div>

      {/* Empty State when zero volunteers */}
      {volunteers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-background-card border border-border/80 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Volunteers Registered Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Add your committee members and student volunteers to enable AI skill matching, workload distribution, and task assignment.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-glow transition-all inline-flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add First Volunteer</span>
          </button>
        </div>
      ) : (
        /* Volunteer Directory Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVolunteers.map((vol) => {
            let skillsList: string[] = [];
            if (vol.skills) {
              try {
                const parsed = JSON.parse(vol.skills);
                skillsList = Array.isArray(parsed) ? parsed : [String(parsed)];
              } catch {
                skillsList = vol.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
              }
            }

            return (
              <div
                key={vol.id}
                className="p-5 rounded-2xl bg-background-card border border-border hover:border-border-highlight transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white truncate">{vol.name}</h3>
                      <div className="text-xs text-slate-400 truncate">{vol.email}</div>
                      {vol.phone && <div className="text-[10px] text-slate-500 mt-0.5">{vol.phone}</div>}
                    </div>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getWorkloadBadge(vol.currentWorkload)}`}>
                        {vol.currentWorkload}
                      </span>
                      <button
                        onClick={() => handleOpenEdit(vol)}
                        title="Edit volunteer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-white/5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVolunteer(vol)}
                        disabled={deletingId === vol.id}
                        title="Remove volunteer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                      >
                        {deletingId === vol.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {skillsList.length > 0 ? (
                      skillsList.slice(0, 5).map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No specific skills listed</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="truncate">Team: <strong className="text-slate-200">{vol.team?.name || 'General Operations'}</strong></span>
                    {vol.experienceYears !== undefined && vol.experienceYears !== null && (
                      <span className="text-slate-500 font-mono">• {vol.experienceYears}y exp</span>
                    )}
                  </div>
                  <span className="flex items-center space-x-1 text-amber-400 font-semibold flex-shrink-0">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{Number(vol.rating || 4.5).toFixed(1)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Volunteer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-background/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-background-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
                  {editingVolunteer ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingVolunteer ? 'Edit Volunteer Details' : 'Add Volunteer to Roster'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveVolunteer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. priya@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Team / Department</label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                    className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- General Operations --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Experience (Years)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stage Management, Logistics, Audio, Social Media"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  The AI matcher uses these skill keywords to calculate task match percentage.
                </span>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingVolunteer ? 'Save Changes' : 'Add Volunteer'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
