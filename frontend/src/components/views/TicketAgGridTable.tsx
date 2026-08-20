import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Ticket } from '@/types';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';
import { Calendar, Clock, CheckCircle, AlertTriangle, Copy, Check } from 'lucide-react';

interface Props {
  tickets: Ticket[];
  loading: boolean;
}

const DueDateCellRenderer: React.FC<any> = (props) => {
  const ticketId = props.data?.id;
  const initialDate = props.value ? props.value.split('T')[0] : '';
  const [dueDate, setDueDate] = useState(initialDate);
  const [saving, setSaving] = useState(false);

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDueDate(newDate);
    if (!ticketId) return;

    setSaving(true);
    try {
      await axiosClient.patch(`/tickets/${ticketId}/`, {
        due_date: newDate ? new Date(newDate).toISOString() : null,
      });
    } catch (err) {
      console.error('Failed to update due date:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 h-full">
      <input
        type="date"
        value={dueDate}
        onChange={handleDateChange}
        onClick={(e) => e.currentTarget.showPicker?.()}
        className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {saving && <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold animate-pulse">Saving...</span>}
    </div>
  );
};

const CopyKeyCellRenderer: React.FC<any> = (props) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const ticketKey = props.value;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ticketKey) return;
    navigator.clipboard.writeText(ticketKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex items-center justify-between gap-1.5 h-full group">
      <span
        onClick={() => navigate(`/tickets/${props.data.id}`)}
        className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate"
        title="Click to view ticket details"
      >
        {ticketKey}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        title="Copy Ticket Key to Clipboard"
        className="p-1 rounded bg-slate-200 dark:bg-slate-800/80 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-400 cursor-pointer transition-all flex-shrink-0"
      >
        {copied ? (
          <Check className="w-3 h-3 text-emerald-400" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};

const TitleCellRenderer: React.FC<any> = (props) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const title = props.value;
  const key = props.data?.ticket_number;

  const handleCopyTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!title) return;
    const copyText = key ? `[${key}] ${title}` : title;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex items-center justify-between gap-2 h-full group">
      <span
        onClick={() => navigate(`/tickets/${props.data.id}`)}
        className="font-semibold text-slate-100 hover:text-blue-400 cursor-pointer truncate"
        title={title}
      >
        {title}
      </span>
      <button
        type="button"
        onClick={handleCopyTitle}
        title="Copy Ticket Key & Title Summary"
        className="opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800/80 hover:bg-blue-600 text-slate-400 hover:text-white transition-all cursor-pointer flex-shrink-0"
      >
        {copied ? (
          <Check className="w-3 h-3 text-emerald-400" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};

export const TicketAgGridTable: React.FC<Props> = ({ tickets, loading }) => {
  const navigate = useNavigate();
  const { mode } = useSelector((state: RootState) => state.theme);

  const columnDefs: ColDef[] = [
    {
      field: 'ticket_number',
      headerName: 'Ticket Key',
      width: 140,
      cellRenderer: CopyKeyCellRenderer,
    },
    {
      field: 'title',
      headerName: 'Summary',
      flex: 1,
      minWidth: 220,
      cellRenderer: (params: any) => (
        <span className="font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {params.value}
        </span>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      cellRenderer: (params: any) => {
        const val = params.value;
        let colorClass = 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';

        if (val === 'DONE') {
          colorClass = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 font-bold';
        } else if (val === 'IN_PROGRESS') {
          colorClass = 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/40 font-semibold';
        } else if (val === 'IN_REVIEW') {
          colorClass = 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/40';
        } else if (val === 'TODO') {
          colorClass = 'bg-slate-200 dark:bg-slate-700/40 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600';
        }

        return (
          <span className={`text-[10px] px-2.5 py-0.5 rounded-md border tracking-wide uppercase ${colorClass}`}>
            {val || 'TODO'}
          </span>
        );
      },
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 140,
      cellRenderer: (params: any) => {
        const val = params.value;
        let colorClass = 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';

        if (val === 'CRITICAL') {
          colorClass = 'bg-rose-100 dark:bg-rose-600/30 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/50 font-black animate-pulse';
        } else if (val === 'URGENT') {
          colorClass = 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-500/40 font-bold';
        } else if (val === 'HIGH') {
          colorClass = 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40 font-semibold';
        } else if (val === 'MEDIUM') {
          colorClass = 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/40';
        } else if (val === 'LOW') {
          colorClass = 'bg-slate-200 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500/40';
        }

        return (
          <span className={`text-[10px] px-2.5 py-0.5 rounded-md border tracking-wide uppercase ${colorClass}`}>
            {val || 'MEDIUM'}
          </span>
        );
      },
    },
    {
      field: 'assigned_user_details',
      headerName: 'Assignee',
      width: 150,
      valueGetter: (params) => {
        const u = params.data?.assigned_user_details;
        if (!u) return 'Unassigned';
        return u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
      },
      cellRenderer: (params: any) => {
        const u = params.data?.assigned_user_details;
        if (!u) return <span className="text-slate-400 text-xs">Unassigned</span>;
        const displayName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
        return <span className="text-slate-800 dark:text-slate-200 text-xs font-semibold">{displayName}</span>;
      },
    },
    {
      field: 'reporter_details',
      headerName: 'Created By',
      width: 150,
      valueGetter: (params) => {
        const rep = params.data?.reporter_details;
        if (!rep) return 'System';
        return rep.first_name ? `${rep.first_name} ${rep.last_name || ''}`.trim() : rep.username;
      },
      cellRenderer: (params: any) => {
        const rep = params.data?.reporter_details;
        if (!rep) return <span className="text-slate-400 text-xs font-mono">System</span>;
        const displayName = rep.first_name ? `${rep.first_name} ${rep.last_name || ''}`.trim() : rep.username;
        return (
          <span className="font-semibold text-slate-800 dark:text-white text-xs">{displayName}</span>
        );
      },
    },
    {
      field: 'created_at',
      headerName: 'Created Date',
      width: 140,
      valueGetter: (params) => params.data?.created_at ? new Date(params.data.created_at).toLocaleDateString() : '',
      cellRenderer: (params: any) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300 font-medium">{params.value}</span>
      ),
    },
  ];

  const gridThemeClass = mode === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';

  return (
    <div className={`${gridThemeClass} w-full h-[580px] rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 transition-colors duration-200`}>
      {loading ? (
        <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-xs font-semibold">
          Loading ticket records...
        </div>
      ) : (
        <AgGridReact
          rowData={tickets}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 20, 50]}
          rowHeight={46}
          headerHeight={44}
          animateRows={true}
        />
      )}
    </div>
  );
};
