import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  CheckSquare, 
  Users, 
  AlertTriangle, 
  Bot, 
  FileUp, 
  Megaphone, 
  Network,
  X,
  Sparkles
} from 'lucide-react';
import { useEvent } from '../../context/EventContext.js';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCopilot: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onOpenCopilot }) => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { currentEvent } = useEvent();

  // Listen for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'ask-chatbot',
      title: 'Ask AI Chatbot',
      subtitle: 'Ask website questions, triage risks, or inspect live event status',
      icon: Bot,
      color: 'text-accent-cyan bg-cyan-500/10',
      run: () => {
        onClose();
        onOpenCopilot();
      },
    },
    {
      id: 'view-twin',
      title: 'Open Event Digital Twin',
      subtitle: 'Inspect visual dependencies and critical path simulations',
      icon: Network,
      color: 'text-primary-400 bg-primary-500/10',
      run: () => {
        onClose();
        navigate('/digital-twin');
      },
    },
    {
      id: 'create-task',
      title: 'Create Operational Task',
      subtitle: 'Add a new deliverable with deadline and team assignment',
      icon: CheckSquare,
      color: 'text-emerald-400 bg-emerald-500/10',
      run: () => {
        onClose();
        navigate('/tasks');
      },
    },
    {
      id: 'volunteer-match',
      title: 'Find & Match Volunteers',
      subtitle: 'Smart AI skill ranking and workload balancing',
      icon: Users,
      color: 'text-violet-400 bg-violet-500/10',
      run: () => {
        onClose();
        navigate('/volunteers');
      },
    },
    {
      id: 'risk-radar',
      title: 'Open Risk Radar',
      subtitle: 'Audit critical bottlenecks and mitigation playbooks',
      icon: AlertTriangle,
      color: 'text-rose-400 bg-rose-500/10',
      run: () => {
        onClose();
        navigate('/risks');
      },
    },
    {
      id: 'upload-doc',
      title: 'Upload Document to Club Brain',
      subtitle: 'Ingest past reports, guidelines, budgets, and rulebooks',
      icon: FileUp,
      color: 'text-amber-400 bg-amber-500/10',
      run: () => {
        onClose();
        navigate('/brain');
      },
    },
    {
      id: 'announcement',
      title: 'Create Announcement Blast',
      subtitle: 'Generate WhatsApp, Email, Notice, or Instagram broadcasts',
      icon: Megaphone,
      color: 'text-pink-400 bg-pink-500/10',
      run: () => {
        onClose();
        navigate('/announcements');
      },
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-xl bg-background-card border border-border-highlight rounded-2xl shadow-2xl overflow-hidden z-10 animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-border bg-background-subtle">
          <Search className="w-5 h-5 text-primary-400 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search (e.g. 'volunteer', 'risk', 'task')..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.run}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-background-hover text-left transition-colors group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border border-white/5 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-primary-300 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-400">{item.subtitle}</div>
                    </div>
                  </div>
                  <kbd className="px-2 py-1 text-[10px] font-mono bg-border/50 text-slate-400 rounded group-hover:border group-hover:border-primary-500/30">
                    ↵
                  </kbd>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">
              No matching commands found.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-background-subtle/50 border-t border-border flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span>Event Context: <strong className="text-slate-200">{currentEvent?.name || 'TechFest 2026'}</strong></span>
          </div>
          <div className="flex items-center space-x-3">
            <span>Navigate <kbd className="px-1 py-0.5 bg-border rounded text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-border rounded text-[10px]">↓</kbd></span>
            <span>Select <kbd className="px-1 py-0.5 bg-border rounded text-[10px]">↵</kbd></span>
          </div>
        </div>
      </div>
    </div>
  );
};
