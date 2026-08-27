import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';
import { Ticket, Comment as CommentType, ActivityLog, User, CustomField } from '@/types';
import {
  MessageSquare,
  Paperclip,
  History,
  Send,
  Upload,
  ArrowLeft,
  FileText,
  Calendar as CalendarIcon,
  UserCheck,
  Edit3,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  Copy,
  Check,
} from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allCustomFields, setAllCustomFields] = useState<CustomField[]>([]);
  const [editCustomFieldsData, setEditCustomFieldsData] = useState<Record<string, any>>({});
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAcceptanceCriteria, setEditAcceptanceCriteria] = useState('');
  const [editStatus, setEditStatus] = useState('TODO');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editAssignee, setEditAssignee] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Comment & Attachment state
  const [newComment, setNewComment] = useState('');
  const [imageComments, setImageComments] = useState<Record<number, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isImageFile = (filename: string, mimeType?: string, fileUrl?: string) => {
    if (mimeType && mimeType.startsWith('image/')) return true;
    if (/\.(png|jpe?g|webp|gif|svg|bmp|tiff)$/i.test(filename || '')) return true;
    if (fileUrl && (fileUrl.includes('cloudinary') || /\.(png|jpe?g|webp|gif|svg)$/i.test(fileUrl))) return true;
    return false;
  };


  const handlePostImageComment = async (attachmentId: number) => {
    const content = imageComments[attachmentId];
    if (!content || !content.trim() || !ticket) return;

    try {
      await axiosClient.post('/comments/', {
        ticket: ticket.id,
        attachment: attachmentId,
        content: content.trim(),
      });
      setImageComments({ ...imageComments, [attachmentId]: '' });
      fetchTicketData();
    } catch (e) {
      console.error('Failed to post image comment:', e);
    }
  };

  const fetchTicketData = async () => {
    if (!id) return;
    try {
      const tRes = await axiosClient.get(`/tickets/${id}/`);
      const tData = tRes.data;
      setTicket(tData);

      const fRes = await axiosClient.get('/dynamic-fields/');
      const fieldsData: CustomField[] = fRes.data.results || fRes.data;
      setAllCustomFields(fieldsData);

      // Populate edit form states only if not currently editing
      if (!isEditing) {
        setEditTitle(tData.title || '');
        setEditDescription(tData.description || '');
        setEditAcceptanceCriteria(tData.acceptance_criteria || '');
        setEditStatus(tData.status || 'TODO');
        setEditPriority(tData.priority || 'MEDIUM');
        setEditAssignee(tData.assigned_user ? String(tData.assigned_user) : '');
        setEditStartDate(tData.start_date ? tData.start_date.split('T')[0] : '');
        setEditDueDate(tData.due_date ? tData.due_date.split('T')[0] : '');

        const initialCustomData: Record<string, any> = {};
        const existingValues = tData.custom_values || [];
        fieldsData.forEach((cf) => {
          const match = existingValues.find(
            (cv: any) => cv.field_key === cf.field_key || cv.custom_field === cf.id
          );
          initialCustomData[cf.field_key] = match ? match.value : (cf.default_value || '');
        });
        setEditCustomFieldsData(initialCustomData);
      }

      const cRes = await axiosClient.get(`/comments/?ticket_id=${id}`);
      setComments(cRes.data.results || cRes.data);

      const aRes = await axiosClient.get(`/audit-logs/?ticket_id=${id}`);
      setActivities(aRes.data.results || aRes.data);

      const uRes = await axiosClient.get('/auth/users/');
      setUsers(uRes.data.results || uRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTicketData();
  }, [id]);

  const handleSaveSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      await axiosClient.patch(`/tickets/${ticket.id}/`, {
        title: editTitle,
        description: editDescription,
        acceptance_criteria: editAcceptanceCriteria,
        status: editStatus,
        priority: editPriority,
        assigned_user: editAssignee ? parseInt(editAssignee) : null,
        start_date: editStartDate ? new Date(editStartDate).toISOString() : null,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
        custom_fields_data: editCustomFieldsData,
      });

      setSaveSuccess('Ticket updates submitted & saved successfully!');
      setIsEditing(false);
      fetchTicketData();
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      setSaveError('Failed to submit ticket updates. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !ticket) return;

    try {
      await axiosClient.post('/comments/', {
        ticket: ticket.id,
        content: newComment,
      });
      setNewComment('');
      fetchTicketData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (filesList: FileList | File[]) => {
    if (!filesList || filesList.length === 0 || !ticket) return;

    setIsUploading(true);
    setUploadMessage('Uploading & optimizing media...');

    try {
      const filesArray = Array.from(filesList);
      for (const file of filesArray) {
        const formData = new FormData();
        formData.append('file', file);
        await axiosClient.post(`/tickets/${ticket.id}/attachments/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setUploadMessage('Media uploaded successfully!');
      setTimeout(() => setUploadMessage(''), 3000);
      fetchTicketData();
    } catch (e) {
      console.error(e);
      setUploadMessage('Upload failed. Please try again.');
      setTimeout(() => setUploadMessage(''), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  if (!ticket) {
    return <div className="p-6 text-slate-400 text-xs font-semibold">Loading ticket details...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Back Link & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </button>

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" /> Edit Ticket Details
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                fetchTicketData();
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancel Editing
            </button>
          )}
        </div>
      </div>

      {/* Global Success / Error Toast Banners */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Interactive Edit Form mode */}
      {isEditing ? (
        <form onSubmit={handleSaveSubmitTicket} className="max-w-4xl mx-auto p-5 rounded-2xl bg-slate-900 border border-blue-500/40 shadow-2xl space-y-3.5 text-xs text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-400" /> Edit Ticket: <span className="font-mono text-blue-400">{ticket.ticket_number}</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Modify fields and submit updates</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Ticket Title / Summary</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* 2nd Place: Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none placeholder-slate-500"
              placeholder="Detailed issue description..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="OPEN" className="bg-slate-900 text-slate-100">Open</option>
                <option value="IN_PROGRESS" className="bg-slate-900 text-slate-100">In Progress</option>
                <option value="IN_REVIEW" className="bg-slate-900 text-slate-100">In Review</option>
                <option value="REOPEN" className="bg-slate-900 text-slate-100">Reopen</option>
                <option value="DONE" className="bg-slate-900 text-slate-100">Done</option>
                <option value="CLOSED" className="bg-slate-900 text-slate-100">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="LOW" className="bg-slate-900 text-slate-100">Low</option>
                <option value="MEDIUM" className="bg-slate-900 text-slate-100">Medium</option>
                <option value="HIGH" className="bg-slate-900 text-slate-100">High</option>
                <option value="URGENT" className="bg-slate-900 text-slate-100">Urgent</option>
                <option value="CRITICAL" className="bg-slate-900 text-slate-100">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Assignee</label>
              <select
                value={editAssignee}
                onChange={(e) => setEditAssignee(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-400">Unassigned</option>
                {(() => {
                  const grpMembers = (ticket.assigned_group_details as any)?.members_details || [];
                  const assignable = grpMembers.length > 0
                    ? users.filter((u) => grpMembers.some((m: any) => m.id === u.id))
                    : [];

                  if (grpMembers.length === 0) {
                    return (
                      <option value="" disabled className="bg-slate-900 text-amber-400">
                        No users assigned rights to this department yet
                      </option>
                    );
                  }

                  return assignable.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-slate-100">
                      {u.username} ({u.role})
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Start Date (From)</label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Due Date (To)</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer shadow-sm"
              />
            </div>
          </div>

          {/* Dynamic Custom Fields */}
          {allCustomFields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allCustomFields.map((cf) => {
                  const rawOpts: any = cf.options;
                  const opts: string[] = Array.isArray(rawOpts)
                    ? rawOpts.map(String)
                    : typeof rawOpts === 'string'
                    ? (rawOpts as string).split(',').map((s: string) => s.trim())
                    : [];

                  return (
                    <div key={cf.id} className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {cf.label}{' '}
                        {cf.is_required && <span className="text-rose-500">*</span>}
                      </label>
                      {cf.field_type === 'DROPDOWN' || cf.field_type === 'SEARCHABLE_DROPDOWN' || cf.field_type === 'RADIO' ? (
                        <select
                          value={editCustomFieldsData[cf.field_key] || ''}
                          onChange={(e) =>
                            setEditCustomFieldsData({ ...editCustomFieldsData, [cf.field_key]: e.target.value })
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer shadow-sm"
                        >
                          <option value="">-- Select {cf.label} --</option>
                          {opts.map((opt, i) => (
                            <option key={i} value={opt} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : cf.field_type === 'CHECKBOX' || cf.field_type === 'TOGGLE' ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            checked={editCustomFieldsData[cf.field_key] === 'true' || editCustomFieldsData[cf.field_key] === true}
                            onChange={(e) =>
                              setEditCustomFieldsData({
                                ...editCustomFieldsData,
                                [cf.field_key]: e.target.checked ? 'true' : 'false',
                              })
                            }
                            className="w-4 h-4 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs text-slate-700 dark:text-slate-300">Enable / True</span>
                        </div>
                      ) : cf.field_type === 'NUMBER' ? (
                        <input
                          type="number"
                          value={editCustomFieldsData[cf.field_key] || ''}
                          onChange={(e) =>
                            setEditCustomFieldsData({ ...editCustomFieldsData, [cf.field_key]: e.target.value })
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                        />
                      ) : cf.field_type === 'DATE' || cf.field_type === 'DATETIME' ? (
                        <input
                          type="date"
                          value={editCustomFieldsData[cf.field_key] || ''}
                          onChange={(e) =>
                            setEditCustomFieldsData({ ...editCustomFieldsData, [cf.field_key]: e.target.value })
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                        />
                      ) : cf.field_type === 'TEXTAREA' || cf.field_type === 'RICH_TEXT' ? (
                        <textarea
                          rows={2}
                          value={editCustomFieldsData[cf.field_key] || ''}
                          onChange={(e) =>
                            setEditCustomFieldsData({ ...editCustomFieldsData, [cf.field_key]: e.target.value })
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                        />
                      ) : (
                        <input
                          type="text"
                          value={editCustomFieldsData[cf.field_key] || ''}
                          onChange={(e) =>
                            setEditCustomFieldsData({ ...editCustomFieldsData, [cf.field_key]: e.target.value })
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
          )}

          {/* Attachments & WebP Media Dropzone (Included inside Form) */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-emerald-400" /> Ticket Media & Attachments ({ticket.attachments?.length || 0})
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Auto WebP Compression &lt; 50KB</span>
            </div>

            {/* Attachments Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileUpload(e.dataTransfer.files);
                }
              }}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center space-y-3 cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                  : 'border-slate-800 hover:border-blue-500 bg-slate-900/60'
              }`}
            >
              <input
                type="file"
                id="editFormFileUpload"
                className="hidden"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
              <label htmlFor="editFormFileUpload" className="cursor-pointer space-y-2 block">
                <Upload className="w-7 h-7 text-blue-400 mx-auto" />
                <div className="text-xs font-bold text-white">
                  Drag & Drop Images / Files Here or <span className="text-blue-400 underline">Browse Files</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Auto-optimized WebP image storage
                </div>
              </label>

              {isUploading && (
                <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs rounded-xl font-bold flex items-center justify-center gap-2 animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>{uploadMessage || 'Uploading & optimizing media...'}</span>
                </div>
              )}

              {uploadMessage && !isUploading && (
                <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 py-1 px-3 rounded-xl border border-emerald-500/20 inline-block">
                  ✨ {uploadMessage}
                </p>
              )}
            </div>

            {/* Attachments Gallery & List */}
            <div className="space-y-3 pt-2">
              {ticket.attachments && ticket.attachments.length > 0 ? (
                ticket.attachments.map((att) => {
                  const isImg = isImageFile(att.original_filename, att.mime_type, att.file);
                  return (
                    <div key={att.id} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-blue-400" /> {att.original_filename}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                          {(att.file_size_bytes / 1024).toFixed(1)} KB (Optimized WebP)
                        </span>
                      </div>

                      {isImg ? (
                        <div
                          onClick={() => setPreviewImage(att.file)}
                          className="cursor-pointer group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex justify-center p-2 hover:border-blue-500/50 transition-all"
                        >
                          <img
                            src={att.thumbnail || att.file}
                            alt={att.original_filename}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (att.file && target.src !== att.file && !target.dataset.triedFile) {
                                target.dataset.triedFile = 'true';
                                target.src = att.file;
                              } else {
                                target.onerror = null;
                                target.style.display = 'none';
                              }
                            }}
                            className="max-h-72 w-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.01]"
                          />
                          <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-500/40 shadow-xl">
                              Click for Full Resolution View
                            </span>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={att.file}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500 flex items-center gap-2 text-xs font-semibold text-blue-400 transition-colors"
                        >
                          <FileText className="w-5 h-5" /> Download File: {att.original_filename}
                        </a>
                      )}

                      {/* Image-Specific Comments */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Comments for this image ({comments.filter((c) => c.attachment === att.id).length}):</span>
                        </div>
                        <div className="space-y-1.5">
                          {comments
                            .filter((c) => c.attachment === att.id)
                            .map((ic) => (
                              <div key={ic.id} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                                <div className="flex items-center justify-between text-slate-400 mb-0.5">
                                  <span className="font-bold text-white text-[11px]">{ic.author_details?.username}</span>
                                  <span className="text-[9px] font-mono text-slate-500">{new Date(ic.created_at).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-slate-300 text-[11px] leading-relaxed">{ic.content}</p>
                              </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={imageComments[att.id] || ''}
                            onChange={(e) => setImageComments({ ...imageComments, [att.id]: e.target.value })}
                            placeholder={`Write a comment on ${att.original_filename}...`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handlePostImageComment(att.id);
                              }
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handlePostImageComment(att.id)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-blue-600/30 cursor-pointer"
                          >
                            <Send className="w-3 h-3" /> Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
                  No attachments uploaded yet. Click above to add images/files.
                </div>
              )}
            </div>
          </div>

          {/* Discussion Thread & Mentions (Editable inside Edit Mode) */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> Post Discussion Comment / @Mention
            </h4>
            <div className="space-y-2">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment... Use @username to mention team members."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-blue-500 focus:outline-none placeholder-slate-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePostComment}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Post Comment
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Submitting Updates...' : 'Submit & Save Ticket Updates'}
            </button>
          </div>
        </form>
      ) : (
        /* Regular View Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ticket Content & Threaded Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Header & Description Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm bg-blue-500/20 text-blue-400 px-3 py-1 rounded border border-blue-500/30">
                      {ticket.ticket_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`[${ticket.ticket_number}] ${ticket.title}`);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      }}
                      title="Click to copy Ticket Key & Title"
                      className="p-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700 flex items-center gap-1 text-xs"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-semibold text-slate-300">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  {/* Priority Badge */}
                  {(() => {
                    const val = ticket.priority;
                    let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';
                    if (val === 'CRITICAL') colorClass = 'bg-rose-600/30 text-rose-300 border-rose-500/50 font-black animate-pulse';
                    else if (val === 'URGENT') colorClass = 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold';
                    else if (val === 'HIGH') colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold';
                    else if (val === 'MEDIUM') colorClass = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
                    else if (val === 'LOW') colorClass = 'bg-slate-500/20 text-slate-300 border-slate-500/40';
                    return (
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border tracking-wide uppercase ${colorClass}`}>
                        {val || 'MEDIUM'}
                      </span>
                    );
                  })()}

                  {/* Status Badge */}
                  {(() => {
                    const val = ticket.status;
                    let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';

                    if (val === 'BACKLOG') { colorClass = 'bg-slate-500/20 text-slate-300 border-slate-500/40 font-bold'; }
                    else if (val === 'OPEN' || val === 'TODO') { colorClass = 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'; }
                    else if (val === 'IN_PROGRESS') { colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'; }
                    else if (val === 'IN_REVIEW') { colorClass = 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'; }
                    else if (val === 'REOPEN') { colorClass = 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold'; }
                    else if (val === 'DONE') { colorClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'; }
                    else if (val === 'CLOSED') { colorClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'; }

                    const label = val ? (val === 'TODO' ? 'OPEN' : val.replace('_', ' ')) : 'OPEN';

                    return (
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-md border tracking-wide uppercase ${colorClass}`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>

              <h1 className="text-xl font-bold text-white leading-snug">{ticket.title}</h1>

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</div>
                <div className="text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-wrap min-h-[90px]">
                  {ticket.description || 'No description provided.'}
                </div>
              </div>

              {/* Custom Dynamic Fields Output */}
              {allCustomFields.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {allCustomFields.map((cf) => {
                      const matched = (ticket.custom_values || []).find(
                        (cv) => cv.field_key === cf.field_key || cv.custom_field === cf.id
                      );
                      const hasVal = matched && matched.value !== null && matched.value !== undefined && String(matched.value).trim() !== '';

                      return (
                        <div key={cf.id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800/80 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold text-[11px]">{cf.label}</span>
                            <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">{cf.field_type}</span>
                          </div>
                          {hasVal ? (
                            <span className="text-white font-semibold text-xs break-all">{String(matched.value)}</span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px] font-normal">Not set (Click Edit to set value)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-400" /> Attachments ({ticket.attachments?.length || 0})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Click 'Edit Ticket' above to add attachments
                  </span>
                </div>

                <div className="space-y-4">
                  {ticket.attachments && ticket.attachments.length > 0 ? (
                    ticket.attachments.map((att) => {
                      const isImg = isImageFile(att.original_filename, att.mime_type, att.file);
                      return (

                        <div key={att.id} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                              <Paperclip className="w-3.5 h-3.5 text-blue-400" /> {att.original_filename}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                              {(att.file_size_bytes / 1024).toFixed(1)} KB (Optimized WebP)
                            </span>
                          </div>

                          {isImg ? (
                            <div
                              onClick={() => setPreviewImage(att.file)}
                              className="cursor-pointer group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 flex justify-center p-2 hover:border-blue-500/50 transition-all"
                            >
                              <img
                                src={att.thumbnail || att.file}
                                alt={att.original_filename}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (att.file && target.src !== att.file && !target.dataset.triedFile) {
                                    target.dataset.triedFile = 'true';
                                    target.src = att.file;
                                  } else {
                                    target.onerror = null;
                                    target.style.display = 'none';
                                  }
                                }}
                                className="max-h-96 w-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.01]"
                              />

                              <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-500/40 shadow-xl">
                                  Click for Full Resolution View
                                </span>
                              </div>
                            </div>
                          ) : (
                            <a
                              href={att.file}
                              target="_blank"
                              rel="noreferrer"
                              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500 flex items-center gap-2 text-xs font-semibold text-blue-400 transition-colors"
                            >
                              <FileText className="w-5 h-5" /> Download File: {att.original_filename}
                            </a>
                          )}

                          {/* Image-Specific Comments Thread & Input Box */}
                          <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Comments for this image ({comments.filter((c) => c.attachment === att.id).length}):</span>
                            </div>

                            {/* Display Comments for this Attachment */}
                            <div className="space-y-1.5">
                              {comments
                                .filter((c) => c.attachment === att.id)
                                .map((ic) => (
                                  <div key={ic.id} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                                    <div className="flex items-center justify-between text-slate-400 mb-0.5">
                                      <span className="font-bold text-white text-[11px]">{ic.author_details?.username}</span>
                                      <span className="text-[9px] font-mono text-slate-500">{new Date(ic.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-slate-300 text-[11px] leading-relaxed">{ic.content}</p>
                                  </div>
                                ))}
                            </div>

                            {/* Post Comment for this Attachment */}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={imageComments[att.id] || ''}
                                onChange={(e) => setImageComments({ ...imageComments, [att.id]: e.target.value })}
                                placeholder={`Write a comment on ${att.original_filename}...`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handlePostImageComment(att.id);
                                  }
                                }}
                                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handlePostImageComment(att.id)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-blue-600/30 cursor-pointer"
                              >
                                <Send className="w-3 h-3" /> Comment
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
                      No attachments uploaded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Discussion Area - Threaded Comments & @Mentions */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" /> Discussion Thread & Mentions ({comments.length})
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Click 'Edit Ticket' to post comments
                </span>
              </div>

              {/* Comments List */}
              <div className="space-y-3 pt-2">
                {comments.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold text-white">{c.author_details?.username}</span>
                      <span className="text-[10px] font-mono">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar Metadata */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ticket Details
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-400 hover:text-blue-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Reporter:</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-blue-600/30 text-blue-300 font-bold flex items-center justify-center text-[10px] overflow-hidden border border-blue-500/30">
                    {ticket.reporter_details?.avatar ? (
                      <img src={ticket.reporter_details.avatar} alt="Reporter DP" className="w-full h-full object-cover" />
                    ) : (
                      <span>{ticket.reporter_details?.first_name ? ticket.reporter_details.first_name[0].toUpperCase() : (ticket.reporter_details?.username ? ticket.reporter_details.username[0].toUpperCase() : 'A')}</span>
                    )}
                  </div>
                  <span className="text-white font-semibold text-xs">
                    {ticket.reporter_details?.first_name ? `${ticket.reporter_details.first_name} ${ticket.reporter_details.last_name || ''}` : ticket.reporter_details?.username}
                  </span>
                  <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20">
                    {ticket.reporter_details?.employee_id || 'TRA0001'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Assignee:</span>
                {ticket.assigned_user_details ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-amber-600/30 text-amber-300 font-bold flex items-center justify-center text-[10px] overflow-hidden border border-amber-500/30">
                      {ticket.assigned_user_details.avatar ? (
                        <img src={ticket.assigned_user_details.avatar} alt="Assignee DP" className="w-full h-full object-cover" />
                      ) : (
                        <span>{ticket.assigned_user_details.first_name ? ticket.assigned_user_details.first_name[0].toUpperCase() : ticket.assigned_user_details.username[0].toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-blue-400 font-semibold text-xs">
                      {ticket.assigned_user_details.first_name ? `${ticket.assigned_user_details.first_name} ${ticket.assigned_user_details.last_name || ''}` : ticket.assigned_user_details.username}
                    </span>
                    <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20">
                      {ticket.assigned_user_details.employee_id || 'TRA0001'}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">Unassigned</span>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Department Group:</span>
                <span className="text-slate-200 font-semibold">{ticket.assigned_group_details?.name}</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-blue-400" /> Start Date (From):
                </span>
                <span className="text-slate-200 font-mono font-medium">
                  {ticket.start_date ? new Date(ticket.start_date).toLocaleDateString() : 'Not Set'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-400" /> Target Due (To):
                </span>
                <span className="text-amber-300 font-mono font-bold">
                  {ticket.due_date ? new Date(ticket.due_date).toLocaleDateString() : 'Not Set'}
                </span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Story Points:</span>
                <span className="font-mono text-amber-400">{ticket.story_points} pts</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Created:</span>
                <span className="text-slate-300">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Audit Log Activity Timeline */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <History className="w-4 h-4 text-purple-400" /> Audit History Timeline
              </h3>

              <div className="space-y-2 text-[11px]">
                {activities.map((a) => (
                  <div key={a.id} className="p-2 rounded bg-slate-800/40 border border-slate-800">
                    <div className="text-slate-300">
                      <span className="font-bold text-blue-400">{a.actor_details?.username}</span>: {a.action_type}
                    </div>
                    {a.old_value && (
                      <div className="text-slate-500 font-mono text-[10px]">
                        {a.field_name}: {a.old_value} &rarr; {a.new_value}
                      </div>
                    )}
                    <div className="text-[9px] text-slate-500 mt-1">{new Date(a.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Resolution Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in cursor-pointer"
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-blue-400 bg-slate-800/80 p-1.5 rounded-full border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Attachment Preview"
              className="max-h-[85vh] max-w-full object-contain rounded-2xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
