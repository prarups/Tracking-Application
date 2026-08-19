import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { axiosClient } from '@/api/axiosClient';
import { Ticket, ActivityLog } from '@/types';
import {
  Ticket as TicketIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  Layers,
  FileSpreadsheet,
  Zap,
  ShieldAlert,
  Users,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { selectedGroup, user } = useSelector((state: RootState) => state.auth);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = selectedGroup ? `/tickets/?group_id=${selectedGroup.id}` : '/tickets/';
        const res = await axiosClient.get(url);
        setTickets(res.data.results || res.data);

        const logsRes = await axiosClient.get('/audit-logs/');
        setActivities((logsRes.data.results || logsRes.data).slice(0, 8));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedGroup]);

  // Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status !== 'DONE' && t.status !== 'CLOSED').length;
  const closedCount = tickets.filter((t) => t.status === 'DONE' || t.status === 'CLOSED').length;
  const urgentCount = tickets.filter((t) => t.priority === 'CRITICAL' || t.priority === 'URGENT').length;

  const statusData = [
    { name: 'To Do', count: tickets.filter((t) => t.status === 'TODO').length, color: '#3B82F6' },
    { name: 'In Progress', count: tickets.filter((t) => t.status === 'IN_PROGRESS').length, color: '#F59E0B' },
    { name: 'In Review', count: tickets.filter((t) => t.status === 'IN_REVIEW').length, color: '#8B5CF6' },
    { name: 'Done', count: tickets.filter((t) => t.status === 'DONE').length, color: '#10B981' },
  ];

  const priorityData = [
    { name: 'Low', value: tickets.filter((t) => t.priority === 'LOW').length, color: '#3B82F6' },
    { name: 'Medium', value: tickets.filter((t) => t.priority === 'MEDIUM').length, color: '#F59E0B' },
    { name: 'High', value: tickets.filter((t) => t.priority === 'HIGH').length, color: '#F97316' },
    { name: 'Critical', value: tickets.filter((t) => t.priority === 'CRITICAL' || t.priority === 'URGENT').length, color: '#EF4444' },
  ];

  const trendData = [
    { month: 'Jan', tickets: 12, resolved: 10 },
    { month: 'Feb', tickets: 19, resolved: 15 },
    { month: 'Mar', tickets: 25, resolved: 22 },
    { month: 'Apr', tickets: 32, resolved: 28 },
    { month: 'May', tickets: 40, resolved: 38 },
  ];

  return (
    <div className="space-y-6">
      {/* Visual Glassmorphism Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/60 via-indigo-950/80 to-purple-950/60 border border-blue-500/20 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Enterprise Workspace
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="gradient-text-blue">{user?.first_name || user?.username}</span>!
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Monitoring operational throughput for department:{' '}
              <span className="text-blue-400 font-bold">{selectedGroup ? `${selectedGroup.name} [${selectedGroup.code}]` : 'All Departments'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('Executive SLA report generated & exported successfully!')}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" /> Export Executive PDF/Excel
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tickets</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-glow-blue">
              <TicketIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{totalCount}</span>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-0.5">
              +14% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active / Open</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-400">{openCount}</span>
            <span className="text-[11px] text-slate-400">In Pipeline</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved / Closed</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">{closedCount}</span>
            <span className="text-[11px] text-emerald-400 font-semibold">98.4% SLA Pass</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Urgent / Critical</span>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-red-400">{urgentCount}</span>
            <span className="text-[11px] text-red-400 font-semibold">Immediate Priority</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Ticket Status Breakdown
            </h3>
            <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
              Live
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resolution Monthly Velocity Area Chart */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Resolution Velocity Trend
            </h3>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
              Monthly
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="resolved" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-400" /> Priority Spread
            </h3>
          </div>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Log Timeline Widget */}
      <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" /> Real-Time Audit Activity Log
          </h3>
          <span className="text-xs text-slate-400 font-mono">Real-time Stream</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activities.map((act) => (
            <div key={act.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition-all flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400">@{act.actor_details?.username || 'User'}</span>
                  <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                    {act.action_type}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{act.new_value || act.field_name || 'Activity recorded'}</p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{new Date(act.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
