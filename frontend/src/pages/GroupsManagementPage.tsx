import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { setSelectedGroup } from '@/store/slices/authSlice';
import { axiosClient } from '@/api/axiosClient';
import { Group, User } from '@/types';
import {
  Users,
  Plus,
  Shield,
  Folder,
  Check,
  X,
  ArrowRight,
  Ticket,
  LayoutList,
  LayoutGrid,
  AlertCircle,
  UserPlus,
  CheckSquare,
  Square,
  Lock,
  Search,
  ChevronLeft,
  ChevronRight,
  Pin,
} from 'lucide-react';

export const GroupsManagementPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const canManageGroups = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedOnlyFilter, setPinnedOnlyFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Pinned Groups State (persisted in localStorage)
  const [pinnedGroupIds, setPinnedGroupIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('pinned_group_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const togglePinGroup = (groupId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPinnedGroupIds((prev) => {
      const next = prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId];
      localStorage.setItem('pinned_group_ids', JSON.stringify(next));
      return next;
    });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Group Member Rights Assignment Modal
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [savingAccess, setSavingAccess] = useState(false);
  const [modalUserSearchQuery, setModalUserSearchQuery] = useState('');

  const fetchGroups = async () => {
    try {
      const res = await axiosClient.get('/groups/');
      const groupList = res.data.results || res.data;
      if (Array.isArray(groupList)) {
        setGroups(groupList);
      }
      const uRes = await axiosClient.get('/auth/users/');
      setUsers(uRes.data.results || uRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const generateNextCode = (currentGroups: Group[]) => {
    let maxNum = 0;
    currentGroups.forEach((g) => {
      if (g.code && g.code.toUpperCase().startsWith('TR')) {
        const num = parseInt(g.code.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `TR${String(nextNum).padStart(4, '0')}`;
  };

  const handleOpenModal = () => {
    setFormError('');
    setName('');
    setDescription('');
    setCode(generateNextCode(groups));
    setIsModalOpen(true);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const finalCode = code || generateNextCode(groups);
    try {
      await axiosClient.post('/groups/', {
        name,
        code: finalCode,
        description,
        color: '#3B82F6',
        icon: 'folder',
      });
      setIsModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      fetchGroups();
    } catch (e: any) {
      console.error('Failed to create group:', e);
      const errData = e.response?.data;
      if (errData) {
        if (typeof errData === 'object') {
          const k = Object.keys(errData)[0];
          const val = errData[k];
          const msg = Array.isArray(val) ? val[0] : val;
          setFormError(`${k.toUpperCase()}: ${msg}`);
        } else {
          setFormError(String(errData));
        }
      } else {
        setFormError('Failed to create department group. Please ensure you are logged in.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAccessModal = (g: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroup(g);
    setModalUserSearchQuery('');
    // Initialize currently assigned member IDs
    const existingIds = (g as any).members_details ? (g as any).members_details.map((m: any) => m.id) : [];
    setSelectedUserIds(existingIds);
    setIsAccessModalOpen(true);
  };

  const toggleUserAccess = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSaveGroupAccess = async () => {
    if (!editingGroup) return;
    setSavingAccess(true);
    try {
      const res = await axiosClient.post(`/groups/${editingGroup.id}/assign-members/`, {
        user_ids: selectedUserIds,
      });
      setIsAccessModalOpen(false);
      const updatedGroup = res.data;
      dispatch(setSelectedGroup(updatedGroup));
      fetchGroups();
    } catch (e) {
      console.error('Failed to update group access rights:', e);
    } finally {
      setSavingAccess(false);
    }
  };

  const handleViewGroupTickets = (g: Group) => {
    dispatch(setSelectedGroup(g));
    navigate('/tickets');
  };

  const handleCreateTicketForGroup = (g: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setSelectedGroup(g));
    navigate('/tickets', { state: { openCreate: true } });
  };

  // Filter and sort groups by search query and pinned status (Pinned groups first)
  const filteredGroups = groups
    .filter((g) => {
      if (pinnedOnlyFilter && !pinnedGroupIds.includes(g.id)) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        g.name?.toLowerCase().includes(q) ||
        g.code?.toLowerCase().includes(q) ||
        (g.description || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const isAPinned = pinnedGroupIds.includes(a.id);
      const isBPinned = pinnedGroupIds.includes(b.id);
      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;
      return (b.code || '').localeCompare(a.code || '');
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredGroups.length / pageSize) || 1;
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            Department Groups
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Manage department workspaces and team access rights.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Pinned Only Filter Button */}
          <button
            type="button"
            onClick={() => {
              setPinnedOnlyFilter(!pinnedOnlyFilter);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              pinnedOnlyFilter
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${pinnedOnlyFilter ? 'fill-slate-950' : 'text-amber-500'}`} />
            <span>Pinned ({pinnedGroupIds.length})</span>
          </button>

          {/* Search Filter input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Name or Code (e.g. TR0001)..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {canManageGroups && (
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Department Group
            </button>
          )}
        </div>
      </div>

      {/* Empty State Banner */}
      {groups.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-12 text-center space-y-4 backdrop-blur-xl shadow-sm">
          <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Department Groups Found</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {canManageGroups
              ? 'Click the button below to manually create your first department group.'
              : 'You do not have access rights to any department groups yet. Please contact an Administrator.'}
          </p>
          {canManageGroups && (
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create First Department Group
            </button>
          )}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-sm">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Matching Department Groups</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">No department group matched your search query "{searchQuery}".</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <>
          {/* Main Groups Display: Table View */}
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-md backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-3.5 w-10 text-center">Pin</th>
                    <th className="px-5 py-3.5">Group Code</th>
                    <th className="px-5 py-3.5">Department Name</th>
                    <th className="px-5 py-3.5">Assigned Members / Rights</th>
                    <th className="px-5 py-3.5 text-right">Actions / Ticket Creation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {paginatedGroups.map((g) => {
                    const membersList = (g as any).members_details || [];
                    const isPinned = pinnedGroupIds.includes(g.id);
                    return (
                      <tr
                        key={g.id}
                        onClick={() => handleViewGroupTickets(g)}
                        className={`hover:bg-slate-100/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                          isPinned ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.05]' : ''
                        }`}
                      >
                        <td className="px-3 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => togglePinGroup(g.id, e)}
                            title={isPinned ? 'Unpin Group' : 'Pin Group to top'}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isPinned
                                ? 'text-amber-500 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
                                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                          >
                            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-500' : ''}`} />
                          </button>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border"
                            style={{
                              backgroundColor: `${g.color || '#3B82F6'}15`,
                              borderColor: `${g.color || '#3B82F6'}40`,
                              color: g.color || '#3B82F6',
                            }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color || '#3B82F6' }} />
                            [{g.code}]
                          </span>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <div className="flex items-center gap-2">
                            <span>{g.name}</span>
                            {isPinned && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                <Pin className="w-2.5 h-2.5 fill-amber-500" /> Pinned
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">{g.description || 'Department workspace.'}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-medium">
                          <button
                            type="button"
                            onClick={(e) => handleOpenAccessModal(g, e)}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                          >
                            {canManageGroups ? (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Assign Access Rights</span>
                              </>
                            ) : (
                              <>
                                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>View Group Rights</span>
                              </>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 font-bold">
                              {membersList.length} {membersList.length === 1 ? 'User' : 'Users'}
                            </span>
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={(e) => handleCreateTicketForGroup(g, e)}
                              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-105 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Create Ticket
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewGroupTickets(g)}
                              className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-xs font-medium cursor-pointer"
                            >
                              View Tickets <ArrowRight className="w-3 h-3" />
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
          {filteredGroups.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl text-xs text-slate-600 dark:text-slate-400 backdrop-blur-xl shadow-sm">
              <div>
                Showing <span className="text-slate-900 dark:text-white font-bold">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                <span className="text-slate-900 dark:text-white font-bold">{Math.min(currentPage * pageSize, filteredGroups.length)}</span> of{' '}
                <span className="text-slate-900 dark:text-white font-bold">{filteredGroups.length}</span> Department Groups
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

      {/* Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Create Department Group
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Auto-Generated Group Code <span className="text-blue-400">(Auto: TR0001)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={code}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-blue-400 font-mono font-bold focus:outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Group Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Development Engineering, HR & Operations..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating Group...' : 'Create Department Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Group Access Rights & Team Members */}
      {isAccessModalOpen && editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 text-slate-900 dark:text-white">
            {!canManageGroups ? (
              /* Read-Only Modal for Non-Admins */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Group Access Rights: <span className="text-blue-600 dark:text-blue-400 font-mono">[{editingGroup.code}]</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Members who have active access rights to {editingGroup.name}
                    </p>
                  </div>
                  <button onClick={() => setIsAccessModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {((editingGroup as any).members_details && (editingGroup as any).members_details.length > 0) ? (
                    (editingGroup as any).members_details.map((m: any) => (
                      <div key={m.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center font-bold text-xs text-white shadow-md">
                            {m.first_name ? m.first_name[0].toUpperCase() : m.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{m.first_name ? `${m.first_name} ${m.last_name || ''}` : m.username}</span>
                              <span className="text-slate-500 dark:text-slate-400 font-normal text-[11px]">(@{m.username})</span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                              <span>ID: {m.employee_id || 'N/A'}</span>
                              <span>•</span>
                              <span>{m.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 font-bold border border-blue-300 dark:border-blue-500/20">
                            {m.role}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20">
                            Has Access Rights
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50 dark:bg-slate-950/40">
                      No team members currently assigned to this group.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAccessModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-bold cursor-pointer transition-all"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              /* Interactive Access Rights Assignment Modal for Admins */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Assign Rights to Group: <span className="text-blue-600 dark:text-blue-400 font-mono">[{editingGroup.code}]</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Select which team members have access rights to {editingGroup.name}. Only checked users can be assigned tickets.
                    </p>
                  </div>
                  <button onClick={() => setIsAccessModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Real-time Search Box for Team Members */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={modalUserSearchQuery}
                    onChange={(e) => setModalUserSearchQuery(e.target.value)}
                    placeholder="Search user by username, email, or role (e.g. john_dev)..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all shadow-sm"
                  />
                  {modalUserSearchQuery && (
                    <button
                      onClick={() => setModalUserSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {users
                    .filter((u) => {
                      if (!modalUserSearchQuery.trim()) return true;
                      const q = modalUserSearchQuery.trim().toLowerCase();
                      return (
                        u.username?.toLowerCase().includes(q) ||
                        u.email?.toLowerCase().includes(q) ||
                        u.role?.toLowerCase().includes(q)
                      );
                    })
                    .map((u) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleUserAccess(u.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-300 dark:border-blue-500/40 text-slate-900 dark:text-white font-bold'
                              : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <Square className="w-4 h-4 text-slate-400 dark:text-slate-600" />}
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">{u.username}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{u.email || u.role}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                            {u.role}
                          </span>
                        </div>
                      );
                    })}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAccessModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGroupAccess}
                    disabled={savingAccess}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                  >
                    {savingAccess ? 'Saving Rights...' : 'Save & Update Group Access Rights'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
