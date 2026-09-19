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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAEFF7]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] animate-pulse" />
            <h1 className="text-xl font-bold text-[#191E35] flex items-center space-x-2">
              <GitFork className="w-5 h-5 text-[#8B5CF6]" />
              <span>What-If Scenario Simulator</span>
            </h1>
          </div>
          <p className="text-xs text-[#7A829D] mt-0.5 font-medium">
            Test hypothetical shocks and supply chain delays without altering production event records.
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
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
              className={`p-5 rounded-3xl border cursor-pointer transition-all shadow-card hover:shadow-hover ${
                isSelected
                  ? 'border-[#8B5CF6] bg-[#EDE9FE]/30 ring-2 ring-[#8B5CF6]/30'
                  : 'border-[#EAEFF7] bg-white hover:border-purple-200'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${sc.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-sm font-bold text-[#191E35]">{sc.title}</div>
              </div>
              <p className="text-xs text-[#7A829D] leading-relaxed font-medium">{sc.description}</p>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Current State vs Simulated State */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CURRENT STATE */}
        <div className="bg-white border border-[#EAEFF7] rounded-3xl p-6 space-y-4 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF7]">
            <h3 className="text-sm font-bold text-[#191E35] uppercase tracking-wider">Current Production State</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              LIVE DATA
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#F4F5FB] border border-[#EAEFF7]">
              <div className="text-[10px] text-[#7A829D] uppercase font-bold">Health Score</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{healthScore} / 100</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F4F5FB] border border-[#EAEFF7]">
              <div className="text-[10px] text-[#7A829D] uppercase font-bold">Critical Risks</div>
              <div className="text-2xl font-black text-[#191E35] mt-1">2 Active</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F5FB] border border-[#EAEFF7] text-xs space-y-2">
            <div className="font-semibold text-[#191E35]">Baseline Critical Path Deliverables:</div>
            <ul className="space-y-1.5 text-[#7A829D] font-medium">
              <li>• Auditorium Booking: Target Day -14</li>
              <li>• Stage Truss Setup: Target Day -5</li>
              <li>• Soundcheck & Wi-Fi Testing: Target Day -2</li>
            </ul>
          </div>
        </div>

        {/* SIMULATED STATE */}
        <div className={`bg-white border rounded-3xl p-6 space-y-4 transition-all shadow-card ${
          simulationResult ? 'border-rose-200' : 'border-[#EAEFF7]'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF7]">
            <h3 className="text-sm font-bold text-[#191E35] uppercase tracking-wider">Simulated Shock Impact</h3>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              simulationResult ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-[#7A829D]'
            }`}>
              {simulationResult ? 'SIMULATION READY' : 'CLICK RUN SIMULATION'}
            </span>
          </div>

          {simulationResult ? (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                  <div className="text-[10px] text-rose-700 uppercase font-bold">Simulated Health</div>
                  <div className="text-2xl font-black text-rose-600 mt-1">
                    {simulationResult.simulatedState.healthScore} / 100
                  </div>
                  <span className="text-[10px] text-rose-600 font-mono font-semibold">
                    {simulationResult.simulatedState.healthDelta} pts drop
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="text-[10px] text-amber-800 uppercase font-bold">Affected Tasks</div>
                  <div className="text-2xl font-black text-amber-700 mt-1">
                    {simulationResult.simulatedState.affectedTasksCount} Tasks
                  </div>
                  <span className="text-[10px] text-amber-700 font-mono font-semibold">
                    Across {simulationResult.simulatedState.affectedTeamsCount} teams
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F5F3FF] border border-purple-200 text-xs space-y-2">
                <div className="font-semibold text-[#7C3AED] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>AI Strategic Recommendation:</span>
                </div>
                <p className="text-[#191E35] leading-relaxed font-medium">
                  {simulationResult.recommendation}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-[#7A829D] font-medium">Apply this hypothetical shift to schedule?</span>
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
            <div className="py-16 text-center text-xs text-[#7A829D] space-y-2">
              <GitFork className="w-8 h-8 text-[#A0A6BD] mx-auto" />
              <p>Select a scenario above and click <strong>Run Simulation</strong> to preview cascading delays.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
