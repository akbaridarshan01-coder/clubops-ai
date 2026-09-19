import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Bell, 
  Loader2,
  RefreshCw,
  Flame
} from 'lucide-react';
import { useEvent } from '../context/EventContext.js';
import { api } from '../services/api.js';
import { ActionConfirmationModal } from '../components/common/ActionConfirmationModal.js';
import { ProposedAction } from '../types/index.js';

export const WarRoomPage: React.FC = () => {
  const { currentEvent, healthScore, refreshEvent } = useEvent();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ProposedAction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const tasks = currentEvent?.tasks || [];
  const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');
  const criticalTasks = tasks.filter(t => t.priority === 'CRITICAL');
  const risks = currentEvent?.risks || [];
  const criticalRisks = risks.filter(r => r.severity === 'CRITICAL');

  const handleActionClick = (action: ProposedAction) => {
    setSelectedAction(action);
    setConfirmOpen(true);
  };

  const handleSuccess = (res: any) => {
    setToastMessage(res.message || 'War room directive executed successfully!');
    refreshEvent();
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* War Room Alarm Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/60 via-background-card to-rose-950/30 border border-rose-500/40 shadow-glow-rose flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-300">
              HIGH ALERT EVENT WAR ROOM ACTIVE
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
            <span>AI Crisis Triage & Instant Dispatch</span>
          </h1>
          <p className="text-xs text-rose-200/80 max-w-2xl leading-relaxed">
            Final-days operational command. Instant triage of volunteer deficits, permit delays, and emergency team reallocations with verified human approval.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-center">
            <div className="text-[10px] font-mono text-rose-300 uppercase">Emergency Health</div>
            <div className="text-2xl font-black text-rose-400">{healthScore} / 100</div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main War Room Cards: Crisis Alert & Instant Action Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Critical Bottleneck Alert with 1-Click Action */}
        <div className="lg:col-span-7 bg-background-card border border-rose-500/30 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center space-x-2 text-rose-400">
              <Flame className="w-5 h-5 text-rose-500 animate-bounce" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Immediate Action Directive
              </h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
              PRIORITY ZERO
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300">CRITICAL VOLUNTEER SHORTAGE</span>
              <span className="text-[10px] text-slate-400">Registration Desk • 08:00 AM Rush</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Registration team currently only has <strong>4 volunteers</strong> rostered for an expected <strong>650 incoming attendees</strong>. Queue simulation projects a 28-minute choke point that threatens opening ceremony timing.
            </p>

            <div className="p-3 rounded-xl bg-background-card/90 border border-border/80 text-xs space-y-1">
              <div className="text-[11px] font-semibold text-primary-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
                <span>AI Recommendation Engine:</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Move 3 available volunteers from Marketing & Media to Registration Desk from 07:30 AM to 10:00 AM. Marketing workload is currently LOW.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => handleActionClick({
                  id: 'war-room-reallocate',
                  type: 'REALLOCATE_VOLUNTEERS',
                  title: 'Emergency Reallocation: 3 Volunteers to Registration Desk',
                  description: 'Reassign 3 low-workload media volunteers to morning badge scanning desk to eliminate registration bottlenecks.',
                  buttonLabel: 'Approve Volunteer Reallocation',
                  payload: {
                    eventId: currentEvent?.id,
                    sourceTeam: 'Marketing & Media',
                    targetTeam: 'Hospitality & Registration',
                    count: 3,
                  },
                })}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-glow flex items-center justify-center space-x-2 transition-all"
              >
                <span>Approve & Dispatch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleActionClick({
                  id: 'war-room-notify',
                  type: 'NOTIFY_TEAM',
                  title: 'Broadcast Urgent Roster Shift to Team Leads',
                  description: 'Send SMS & WhatsApp alerts to Hospitality and Marketing team leads with updated shift rosters.',
                  buttonLabel: 'Notify Leads',
                  payload: {
                    eventId: currentEvent?.id,
                    message: 'War Room Alert: Volunteer shift update approved. Check updated roster.',
                  },
                })}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-background-subtle border border-border hover:border-primary-500/40 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Notify Team Leads</span>
              </button>
            </div>
          </div>

          {/* Secondary Directive: Venue Permit */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">VENUE CLEARANCE ESCALATION</span>
              <span className="text-[10px] text-slate-400">Dean Board Walkthrough</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Auditorium safety permit has been delayed 48 hours. Stage AV rigging is currently on hold.
            </p>
            <button
              onClick={() => handleActionClick({
                id: 'war-room-contingency',
                type: 'ACTIVATE_CONTINGENCY',
                title: 'Activate Open-Air Amphitheater Contingency Staging',
                description: 'Initiate backup outdoor stage setup protocol to ensure opening ceremony proceeds without delay.',
                buttonLabel: 'Activate Contingency Plan',
                payload: { eventId: currentEvent?.id },
              })}
              className="px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center space-x-2 transition-colors"
            >
              <span>Activate Contingency Protocol</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Live Event Triage Status */}
        <div className="lg:col-span-5 bg-background-card border border-border rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-bold text-white">Live Event Status Matrix</h3>
            <span className="text-[10px] text-slate-400 font-mono">Updated just now</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-background-subtle border border-border flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="text-slate-300">Active Critical Risks</span>
              </div>
              <span className="font-bold text-rose-400">{criticalRisks.length} Unresolved</span>
            </div>

            <div className="p-3 rounded-xl bg-background-subtle border border-border flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">Blocked Critical Path Tasks</span>
              </div>
              <span className="font-bold text-amber-400">{blockedTasks.length} Tasks</span>
            </div>

            <div className="p-3 rounded-xl bg-background-subtle border border-border flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-violet-400" />
                <span className="text-slate-300">Volunteer Shortage Risk</span>
              </div>
              <span className="font-bold text-rose-400">Registration (-3)</span>
            </div>

            <div className="p-3 rounded-xl bg-background-subtle border border-border flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Wi-Fi / Network Subnet</span>
              </div>
              <span className="font-bold text-emerald-400">VLAN /22 Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ActionConfirmationModal
        action={selectedAction}
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
