import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Ticket, TicketStatus } from '@/types';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Paperclip, User } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';

interface Props {
  tickets: Ticket[];
  onTicketUpdate: () => void;
}

const COLUMNS: { id: TicketStatus; label: string; color: string; bgBadge: string; dot: string }[] = [
  { id: 'BACKLOG', label: 'Backlog', color: 'border-slate-500', bgBadge: 'bg-slate-500/20 text-slate-300', dot: '#94A3B8' },
  { id: 'OPEN', label: 'Open', color: 'border-blue-500', bgBadge: 'bg-blue-500/20 text-blue-300', dot: '#3B82F6' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-500', bgBadge: 'bg-amber-500/20 text-amber-300', dot: '#F59E0B' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'border-purple-500', bgBadge: 'bg-purple-500/20 text-purple-300', dot: '#A855F7' },
  { id: 'REOPEN', label: 'Reopen', color: 'border-orange-500', bgBadge: 'bg-orange-500/20 text-orange-300', dot: '#F97316' },
  { id: 'DONE', label: 'Done', color: 'border-emerald-500', bgBadge: 'bg-emerald-500/20 text-emerald-300', dot: '#10B981' },
  { id: 'CLOSED', label: 'Closed', color: 'border-rose-500', bgBadge: 'bg-rose-500/20 text-rose-300', dot: '#F43F5E' },
];

export const KanbanBoard: React.FC<Props> = ({ tickets, onTicketUpdate }) => {
  const navigate = useNavigate();

  const handleDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newStatus = destination.droppableId as TicketStatus;

    try {
      await axiosClient.patch(`/tickets/${draggableId}/`, { status: newStatus });
      onTicketUpdate();
    } catch (e) {
      console.error('Error updating ticket status via Kanban drag:', e);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-6">
        {COLUMNS.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.id);

          return (
            <div key={col.id} className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col max-h-[75vh]">
              {/* Column Header */}
              <div className={`p-3 border-t-4 ${col.color} bg-slate-900 border-b border-slate-800 flex items-center justify-between`}>
                <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.dot }} />
                  {col.label}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700/50 ${col.bgBadge}`}>
                  {colTickets.length}
                </span>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 overflow-y-auto space-y-2.5 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-950/20' : ''
                    }`}
                  >
                    {colTickets.map((ticket, index) => (
                      <Draggable key={ticket.id} draggableId={String(ticket.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                            className={`p-3 rounded-lg bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 shadow-md cursor-pointer transition-all ${
                              snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] mb-1.5">
                              <span className="font-mono font-bold text-blue-400">{ticket.ticket_number}</span>
                              <span className="text-[10px] bg-slate-700 text-slate-300 font-semibold px-1.5 py-0.5 rounded">
                                {ticket.priority}
                              </span>
                            </div>

                            <h4 className="text-xs font-semibold text-white mb-2 line-clamp-2">{ticket.title}</h4>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/50">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-500" />
                                <span>{ticket.assigned_user_details?.username || 'Unassigned'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {ticket.attachments.length > 0 && (
                                  <span className="flex items-center gap-0.5 text-slate-400">
                                    <Paperclip className="w-3 h-3" /> {ticket.attachments.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
