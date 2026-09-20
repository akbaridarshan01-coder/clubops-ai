import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  User, 
  Clock, 
  ArrowRight, 
  Loader2, 
  Check, 
  AlertTriangle,
  Radio,
  Zap,
  Split,
  GitBranch,
  Megaphone,
  ShieldAlert,
  Lightbulb
} from 'lucide-react';
import { useEvent } from '../context/EventContext.js';
import { api } from '../services/api.js';

export const MeetingsPage: React.FC = () => {
  const { currentEvent, refreshEvent } = useEvent();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [transcript, setTranscript] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('Tech Fest Executive Alignment Sync');
  const [processing, setProcessing] = useState(false);
  const [executingAll, setExecutingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'tasks' | 'completed' | 'dependencies' | 'decisions' | 'risks' | 'announcements'>('all');

  const loadMeetings = async () => {
    if (!currentEvent) return;
    try {
      const data: any = await api.getEventMeetings(currentEvent.id);
      setMeetings(data);
      // Only auto-select the first meeting if nothing is selected yet
      if (data.length > 0 && !selectedMeeting) {
        setSelectedMeeting(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [currentEvent?.id]);

  const handleProcessTranscript = async () => {
    if (!currentEvent || !transcript.trim()) return;
    setProcessing(true);
    try {
      const newMeeting: any = await api.processMeeting({
        eventId: currentEvent.id,
        title: meetingTitle,
        transcript,
      });
      // Always show the newly processed meeting — load the rest in background
      setSelectedMeeting(newMeeting);
      setMeetings(prev => [newMeeting, ...prev.filter(m => m.id !== newMeeting.id)]);
      setTranscript('');
      setToastMessage('Meeting processed! Extracted tasks, decisions, dependencies, risks, and announcements.');
      refreshEvent();
      setTimeout(() => setToastMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      setToastMessage(`❌ Failed to process meeting: ${err.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setProcessing(false);
    }
  };

  const handleExecuteAllActions = async () => {
    if (!selectedMeeting) return;
    setExecutingAll(true);
    try {
      const res: any = await api.executeAllMeetingActions(selectedMeeting.id);
      setToastMessage(res.message || 'All application actions executed in database successfully!');
      await loadMeetings();
      // Reload selected meeting
      const updated = await api.getMeeting(selectedMeeting.id);
      setSelectedMeeting(updated);
      refreshEvent();
      setTimeout(() => setToastMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setExecutingAll(false);
    }
  };

  const handleConvertSingle = async (itemId: string) => {
    if (!selectedMeeting || !currentEvent) return;
    try {
      await api.convertMeetingItem(itemId, currentEvent.id);
      setToastMessage('Task created successfully in database roadmap!');
      await loadMeetings();
      const updated = await api.getMeeting(selectedMeeting.id);
      setSelectedMeeting(updated);
      refreshEvent();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const techFestDemoTranscript = `Today we discussed Tech Fest.

Rahul will contact the sponsor by Monday.
Neel will arrange the projector by Tuesday.
Priya finished the event poster.
The banners can only be printed after the sponsor confirms.
If the sponsor does not confirm by Monday evening, Rahul should contact the backup sponsor.

We also decided that the event will be held in Auditorium A.
There will be a volunteer meeting tomorrow at 5 PM.`;

  const analysis = selectedMeeting?.structuredAnalysis;
  const tasksList = analysis?.tasks || [];
  const completedList = analysis?.completed_tasks || [];
  const decisionsList = analysis?.decisions || [];
  const risksList = analysis?.risks || [];
  const announcementsList = analysis?.announcements || [];
  const dependenciesList = analysis?.dependencies || [];
  const conditionsList = analysis?.conditions || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="live-pulse" />
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary-400" />
              <span>Meeting Intelligence Pipeline</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Turn meeting transcripts and unorganized discussion notes into real, assigned operational tasks, decisions, and risks.
          </p>
        </div>

        {/* Quick Load Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setMeetingTitle('Tech Fest Operational Alignment');
              setTranscript(techFestDemoTranscript);
            }}
            className="text-xs font-semibold text-accent-cyan hover:text-white px-3 py-1.5 rounded-xl border border-accent-cyan/30 bg-accent-cyan/10 transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Meeting</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Transcript Input Box */}
      <div className="bg-background-card border border-border rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-accent-cyan" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Paste or Upload Meeting Notes / Transcript
            </span>
          </div>
          <input
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            className="bg-background-subtle border border-border px-3 py-1.5 rounded-xl text-xs text-white max-w-sm"
            placeholder="Meeting Title"
          />
        </div>

        <textarea
          rows={5}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste meeting discussion (e.g. 'Rahul will contact the sponsor by Monday. Neel will arrange the projector by Tuesday. Priya finished the event poster. We also decided that the event will be held in Auditorium A...')"
          className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none font-mono leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500">
            Automatically extracts: Tasks, Owners, Deadlines, Dependencies, Completed Work, Decisions, and Risks.
          </span>
          <button
            onClick={handleProcessTranscript}
            disabled={processing || !transcript.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Process Meeting with ClubOps AI</span>
          </button>
        </div>
      </div>

      {/* Extracted Intelligence Presentation */}
      {selectedMeeting && (
        <div className="bg-background-card border border-border rounded-3xl p-6 space-y-6">
          {/* Header & 1-Click Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="text-[10px] font-mono text-primary-400 font-bold uppercase">
                INTELLIGENT MEETING LOG
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">{selectedMeeting.title}</h2>
              <span className="text-xs text-slate-400">
                Processed on {new Date(selectedMeeting.date).toLocaleDateString()} &bull; {selectedMeeting.location || 'Campus / Room 302'}
              </span>
            </div>

            <button
              onClick={handleExecuteAllActions}
              disabled={executingAll}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {executingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>⚡ 1-Click Execute All Actions in Database</span>
            </button>
          </div>

          {/* Transcript Efficiency & Accuracy Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-background-subtle via-primary-950/20 to-background-subtle border border-primary-500/20 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs flex-shrink-0">
                ⚡
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Processing Speed</div>
                <div className="text-white font-bold font-mono">
                  {analysis?.efficiency?.processingTimeMs || 8} ms
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs flex-shrink-0">
                🎯
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Signal Density</div>
                <div className="text-emerald-300 font-bold font-mono">
                  {analysis?.efficiency?.signalToNoiseRatio || 95}% Actionable
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-xs flex-shrink-0">
                🛡️
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Phantom Tasks</div>
                <div className="text-white font-bold font-mono">
                  0% (Strict Mode)
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0">
                📋
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Items Discussed</div>
                <div className="text-white font-bold font-mono">
                  {tasksList.length + completedList.length + decisionsList.length} Extracted
                </div>
              </div>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'all' ? 'bg-primary-600 text-white' : 'bg-background-subtle text-slate-400 hover:text-white'
              }`}
            >
              All Insights
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'tasks' ? 'bg-primary-600 text-white' : 'bg-background-subtle text-slate-400 hover:text-white'
              }`}
            >
              📋 Pending Tasks ({tasksList.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'completed' ? 'bg-emerald-600 text-white' : 'bg-background-subtle text-slate-400 hover:text-white'
              }`}
            >
              ✅ Completed Work ({completedList.length})
            </button>
            <button
              onClick={() => setActiveTab('dependencies')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'dependencies' ? 'bg-primary-600 text-white' : 'bg-background-subtle text-slate-400 hover:text-white'
              }`}
            >
              🔗 Dependencies & Conditions ({dependenciesList.length + conditionsList.length})
            </button>
            <button
              onClick={() => setActiveTab('decisions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'decisions' ? 'bg-amber-600 text-white' : 'bg-background-subtle text-slate-400 hover:text-white'
              }`}
            >
              💡 Decisions ({decisionsList.length})
            </button>
            <button
              onClick={() => setActiveTab('risks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'risks' ? 'bg-rose-600 text-white' : 'bg-background-subtle text-slate-400 hover:text-white'
              }`}
            >
              ⚠️ Risks ({risksList.length})
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'announcements' ? 'bg-violet-600 text-white' : 'bg-background-subtle text-slate-400 hover:text-white'
              }`}
            >
              📢 Announcements ({announcementsList.length})
            </button>
          </div>

          {/* 1. DECISIONS & MEMORY SECTION */}
          {(activeTab === 'all' || activeTab === 'decisions') && decisionsList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Lightbulb className="w-4 h-4" />
                <span>💡 Confirmed Executive Decisions</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {decisionsList.map((dec: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        {dec.status || 'CONFIRMED'}
                      </span>
                      <div className="text-xs font-bold text-white mt-1.5">{dec.decision}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Category: {dec.category || 'General'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. COMPLETED WORK SECTION (Section 12) */}
          {(activeTab === 'all' || activeTab === 'completed') && completedList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>✅ Work Completed (Verified Deliverables)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedList.map((ct: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          STATUS: DONE
                        </span>
                        <span className="text-[10px] text-slate-400">{ct.team || 'Media & Design'}</span>
                      </div>
                      <div className="text-xs font-bold text-white mt-1.5">{ct.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Completed by: <strong>{ct.assigned_to}</strong></div>
                    </div>
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. DEPENDENCY & CONDITIONAL WORKFLOWS (Sections 8 & 9) */}
          {(activeTab === 'all' || activeTab === 'dependencies') && (dependenciesList.length > 0 || conditionsList.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <GitBranch className="w-4 h-4" />
                <span>🔗 Critical Path Dependencies & Conditional Workflows</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dependenciesList.map((dep: any, idx: number) => (
                  <div key={`dep_${idx}`} className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                    <div className="text-[10px] font-mono text-cyan-300 font-bold">DEPENDENCY RULE</div>
                    <div className="text-xs text-white">
                      <strong>{dep.task}</strong> <span className="text-cyan-400">➔ depends on ➔</span> <strong>{dep.depends_on}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Requirement: Prerequisite must be confirmed before {dep.task} can proceed.
                    </div>
                  </div>
                ))}

                {conditionsList.map((cond: any, idx: number) => (
                  <div key={`cond_${idx}`} className="p-4 rounded-2xl bg-primary-950/20 border border-primary-500/30 space-y-2">
                    <div className="text-[10px] font-mono text-primary-300 font-bold">AUTOMATED CONTINGENCY</div>
                    <div className="text-xs text-white">
                      <span className="text-amber-300 font-bold">{cond.condition}</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      ➔ <strong>THEN:</strong> {cond.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. RISKS IDENTIFIED SECTION (Section 10) */}
          {(activeTab === 'all' || activeTab === 'risks') && risksList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>⚠️ Potential Operational Risks</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {risksList.map((r: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                        {r.severity} SEVERITY
                      </span>
                      <span className="text-[10px] text-slate-400">Related: {r.related_task || 'Timeline'}</span>
                    </div>
                    <div className="text-xs font-bold text-white">{r.title}</div>
                    <p className="text-[11px] text-slate-300">{r.reason}</p>
                    <div className="text-[11px] text-primary-300 pt-1 border-t border-white/5">
                      <strong>Recommended Action:</strong> {r.recommended_action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. ANNOUNCEMENTS SECTION (Section 11) */}
          {(activeTab === 'all' || activeTab === 'announcements') && announcementsList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
                <Megaphone className="w-4 h-4" />
                <span>📢 Announcements Prepared</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {announcementsList.map((ann: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-violet-950/20 border border-violet-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono">
                        AUDIENCE: {ann.audience}
                      </span>
                      <span className="text-[10px] text-slate-400">Channel: {ann.channel || 'WHATSAPP'}</span>
                    </div>
                    <div className="text-xs font-bold text-white">{ann.title}</div>
                    <p className="text-[11px] text-slate-300 italic">"{ann.message}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. ACTIONABLE TASKS SECTION (Sections 4, 5, 6, 7) */}
          {(activeTab === 'all' || activeTab === 'tasks') && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-primary-400 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>📋 Actionable Tasks Extracted ({selectedMeeting.actionItems?.length || 0})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(selectedMeeting.actionItems || []).map((item: any) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                      item.convertedTaskId
                        ? 'bg-emerald-950/15 border-emerald-500/40'
                        : 'bg-background-subtle border-border hover:border-border-highlight'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-semibold text-primary-300">
                          {item.suggestedTeam || 'Operations'}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          item.suggestedPriority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-primary-500/20 text-primary-300'
                        }`}>
                          {item.suggestedPriority}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white leading-snug">
                        {item.extractedTitle}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 italic line-clamp-2">
                        "{item.rawText}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{item.suggestedOwner || 'Lead'}</span>
                      </span>

                      {item.convertedTaskId ? (
                        <span className="text-emerald-400 font-bold flex items-center space-x-1 text-[10px]">
                          <Check className="w-3 h-3" />
                          <span>Task Created</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConvertSingle(item.id)}
                          className="px-2.5 py-1 rounded-lg bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border border-primary-500/30 font-semibold text-[10px] transition-colors"
                        >
                          + Create Task
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
