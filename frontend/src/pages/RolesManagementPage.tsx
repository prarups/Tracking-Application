import React, { useState, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';
import { Shield, Plus, Check, X, ShieldAlert, Key, Users, CheckSquare } from 'lucide-react';

interface CustomRole {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  user_count: number;
  created_at: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'create_ticket', label: 'Create Tickets', category: 'Tickets' },
  { id: 'update_ticket', label: 'Edit & Transition Tickets', category: 'Tickets' },
  { id: 'delete_ticket', label: 'Delete Tickets & Media', category: 'Tickets' },
  { id: 'assign_ticket', label: 'Reassign & Transfer Tickets', category: 'Tickets' },
  { id: 'manage_groups', label: 'Manage Department Groups', category: 'Administration' },
  { id: 'manage_custom_fields', label: 'Dynamic Form Builder', category: 'Administration' },
  { id: 'view_audit_logs', label: 'View System Audit Logs', category: 'Security' },
  { id: 'export_reports', label: 'Export Analytics & Reports', category: 'Analytics' },
  { id: 'manage_roles', label: 'Create & Assign Dynamic Roles', category: 'Security' },
];

export const RolesManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'create_ticket',
    'update_ticket',
  ]);

  const fetchRoles = async () => {
    try {
      const res = await axiosClient.get('/auth/roles/');
      setRoles(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleTogglePermission = (permId: string) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('/auth/roles/', {
        name,
        description,
        permissions: selectedPermissions,
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setSelectedPermissions(['create_ticket', 'update_ticket']);
      fetchRoles();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-500" />
            Dynamic Custom Role Builder & Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create dynamic custom RBAC roles with fine-grained permission flags without hardcoded limits.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" /> Create Dynamic Custom Role
        </button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((r) => (
          <div key={r.id} className="glass-card p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{r.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{r.description || 'Custom RBAC Role'}</p>
              </div>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold px-2.5 py-1 rounded-full text-[10px]">
                {r.user_count} Users
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Granted Permissions ({r.permissions.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.permissions.map((p) => (
                  <span key={p} className="bg-slate-800 text-slate-300 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border border-slate-700">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Dynamic Custom Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" /> Create Dynamic Custom Role
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Role Title <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  placeholder="e.g. Release & Security Manager"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  placeholder="Role scope and responsibilities..."
                />
              </div>

              {/* Granular Permission Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Granular Permission Flags ({selectedPermissions.length} selected)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleTogglePermission(perm.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          isChecked ? 'bg-purple-950/40 border-purple-500/40 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{perm.label}</div>
                          <div className="text-[9px] font-mono text-slate-500">{perm.id}</div>
                        </div>
                        {isChecked && <CheckSquare className="w-4 h-4 text-purple-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
                >
                  Save Dynamic Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
