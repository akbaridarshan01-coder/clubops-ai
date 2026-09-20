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
      case 'RISK': return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'TASK': return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'AI': return <Bot className="w-4 h-4 text-primary-400" />;
      case 'MEETING': return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'ANNOUNCEMENT': return <Megaphone className="w-4 h-4 text-cyan-400" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-background-card border-l border-border shadow-2xl flex flex-col z-10 animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Event Notification Center</h2>
            <p className="text-xs text-slate-400">Real-time alerts, AI prompts, and task changes</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMarkAllRead}
              className="px-2.5 py-1 text-xs text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-colors flex items-center space-x-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-2 border-b border-border flex items-center space-x-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'bg-background-subtle text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.read && handleMarkRead(item.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  item.read
                    ? 'bg-background-subtle/40 border-border/50 opacity-75'
                    : 'bg-background-subtle border-border-highlight shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-background-hover border border-white/5 mt-0.5">
                    {getIcon(item.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-2">{item.message}</p>
                    <div className="flex items-center text-[10px] text-slate-500 space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-sm text-slate-500">
              No notifications in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
