import React, { useEffect, useState } from 'react';
import { 
  X, 
  CheckCheck, 
  AlertTriangle, 
  CheckSquare, 
  Bot, 
  Megaphone, 
  Calendar, 
  Info,
  Clock
} from 'lucide-react';
import { Notification } from '../../types/index.js';
import { api } from '../../services/api.js';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCountUpdate: (count: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onCountUpdate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const loadNotifications = async () => {
    try {
      const data: any = await api.getNotifications();
      setNotifications(data.notifications || []);
      onCountUpdate(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      onCountUpdate(notifications.filter(n => !n.read && n.id !== id).length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      onCountUpdate(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const categories = ['ALL', 'TASK', 'RISK', 'AI', 'MEETING'];

  const filtered = selectedCategory === 'ALL'
    ? notifications
    : notifications.filter(n => n.category === selectedCategory);

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'RISK': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'TASK': return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'AI': return <Bot className="w-4 h-4 text-violet-500" />;
      case 'MEETING': return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'ANNOUNCEMENT': return <Megaphone className="w-4 h-4 text-cyan-500" />;
      default: return <Info className="w-4 h-4 text-[#7A829D]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white border-l border-[#EAEFF7] shadow-2xl flex flex-col z-10 animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-[#EAEFF7] flex items-center justify-between bg-white">
          <div>
            <h2 className="text-base font-bold text-[#191E35]">Event Notification Center</h2>
            <p className="text-xs text-[#7A829D]">Real-time alerts, AI prompts, and task changes</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMarkAllRead}
              className="px-2.5 py-1 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors flex items-center space-x-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-[#7A829D] hover:text-[#191E35] hover:bg-[#F4F5FB] rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-2 border-b border-[#EAEFF7] flex items-center space-x-2 overflow-x-auto bg-[#F4F5FB]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'bg-white text-[#7A829D] hover:text-[#191E35] border border-[#EAEFF7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#F4F5FB]">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.read && handleMarkRead(item.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  item.read
                    ? 'bg-white border-[#EAEFF7] opacity-60'
                    : 'bg-white border-violet-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-[#F4F5FB] border border-[#EAEFF7] mt-0.5 flex-shrink-0">
                    {getIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#191E35] truncate">{item.title}</span>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-[#7A829D] leading-relaxed mb-2">{item.message}</p>
                    <div className="flex items-center text-[10px] text-[#7A829D] space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-sm text-[#7A829D]">
              No notifications in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
