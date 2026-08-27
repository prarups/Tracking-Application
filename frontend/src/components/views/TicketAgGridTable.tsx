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
import { Calendar, Clock, CheckCircle, AlertTriangle, Copy, Check, ExternalLink, Eye } from 'lucide-react';
import { navigateToTicket } from '@/utils/navigation';

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
    <div className="flex items-center justify-between gap-2 h-full group whitespace-nowrap">
      <span
        onClick={(e) => navigateToTicket(e, props.data.ticket_number || props.data.id, navigate)}
        className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer tracking-tight"
        title="Click to view full ticket (Ctrl+Click to open in new tab)"
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
        onClick={(e) => navigateToTicket(e, props.data.ticket_number || props.data.id, navigate)}
        className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
        title={title}
      >
        {title}
      </span>
      <button
        type="button"
        onClick={handleCopyTitle}
        title="Copy Ticket Key & Title Summary"
        className="opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-200 dark:bg-slate-800/80 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-400 cursor-pointer transition-all flex-shrink-0"
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
      width: 145,
      cellRenderer: CopyKeyCellRenderer,
    },
    {
      field: 'title',
      headerName: 'Summary / Title',
      width: 250,
      cellRenderer: TitleCellRenderer,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      cellRenderer: (params: any) => {
        const val = params.value || 'OPEN';
        let badgeColor = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        if (val === 'IN_PROGRESS') badgeColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        if (val === 'IN_REVIEW') badgeColor = 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        if (val === 'DONE' || val === 'CLOSED') badgeColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${badgeColor}`}>
            {val.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 120,
      cellRenderer: (params: any) => {
        const p = params.value || 'MEDIUM';
        let color = 'text-slate-400';
        if (p === 'HIGH') color = 'text-amber-500';
        if (p === 'URGENT' || p === 'CRITICAL') color = 'text-red-500 font-bold';
        return <span className={`text-xs font-bold ${color}`}>{p}</span>;
      },
    },
    {
      field: 'reporter_details',
      headerName: 'Created By',
      width: 150,
      cellRenderer: (params: any) => {
        const u = params.data?.reporter_details;
        if (!u) return <span className="text-slate-400 text-xs">System</span>;
        const displayName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
        return <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{displayName}</span>;
      },
    },
    {
      field: 'created_at',
      headerName: 'Created Date',
      width: 140,
      valueGetter: (params: any) => {
        if (!params.data?.created_at) return 'N/A';
        const d = new Date(params.data.created_at);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      },
      cellRenderer: (params: any) => {
        return (
          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
            {params.value}
          </span>
        );
      },
    },
    {
      field: 'assigned_user_details',
      headerName: 'Assignee',
      width: 170,
      cellRenderer: (params: any) => {
        const u = params.data?.assigned_user_details;
        if (!u) return <span className="text-slate-400 text-xs italic">Unassigned</span>;
        const displayName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
        return (
          <div className="flex items-center gap-2 h-full">
            <div className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-500 font-bold text-[10px] flex items-center justify-center overflow-hidden border border-purple-500/30 flex-shrink-0">
              {u.avatar ? (
                <img src={u.avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{displayName[0].toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col leading-tight truncate">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{displayName}</span>
              {u.employee_id && (
                <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 font-semibold">{u.employee_id}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Open Full Ticket',
      width: 160,
      cellRenderer: (params: any) => (
        <button
          type="button"
          onClick={(e) => navigateToTicket(e, params.data.ticket_number || params.data.id, navigate)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          title="Click to view (Ctrl+Click to open in new tab)"
        >
          <Eye className="w-3.5 h-3.5" /> View Entire Ticket
        </button>
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
          onRowDoubleClicked={(event) => event.data?.id && navigateToTicket(event.event, event.data.ticket_number || event.data.id, navigate)}
          onRowClicked={(event) => event.data?.id && navigateToTicket(event.event, event.data.ticket_number || event.data.id, navigate)}
        />
      )}
    </div>
  );
};
