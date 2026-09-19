import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  User, 
  Clock, 
  ArrowRight, 
  Loader2, 
  Check, 
  Upload,
  AlertTriangle
} from 'lucide-react';
import { useEvent } from '../context/EventContext.js';
import { api } from '../services/api.js';

export const MeetingsPage: React.FC = () => {
  const { currentEvent, refreshEvent } = useEvent();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [transcript, setTranscript] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('Sprint 4 Venue & Volunteer Alignment Sync');
  const [processing, setProcessing] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadMeetings = async () => {
    if (!currentEvent) return;
    try {
      const data: any = await api.getEventMeetings(currentEvent.id);
      setMeetings(data);
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
      setMeetings([newMeeting, ...meetings]);
      setSelectedMeeting(newMeeting);
      setTranscript('');
      setToastMessage('Transcript parsed: Extracted 7 operational action items!');
      refreshEvent();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleConvertAll = async () => {
    if (!selectedMeeting) return;
    setCreatingTasks(true);
    try {
      const res: any = await api.convertAllMeetingItems(selectedMeeting.id);
      setToastMessage(res.message || 'All action items converted to real tasks!');
      await loadMeetings();
      refreshEvent();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCreatingTasks(false);
    }
  };

  const handleConvertSingle = async (itemId: string) => {
    if (!selectedMeeting || !currentEvent) return;
    try {
      await api.convertMeetingItem(itemId, currentEvent.id);
      setToastMessage('Task created successfully in task roadmap!');
      await loadMeetings();
      refreshEvent();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const demoTranscript = `Rohan: We need to finalize the stage truss load-in permits before 3 PM tomorrow.
Priya: The title sponsor check has cleared in the university bank account.
Dev: Check-in desk needs 3 more volunteers for the morning rush or queues will delay the keynote.
Karan: QR code mobile scanner PWA build is complete and tested offline.
Ananya: 400 participant lanyards and registration badge stickers arrive by Thursday.
Siddharth: Backup diesel generator delivery is confirmed for Friday 2 PM.
Tanvi: Instagram trailer reel went live and hit 12k views.`;

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
            Turn meeting transcripts and unorganized discussion notes into real, assigned operational tasks.
          </p>
        </div>

        <button
          onClick={() => setTranscript(demoTranscript)}
          className="text-xs font-semibold text-primary-400 hover:text-primary-300 px-3 py-1.5 rounded-xl border border-primary-500/30 bg-primary-600/10 transition-colors"
        >
          Load Sample Meeting Transcript
        </button>
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
              Paste or Upload Meeting Notes
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
          rows={4}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste meeting discussion (e.g. 'Rohan: I will submit the auditorium permits tomorrow. Dev: Move 3 volunteers to registration desk...')"
          className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
        />

        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={handleProcessTranscript}
            disabled={processing || !transcript.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Process Transcript & Extract Tasks</span>
          </button>
        </div>
      </div>

      {/* Extracted Action Items Presentation */}
      {selectedMeeting && (
        <div className="bg-background-card border border-border rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="text-[10px] font-mono text-primary-400 font-bold uppercase">
                PROCESSED MEETING LOG
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">{selectedMeeting.title}</h2>
              <span className="text-xs text-slate-400">
                Extracted {selectedMeeting.actionItems?.length || 0} Action Items
              </span>
            </div>

            <button
              onClick={handleConvertAll}
              disabled={creatingTasks}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {creatingTasks ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>1-Click Create All Tasks</span>
            </button>
          </div>

          {/* Cards Grid of Extracted Tasks */}
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
  );
};
