import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  CheckSquare,
  ShieldAlert,
  GitFork,
  FileText,
  Users,
  AlertTriangle,
  Brain,
  Megaphone,
  BarChart3,
  Bot
} from 'lucide-react';

interface SidebarProps {
  onOpenCopilot: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCopilot }) => {
  const navLinks = [
    { to: '/mission-control', label: 'Mission Control', icon: LayoutDashboard },
    { to: '/digital-twin', label: 'Digital Twin', icon: Network, badge: 'Twin' },
    { to: '/tasks', label: 'Tasks & Roadmap', icon: CheckSquare },
    { to: '/war-room', label: 'AI War Room', icon: ShieldAlert, badge: 'Live', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    { to: '/simulator', label: 'What-If Simulator', icon: GitFork },
    { to: '/meetings', label: 'Meeting Intelligence', icon: FileText },
    { to: '/volunteers', label: 'Volunteer Matching', icon: Users },
    { to: '/risks', label: 'Risk Radar', icon: AlertTriangle },
    { to: '/brain', label: 'Club Brain', icon: Brain },
    { to: '/announcements', label: 'Announcement Engine', icon: Megaphone },
    { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 border-r border-[#EAEFF7] bg-white hidden md:flex flex-col justify-between py-6 px-4 flex-shrink-0 min-h-[calc(100vh-5rem)]">
      {/* Navigation list */}
      <div className="space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-bold text-[#8C93AE] uppercase tracking-wider">
          Operations
        </div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#EDE9FE] text-primary-600 shadow-2xs font-bold'
                    : 'text-[#626A87] hover:text-[#191E35] hover:bg-[#F5F6FC]'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${item.badgeColor || 'bg-primary-100 text-primary-700 border-primary-200'}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Section (Upgrade/AI Card + Settings & Support like MeetCraft) */}
      <div className="pt-4 space-y-4">
        {/* Floating AI Chatbot Card styled like 'Upgrade to Pro' */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EEF0FD] via-[#F3E8FF] to-[#EBE4FF] border border-[#DDD6FE] relative overflow-hidden shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-primary-600 mb-2.5">
            <Bot className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-xs font-bold text-[#191E35]">AI Assistant Pro</div>
          <p className="text-[11px] text-[#626A87] mt-0.5 mb-3 leading-relaxed">
            Instant event triage, bot recommendations & live analytics.
          </p>
          <button
            onClick={onOpenCopilot}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-primary-600 text-primary-700 hover:text-white border border-[#DDD6FE] hover:border-transparent text-xs font-bold shadow-2xs transition-all flex items-center justify-center space-x-1"
          >
            <span>Ask AI Assistant</span>
          </button>
        </div>

        {/* Settings & Support footer links */}
        <div className="pt-2 border-t border-[#F0F2F9] space-y-1">
          <NavLink
            to="/brain"
            className="flex items-center space-x-3 px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#7A829D] hover:text-[#191E35] hover:bg-[#F5F6FC] transition-colors"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Settings & Brain</span>
          </NavLink>
          <button
            onClick={onOpenCopilot}
            className="w-full flex items-center space-x-3 px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#7A829D] hover:text-[#191E35] hover:bg-[#F5F6FC] transition-colors text-left"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Support & Help</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
