import React, { useState, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';
import { CustomField, FieldType, Group } from '@/types';
import { Sliders, Plus, X, Trash2, Filter, Building2, Edit3, Tag } from 'lucide-react';

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
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [label, setLabel] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('DROPDOWN');
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [optionsList, setOptionsList] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');
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

  const handleAddOption = () => {
    const val = newOptionInput.trim();
    if (!val) return;
    if (val.includes(',')) {
      const splitted = val.split(',').map((s) => s.trim()).filter(Boolean);
      setOptionsList([...optionsList, ...splitted.filter((s) => !optionsList.includes(s))]);
    } else if (!optionsList.includes(val)) {
      setOptionsList([...optionsList, val]);
    }
    setNewOptionInput('');
  };

  const handleRemoveOption = (index: number) => {
    setOptionsList(optionsList.filter((_, i) => i !== index));
  };

  const handleOpenCreateModal = () => {
    setEditingField(null);
    setLabel('');
    setFieldKey('');
    setFieldType('DROPDOWN');
    setOptionsList(['Option 1', 'Option 2', 'Option 3']);
    setNewOptionInput('');
    setIsRequired(false);
    setFormError('');
    if (groups.length > 0 && !targetGroupId) setTargetGroupId(String(groups[0].id));
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (field: CustomField) => {
    setEditingField(field);
    setLabel(field.label);
    setFieldKey(field.field_key);
    setFieldType(field.field_type);
    setTargetGroupId(field.group ? String(field.group) : (groups[0] ? String(groups[0].id) : ''));
    
    const rawOpts: any = field.options;
    const existingOpts: string[] = Array.isArray(rawOpts)
      ? rawOpts.map(String)
      : typeof rawOpts === 'string'
      ? rawOpts.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    setOptionsList(existingOpts);
    setNewOptionInput('');
    setIsRequired(field.is_required);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!targetGroupId) {
      setFormError('Please select a target Department Group for this dynamic field.');
      return;
    }

    try {
      const payload = {
        label,
        field_key: fieldKey.toLowerCase().replace(/\s+/g, '_'),
        field_type: fieldType,
        group: parseInt(targetGroupId),
        options: optionsList,
        is_required: isRequired,
        display_order: editingField ? editingField.display_order : fields.length + 1,
      };

      if (editingField) {
        await axiosClient.patch(`/dynamic-fields/${editingField.id}/`, payload);
      } else {
        await axiosClient.post('/dynamic-fields/', payload);
      }

      setIsModalOpen(false);
      fetchFields();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || err.response?.data?.field_key?.[0] || 'Failed to save custom attribute.';
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
            onClick={handleOpenCreateModal}
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
              <th className="px-4 py-3">Dropdown Choices</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {fields.map((f, i) => {
              const rawOpts: any = f.options;
              const optsList: string[] = Array.isArray(rawOpts)
                ? rawOpts.map(String)
                : typeof rawOpts === 'string'
                ? rawOpts.split(',').map((s) => s.trim()).filter(Boolean)
                : [];

              return (
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
                  <td className="px-4 py-3">
                    {optsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {optsList.map((opt, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(f)}
                      title="Edit Custom Field & Dropdown Values"
                      className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteField(f.id)}
                      title="Delete Custom Field"
                      className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingField ? (
                  <>
                    <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Edit Custom Dynamic Field
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Create Custom Dynamic Field
                  </>
                )}
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

            <form onSubmit={handleSaveField} className="space-y-4">
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
                    if (!editingField) {
                      setFieldKey(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                  placeholder="e.g. Priority Level / Server Environment"
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
                  placeholder="custom_priority_level"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Field Type</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as FieldType)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white cursor-pointer focus:border-blue-500 focus:outline-none shadow-sm font-semibold text-blue-600 dark:text-blue-400"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.id} value={ft.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {ft.label} [{ft.id}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Interactive Options Manager for Dropdowns & Searchable Dropdowns */}
              {(fieldType === 'DROPDOWN' || fieldType === 'SEARCHABLE_DROPDOWN' || fieldType === 'MULTI_SELECT' || fieldType === 'RADIO') && (
                <div className="space-y-2.5 p-3 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Dynamic Dropdown Values / Choices ({optionsList.length})
                    </label>
                  </div>

                  {/* Add New Option Input Box */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newOptionInput}
                      onChange={(e) => setNewOptionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                      placeholder="Type option name & click Add (or press Enter)..."
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-all flex-shrink-0"
                    >
                      + Add Option
                    </button>
                  </div>

                  {/* Active Option Tags Pills List */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {optionsList.length > 0 ? (
                      optionsList.map((opt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs font-semibold shadow-sm group"
                        >
                          <span>{opt}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
                            title="Remove option"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400 italic">No dropdown options added yet. Type an option above to add.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_req"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="is_req" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Require this field when submitting tickets
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  {editingField ? 'Update Custom Field & Options' : 'Save Custom Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
