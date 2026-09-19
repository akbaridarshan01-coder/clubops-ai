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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAEFF7]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-[#191E35] flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary-600" />
              <span>Meeting Intelligence & Notes</span>
            </h1>
          </div>
          <p className="text-xs text-[#7A829D] mt-0.5">
            Turn meeting transcripts and discussion notes into actionable, assigned tasks.
          </p>
        </div>

        <button
          onClick={() => setTranscript(demoTranscript)}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-xl border border-primary-200 bg-primary-50 transition-colors shadow-2xs"
        >
          Load Sample Meeting Transcript
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Transcript Input Box */}
      <div className="meet-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-bold text-[#191E35] uppercase tracking-wider">
              Paste or Upload Meeting Notes
            </span>
          </div>
          <input
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            className="bg-[#F5F6FC] border border-[#E4E8F2] px-3.5 py-1.5 rounded-xl text-xs text-[#191E35] font-medium max-w-sm focus:outline-none focus:border-primary-500"
            placeholder="Meeting Title"
          />
        </div>

        <textarea
          rows={4}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste meeting discussion (e.g. 'Rohan: I will submit the auditorium permits tomorrow. Dev: Move 3 volunteers to registration desk...')"
          className="w-full bg-[#F5F6FC] border border-[#E4E8F2] focus:border-primary-500 rounded-2xl p-4 text-xs text-[#191E35] placeholder-[#8C93AE] focus:outline-none font-mono leading-relaxed"
        />

        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={handleProcessTranscript}
            disabled={processing || !transcript.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50 active:scale-95"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Process Transcript & Extract Tasks</span>
          </button>
        </div>
      </div>

      {/* Extracted Action Items Presentation */}
      {selectedMeeting && (
        <div className="meet-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAEFF7]">
            <div>
              <div className="text-[10px] font-bold text-primary-600 uppercase">
                PROCESSED MEETING LOG
              </div>
              <h2 className="text-base font-bold text-[#191E35] mt-0.5">{selectedMeeting.title}</h2>
              <span className="text-xs text-[#7A829D]">
                Extracted {selectedMeeting.actionItems?.length || 0} Action Items
              </span>
            </div>

            <button
              onClick={handleConvertAll}
              disabled={creatingTasks}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50 active:scale-95"
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
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-[#F8F9FE] border-[#E9EDF7] hover:bg-white hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                      {item.suggestedTeam || 'Operations'}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      item.suggestedPriority === 'CRITICAL' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {item.suggestedPriority}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#191E35] leading-snug">
                    {item.extractedTitle}
                  </div>
                  <p className="text-[11px] text-[#7A829D] mt-2 italic line-clamp-2">
                    "{item.rawText}"
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EAEFF7] flex items-center justify-between text-[11px]">
                  <span className="text-[#626A87] font-medium flex items-center space-x-1">
                    <User className="w-3 h-3 text-[#8C93AE]" />
                    <span>{item.suggestedOwner || 'Lead'}</span>
                  </span>

                  {item.convertedTaskId ? (
                    <span className="text-emerald-700 font-bold flex items-center space-x-1 text-[10px]">
                      <Check className="w-3 h-3" />
                      <span>Task Created</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConvertSingle(item.id)}
                      className="px-2.5 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 font-bold text-[10px] transition-colors"
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
