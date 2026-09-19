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
      case 'CRITICAL': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAEFF7]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h1 className="text-xl font-bold text-[#191E35] flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Predictive Risk Radar</span>
            </h1>
          </div>
          <p className="text-xs text-[#7A829D] mt-0.5 font-medium">
            Continuous background audit for unassigned critical deliverables, overdue permits, and volunteer shortages.
          </p>
        </div>

        <button
          onClick={handleRunRadar}
          disabled={analyzing}
          className="px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-white" />}
          <span>{analyzing ? 'Scanning Critical Paths...' : 'Run Risk Radar Audit'}</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2 animate-fade-in shadow-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
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
                ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-sm font-bold'
                : 'bg-white border border-[#EAEFF7] text-[#7A829D] hover:text-[#191E35]'
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
            className={`p-6 rounded-3xl border transition-all space-y-4 flex flex-col justify-between shadow-card hover:shadow-hover ${
              risk.severity === 'CRITICAL'
                ? 'bg-gradient-to-br from-rose-50/40 via-white to-white border-rose-200'
                : 'bg-white border-[#EAEFF7]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(risk.severity)}`}>
                    {risk.severity}
                  </span>
                  <span className="text-[10px] text-[#7A829D] font-mono font-medium">
                    CAT: {risk.category}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  risk.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-[#7A829D] border border-slate-200'
                }`}>
                  {risk.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#191E35] leading-snug">{risk.title}</h3>
              <p className="text-xs text-[#7A829D] mt-2 leading-relaxed">{risk.description}</p>

              {/* Impact & Mitigation Plan */}
              {risk.impactAnalysis && (
                <div className="mt-3 p-3 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-rose-700 uppercase">Impact Analysis:</div>
                  <p className="text-[#191E35] text-[11px] leading-relaxed">{risk.impactAnalysis}</p>
                </div>
              )}

              {risk.mitigationPlan && (
                <div className="mt-2 p-3 rounded-2xl bg-[#F5F3FF] border border-purple-100 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-[#7C3AED] uppercase">Recommended Playbook:</div>
                  <p className="text-[#191E35] text-[11px] leading-relaxed">{risk.mitigationPlan}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#EAEFF7] flex items-center justify-between">
              <span className="text-[10px] text-[#7A829D] font-medium">
                Logged on {new Date(risk.createdAt).toLocaleDateString()}
              </span>
              {risk.status !== 'RESOLVED' && (
                <button
                  onClick={() => handleResolveRisk(risk.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-[#EAEFF7] hover:border-emerald-200 text-[#7A829D] hover:text-emerald-700 text-xs font-semibold transition-colors flex items-center space-x-1"
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
