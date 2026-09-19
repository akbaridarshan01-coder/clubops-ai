import React, { useState } from 'react';
import { 
  GitFork, 
  Play, 
  AlertTriangle, 
  TrendingDown, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Users, 
  DollarSign, 
  Building2,
  RotateCcw,
  Check
} from 'lucide-react';
import { useEvent } from '../context/EventContext.js';
import { api } from '../services/api.js';

export const SimulatorPage: React.FC = () => {
  const { currentEvent, healthScore, refreshEvent } = useEvent();

  const [scenario, setScenario] = useState<'VENUE_DELAY' | 'SPONSOR_CANCELLED' | 'VOLUNTEER_SHORTAGE' | 'BUDGET_CUT'>('VENUE_DELAY');
  const [delayDays, setDelayDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [applied, setApplied] = useState(false);

  const scenarios = [
    {
      id: 'VENUE_DELAY',
      title: 'Venue Delayed 3 Days',
      description: 'Auditorium safety permit delayed, holding up AV staging and soundcheck.',
      icon: Building2,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    },
    {
      id: 'SPONSOR_CANCELLED',
      title: 'Title Sponsor Backs Out',
      description: 'Loss of $12,000 cash grant threatening LED stage walls & caterer advance.',
      icon: DollarSign,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'VOLUNTEER_SHORTAGE',
      title: '30% Volunteer Deficit',
      description: 'Morning rush volunteer attendance drop increasing queue wait times to 28m.',
      icon: Users,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    },
  ];

  const handleRunSimulation = async () => {
    if (!currentEvent) return;
    setLoading(true);
    setApplied(false);
    try {
      const res: any = await api.runWhatIf({
        eventId: currentEvent.id,
        scenario,
        delayDays,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySimulation = () => {
    setApplied(true);
    refreshEvent();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="live-pulse" />
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <GitFork className="w-5 h-5 text-primary-400" />
              <span>What-If Scenario Simulator</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test hypothetical shocks and supply chain delays without altering production event records.
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{loading ? 'Simulating Impact...' : 'Run Simulation'}</span>
        </button>
      </div>

      {/* Scenario Chooser Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isSelected = scenario === sc.id;
          return (
            <div
              key={sc.id}
              onClick={() => {
                setScenario(sc.id as any);
                setSimulationResult(null);
                setApplied(false);
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-950/20 shadow-glow'
                  : 'border-border bg-background-card hover:bg-background-hover'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${sc.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-sm font-bold text-white">{sc.title}</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{sc.description}</p>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Current State vs Simulated State */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CURRENT STATE */}
        <div className="bg-background-card border border-border rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Current Production State</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              LIVE DATA
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-background-subtle border border-border">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Health Score</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{healthScore} / 100</div>
            </div>
            <div className="p-4 rounded-2xl bg-background-subtle border border-border">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Critical Risks</div>
              <div className="text-2xl font-black text-white mt-1">2 Active</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-background-subtle border border-border text-xs space-y-2">
            <div className="font-semibold text-slate-300">Baseline Critical Path Deliverables:</div>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Auditorium Booking: Target Day -14</li>
              <li>• Stage Truss Setup: Target Day -5</li>
              <li>• Soundcheck & Wi-Fi Testing: Target Day -2</li>
            </ul>
          </div>
        </div>

        {/* SIMULATED STATE */}
        <div className={`bg-background-card border rounded-3xl p-6 space-y-4 transition-all ${
          simulationResult ? 'border-rose-500/40 shadow-glow-rose' : 'border-border'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Simulated Shock Impact</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
              {simulationResult ? 'SIMULATION READY' : 'CLICK RUN SIMULATION'}
            </span>
          </div>

          {simulationResult ? (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40">
                  <div className="text-[10px] text-rose-300 uppercase font-semibold">Simulated Health</div>
                  <div className="text-2xl font-black text-rose-400 mt-1">
                    {simulationResult.simulatedState.healthScore} / 100
                  </div>
                  <span className="text-[10px] text-rose-400 font-mono">
                    {simulationResult.simulatedState.healthDelta} pts drop
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                  <div className="text-[10px] text-amber-300 uppercase font-semibold">Affected Tasks</div>
                  <div className="text-2xl font-black text-amber-300 mt-1">
                    {simulationResult.simulatedState.affectedTasksCount} Tasks
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Across {simulationResult.simulatedState.affectedTeamsCount} teams
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-primary-950/30 border border-primary-500/30 text-xs space-y-2">
                <div className="font-semibold text-primary-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>AI Strategic Recommendation:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {simulationResult.recommendation}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">Apply this hypothetical shift to schedule?</span>
                <button
                  onClick={handleApplySimulation}
                  disabled={applied}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {applied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simulation Applied</span>
                    </>
                  ) : (
                    <span>Apply Simulation to Event</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-500 space-y-2">
              <GitFork className="w-8 h-8 text-slate-600 mx-auto" />
              <p>Select a scenario above and click <strong>Run Simulation</strong> to preview cascading delays.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
