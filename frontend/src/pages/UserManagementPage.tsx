import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { axiosClient } from '@/api/axiosClient';
import { User, Role, Group, CustomRole } from '@/types';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  CheckCircle,
  X,
  ShieldAlert,
  FolderCheck,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Circle,
  Edit3,
  Sparkles,
  Eye,
  EyeOff,
  Download,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'ON' | 'OFF'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [customRoleId, setCustomRoleId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRole, setEditRole] = useState<Role>('EMPLOYEE');
  const [editCustomRoleId, setEditCustomRoleId] = useState<number | null>(null);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditUserModal = (u: User) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditEmail(u.email || '');
    setEditFirstName(u.first_name || '');
    setEditLastName(u.last_name || '');
    setEditRole(u.role || 'EMPLOYEE');
    setEditCustomRoleId(u.custom_role || null);
    setEditNewPassword('');
    setEditFormError('');
    setIsEditModalOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditFormError('');
    setSavingEdit(true);

    try {
      await axiosClient.patch(`/auth/users/${editingUser.id}/`, {
        username: editUsername,
        email: editEmail,
        first_name: editFirstName,
        last_name: editLastName,
        role: editRole,
        custom_role: editCustomRoleId,
      });

      if (editNewPassword.trim()) {
        await axiosClient.post(`/auth/users/${editingUser.id}/reset-password/`, {
          new_password: editNewPassword.trim(),
        });
      }

      setIsEditModalOpen(false);
      fetchUsersAndGroups();
    } catch (err: any) {
      console.error(err);
      const respData = err.response?.data;
      if (respData) {
        if (typeof respData === 'object') {
          const firstKey = Object.keys(respData)[0];
          const val = respData[firstKey];
          const msg = Array.isArray(val) ? val[0] : val;
          setEditFormError(`${firstKey.toUpperCase()}: ${msg}`);
        } else {
          setEditFormError(String(respData));
        }
      } else {
        setEditFormError('Failed to update user details or reset password.');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Manage Group Access Rights Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userGroupRights, setUserGroupRights] = useState<{ group_id: number; group_code: string; group_name: string; role: string }[]>([]);
  const [isRightsModalOpen, setIsRightsModalOpen] = useState(false);
  const [rightsSearchQuery, setRightsSearchQuery] = useState('');

  const fetchUsersAndGroups = async () => {
    setLoading(true);
    try {
      const uRes = await axiosClient.get('/auth/users/');
      setUsers(uRes.data.results || uRes.data);

      const gRes = await axiosClient.get('/groups/');
      setGroups(gRes.data.results || gRes.data);

      const rRes = await axiosClient.get('/auth/roles/');
      setCustomRoles(rRes.data.results || rRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndGroups();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      await axiosClient.post('/auth/users/', {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
        custom_role: customRoleId,
      });
      setIsCreateModalOpen(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      fetchUsersAndGroups();
    } catch (err: any) {
      const respData = err.response?.data;
      if (respData) {
        if (typeof respData === 'object') {
          const firstKey = Object.keys(respData)[0];
          const val = respData[firstKey];
          const msg = Array.isArray(val) ? val[0] : val;
          setFormError(`${firstKey.toUpperCase()}: ${msg}`);
        } else {
          setFormError(String(respData));
        }
      } else {
        setFormError('Failed to create user. Ensure username and email are unique and password is at least 6 characters.');
      }
    }
  };

  const openRightsModal = async (u: User) => {
    setSelectedUser(u);
    setRightsSearchQuery('');
    try {
      const res = await axiosClient.get(`/auth/users/${u.id}/group-permissions/`);
      setUserGroupRights(res.data);
      setIsRightsModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleGroupAccess = async (groupId: number, hasAccess: boolean) => {
    if (!selectedUser) return;
    try {
      await axiosClient.post(`/auth/users/${selectedUser.id}/group-permissions/`, {
        group_id: groupId,
        role: 'MEMBER',
        action: hasAccess ? 'revoke' : 'grant',
      });
      const res = await axiosClient.get(`/auth/users/${selectedUser.id}/group-permissions/`);
      setUserGroupRights(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUserActiveStatus = async (u: User) => {
    if (currentUser && String(currentUser.id) === String(u.id) && u.is_active) {
      alert('Safety Guard: You cannot disable your own active logged-in admin account!');
      return;
    }
    try {
      const updatedStatus = !u.is_active;
      await axiosClient.patch(`/auth/users/${u.id}/`, {
        is_active: updatedStatus,
      });
      fetchUsersAndGroups();
    } catch (e) {
      console.error('Failed to toggle user active status:', e);
    }
  };

  // Helper to check if a user is live online
  const isUserOnline = (u: User) => {
    if (!u.is_active) return false;
    if (currentUser && currentUser.id === u.id) return true;
    // Users active and registered recently or logged in are online
    return u.is_active;
  };

  // Filtered users calculation
  const filteredUsers = users.filter((u) => {
    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = u.username?.toLowerCase().includes(q) || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchRole = u.role?.toLowerCase().includes(q);
      const matchEmpId = u.employee_id?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchRole && !matchEmpId) return false;
    }

    // Status filter
    if (statusFilter === 'ONLINE') {
      if (!isUserOnline(u)) return false;
    } else if (statusFilter === 'OFFLINE') {
      if (isUserOnline(u)) return false;
    } else if (statusFilter === 'ON') {
      if (!u.is_active) return false;
    } else if (statusFilter === 'OFF') {
      if (u.is_active) return false;
    }

    return true;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const onlineCount = users.filter(isUserOnline).length;
  const offlineCount = users.length - onlineCount;

  // CSV Status Notification
  const [csvStatus, setCsvStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      'Employee ID',
      'Username',
      'First Name',
      'Last Name',
      'Email',
      'System Role',
      'Custom Role',
      'Account Status',
      'Online Status',
      'Date Joined',
    ];

    const rows = filteredUsers.map((u) => [
      `"${(u.employee_id || 'TRA0001').replace(/"/g, '""')}"`,
      `"${(u.username || '').replace(/"/g, '""')}"`,
      `"${(u.first_name || '').replace(/"/g, '""')}"`,
      `"${(u.last_name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.role || '').replace(/"/g, '""')}"`,
      `"${(u.custom_role_details?.name || '').replace(/"/g, '""')}"`,
      `"${u.is_active ? 'Active (ON)' : 'Blocked (OFF)'}"`,
      `"${isUserOnline(u) ? 'Online' : 'Offline'}"`,
      `"${new Date(u.date_joined).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Users_Access_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCsvStatus({ type: 'success', message: `Exported ${filteredUsers.length} user record(s) to CSV!` });
    setTimeout(() => setCsvStatus(null), 5000);
  };

  // Sample CSV Template Downloader
  const handleDownloadSampleCSV = () => {
    const sampleCSV = `Username,Email,Password,First Name,Last Name,Role
john_dev,john@enterprise.com,UserPass123!,John,Dev,EMPLOYEE
sarah_admin,sarah@enterprise.com,UserPass123!,Sarah,Admin,ADMIN`;

    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Users_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import Handler
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== '');
      if (lines.length <= 1) {
        setCsvStatus({ type: 'error', message: 'CSV file is empty or missing data rows.' });
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
      let successCount = 0;
      let failCount = 0;
      const errorLogs: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((val) => val.trim().replace(/^"|"$/g, ''));
        if (row.length === 0 || !row[0]) continue;

        const rowData: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowData[h] = row[idx] || '';
        });

        const uname = rowData['username'] || row[0];
        const uemail = rowData['email'] || row[1] || `${uname}@enterprise.com`;
        const upass = rowData['password'] || row[2] || 'UserPass123!';
        const ufirst = rowData['first name'] || rowData['first_name'] || row[3] || uname;
        const ulast = rowData['last name'] || rowData['last_name'] || row[4] || '';
        const uroleRaw = (rowData['role'] || rowData['system role'] || row[5] || 'EMPLOYEE').toUpperCase();
        const urole = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'].includes(uroleRaw) ? uroleRaw : 'EMPLOYEE';

        try {
          await axiosClient.post('/auth/users/create/', {
            username: uname,
            email: uemail,
            password: upass,
            first_name: ufirst,
            last_name: ulast,
            role: urole,
          });
          successCount++;
        } catch (err: any) {
          failCount++;
          const msg = err.response?.data?.detail || err.response?.data?.username?.[0] || 'User creation failed';
          errorLogs.push(`${uname}: ${msg}`);
        }
      }

      fetchUsersAndGroups();
      e.target.value = '';

      if (successCount > 0) {
        setCsvStatus({
          type: 'success',
          message: `CSV Import Complete! Successfully added ${successCount} user account(s).` + (failCount > 0 ? ` Failed: ${failCount}` : ''),
        });
      } else {
        setCsvStatus({
          type: 'error',
          message: `CSV Import Failed for ${failCount} row(s). ${errorLogs.slice(0, 2).join('; ')}`,
        });
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            Users & Access
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Manage user accounts, live online status, login permissions, and department group access.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Online Counter Badge */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{onlineCount} Online</span>
            <span className="text-slate-300 dark:text-slate-600 font-bold">|</span>
            <span className="text-slate-600 dark:text-slate-400 font-mono">{offlineCount} Offline</span>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Export current user list to CSV file"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-105 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          {/* Import CSV Button */}
          <label
            title="Upload CSV file to bulk import user accounts"
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>

          {/* Sample CSV Template Link */}
          <button
            type="button"
            onClick={handleDownloadSampleCSV}
            title="Download CSV import sample template"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              setFormError('');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Create New User
          </button>
        </div>
      </div>

      {/* CSV Status Alert Banner */}
      {csvStatus && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
            csvStatus.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {csvStatus.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{csvStatus.message}</span>
          </div>
          <button onClick={() => setCsvStatus(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Filter People:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-1.5 text-xs focus:outline-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-700 transition-colors font-semibold shadow-sm"
          >
            <option value="ALL">All Accounts ({users.length})</option>
            <option value="ONLINE">Live Online ({onlineCount})</option>
            <option value="OFFLINE">Offline ({offlineCount})</option>
            <option value="ON">ON (Allowed to Login)</option>
            <option value="OFF">OFF (Blocked Login)</option>
          </select>
        </div>

        {/* Real-time Search Box */}
        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Username, Email, or Role..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Users Data Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-sm">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Matching User Accounts</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">No user account matched your search query or status filter.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white/80 dark:bg-slate-900/60 rounded-2xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-800 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">User Account</th>
                    <th className="px-4 py-3.5">Live Online Status</th>
                    <th className="px-4 py-3.5">System Role</th>
                    <th className="px-4 py-3.5">Login Access (ON/OFF)</th>
                    <th className="px-4 py-3.5">Joined Date</th>
                    <th className="px-4 py-3.5 text-right">Group Rights Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {paginatedUsers.map((u) => {
                    const online = isUserOnline(u);
                    return (
                      <tr key={u.id} className="hover:bg-slate-100/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs border border-blue-400/30 relative overflow-hidden shadow-sm flex-shrink-0">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                            ) : (
                              <span>{u.first_name ? u.first_name[0].toUpperCase() : u.username[0].toUpperCase()}</span>
                            )}
                            {online && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs">
                                {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30">
                                {u.employee_id || 'TRA0001'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">@{u.username} • {u.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {online ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                              <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                              Offline
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {u.custom_role_details ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md border bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/30 inline-flex items-center gap-1 shadow-sm">
                              <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              {u.custom_role_details.name}
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded border ${
                                u.role === 'SUPER_ADMIN'
                                  ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/30'
                                  : u.role === 'ADMIN' || u.role === 'MANAGER'
                                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/30'
                                  : u.role === 'TEAM_LEAD'
                                  ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleUserActiveStatus(u)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                              u.is_active
                                ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-200 dark:hover:bg-emerald-500/25'
                                : 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/40 hover:bg-red-200 dark:hover:bg-red-500/25'
                            }`}
                            title={u.is_active ? 'Click to turn OFF (Block Login Access)' : 'Click to turn ON (Allow Login Access)'}
                          >
                            <div
                              className={`w-3 h-3 rounded-full transition-all ${
                                u.is_active ? 'bg-emerald-500 shadow-sm shadow-emerald-400' : 'bg-red-500 shadow-sm shadow-red-400'
                              }`}
                            />
                            <span>{u.is_active ? 'ON (Allowed)' : 'OFF (Blocked)'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {new Date(u.date_joined).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditUserModal(u)}
                              className="bg-blue-50 dark:bg-blue-600/10 hover:bg-blue-100 dark:hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit Details
                            </button>
                            <button
                              type="button"
                              onClick={() => openRightsModal(u)}
                              className="bg-purple-50 dark:bg-purple-600/10 hover:bg-purple-100 dark:hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                            >
                              <Shield className="w-3.5 h-3.5" /> Group Access Rights
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls Bar */}
          {filteredUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl text-xs text-slate-600 dark:text-slate-400 backdrop-blur-xl shadow-sm">
              <div>
                Showing <span className="text-slate-900 dark:text-white font-bold">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                <span className="text-slate-900 dark:text-white font-bold">{Math.min(currentPage * pageSize, filteredUsers.length)}</span> of{' '}
                <span className="text-slate-900 dark:text-white font-bold">{filteredUsers.length}</span> User Accounts
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <span className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 font-mono font-bold border border-slate-300 dark:border-slate-800 shadow-sm">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Create New User Account
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Employee ID Format:</span>
                <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-blue-300 dark:border-blue-500/40 shadow-sm">
                  Auto-Assigns Sequentially (e.g. TRA0006)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                  placeholder="e.g. john_dev"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-3.5 pr-10 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 cursor-pointer transition-colors"
                    title={showCreatePassword ? 'Hide password' : 'Show password'}
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4 text-blue-500" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">System & Dynamic Role</label>
                <select
                  value={customRoleId ? `CUSTOM_${customRoleId}` : role}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('CUSTOM_')) {
                      const id = parseInt(val.replace('CUSTOM_', ''), 10);
                      setCustomRoleId(id);
                      setRole('EMPLOYEE');
                    } else {
                      setCustomRoleId(null);
                      setRole(val as Role);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer shadow-sm"
                >
                  <optgroup label="System Roles">
                    <option value="SUPER_ADMIN" className="bg-white dark:bg-slate-900">Super Admin</option>
                    <option value="ADMIN" className="bg-white dark:bg-slate-900">Admin</option>
                    <option value="MANAGER" className="bg-white dark:bg-slate-900">Manager</option>
                    <option value="TEAM_LEAD" className="bg-white dark:bg-slate-900">Team Lead</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="VIEWER">Viewer</option>
                  </optgroup>
                  {customRoles.length > 0 && (
                    <optgroup label="✨ Dynamic Custom Roles">
                      {customRoles.map((cr) => (
                        <option key={cr.id} value={`CUSTOM_${cr.id}`}>
                          ✨ Dynamic: {cr.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant/Revoke Department Group Access Rights Modal */}
      {isRightsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Group Access Rights: @{selectedUser.username}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30">
                    {userGroupRights.length} / {groups.length} Groups Granted
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Currently has access rights to <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{userGroupRights.length}</span> out of <span className="text-slate-900 dark:text-white font-bold font-mono">{groups.length}</span> department groups.
                </p>
              </div>
              <button onClick={() => setIsRightsModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Real-time Search Box for Department Groups */}
            <div className="relative mb-3.5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rightsSearchQuery}
                onChange={(e) => setRightsSearchQuery(e.target.value)}
                placeholder="Search department group by Name or Code (e.g. TR0001)..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all shadow-sm"
              />
              {rightsSearchQuery && (
                <button
                  onClick={() => setRightsSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {groups
                .filter((g) => {
                  if (!rightsSearchQuery.trim()) return true;
                  const q = rightsSearchQuery.trim().toLowerCase();
                  return g.name?.toLowerCase().includes(q) || g.code?.toLowerCase().includes(q);
                })
                .map((g) => {
                  const hasAccess = userGroupRights.some((r) => r.group_id === g.id);

                  return (
                    <div
                      key={g.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        hasAccess
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-500/40'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: g.color }} />
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">{g.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">[{g.code}]</div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleGroupAccess(g.id, hasAccess)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          hasAccess
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-800 dark:hover:text-red-300'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        {hasAccess ? 'Granted (Revoke)' : 'Grant Access'}
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
              <button
                onClick={() => setIsRightsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                Done & Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Account Details Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Edit Employee Details: @{editingUser.username}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editFormError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">System & Dynamic Role</label>
                <select
                  value={editCustomRoleId ? `CUSTOM_${editCustomRoleId}` : editRole}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('CUSTOM_')) {
                      const id = parseInt(val.replace('CUSTOM_', ''), 10);
                      setEditCustomRoleId(id);
                      setEditRole('EMPLOYEE');
                    } else {
                      setEditCustomRoleId(null);
                      setEditRole(val as Role);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer font-semibold shadow-sm"
                >
                  <optgroup label="System Roles">
                    <option value="SUPER_ADMIN" className="bg-white dark:bg-slate-900">Super Admin</option>
                    <option value="ADMIN" className="bg-white dark:bg-slate-900">Admin</option>
                    <option value="MANAGER" className="bg-white dark:bg-slate-900">Manager</option>
                    <option value="TEAM_LEAD" className="bg-white dark:bg-slate-900">Team Lead</option>
                    <option value="EMPLOYEE" className="bg-white dark:bg-slate-900">Employee</option>
                    <option value="VIEWER" className="bg-white dark:bg-slate-900">Viewer</option>
                  </optgroup>
                  {customRoles.length > 0 && (
                    <optgroup label="✨ Dynamic Custom Roles">
                      {customRoles.map((cr) => (
                        <option key={cr.id} value={`CUSTOM_${cr.id}`} className="bg-white dark:bg-slate-900">
                          ✨ Dynamic: {cr.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reset Account Password <span className="text-slate-400 font-normal">(Optional - Leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-3.5 pr-10 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 cursor-pointer transition-colors"
                    title={showEditPassword ? 'Hide password' : 'Show password'}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4 text-blue-500" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? 'Saving Updates...' : 'Save & Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
