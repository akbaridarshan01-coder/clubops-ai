import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  Activity, 
  Users, 
  GitFork, 
  Brain, 
  CheckCircle2, 
  AlertTriangle, 
  Network, 
  Layers,
  ChevronRight,
  Play
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [simulationActive, setSimulationActive] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Auto cycle simulation after 4 seconds to show hackathon judges the instant AI intelligence
  useEffect(() => {
    const timer = setTimeout(() => {
      setSimulationActive(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary-600 selection:text-white relative overflow-hidden">
      {/* Background Subtle Gradient Spheres */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[32rem] h-[32rem] bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-cyan p-0.5 shadow-glow flex items-center justify-center">
              <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent-cyan" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">CLUBOPS</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Your AI Operating System for College Events</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/auth?mode=login')}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth?mode=register')}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-glow transition-all flex items-center space-x-2"
            >
              <span>Launch Your Event</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-6 max-w-7xl mx-auto text-center relative">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
          <span>Plan. Coordinate. Predict. Execute.</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Run Your College Events Like a{' '}
          <span className="bg-gradient-to-r from-primary-400 via-accent-violet to-accent-cyan bg-clip-text text-transparent">
            Mission Control.
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          ClubOps AI turns scattered WhatsApp chats, spreadsheets, meeting notes, and volunteer panic into one intelligent, self-predicting event operating system.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => navigate('/auth?mode=register')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-violet text-white font-bold text-sm shadow-glow hover:opacity-95 transition-all flex items-center justify-center space-x-2.5"
          >
            <span>Launch Your Event Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              navigate('/auth?mode=login');
            }}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-background-card border border-border hover:border-border-highlight text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 text-primary-400" />
            <span>Sign In to Dashboard</span>
          </button>

        </div>

        {/* Hero Interactive Digital Twin Simulation */}
        <div className="mt-16 max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-primary-500/30 via-border/50 to-transparent shadow-2xl">
          <div className="bg-background-card rounded-[22px] border border-border/80 overflow-hidden text-left p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-border/80 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="live-pulse" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Live Event Digital Twin Preview
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Predictive Dependency & Cascading Delay Simulator
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSimulationActive(!simulationActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
                    simulationActive
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-glow-rose'
                      : 'bg-primary-600/20 text-primary-300 border-primary-500/40'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{simulationActive ? 'Simulation: Venue Delayed 3 Days (Active)' : 'Simulate: Venue Delayed 3 Days'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Node Graph Pipeline */}
            <div className="py-8 grid grid-cols-1 md:grid-cols-5 gap-3 relative">
              {/* Node 1: Venue Booking */}
              <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                simulationActive 
                  ? 'bg-rose-950/40 border-rose-500/60 shadow-glow-rose scale-105' 
                  : 'bg-background-subtle border-border'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Node 01</span>
                  {simulationActive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 animate-pulse">
                      +3d Delay
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-white mb-1">Venue Booking</div>
                <div className="text-[11px] text-slate-400">Auditorium Clearances</div>
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Team</span>
                  <span className="text-primary-300 font-semibold">Logistics</span>
                </div>
              </div>

              {/* Node 2: Stage Setup */}
              <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                simulationActive 
                  ? 'bg-amber-950/30 border-amber-500/60 text-amber-200' 
                  : 'bg-background-subtle border-border text-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Node 02</span>
                  {simulationActive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">
                      Blocked
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-white mb-1">Stage Setup</div>
                <div className="text-[11px] text-slate-400">Truss & Rigging</div>
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Team</span>
                  <span className="text-amber-300 font-semibold">Venue</span>
                </div>
              </div>

              {/* Node 3: Decoration */}
              <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                simulationActive 
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' 
                  : 'bg-background-subtle border-border text-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Node 03</span>
                  {simulationActive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">
                      Shifted
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-white mb-1">Stage Decoration</div>
                <div className="text-[11px] text-slate-400">Banners & LED Wall</div>
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Team</span>
                  <span className="text-pink-300 font-semibold">Marketing</span>
                </div>
              </div>

              {/* Node 4: Technical Setup */}
              <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                simulationActive 
                  ? 'bg-amber-950/20 border-amber-500/40' 
                  : 'bg-background-subtle border-border'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Node 04</span>
                  {simulationActive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">
                      At Risk
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-white mb-1">Technical Setup</div>
                <div className="text-[11px] text-slate-400">Wi-Fi & Soundcheck</div>
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Team</span>
                  <span className="text-cyan-300 font-semibold">Technical</span>
                </div>
              </div>

              {/* Node 5: Event Day */}
              <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                simulationActive 
                  ? 'bg-background-subtle border-rose-500/40 text-rose-300' 
                  : 'bg-primary-600/15 border-primary-500/40 text-white'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Node 05</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Target
                  </span>
                </div>
                <div className="text-xs font-bold text-white mb-1">Event Day Launch</div>
                <div className="text-[11px] text-slate-400">650 Participants</div>
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Status</span>
                  <span className="text-emerald-400 font-semibold">Milestone</span>
                </div>
              </div>
            </div>

            {/* AI Cascade Explanation & Autonomous Recommendation Card */}
            {simulationActive && (
              <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-background-card to-primary-900/20 border border-rose-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>AI IMPACT DETECTION: 7 tasks affected • 3 teams affected • 2 deadlines at risk</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    <strong>AI Recommendation:</strong> Activate backup Open-Air Amphitheater workflow. Fast-track AV setup to overlap with decoration, recovering 48 hours of critical path time.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/war-room')}
                  className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-glow flex items-center space-x-2 whitespace-nowrap"
                >
                  <span>Activate Backup Workflow</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Pillar Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-border/50">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white">
            Built Specifically for College Event Operations
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-xl mx-auto">
            Everything your club committee needs to move from frantic chaos to autonomous clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-background-card border border-border hover:border-primary-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center text-primary-400 mb-4 group-hover:scale-110 transition-transform">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Event Digital Twin</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visualize your entire event as a live dependency graph. Click any node to understand critical paths, owners, and downstream impacts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-background-card border border-border hover:border-accent-cyan/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">AI War Room</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed for final 48-hour sprints. Real-time bottleneck triage, volunteer shortage auto-rebalancing, and 1-click human approvals.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-background-card border border-border hover:border-accent-violet/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Club Brain & Memory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Query past festivals, budgets, and post-mortems with source citations. Never repeat last year's venue booking or catering mistakes.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 ClubOps AI. Built for hackathons, universities, and student leaders.</p>
      </footer>
    </div>
  );
};
