import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { markRead, markAllRead } from '@/store/slices/notificationSlice';
import { Bell, CheckCheck, X, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notifications);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.post('/notifications/mark-all-read/');
      dispatch(markAllRead());
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemClick = async (notifId: number, ticketId?: number) => {
    try {
      await axiosClient.post(`/notifications/${notifId}/mark-read/`);
      dispatch(markRead(notifId));
      if (ticketId) {
        navigate(`/tickets/${ticketId}`);
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white text-base">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" /> Clear
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No new notifications</div>
        ) : (
          notifications.map((n) => {
            const actorName = n.actor_details
              ? n.actor_details.first_name
                ? `${n.actor_details.first_name} ${n.actor_details.last_name || ''}`.trim()
                : n.actor_details.username
              : '';

            const verbColor = n.verb === 'CREATED'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : n.verb === 'UPDATED'
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              : 'bg-purple-500/20 text-purple-300 border-purple-500/30';

            return (
              <div
                key={n.id}
                onClick={() => handleItemClick(n.id, n.ticket)}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  !n.is_read
                    ? 'bg-blue-950/40 border-blue-500/40 hover:bg-blue-900/40 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {n.ticket_number && (
                      <span className="font-mono font-bold text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {n.ticket_number}
                      </span>
                    )}
                    {n.verb && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${verbColor}`}>
                        {n.verb}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {n.message}
                </p>

                {actorName && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold pt-1 border-t border-slate-800/60">
                    <span>By:</span>
                    <span className="text-slate-200">{actorName}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
