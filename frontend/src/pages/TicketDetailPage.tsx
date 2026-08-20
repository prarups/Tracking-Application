import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';
import { Ticket, Comment as CommentType, ActivityLog, User } from '@/types';
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

      // Populate edit form states
      setEditTitle(tData.title || '');
      setEditDescription(tData.description || '');
      setEditAcceptanceCriteria(tData.acceptance_criteria || '');
      setEditStatus(tData.status || 'TODO');
      setEditPriority(tData.priority || 'MEDIUM');
      setEditAssignee(tData.assigned_user ? String(tData.assigned_user) : '');
      setEditStartDate(tData.start_date ? tData.start_date.split('T')[0] : '');
      setEditDueDate(tData.due_date ? tData.due_date.split('T')[0] : '');

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !ticket) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setUploadMessage('Compressing image to WebP format under < 50 KB...');

    try {
      await axiosClient.post(`/tickets/${ticket.id}/attachments/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchTicketData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
      setUploadMessage('');
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
        <form onSubmit={handleSaveSubmitTicket} className="p-6 rounded-3xl bg-slate-900 border border-blue-500/40 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" /> Edit Ticket: <span className="font-mono text-blue-400">{ticket.ticket_number}</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Modify fields and click Submit to save</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Ticket Title / Summary</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
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
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Assignee <span className="text-[10px] text-blue-400 font-mono">(Group Access Rights Only)</span>
              </label>
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
              <label className="block text-xs font-bold text-slate-300 mb-1">Target Due Date (To)</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
            <textarea
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              placeholder="Detailed issue description..."
            />
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
              {ticket.custom_values && ticket.custom_values.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Custom Field Attributes</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {ticket.custom_values.map((cv) => (
                      <div key={cv.id} className="p-2 rounded bg-slate-800/60 border border-slate-800">
                        <span className="text-slate-400 font-semibold">{cv.field_label}: </span>
                        <span className="text-white font-medium">{String(cv.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-blue-400" /> Attachments ({ticket.attachments?.length || 0})
                  </h4>

                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5" /> Upload Media (&lt;50KB WebP)
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {isUploading && (
                  <div className="p-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs rounded mb-3 font-semibold text-center animate-pulse">
                    {uploadMessage}
                  </div>
                )}

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
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> Discussion Thread & Mentions
              </h3>

              {/* Comment Box */}
              <form onSubmit={handlePostComment} className="space-y-2">
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment... Use @username to mention team members."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Post Comment
                  </button>
                </div>
              </form>

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

              <div className="flex justify-between">
                <span className="text-slate-400">Reporter:</span>
                <span className="text-white font-semibold">{ticket.reporter_details?.username}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Assignee:</span>
                <span className="text-blue-400 font-semibold">{ticket.assigned_user_details?.username || 'Unassigned'}</span>
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
