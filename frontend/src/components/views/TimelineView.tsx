import React from 'react';
import { Ticket } from '@/types';
import { useNavigate } from 'react-router-dom';
import { navigateToTicket } from '@/utils/navigation';
import { GitCommit, ArrowRight } from 'lucide-react';

interface Props {
  tickets: Ticket[];
}

export const TimelineView: React.FC<Props> = ({ tickets }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <GitCommit className="w-5 h-5 text-indigo-400" />
        <h3 className="text-base font-bold text-white">Project Milestone Timeline</h3>
      </div>

      <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
        {tickets.map((t) => (
          <div key={t.id} className="relative pl-6">
            {/* Timeline Dot */}
            <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-slate-900" />

            <div
              onClick={(e) => navigateToTicket(e, t.ticket_number || t.id, navigate)}
              className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-blue-500 cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xs text-blue-400">{t.ticket_number}</span>
                  <span className="text-slate-400 text-xs">• Created {new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                <h4 className="font-semibold text-white text-sm">{t.title}</h4>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold bg-slate-700 text-slate-200 px-2.5 py-1 rounded">
                  {t.status}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
