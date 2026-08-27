import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigateToTicket } from '@/utils/navigation';
import { RootState } from '@/store';
import { setViewMode, setStatusFilter, setPriorityFilter } from '@/store/slices/filterSlice';
import { axiosClient } from '@/api/axiosClient';
import { Ticket, CustomField, Project, User, Group } from '@/types';
import { TicketAgGridTable } from '@/components/views/TicketAgGridTable';
import { KanbanBoard } from '@/components/views/KanbanBoard';
import { CalendarView } from '@/components/views/CalendarView';
import { TimelineView } from '@/components/views/TimelineView';
import { DynamicFormRenderer } from '@/components/forms/DynamicFormRenderer';
import { useForm } from 'react-hook-form';
import {
  Plus,
  LayoutList,
  Kanban,
  Calendar as CalendarIcon,
  GitCommit,
  Filter,
  X,
  AlertCircle,
  Clock,
  Paperclip,
  Trash2,
  FileText,
  Building2,
  Layers,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Search,
  ArrowLeft,
  Download,
} from 'lucide-react';

export const TicketsPage: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedGroup } = useSelector((state: RootState) => state.auth);
  const { viewMode, statusFilter, priorityFilter } = useSelector((state: RootState) => state.filters);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchKey, setSearchKey] = useState('');
  const [createdFromDate, setCreatedFromDate] = useState('');
  const [createdToDate, setCreatedToDate] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [quickViewTicket, setQuickViewTicket] = useState<Ticket | null>(null);
  const [createFormError, setCreateFormError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  const [activeGroupDetails, setActiveGroupDetails] = useState<Group | null>(null);

  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateFormError('');
      setSelectedFiles([]);
      setIsCreateModalOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (selectedGroup?.id) {
        try {
          const gRes = await axiosClient.get(`/groups/${selectedGroup.id}/`);
          setActiveGroupDetails(gRes.data);
        } catch (e) {
          console.error(e);
          setActiveGroupDetails(selectedGroup);
        }
      } else {
        setActiveGroupDetails(null);
      }
    };
    fetchGroupInfo();
  }, [selectedGroup]);

  const fetchTickets = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      let params: string[] = [];
      if (selectedGroup) params.push(`group_id=${selectedGroup.id}`);
      if (statusFilter) params.push(`status=${statusFilter}`);
      if (priorityFilter) params.push(`priority=${priorityFilter}`);

      const queryString = params.length > 0 ? `?${params.join('&')}` : '';
      const res = await axiosClient.get(`/tickets/${queryString}`);
      setTickets(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedGroup, statusFilter, priorityFilter]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const fieldsUrl = selectedGroup ? `/dynamic-fields/?group_id=${selectedGroup.id}` : '/dynamic-fields/';
        const [fRes, pRes, uRes] = await Promise.all([
          axiosClient.get(fieldsUrl),
          axiosClient.get('/projects/'),
          axiosClient.get('/auth/users/'),
        ]);
        setCustomFields(fRes.data.results || fRes.data);
        setProjects(pRes.data.results || pRes.data);
        setUsers(uRes.data.results || uRes.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMetadata();
  }, [selectedGroup]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onCreateTicket = async (data: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setCreateFormError('');
    try {
      const custom_fields_data: Record<string, any> = {};
      customFields.forEach((cf) => {
        if (data[cf.field_key] !== undefined) {
          custom_fields_data[cf.field_key] = data[cf.field_key];
        }
      });

      const payload = {
        title: data.title,
        description: data.description || '',
        priority: data.priority || 'MEDIUM',
        status: data.status || 'OPEN',
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        project: data.project ? parseInt(data.project) : (projects[0]?.id || null),
        assigned_group: selectedGroup?.id || 1,
        assigned_user: data.assigned_user ? parseInt(data.assigned_user) : null,
        story_points: parseInt(data.story_points || '3'),
        custom_fields_data,
      };

      const res = await axiosClient.post('/tickets/', payload);
      const newTicket = res.data;

      // Upload any selected files/images
      if (selectedFiles.length > 0 && newTicket?.id) {
        for (const f of selectedFiles) {
          const formData = new FormData();
          formData.append('file', f);
          try {
            await axiosClient.post(`/tickets/${newTicket.id}/attachments/`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (uploadErr) {
            console.error('Failed to upload file:', f.name, uploadErr);
          }
        }
      }

      setIsCreateModalOpen(false);
      setSelectedFiles([]);
      reset();
      fetchTickets();
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      const respData = err.response?.data;
      if (respData) {
        if (typeof respData === 'object') {
          const firstKey = Object.keys(respData)[0];
          const val = respData[firstKey];
          const msg = Array.isArray(val) ? val[0] : val;
          setCreateFormError(`${firstKey.toUpperCase()}: ${msg}`);
        } else {
          setCreateFormError(String(respData));
        }
      } else {
        setCreateFormError('Failed to create ticket. Ensure title & project key are selected.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    // Search key filter
    if (searchKey.trim()) {
      const query = searchKey.trim().toLowerCase();
      const matchesKey = t.ticket_number?.toLowerCase().includes(query);
      const matchesTitle = t.title?.toLowerCase().includes(query);
      const matchesAssignee = t.assigned_user_details?.username?.toLowerCase().includes(query);
      const matchesReporter = t.reporter_details?.username?.toLowerCase().includes(query);
      if (!matchesKey && !matchesTitle && !matchesAssignee && !matchesReporter) return false;
    }

    // Assignee Filter
    if (assigneeFilter) {
      if (assigneeFilter === 'UNASSIGNED') {
        if (t.assigned_user) return false;
      } else if (String(t.assigned_user) !== assigneeFilter) {
        return false;
      }
    }

    // Created By Filter
    if (createdByFilter) {
      if (String(t.reporter) !== createdByFilter) return false;
    }

    // Created From Date filter
    if (createdFromDate) {
      const ticketDate = new Date(t.created_at);
      const fromDate = new Date(createdFromDate);
      fromDate.setHours(0, 0, 0, 0);
      if (ticketDate < fromDate) return false;
    }

    // Created To Date filter
    if (createdToDate) {
      const ticketDate = new Date(t.created_at);
      const toDate = new Date(createdToDate);
      toDate.setHours(23, 59, 59, 999);
      if (ticketDate > toDate) return false;
    }

    return true;
  });

  const handleExportCSV = () => {
    if (!filteredTickets || filteredTickets.length === 0) return;

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Ticket Key',
      'Title Summary',
      'Description',
      'Status',
      'Priority',
      'Department Group Code',
      'Department Group Name',
      'Project Code',
      'Project Name',
      'Assignee Name',
      'Assignee Username',
      'Assignee Employee ID',
      'Created By Name',
      'Created By Username',
      'Created By Employee ID',
      'Start Date',
      'Target Due Date',
      'Story Points',
      'Created Date',
      'Last Updated Date',
      'Custom Field Attributes',
    ];

    const rows = filteredTickets.map((t) => {
      const assigneeName = t.assigned_user_details
        ? t.assigned_user_details.first_name
          ? `${t.assigned_user_details.first_name} ${t.assigned_user_details.last_name || ''}`.trim()
          : t.assigned_user_details.username
        : 'Unassigned';

      const reporterName = t.reporter_details
        ? t.reporter_details.first_name
          ? `${t.reporter_details.first_name} ${t.reporter_details.last_name || ''}`.trim()
          : t.reporter_details.username
        : 'System';

      const customAttrs = t.custom_values && t.custom_values.length > 0
        ? t.custom_values.map((cv) => `${cv.field_label}: ${cv.value}`).join(' | ')
        : '';

      return [
        escapeCSV(t.ticket_number),
        escapeCSV(t.title),
        escapeCSV(t.description),
        escapeCSV(t.status),
        escapeCSV(t.priority),
        escapeCSV(t.group_details?.code || activeGroupDetails?.code || selectedGroup?.code),
        escapeCSV(t.group_details?.name || activeGroupDetails?.name || selectedGroup?.name),
        escapeCSV(t.project_details?.code || t.project_code),
        escapeCSV(t.project_details?.name || t.project_name),
        escapeCSV(assigneeName),
        escapeCSV(t.assigned_user_details?.username || ''),
        escapeCSV(t.assigned_user_details?.employee_id || ''),
        escapeCSV(reporterName),
        escapeCSV(t.reporter_details?.username || ''),
        escapeCSV(t.reporter_details?.employee_id || ''),
        escapeCSV(t.start_date ? new Date(t.start_date).toLocaleString() : ''),
        escapeCSV(t.due_date ? new Date(t.due_date).toLocaleString() : ''),
        escapeCSV(t.story_points || 0),
        escapeCSV(t.created_at ? new Date(t.created_at).toLocaleString() : ''),
        escapeCSV(t.updated_at ? new Date(t.updated_at).toLocaleString() : ''),
        escapeCSV(customAttrs),
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const grpCode = activeGroupDetails ? activeGroupDetails.code : selectedGroup ? selectedGroup.code : 'ALL';
    link.setAttribute('download', `Comprehensive_Tickets_Export_${grpCode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'BACKLOG' || t.status === 'TODO').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const inReviewCount = tickets.filter((t) => t.status === 'IN_REVIEW' || t.status === 'REOPEN').length;
  const doneCount = tickets.filter((t) => t.status === 'DONE' || t.status === 'CLOSED').length;

  return (
    <div className="space-y-6">
      {/* Action Bar & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <div className="space-y-2">
          <button
            onClick={() => navigate('/groups')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Back to Department Groups
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>Ticket Management Engine</span>
            </h1>

            {/* Selected Department Group Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs border border-indigo-500/30 shadow-sm">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>{activeGroupDetails ? activeGroupDetails.name : selectedGroup ? selectedGroup.name : 'All Department Groups'}</span>
              <span className="font-mono text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                {activeGroupDetails ? activeGroupDetails.code : selectedGroup ? selectedGroup.code : 'ALL'}
              </span>
            </span>

            {/* Live Status Summary Badges in Header */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setStatusFilter('')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  !statusFilter
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-500'
                }`}
                title="Click to view all tickets"
              >
                <span>Total</span>
                <span className="bg-white/20 dark:bg-black/20 px-1.5 py-0.2 rounded-md font-mono text-[10px]">
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('OPEN')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'OPEN'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:border-blue-500'
                }`}
                title="Click to filter Open tickets"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Open</span>
                <span className="bg-blue-500/20 px-1.5 py-0.2 rounded-md font-mono text-[10px]">
                  {openCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('IN_PROGRESS')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'IN_PROGRESS'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:border-amber-500'
                }`}
                title="Click to filter In Progress tickets"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>In Progress</span>
                <span className="bg-amber-500/20 px-1.5 py-0.2 rounded-md font-mono text-[10px]">
                  {inProgressCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('IN_REVIEW')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'IN_REVIEW'
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:border-purple-500'
                }`}
                title="Click to filter In Review tickets"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>In Review</span>
                <span className="bg-purple-500/20 px-1.5 py-0.2 rounded-md font-mono text-[10px]">
                  {inReviewCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('DONE')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'DONE'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:border-emerald-500'
                }`}
                title="Click to filter Completed/Done tickets"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Done</span>
                <span className="bg-emerald-500/20 px-1.5 py-0.2 rounded-md font-mono text-[10px]">
                  {doneCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredTickets.length === 0}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all hover:border-slate-400 cursor-pointer disabled:opacity-50 shadow-sm"
            title="Export displayed tickets to CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Export CSV ({filteredTickets.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setCreateFormError('');
              setSelectedFiles([]);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New Ticket
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Quick Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => dispatch(setStatusFilter(e.target.value))}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-700 transition-colors shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="REOPEN">Reopen</option>
            <option value="DONE">Done</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => dispatch(setPriorityFilter(e.target.value))}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-700 transition-colors shadow-sm"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-700 transition-colors font-semibold shadow-sm"
          >
            <option value="">All Assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.first_name ? `${u.first_name} (@${u.username})` : u.username}
              </option>
            ))}
          </select>

          <select
            value={createdByFilter}
            onChange={(e) => setCreatedByFilter(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-700 transition-colors font-semibold shadow-sm"
          >
            <option value="">All Creators (Created By)</option>
            {users.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.first_name ? `${u.first_name} (@${u.username})` : u.username}
              </option>
            ))}
          </select>

          {/* Creation Date Range Filters */}
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800/80 px-2.5 py-1 rounded-xl shadow-sm max-w-full">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">Created:</span>
            <input
              type="date"
              value={createdFromDate}
              onChange={(e) => setCreatedFromDate(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              title="From Created Date"
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-none cursor-pointer font-mono"
            />
            <span className="text-slate-400 font-bold">&rarr;</span>
            <input
              type="date"
              value={createdToDate}
              onChange={(e) => setCreatedToDate(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              title="To Created Date"
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-none cursor-pointer font-mono"
            />
            {(createdFromDate || createdToDate) && (
              <button
                onClick={() => {
                  setCreatedFromDate('');
                  setCreatedToDate('');
                }}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-0.5"
                title="Clear date range filter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Search Filter by Ticket Key */}
        <div className="relative w-full lg:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            placeholder="Search by Ticket Key (e.g. TR0001)..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors shadow-sm"
          />
          {searchKey && (
            <button
              onClick={() => setSearchKey('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active View Render */}
      {viewMode === 'ag-grid' && <TicketAgGridTable tickets={filteredTickets} loading={loading} />}
      {viewMode === 'kanban' && <KanbanBoard tickets={filteredTickets} onTicketUpdate={(silent) => fetchTickets(silent ?? true)} />}
      {viewMode === 'calendar' && <CalendarView tickets={filteredTickets} />}
      {viewMode === 'timeline' && <TimelineView tickets={filteredTickets} />}

      {/* Full Enterprise Create Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 animate-in zoom-in-95 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Create New Enterprise Ticket
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Department:{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-semibold font-mono">
                    [{activeGroupDetails ? activeGroupDetails.code : selectedGroup ? selectedGroup.code : 'GLOBAL'}]
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createFormError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onCreateTicket)} className="space-y-4">
              {/* Section 1: Basic Info */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ticket Title / Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                  placeholder="Summary of issue or feature request..."
                />
              </div>

              {/* Section 2: Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  {...register('description')}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-600 shadow-sm"
                  placeholder="Detailed description, steps to reproduce, or notes..."
                />
              </div>

              {/* Section 3: Status, Priority & Assignee */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-20">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    {...register('status')}
                    defaultValue="OPEN"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white truncate focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer font-semibold shadow-sm"
                  >
                    <option value="OPEN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1.5 px-3">Open (Default)</option>
                    <option value="IN_PROGRESS" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1.5 px-3">In Progress</option>
                    <option value="IN_REVIEW" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1.5 px-3">In Review</option>
                    <option value="REOPEN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1.5 px-3">Reopen</option>
                    <option value="DONE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1.5 px-3">Done</option>
                    <option value="CLOSED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1.5 px-3">Closed</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    {...register('priority')}
                    defaultValue="MEDIUM"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white truncate focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm"
                  >
                    <option value="LOW" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1.5 px-3">Low</option>
                    <option value="MEDIUM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1.5 px-3">Medium</option>
                    <option value="HIGH" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1.5 px-3">High</option>
                    <option value="URGENT" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1.5 px-3">Urgent</option>
                    <option value="CRITICAL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1.5 px-3">Critical</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assignee</label>
                  <select
                    {...register('assigned_user')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white truncate focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">Unassigned</option>
                    {(() => {
                      const currentGrp = activeGroupDetails || selectedGroup;
                      const groupMembers = (currentGrp as any)?.members_details || [];

                      if (currentGrp) {
                        const assignableUsers = users.filter((u) =>
                          groupMembers.some((m: any) => m.id === u.id)
                        );

                        if (assignableUsers.length === 0) {
                          return (
                            <option value="" disabled className="bg-slate-900 text-amber-400 font-semibold">
                              No users assigned rights to {currentGrp.code} yet
                            </option>
                          );
                        }

                        return assignableUsers.map((u) => (
                          <option key={u.id} value={u.id} className="bg-slate-900 text-slate-100 py-1.5 px-3">
                            {u.username} ({u.role})
                          </option>
                        ));
                      }

                      return users.map((u) => (
                        <option key={u.id} value={u.id} className="bg-slate-900 text-slate-100 py-1.5 px-3">
                          {u.username} ({u.role})
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              {/* Section 4: Interactive Timeline Schedule (From Date -> To Date) */}
              <div className="p-4 bg-slate-100/80 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Timeline Schedule (From Date & Target Due Date)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Start Date (From Date)</label>
                    <input
                      type="date"
                      {...register('start_date')}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Due Date (To Date)</label>
                    <input
                      type="date"
                      {...register('due_date')}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: File & Image Upload Attachment Selector */}
              <div className="p-4 bg-slate-100/80 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Attach Images & Files (WebP Compression &lt; 50 KB)
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {selectedFiles.length} file(s) selected
                  </span>
                </div>

                <label className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-purple-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white/60 dark:bg-slate-900/40 transition-colors shadow-sm">
                  <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Click or Drag & Drop Images/Files Here</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">Images will be auto-compressed to &lt; 50 KB WebP format</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                {selectedFiles.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs shadow-sm">
                        <div className="flex items-center gap-2 truncate">
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          )}
                          <span className="truncate text-slate-800 dark:text-slate-200">{file.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({Math.round(file.size / 1024)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 6: Injected Dynamic Custom Fields */}
              <DynamicFormRenderer fields={customFields} register={register} errors={errors} control={control} />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Ticket...
                    </>
                  ) : (
                    'Create Ticket'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Ticket View Modal / Drawer */}
      {quickViewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 text-slate-900 dark:text-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-xl border border-blue-500/30">
                  {quickViewTicket.ticket_number}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                  {quickViewTicket.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => navigateToTicket(e, quickViewTicket.ticket_number || quickViewTicket.id, navigate)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  title="Click to view (Ctrl+Click to open in new tab)"
                >
                  Edit / Full Page
                </button>
                <button
                  onClick={() => setQuickViewTicket(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick View Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ticket Summary / Title</h4>
                  <div className="text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    {quickViewTicket.title}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Entire Ticket Description</h4>
                  <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap min-h-[100px] leading-relaxed">
                    {quickViewTicket.description || <span className="italic text-slate-400">No description provided.</span>}
                  </div>
                </div>

                {/* Custom Dynamic Fields */}
                {customFields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {customFields.map((cf) => {
                        const match = (quickViewTicket.custom_values || []).find(
                          (cv) => cv.field_key === cf.field_key || cv.custom_field === cf.id
                        );
                        const hasVal = match && match.value !== null && String(match.value).trim() !== '';

                        return (
                          <div key={cf.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-0.5">
                            <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">{cf.label}</span>
                            {hasVal ? (
                              <span className="text-slate-900 dark:text-white font-semibold text-xs">{String(match.value)}</span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Not set</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                )}
              </div>

              {/* Sidebar Attributes */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Group / Department</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20 inline-block font-mono">
                    {quickViewTicket.assigned_group_details?.name || 'ddada'} [{quickViewTicket.assigned_group_details?.code || 'TR0001'}]
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Status</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 inline-block">
                    {quickViewTicket.status}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Priority</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 uppercase bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 inline-block">
                    {quickViewTicket.priority}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Assignee</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {quickViewTicket.assigned_user_details?.username || 'Unassigned'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Reporter</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {quickViewTicket.reporter_details?.username || 'System'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Due Date</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {quickViewTicket.due_date ? new Date(quickViewTicket.due_date).toLocaleDateString() : 'No due date'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
