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
      color: 'text-cyan-600 bg-cyan-50',
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
      color: 'text-violet-600 bg-violet-50',
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
      color: 'text-emerald-600 bg-emerald-50',
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
      color: 'text-violet-600 bg-violet-50',
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
      color: 'text-rose-600 bg-rose-50',
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
      color: 'text-amber-600 bg-amber-50',
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
      color: 'text-pink-600 bg-pink-50',
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/30 backdrop-blur-md animate-fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-xl bg-white border border-[#EAEFF7] rounded-2xl shadow-2xl overflow-hidden z-10 animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#EAEFF7] bg-[#F4F5FB]">
          <Search className="w-5 h-5 text-violet-500 mr-3 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search (e.g. 'volunteer', 'risk', 'task')..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-[#191E35] placeholder-[#7A829D] focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-[#7A829D] hover:text-[#191E35] hover:bg-white rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 bg-white">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.run}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#F4F5FB] text-left transition-colors group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border border-[#EAEFF7] ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#191E35] group-hover:text-violet-600 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-[#7A829D]">{item.subtitle}</div>
                    </div>
                  </div>
                  <kbd className="px-2 py-1 text-[10px] font-mono bg-[#F4F5FB] text-[#7A829D] rounded border border-[#EAEFF7] group-hover:border-violet-300 flex-shrink-0">
                    ↵
                  </kbd>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-sm text-[#7A829D]">
              No matching commands found.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-[#F4F5FB] border-t border-[#EAEFF7] flex items-center justify-between text-[11px] text-[#7A829D]">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span>Event Context: <strong className="text-[#191E35]">{currentEvent?.name || 'TechFest 2026'}</strong></span>
          </div>
          <div className="flex items-center space-x-3">
            <span>Navigate <kbd className="px-1 py-0.5 bg-white border border-[#EAEFF7] rounded text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-white border border-[#EAEFF7] rounded text-[10px]">↓</kbd></span>
            <span>Select <kbd className="px-1 py-0.5 bg-white border border-[#EAEFF7] rounded text-[10px]">↵</kbd></span>
          </div>
        </div>
      </div>
    </div>
  );
};
