import React, { useState, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';
import { Shield, Plus, Check, X, Edit3, Trash2, CheckSquare, Square, Grid, LayoutGrid, Key, PlusCircle, AlertCircle, Save, CheckCircle2, List, Users } from 'lucide-react';

interface CustomRole {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  user_count: number;
  created_at: string;
}

interface PermissionDefinition {
  id: string;
  label: string;
  category: string;
  description?: string;
}

const DEFAULT_PERMISSIONS: PermissionDefinition[] = [
  // Ticket Management
  { id: 'create_ticket', label: 'Create Tickets', category: 'Tickets', description: 'Allows creating new work items & tickets' },
  { id: 'update_ticket', label: 'Edit & Transition Tickets', category: 'Tickets', description: 'Allows editing title, status, priority, and custom fields' },
  { id: 'delete_ticket', label: 'Delete Tickets & Attachments', category: 'Tickets', description: 'Allows permanently removing tickets and files' },
  { id: 'assign_ticket', label: 'Reassign & Transfer Tickets', category: 'Tickets', description: 'Allows transferring tickets between team members' },
  { id: 'close_ticket', label: 'Close & Resolve Tickets', category: 'Tickets', description: 'Allows marking tickets as Done or Closed' },
  { id: 'export_tickets', label: 'Export Ticket CSV/Excel', category: 'Tickets', description: 'Allows exporting filtered ticket data' },

  // Department Groups
  { id: 'manage_groups', label: 'Manage Department Groups', category: 'Department Groups', description: 'Allows creating and editing department group code & details' },
  { id: 'assign_group_access', label: 'Grant/Revoke Group Rights', category: 'Department Groups', description: 'Allows assigning team member access rights to department groups' },

  // User & Role Access Control
  { id: 'manage_users', label: 'User Account Management', category: 'Security & Access', description: 'Allows creating and editing user accounts & passwords' },
  { id: 'manage_roles', label: 'Dynamic Role Builder', category: 'Security & Access', description: 'Allows creating and modifying custom RBAC dynamic roles' },

  // Dynamic Form Builder
  { id: 'manage_custom_fields', label: 'Dynamic Form Builder', category: 'Form Builder', description: 'Allows adding custom dynamic input fields' },

  // Audit Logs & Security
  { id: 'view_audit_logs', label: 'View System Audit Logs', category: 'Audit & Analytics', description: 'Allows inspecting timeline audit history' },
  { id: 'export_reports', label: 'Export Executive Reports', category: 'Audit & Analytics', description: 'Allows generating Excel/PDF executive reports' },
];

export const RolesManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [permissionList, setPermissionList] = useState<PermissionDefinition[]>(DEFAULT_PERMISSIONS);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);

  // Form Input States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['create_ticket', 'update_ticket']);

  // Add New Custom Feature Right State
  const [newRightId, setNewRightId] = useState('');
  const [newRightLabel, setNewRightLabel] = useState('');
  const [newRightCategory, setNewRightCategory] = useState('Custom Features');
  const [isAddingNewRight, setIsAddingNewRight] = useState(false);

  // Feedback Messages
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRoles = async () => {
    try {
      const res = await axiosClient.get('/auth/roles/');
      const fetchedRoles: CustomRole[] = res.data.results || res.data;
      setRoles(fetchedRoles);

      // Dynamically discover any custom permissions found in database roles that are not in default list
      const discoveredMap = new Map<string, PermissionDefinition>();
      permissionList.forEach((p) => discoveredMap.set(p.id, p));

      fetchedRoles.forEach((role) => {
        (role.permissions || []).forEach((permKey) => {
          if (!discoveredMap.has(permKey)) {
            discoveredMap.set(permKey, {
              id: permKey,
              label: permKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              category: 'Custom Features',
            });
          }
        });
      });

      setPermissionList(Array.from(discoveredMap.values()));
    } catch (e) {
      console.error('Failed to fetch roles:', e);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    setName('');
    setDescription('');
    setSelectedPermissions(['create_ticket', 'update_ticket']);
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (role: CustomRole) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || '');
    setSelectedPermissions(role.permissions || []);
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleAddNewRightDefinition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRightId.trim()) return;

    const formattedId = newRightId.trim().toLowerCase().replace(/\s+/g, '_');
    const formattedLabel = newRightLabel.trim() || formattedId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    if (!permissionList.some((p) => p.id === formattedId)) {
      const newDef: PermissionDefinition = {
        id: formattedId,
        label: formattedLabel,
        category: newRightCategory.trim() || 'Custom Features',
      };
      setPermissionList([...permissionList, newDef]);
      setSelectedPermissions([...selectedPermissions, formattedId]);
    }

    setNewRightId('');
    setNewRightLabel('');
    setIsAddingNewRight(false);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (editingRole) {
        // Edit existing role
        await axiosClient.patch(`/auth/roles/${editingRole.id}/`, {
          name,
          description,
          permissions: selectedPermissions,
        });
        setSuccessMsg(`Role "${name}" updated successfully with ${selectedPermissions.length} granted rights!`);
      } else {
        // Create new role
        await axiosClient.post('/auth/roles/', {
          name,
          description,
          permissions: selectedPermissions,
        });
        setSuccessMsg(`Dynamic Role "${name}" created successfully!`);
      }

      setIsModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      console.error('Failed to save role:', err);
      const detail = err.response?.data?.name ? `Role Name: ${err.response.data.name[0]}` : 'Failed to save role details.';
      setErrorMsg(detail);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: CustomRole) => {
    if (role.user_count > 0) {
      alert(`Cannot delete role "${role.name}" because it is currently assigned to ${role.user_count} user account(s). Please reassign users first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete the custom role "${role.name}"?`)) return;

    try {
      await axiosClient.delete(`/auth/roles/${role.id}/`);
      fetchRoles();
    } catch (err) {
      console.error('Failed to delete role:', err);
    }
  };

  // Matrix cell toggle handler
  const handleMatrixToggle = async (role: CustomRole, permId: string) => {
    const currentPerms = role.permissions || [];
    const updatedPerms = currentPerms.includes(permId)
      ? currentPerms.filter((p) => p !== permId)
      : [...currentPerms, permId];

    try {
      await axiosClient.patch(`/auth/roles/${role.id}/`, {
        permissions: updatedPerms,
      });

      setRoles(
        roles.map((r) => (r.id === role.id ? { ...r, permissions: updatedPerms } : r))
      );
    } catch (err) {
      console.error('Failed to update matrix permission:', err);
    }
  };

  // Group permissions by category for clear presentation
  const groupedPermissions = permissionList.reduce((acc, perm) => {
    const cat = perm.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(perm);
    return acc;
  }, {} as Record<string, PermissionDefinition[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-500" />
            Dynamic Custom Role Builder
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Create dynamic custom RBAC roles and dynamically grant, add, or edit feature rights anytime.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Dynamic Custom Role
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Custom Roles Table List */}
      <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-800 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Custom Role Title</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5">Active Users</th>
                <th className="px-4 py-3.5">Granted Feature Rights ({permissionList.length} Max)</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-100/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-400 flex items-center justify-center border border-purple-300 dark:border-purple-500/30 flex-shrink-0">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                    {r.description || 'Custom RBAC Role'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 font-mono font-bold px-2.5 py-1 rounded-full text-[10px] shadow-sm inline-flex items-center gap-1">
                      <Users className="w-3 h-3" /> {r.user_count} Users
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1.5 max-w-xl">
                      {r.permissions.map((p) => {
                        const foundDef = permissionList.find((def) => def.id === p);
                        return (
                          <span key={p} className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-300 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1">
                            <Key className="w-2.5 h-2.5 text-purple-500" />
                            <span>{foundDef?.label || p}</span>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(r)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-600/10 hover:bg-purple-100 dark:hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-bold text-xs transition-all cursor-pointer shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Rights
                      </button>
                      <button
                        onClick={() => handleDeleteRole(r)}
                        className="p-1.5 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 transition-all cursor-pointer shadow-sm"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dynamic Custom Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                {editingRole ? `Edit Role Rights: ${editingRole.name}` : 'Create Dynamic Custom Role'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role Title / Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none shadow-sm"
                    placeholder="e.g. Senior Release Lead"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none shadow-sm"
                    placeholder="Responsibilities and permission scope..."
                  />
                </div>
              </div>

              {/* Dynamic Feature Right Injector */}
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Need to Add a New Future Feature Right?
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewRight(!isAddingNewRight)}
                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    {isAddingNewRight ? 'Hide Add Right Form' : '+ Add Custom Right Key'}
                  </button>
                </div>

                {isAddingNewRight && (
                  <div className="pt-2 border-t border-purple-200 dark:border-purple-500/20 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Right Key (e.g. approve_payout)"
                        value={newRightId}
                        onChange={(e) => setNewRightId(e.target.value)}
                        className="bg-white dark:bg-slate-950 border border-purple-200 dark:border-purple-500/40 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Display Label (e.g. Approve Payouts)"
                        value={newRightLabel}
                        onChange={(e) => setNewRightLabel(e.target.value)}
                        className="bg-white dark:bg-slate-950 border border-purple-200 dark:border-purple-500/40 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Category (e.g. Finance)"
                        value={newRightCategory}
                        onChange={(e) => setNewRightCategory(e.target.value)}
                        className="bg-white dark:bg-slate-950 border border-purple-200 dark:border-purple-500/40 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddNewRightDefinition}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                    >
                      Inject New Right Definition
                    </button>
                  </div>
                )}
              </div>

              {/* Granular Permissions Checklist Grouped by Category */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Granular Permission Rights ({selectedPermissions.length} Granted)</span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(permissionList.map((p) => p.id))}
                      className="text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions([])}
                      className="text-slate-500 dark:text-slate-400 font-bold hover:underline cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="space-y-2">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 border-b border-slate-200 dark:border-slate-800/80 pb-1">
                        {category} ({perms.filter((p) => selectedPermissions.includes(p.id)).length} / {perms.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.id);
                          return (
                            <div
                              key={perm.id}
                              onClick={() => handleTogglePermission(perm.id)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 text-xs ${
                                isChecked
                                  ? 'bg-purple-100/80 dark:bg-purple-950/50 border-purple-300 dark:border-purple-500/40 text-purple-950 dark:text-white font-bold shadow-sm'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="font-bold flex items-center gap-1.5">
                                  <span>{perm.label}</span>
                                </div>
                                <div className="text-[9px] font-mono text-slate-500">{perm.id}</div>
                                {perm.description && (
                                  <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400 leading-tight">
                                    {perm.description}
                                  </div>
                                )}
                              </div>
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : editingRole ? 'Save Updated Role Rights' : 'Create Dynamic Custom Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
