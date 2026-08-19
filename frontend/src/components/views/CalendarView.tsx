import React from 'react';
import { Ticket } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

interface Props {
  tickets: Ticket[];
}

export const CalendarView: React.FC<Props> = ({ tickets }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
        <CalendarIcon className="w-5 h-5 text-blue-400" />
        <h3 className="text-base font-bold text-white">Ticket Schedule & Due Dates</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {tickets.map((t) => (
          <div
            key={t.id}
            onClick={() => navigate(`/tickets/${t.id}`)}
            className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-blue-500 cursor-pointer transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-blue-400">{t.ticket_number}</span>
              <span className="bg-slate-700 text-slate-300 font-semibold px-2 py-0.5 rounded text-[10px]">
                {t.status}
              </span>
            </div>

            <h4 className="font-semibold text-white text-sm line-clamp-1">{t.title}</h4>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No Due Date'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
