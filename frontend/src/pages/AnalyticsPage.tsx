import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Download, 
  Calendar, 
  Sparkles, 
  PieChart as PieIcon, 
  Activity 
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import { useEvent } from '../context/EventContext.js';
import { api } from '../services/api.js';

export const AnalyticsPage: React.FC = () => {
  const { currentEvent } = useEvent();
  const [analytics, setAnalytics] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    if (!currentEvent) return;
    try {
      const data = await api.getAnalytics(currentEvent.id);
      setAnalytics(data);
      const rep = await api.getPostEventReport(currentEvent.id);
      setReport(rep);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentEvent?.id]);

  const handleExportJson = () => {
    if (!report) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ClubOps_TechFest_Report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAEFF7]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] animate-pulse" />
            <h1 className="text-xl font-bold text-[#191E35] flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#8B5CF6]" />
              <span>Event Analytics & Continuous Learning Loop</span>
            </h1>
          </div>
          <p className="text-xs text-[#7A829D] mt-0.5 font-medium">
            Real-time burnup velocity, workstream distributions, and AI retrospective synthesis.
          </p>
        </div>

        <button
          onClick={handleExportJson}
          className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Post-Event Report</span>
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#EAEFF7] shadow-card">
          <div className="text-xs font-semibold text-[#7A829D]">Total Tasks Tracked</div>
          <div className="text-2xl font-black text-[#191E35] mt-1">
            {analytics?.eventSummary?.totalTasks || 52}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">
            {analytics?.eventSummary?.completionRate || 38}% completed on schedule
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#EAEFF7] shadow-card">
          <div className="text-xs font-semibold text-[#7A829D]">Event Health Index</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {analytics?.eventSummary?.healthScore || 82} / 100
          </div>
          <div className="text-[10px] text-[#7A829D] mt-1 font-medium">
            Optimal operating range
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#EAEFF7] shadow-card">
          <div className="text-xs font-semibold text-[#7A829D]">Active Volunteers</div>
          <div className="text-2xl font-black text-[#7C3AED] mt-1">
            {analytics?.eventSummary?.totalVolunteers || 30}
          </div>
          <div className="text-[10px] text-[#7A829D] mt-1 font-medium">
            94% average skill alignment
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#EAEFF7] shadow-card">
          <div className="text-xs font-semibold text-[#7A829D]">Critical Risks Flagged</div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {analytics?.eventSummary?.criticalRisks || 2}
          </div>
          <div className="text-[10px] text-rose-600 mt-1 font-medium">
            Mitigation playbooks active
          </div>
        </div>
      </div>

      {/* Interactive Charts: Burndown & Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Burndown Velocity Line Chart */}
        <div className="lg:col-span-7 bg-white border border-[#EAEFF7] rounded-3xl p-6 space-y-4 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF7]">
            <h3 className="text-sm font-bold text-[#191E35] flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
              <span>Sprint Burndown Velocity</span>
            </h3>
            <span className="text-[10px] font-mono text-[#7A829D]">Past 7 Days</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.burndown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEFF7" />
                <XAxis dataKey="day" stroke="#7A829D" tick={{ fontSize: 11 }} />
                <YAxis stroke="#7A829D" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EAEFF7', borderRadius: '12px', fontSize: '11px', color: '#191E35', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="planned" stroke="#8B5CF6" strokeWidth={2} name="Planned Trajectory" />
                <Line type="monotone" dataKey="remaining" stroke="#06B6D4" strokeWidth={2} name="Actual Open Tasks" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Team Workload Bar Chart */}
        <div className="lg:col-span-5 bg-white border border-[#EAEFF7] rounded-3xl p-6 space-y-4 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAEFF7]">
            <h3 className="text-sm font-bold text-[#191E35] flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#8B5CF6]" />
              <span>Team Deliverable Loads</span>
            </h3>
            <span className="text-[10px] font-mono text-[#7A829D]">By Workstream</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.teamWorkload || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEFF7" />
                <XAxis dataKey="name" stroke="#7A829D" tick={{ fontSize: 9 }} tickFormatter={(v) => v.split(' ')[0]} />
                <YAxis stroke="#7A829D" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EAEFF7', borderRadius: '12px', fontSize: '11px', color: '#191E35', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="total" fill="#8B5CF6" radius={[6, 6, 0, 0]}>
                  {(analytics?.teamWorkload || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Post-Event Learning Loop Card */}
      {report && (
        <div className="bg-white border border-[#EAEFF7] rounded-3xl p-6 space-y-5 shadow-card">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
            <h3 className="text-base font-bold text-[#191E35]">
              AI Continuous Learning Loop & Executive Retrospective
            </h3>
          </div>
          <p className="text-xs text-[#7A829D] leading-relaxed font-medium">
            {report.executiveSummary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {(report.retrospectiveInsights || []).map((ins: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#F4F5FB] border border-[#EAEFF7] space-y-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  idx === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : idx === 1 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-[#EDE9FE] text-[#7C3AED]'
                }`}>
                  {ins.category}
                </span>
                <p className="text-xs text-[#191E35] leading-relaxed mt-1">
                  {ins.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
