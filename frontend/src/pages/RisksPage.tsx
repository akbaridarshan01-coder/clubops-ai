import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Filter, 
  Loader2,
  Check
} from 'lucide-react';
import { useEvent } from '../context/EventContext.js';
import { Risk } from '../types/index.js';
import { api } from '../services/api.js';

export const RisksPage: React.FC = () => {
  const { currentEvent, refreshEvent } = useEvent();
  const [analyzing, setAnalyzing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const risks: Risk[] = currentEvent?.risks || [];

  const handleRunRadar = async () => {
    if (!currentEvent) return;
    setAnalyzing(true);
    try {
      const res: any = await api.runRiskAnalysis(currentEvent.id);
      setToastMessage(`Risk Radar analysis complete! ${res.totalDetected} new bottleneck risks recorded.`);
      refreshEvent();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResolveRisk = async (riskId: string) => {
    try {
      await api.updateRiskStatus(riskId, 'RESOLVED', 'Resolved via Risk Radar operational review.');
      setToastMessage('Risk marked as resolved!');
      refreshEvent();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRisks = filterSeverity === 'ALL'
    ? risks
    : risks.filter(r => r.severity === filterSeverity);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-glow-rose';
      case 'HIGH': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MEDIUM': return 'bg-primary-500/20 text-primary-300 border-primary-500/30';
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
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Predictive Risk Radar</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous background audit for unassigned critical deliverables, overdue permits, and volunteer shortages.
          </p>
        </div>

        <button
          onClick={handleRunRadar}
          disabled={analyzing}
          className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-accent-cyan" />}
          <span>{analyzing ? 'Scanning Critical Paths...' : 'Run Risk Radar Audit'}</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Severity Filter Tabs */}
      <div className="flex items-center space-x-2">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterSeverity === sev
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-background-card border border-border text-slate-400 hover:text-slate-200'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Risks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRisks.map((risk) => (
          <div
            key={risk.id}
            className={`p-6 rounded-3xl border transition-all space-y-4 flex flex-col justify-between ${
              risk.severity === 'CRITICAL'
                ? 'bg-gradient-to-br from-rose-950/25 via-background-card to-background-card border-rose-500/30'
                : 'bg-background-card border-border hover:border-border-highlight'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getSeverityBadge(risk.severity)}`}>
                    {risk.severity}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    CAT: {risk.category}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  risk.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-background-subtle text-slate-400 border border-border'
                }`}>
                  {risk.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">{risk.title}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{risk.description}</p>

              {/* Impact & Mitigation Plan */}
              {risk.impactAnalysis && (
                <div className="mt-3 p-3 rounded-xl bg-background-subtle border border-border/80 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-rose-300 uppercase">Impact Analysis:</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{risk.impactAnalysis}</p>
                </div>
              )}

              {risk.mitigationPlan && (
                <div className="mt-2 p-3 rounded-xl bg-primary-950/20 border border-primary-500/30 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-primary-300 uppercase">Recommended Playbook:</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{risk.mitigationPlan}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Logged on {new Date(risk.createdAt).toLocaleDateString()}
              </span>
              {risk.status !== 'RESOLVED' && (
                <button
                  onClick={() => handleResolveRisk(risk.id)}
                  className="px-3 py-1.5 rounded-lg bg-background-subtle hover:bg-emerald-500/20 border border-border hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
