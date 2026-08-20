import React, { useState, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';
import { ActivityLog } from '@/types';
import { History, Shield, Globe, User } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get('/audit-logs/');
        setLogs(res.data.results || res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600 dark:text-purple-500" />
            Immutable Enterprise Audit Log & Timeline
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Complete audit trail recording ticket creation, updates, status changes, old/new values, IP addresses, and responsible users.
          </p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor / User</th>
              <th className="px-4 py-3">Action Type</th>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Field & Value Change</th>
              <th className="px-4 py-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-100/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-sans">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-sans font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {log.actor_details?.username || 'System'}
                </td>
                <td className="px-4 py-3">
                  <span className="bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 px-2 py-0.5 rounded font-bold text-[10px] shadow-sm">
                    {log.action_type}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400">{log.ticket_number || '-'}</td>
                <td className="px-4 py-3 font-sans text-slate-800 dark:text-slate-300">
                  {log.field_name && (
                    <span className="font-semibold text-slate-600 dark:text-slate-400">{log.field_name}: </span>
                  )}
                  {log.old_value && <span className="text-red-600 dark:text-red-400 line-through mr-1">{log.old_value}</span>}
                  {log.new_value && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{log.new_value}</span>}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-400 dark:text-slate-600" /> {log.ip_address || '127.0.0.1'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
