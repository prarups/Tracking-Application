import React from 'react';
import { CustomField } from '@/types';
import { UseFormRegister, FieldErrors, Control, Controller } from 'react-hook-form';

interface Props {
  fields: CustomField[];
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  control: Control<any>;
}

export const DynamicFormRenderer: React.FC<Props> = ({ fields, register, errors, control }) => {
  if (!fields || fields.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 p-4 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">

      {fields.map((field) => {
        const error = errors[field.field_key]?.message as string;

        switch (field.field_type) {
          case 'TEXT':
          case 'EMAIL':
          case 'PHONE':
            return (
              <div key={field.id} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {field.label} {field.is_required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={field.field_type === 'EMAIL' ? 'email' : 'text'}
                  {...register(field.field_key, { required: field.is_required ? `${field.label} is required` : false })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                  placeholder={`Enter ${field.label}...`}
                />
                {error && <span className="text-[10px] text-red-500">{error}</span>}
              </div>
            );

          case 'NUMBER':
            return (
              <div key={field.id} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {field.label} {field.is_required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="number"
                  {...register(field.field_key, { required: field.is_required ? `${field.label} is required` : false })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                />
              </div>
            );

          case 'TEXTAREA':
          case 'RICH_TEXT':
            return (
              <div key={field.id} className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {field.label} {field.is_required && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  {...register(field.field_key, { required: field.is_required ? `${field.label} is required` : false })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                  placeholder={`Enter ${field.label}...`}
                />
              </div>
            );

          case 'DROPDOWN':
          case 'SEARCHABLE_DROPDOWN':
            return (
              <div key={field.id} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {field.label} {field.is_required && <span className="text-red-500">*</span>}
                </label>
                <select
                  {...register(field.field_key, { required: field.is_required ? `${field.label} is required` : false })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm"
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">Select option...</option>
                  {field.options?.map((opt: string) => (
                    <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1 px-2">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );

          case 'DATE':
          case 'DATETIME':
            return (
              <div key={field.id} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {field.label} {field.is_required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={field.field_type === 'DATETIME' ? 'datetime-local' : 'date'}
                  {...register(field.field_key, { required: field.is_required ? `${field.label} is required` : false })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                />
              </div>
            );

          case 'TOGGLE':
          case 'CHECKBOX':
            return (
              <div key={field.id} className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id={field.field_key}
                  {...register(field.field_key)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={field.field_key} className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {field.label}
                </label>
              </div>
            );

          case 'COLOR_PICKER':
            return (
              <div key={field.id} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{field.label}</label>
                <input
                  type="color"
                  {...register(field.field_key)}
                  className="h-9 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1 cursor-pointer"
                />
              </div>
            );

          default:
            return (
              <div key={field.id} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{field.label}</label>
                <input
                  type="text"
                  {...register(field.field_key)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm"
                />
              </div>
            );
        }
      })}
    </div>
  );
};
