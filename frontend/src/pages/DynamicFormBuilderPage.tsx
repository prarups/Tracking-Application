import React, { useState, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';
import { CustomField, FieldType, Group } from '@/types';
import { Sliders, Plus, X, Trash2, Filter, Building2 } from 'lucide-react';

const FIELD_TYPES: { id: FieldType; label: string }[] = [
  { id: 'TEXT', label: 'Text Input' },
  { id: 'TEXTAREA', label: 'Textarea' },
  { id: 'RICH_TEXT', label: 'Rich Text Editor' },
  { id: 'NUMBER', label: 'Number' },
  { id: 'EMAIL', label: 'Email' },
  { id: 'PHONE', label: 'Phone' },
  { id: 'DATE', label: 'Date Picker' },
  { id: 'DATETIME', label: 'Date Time Picker' },
  { id: 'DROPDOWN', label: 'Dropdown Select' },
  { id: 'SEARCHABLE_DROPDOWN', label: 'Searchable Dropdown' },
  { id: 'MULTI_SELECT', label: 'Multi-Select' },
  { id: 'CHECKBOX', label: 'Checkbox' },
  { id: 'RADIO', label: 'Radio Button' },
  { id: 'TOGGLE', label: 'Toggle Switch' },
  { id: 'USER_PICKER', label: 'User Picker' },
  { id: 'GROUP_PICKER', label: 'Group Picker' },
  { id: 'IMAGE_UPLOAD', label: 'Image Upload' },
  { id: 'FILE_UPLOAD', label: 'File Upload' },
  { id: 'COLOR_PICKER', label: 'Color Picker' },
];

export const DynamicFormBuilderPage: React.FC = () => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('TEXT');
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [optionsStr, setOptionsStr] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchGroups = async () => {
    try {
      const res = await axiosClient.get('/groups/');
      const fetchedGroups = res.data.results || res.data;
      setGroups(fetchedGroups);
      if (fetchedGroups.length > 0 && !targetGroupId) {
        setTargetGroupId(String(fetchedGroups[0].id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFields = async () => {
    try {
      const url = selectedGroupFilter ? `/dynamic-fields/?group_id=${selectedGroupFilter}` : '/dynamic-fields/';
      const res = await axiosClient.get(url);
      setFields(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchFields();
  }, [selectedGroupFilter]);

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!targetGroupId) {
      setFormError('Please select a target Department Group for this dynamic field.');
      return;
    }
    try {
      const options = optionsStr.split(',').map((s) => s.trim()).filter(Boolean);
      await axiosClient.post('/dynamic-fields/', {
        label,
        field_key: fieldKey.toLowerCase().replace(/\s+/g, '_'),
        field_type: fieldType,
        group: parseInt(targetGroupId),
        options,
        is_required: isRequired,
        display_order: fields.length + 1,
      });
      setIsModalOpen(false);
      setLabel('');
      setFieldKey('');
      setOptionsStr('');
      fetchFields();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || err.response?.data?.field_key?.[0] || 'Failed to create custom attribute.';
      setFormError(msg);
    }
  };

  const handleDeleteField = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this custom field?')) return;
    try {
      await axiosClient.delete(`/dynamic-fields/${id}/`);
      fetchFields();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            Dynamic Form Builder Engine
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Configure group-scoped custom ticket attributes. Fields apply ONLY to their assigned department group.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter by Department Group */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs shadow-sm">
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Department Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={String(g.id)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  Group: {g.name} [{g.code}]
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setFormError('');
              if (groups.length > 0 && !targetGroupId) setTargetGroupId(String(groups[0].id));
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Add Dynamic Custom Field
          </button>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Field Label</th>
              <th className="px-4 py-3">Field Key</th>
              <th className="px-4 py-3">Assigned Group</th>
              <th className="px-4 py-3">Field Type</th>
              <th className="px-4 py-3">Required</th>
              <th className="px-4 py-3">Options</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {fields.map((f, i) => (
              <tr key={f.id} className="hover:bg-slate-100/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">#{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{f.label}</td>
                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{f.field_key}</td>
                <td className="px-4 py-3 font-medium">
                  {f.group_details ? (
                    <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 px-2 py-0.5 rounded text-[11px] font-bold shadow-sm">
                      <Building2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      {f.group_details.name} [{f.group_details.code}]
                    </span>
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">Global (All Groups)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 font-bold px-2 py-0.5 rounded text-[10px] shadow-sm">
                    {f.field_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {f.is_required ? (
                    <span className="text-red-600 dark:text-red-400 font-bold">Required</span>
                  ) : (
                    <span className="text-slate-500">Optional</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  {f.options && f.options.length > 0 ? f.options.join(', ') : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDeleteField(f.id)}
                    title="Delete Custom Field"
                    className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Create Custom Attribute
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateField} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Department Group <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white cursor-pointer font-semibold focus:border-blue-500 focus:outline-none shadow-sm"
                >
                  <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">Select Department Group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={String(g.id)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {g.name} [{g.code}]
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  This custom field will be inserted ONLY into tickets belonging to this selected group.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Field Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    setFieldKey(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                  placeholder="e.g. Sprint Name / Server Location"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Field Key Identifier</label>
                <input
                  type="text"
                  required
                  value={fieldKey}
                  onChange={(e) => setFieldKey(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white font-mono focus:border-blue-500 focus:outline-none shadow-sm"
                  placeholder="custom_sprint_name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Field Type (20+ Supported)</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as FieldType)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white cursor-pointer focus:border-blue-500 focus:outline-none shadow-sm"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.id} value={ft.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {ft.label} [{ft.id}]
                    </option>
                  ))}
                </select>
              </div>

              {(fieldType === 'DROPDOWN' || fieldType === 'SEARCHABLE_DROPDOWN' || fieldType === 'MULTI_SELECT' || fieldType === 'RADIO') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Choices / Options (Comma Separated)</label>
                  <input
                    type="text"
                    value={optionsStr}
                    onChange={(e) => setOptionsStr(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm"
                    placeholder="Option A, Option B, Option C"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_req"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                />
                <label htmlFor="is_req" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Require this field when submitting tickets
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Save Custom Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
