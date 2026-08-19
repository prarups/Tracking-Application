import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setIsSearchModalOpen } from '@/store/slices/filterSlice';
import { axiosClient } from '@/api/axiosClient';
import { GlobalSearchResult } from '@/types';
import { Search, X, Ticket, MessageSquare, Users, Folder, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GlobalSearchModal: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen = useSelector((state: RootState) => state.filters.isSearchModalOpen);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatch(setIsSearchModalOpen(!isOpen));
      } else if (e.key === 'Escape' && isOpen) {
        dispatch(setIsSearchModalOpen(false));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/search/?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-blue-400" />
          <input
            type="text"
            className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none text-base font-medium"
            placeholder="Search tickets, comments, users, groups... (Press Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => dispatch(setIsSearchModalOpen(false))}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <div className="text-center py-6 text-slate-400">Searching enterprise index...</div>}

          {!loading && !query.trim() && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm font-medium">Type a ticket number, title, description, or username</p>
              <span className="inline-block mt-2 text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded">
                Quick Shortcut: <kbd className="font-mono text-blue-400">Ctrl + K</kbd>
              </span>
            </div>
          )}

          {!loading && results && (
            <>
              {/* Tickets Section */}
              {results.tickets.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-blue-400" /> Tickets ({results.tickets.length})
                  </h4>
                  <div className="space-y-1">
                    {results.tickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          navigate(`/tickets/${t.id}`);
                          dispatch(setIsSearchModalOpen(false));
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-blue-600/20 hover:border-blue-500/40 border border-transparent cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                            {t.ticket_number}
                          </span>
                          <span className="text-slate-200 font-medium text-sm">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">{t.group_name}</span>
                          <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{t.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              {results.comments.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Comments ({results.comments.length})
                  </h4>
                  <div className="space-y-1">
                    {results.comments.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          navigate(`/tickets/${c.ticket_id}`);
                          dispatch(setIsSearchModalOpen(false));
                        }}
                        className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="font-semibold text-slate-300">@{c.author}</span>
                          <span className="font-mono">{c.ticket_number}</span>
                        </div>
                        <p className="text-slate-300 text-xs italic">"{c.snippet}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users & Groups Section */}
              <div className="grid grid-cols-2 gap-4">
                {results.users.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-400" /> Users ({results.users.length})
                    </h4>
                    {results.users.map((u) => (
                      <div key={u.id} className="p-2 rounded bg-slate-800/40 text-xs text-slate-200 mb-1 flex justify-between">
                        <span>{u.username}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{u.role}</span>
                      </div>
                    ))}
                  </div>
                )}
                {results.groups.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-amber-400" /> Groups ({results.groups.length})
                    </h4>
                    {results.groups.map((g) => (
                      <div key={g.id} className="p-2 rounded bg-slate-800/40 text-xs text-slate-200 mb-1 flex justify-between">
                        <span className="font-semibold">{g.name}</span>
                        <span className="font-mono text-blue-400">[{g.code}]</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
