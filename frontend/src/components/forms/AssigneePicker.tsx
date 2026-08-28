import React, { useState, useRef, useEffect } from 'react';
import { User, Group } from '../../types';
import { ChevronDown, Search, User as UserIcon, Check } from 'lucide-react';

interface AssigneePickerProps {
  users: User[];
  value: string | number | null;
  onChange: (userId: string) => void;
  assignedGroupDetails?: Group | null;
  className?: string;
}

export const AssigneePicker: React.FC<AssigneePickerProps> = ({
  users,
  value,
  onChange,
  assignedGroupDetails,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedUserIdStr = value !== null && value !== undefined ? String(value) : '';
  const selectedUser = users.find((u) => String(u.id) === selectedUserIdStr);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const grpMembers = (assignedGroupDetails as any)?.members_details || [];
  const isMember = (uId: number) => grpMembers.some((m: any) => m.id === uId);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const uname = u.username.toLowerCase();
    return name.includes(q) || uname.includes(q);
  });

  const sortedUsers = grpMembers.length > 0
    ? [...filteredUsers].sort((a, b) => (isMember(b.id) ? 1 : 0) - (isMember(a.id) ? 1 : 0))
    : filteredUsers;

  const handleSelect = (uId: string) => {
    onChange(uId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getDisplayName = (u: User) => {
    return u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none flex items-center justify-between gap-2 cursor-pointer transition-all shadow-sm"
      >
        {selectedUser ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-[10px] overflow-hidden flex-shrink-0">
              {selectedUser.avatar ? (
                <img src={selectedUser.avatar} alt={getDisplayName(selectedUser)} className="w-full h-full object-cover" />
              ) : (
                <span>{selectedUser.first_name ? selectedUser.first_name[0].toUpperCase() : selectedUser.username[0].toUpperCase()}</span>
              )}
            </div>
            <span className="font-semibold text-slate-100 text-xs truncate">
              {getDisplayName(selectedUser)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <UserIcon className="w-3.5 h-3.5 text-slate-500" />
            <span className="italic">Unassigned</span>
          </div>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in duration-100">
          {/* Search Box */}
          {users.length > 5 && (
            <div className="p-2 border-b border-slate-800 bg-slate-950/60 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <input
                type="text"
                placeholder="Search name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-52 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
            {/* Clear / Unassign Option */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                selectedUserIdStr === '' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Unassigned</span>
              </div>
              {selectedUserIdStr === '' && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>

            {sortedUsers.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500 italic">
                No matching users found
              </div>
            ) : (
              sortedUsers.map((u) => {
                const isSelected = String(u.id) === selectedUserIdStr;
                const name = getDisplayName(u);

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(String(u.id))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'hover:bg-slate-800/70 text-slate-200 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-[10px] overflow-hidden flex-shrink-0">
                        {u.avatar ? (
                          <img src={u.avatar} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{u.first_name ? u.first_name[0].toUpperCase() : u.username[0].toUpperCase()}</span>
                        )}
                      </div>
                      <span className="font-medium text-xs truncate">{name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
