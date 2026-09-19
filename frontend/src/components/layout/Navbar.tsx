import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useEvent } from '../../context/EventContext.js';
import { 
  Sparkles, 
  Search, 
  Bell, 
  ShieldAlert, 
  ChevronDown, 
  LogOut, 
  User as UserIcon,
  Activity,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenCommandPalette, 
  onOpenNotifications, 
  unreadCount 
}) => {
  const { user, logout } = useAuth();
  const { currentEvent, events, setCurrentEvent, healthScore } = useEvent();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <header className="h-20 border-b border-[#EAEFF7] bg-white px-6 md:px-8 flex items-center justify-between">
      {/* Left: Brand Logo & Event Switcher */}
      <div className="flex items-center space-x-6">
        <div 
          onClick={() => navigate('/mission-control')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 via-indigo-500 to-accent-violet p-0.5 shadow-sm flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-600 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight text-[#191E35]">ClubOps</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100">AI</span>
            </div>
          </div>
        </div>

        {/* Active Event Dropdown */}
        {currentEvent && (
          <div className="relative hidden lg:block">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#F5F6FC] border border-[#E4E8F2] hover:bg-[#EEF1F9] text-xs font-semibold text-[#323955] transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-primary-600" />
              <span className="max-w-[150px] truncate">{currentEvent.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold">
                {currentEvent.status}
              </span>
              <ChevronDown className="w-3 h-3 text-[#7A829D]" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-[#EAEFF7] shadow-xl p-2 z-50 animate-scale-in">
                <div className="text-[10px] font-bold text-[#7A829D] px-2.5 py-1.5 uppercase tracking-wider">
                  Switch Event
                </div>
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => {
                      setCurrentEvent(ev);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                      ev.id === currentEvent.id
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-[#48506E] hover:bg-[#F5F6FC]'
                    }`}
                  >
                    <span className="truncate">{ev.name}</span>
                    <span className="text-[10px] text-[#8C93AE]">{ev.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center: Search Pill (MeetCraft Style) */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div 
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-3 px-4 py-2.5 rounded-full bg-[#F5F6FC] border border-[#E4E8F2] hover:border-primary-300 text-[#7A829D] hover:text-[#323955] transition-all cursor-pointer group"
        >
          <Search className="w-4 h-4 text-[#8C93AE] group-hover:text-primary-600 transition-colors" />
          <span className="text-xs font-medium flex-1">Search tasks, meetings, volunteers...</span>
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-white rounded-md text-[#7A829D] border border-[#D5DAE8] shadow-2xs">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right: + New Event, Notification Bell, User Profile (MeetCraft Style) */}
      <div className="flex items-center space-x-4">
        {/* + New Event Button (MeetCraft Style) */}
        <button
          onClick={() => navigate('/auth?mode=onboarding')}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <span className="text-sm leading-none">+</span>
          <span>New Event</span>
        </button>

        {/* Health Score Pill */}
        <div 
          onClick={() => navigate('/mission-control')}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#F5F6FC] border border-[#E4E8F2] text-xs font-semibold cursor-pointer hover:bg-[#EEF1F9] transition-colors"
          title="Overall Event Health Score"
        >
          <Activity className="w-3.5 h-3.5 text-primary-600" />
          <span className="text-[#323955]">Health:</span>
          <span className="text-primary-700 font-bold">{healthScore}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2.5 rounded-full bg-[#F5F6FC] hover:bg-[#EEF1F9] text-[#48506E] transition-colors border border-[#E4E8F2]"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute 1 top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        {/* User Profile Info (Avatar + Name + Role as seen in MeetCraft) */}
        <div className="relative pl-2 border-l border-[#EAEFF7]">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-3 p-1 rounded-xl hover:bg-[#F5F6FC] transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 p-0.5 shadow-sm">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-primary-700 font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-bold text-[#191E35] truncate max-w-[110px]">
                {user?.name || 'Organizer'}
              </div>
              <div className="text-[10px] text-[#7A829D] font-medium truncate">
                {user?.role === 'OWNER' ? 'Lead Manager' : (user?.role || 'Event Manager')}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-[#7A829D] hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#EAEFF7] shadow-xl p-2 z-50 animate-scale-in">
              <div className="px-3 py-2 border-b border-[#F0F2F9] mb-1">
                <div className="text-xs font-bold text-[#191E35] truncate">{user?.name}</div>
                <div className="text-[11px] text-[#7A829D] truncate">{user?.email}</div>
              </div>
              <button
                onClick={() => {
                  navigate('/brain');
                  setUserMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#323955] hover:bg-[#F5F6FC] transition-colors flex items-center space-x-2"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#7A829D]" />
                <span>Club Profile & Brain</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/auth');
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
