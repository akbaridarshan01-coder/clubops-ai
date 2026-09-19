import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  Mail, 
  MessageSquare, 
  Instagram, 
  FileText, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useEvent } from '../context/EventContext.js';
import { api } from '../services/api.js';

export const AnnouncementsPage: React.FC = () => {
  const { currentEvent } = useEvent();
  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL' | 'NOTICE' | 'INSTAGRAM'>('WHATSAPP');
  const [topic, setTopic] = useState('Registration Deadline Extended & Final Speaker Slot');
  const [audience, setAudience] = useState('ALL PARTICIPANTS');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const channels = [
    { id: 'WHATSAPP', label: 'WhatsApp Broadcast', icon: MessageSquare, color: 'text-emerald-400' },
    { id: 'EMAIL', label: 'Official Email', icon: Mail, color: 'text-primary-400' },
    { id: 'INSTAGRAM', label: 'Instagram Caption', icon: Instagram, color: 'text-pink-400' },
    { id: 'NOTICE', label: 'Campus Notice Board', icon: FileText, color: 'text-amber-400' },
  ];

  const handleGenerate = async () => {
    if (!currentEvent || !topic.trim()) return;
    setLoading(true);
    setCopied(false);
    try {
      const res: any = await api.generateAnnouncement({
        eventId: currentEvent.id,
        channel,
        topic,
        targetAudience: audience,
      });
      setGenerated(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
  }, [channel]);

  const handleCopy = () => {
    if (!generated?.content) return;
    navigator.clipboard.writeText(generated.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const [sending, setSending] = useState(false);

  const handleSendBroadcast = async () => {
    if (!currentEvent || !generated) return;
    setSending(true);
    try {
      const res: any = await api.createAnnouncement({
        eventId: currentEvent.id,
        title: generated.title,
        channel: generated.channel,
        content: generated.content,
        targetAudience: generated.targetAudience,
      });
      const summary = res?.deliverySummary;
      if (summary && summary.emailsSent > 0) {
        setToastMessage(`✉️ Real emails successfully delivered to ${summary.emailsSent} recipient(s)!`);
      } else if (summary && summary.totalRecipients === 0) {
        setToastMessage(`⚠️ Announcement saved, but no volunteers found registered with email for this event.`);
      } else {
        setToastMessage(`Broadcast dispatched successfully via ${generated.channel}!`);
      }
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      setToastMessage(`Failed to send broadcast: ${err.message || 'Unknown error'}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="live-pulse" />
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-accent-cyan" />
              <span>Multi-Channel Announcement Engine</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-generate tailored event notices for WhatsApp groups, official emails, campus notice boards, and social captions.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Channel Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {channels.map((ch) => {
          const Icon = ch.icon;
          const isSelected = channel === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => setChannel(ch.id as any)}
              className={`p-4 rounded-2xl border transition-all text-left flex items-center space-x-3 ${
                isSelected
                  ? 'bg-primary-950/20 border-primary-500 shadow-glow text-white'
                  : 'bg-background-card border-border hover:bg-background-hover text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${ch.color}`} />
              <div className="text-xs font-bold">{ch.label}</div>
            </button>
          );
        })}
      </div>

      {/* Inputs & Generated Content Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Config */}
        <div className="lg:col-span-5 bg-background-card border border-border rounded-3xl p-6 space-y-4">
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            Announcement Parameters
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Announcement Subject / Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            >
              <option value="ALL PARTICIPANTS">All Participants (650 hackers)</option>
              <option value="VOLUNTEERS">Volunteers & Core Leads</option>
              <option value="SPONSORS & VIPs">Corporate Sponsors & Judges</option>
              <option value="GENERAL CAMPUS">General Campus Student Body</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Regenerate tailored announcement</span>
          </button>
        </div>

        {/* Right 7 Cols: Live Preview & Actions */}
        <div className="lg:col-span-7 bg-background-card border border-border rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="text-xs font-bold text-white flex items-center space-x-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-500/20 text-primary-300 font-bold">
                  {channel}
                </span>
                <span>{generated?.title || 'Announcement Preview'}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-background-subtle hover:bg-background-hover border border-border text-slate-300 text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleSendBroadcast}
                  disabled={sending || loading}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{sending ? 'Sending Emails...' : 'Send Broadcast'}</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex items-center justify-center space-x-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                <span>Formatting announcement with platform-specific hashtags & emojis...</span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-background-subtle border border-border/80 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {generated?.content}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Target: {audience}</span>
            <span>Channel: {channel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
