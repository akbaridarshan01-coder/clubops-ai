import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Network, ShieldAlert, Bot } from 'lucide-react';

interface BottomNavProps {
  onOpenCopilot: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenCopilot }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background-card/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 z-50">
      <NavLink
        to="/mission-control"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center space-y-1 w-14 py-1 rounded-lg ${
            isActive ? 'text-primary-400' : 'text-slate-400'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] font-medium">Overview</span>
      </NavLink>

      <NavLink
        to="/digital-twin"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center space-y-1 w-14 py-1 rounded-lg ${
            isActive ? 'text-primary-400' : 'text-slate-400'
          }`
        }
      >
        <Network className="w-5 h-5" />
        <span className="text-[10px] font-medium">Twin</span>
      </NavLink>

      {/* Center AI Copilot Action Button */}
      <button
        onClick={onOpenCopilot}
        className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-primary-600 to-accent-cyan shadow-glow flex items-center justify-center text-white border-2 border-background"
      >
        <Bot className="w-6 h-6" />
      </button>

      <NavLink
        to="/tasks"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center space-y-1 w-14 py-1 rounded-lg ${
            isActive ? 'text-primary-400' : 'text-slate-400'
          }`
        }
      >
        <CheckSquare className="w-5 h-5" />
        <span className="text-[10px] font-medium">Tasks</span>
      </NavLink>

      <NavLink
        to="/war-room"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center space-y-1 w-14 py-1 rounded-lg ${
            isActive ? 'text-rose-400' : 'text-slate-400'
          }`
        }
      >
        <ShieldAlert className="w-5 h-5" />
        <span className="text-[10px] font-medium">War Room</span>
      </NavLink>
    </nav>
  );
};
