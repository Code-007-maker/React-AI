import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  BookOpen,
  Calendar,
  Sparkles,
  Smile,
  Zap,
  Coffee,
  Target,
  AlertCircle,
  Heart,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { JournalEntry, ReflectionCategory, MoodType } from '../types';

interface SidebarHistoryProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  isLoading: boolean;
}

const CATEGORY_LABELS: Record<ReflectionCategory, { label: string; color: string }> = {
  daily_journal: { label: 'Daily Journal', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  deep_reflection: { label: 'Deep Reflection', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  goal_setting: { label: 'Goal Setting', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  problem_solving: { label: 'Problem Solving', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  gratitude: { label: 'Gratitude', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  brainstorming: { label: 'Brainstorming', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

const MOOD_ICONS: Record<MoodType, { label: string; icon: any }> = {
  reflective: { label: 'Reflective', icon: BookOpen },
  energized: { label: 'Energized', icon: Zap },
  calm: { label: 'Calm', icon: Coffee },
  focused: { label: 'Focused', icon: Target },
  overwhelmed: { label: 'Overwhelmed', icon: AlertCircle },
  grateful: { label: 'Grateful', icon: Heart },
};

export const SidebarHistory: React.FC<SidebarHistoryProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.messages.some((m) => m.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.summary && entry.summary.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategoryFilter === 'all' || entry.category === selectedCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [entries, searchTerm, selectedCategoryFilter]);

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this reflection? This cannot be undone.')) {
      try {
        setDeletingId(entryId);
        await onDeleteEntry(entryId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <aside className="w-full lg:w-80 bg-slate-900/90 border-r border-slate-800 flex flex-col h-[calc(100vh-4rem)] shrink-0">
      {/* Search & Actions Header */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Reflection Vault</span>
            <span className="text-xs text-slate-400 font-normal">({entries.length})</span>
          </h2>
          <button
            id="btn-sidebar-new"
            onClick={onNewEntry}
            className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors cursor-pointer shadow-sm"
            title="Start New Reflection"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="input-search-reflections"
            type="text"
            placeholder="Search entries & insights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, val]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategoryFilter(catKey)}
              className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategoryFilter === catKey
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && entries.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading reflection history...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-xs text-slate-400 mb-2">No reflections found.</p>
            <button
              onClick={onNewEntry}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create first reflection</span>
            </button>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = entry.id === selectedEntryId;
            const categoryMeta = CATEGORY_LABELS[entry.category] || CATEGORY_LABELS.daily_journal;
            const MoodIcon = entry.mood ? MOOD_ICONS[entry.mood]?.icon : null;
            const previewText =
              entry.messages.find((m) => m.role === 'user')?.content ||
              entry.summary ||
              'No text content recorded yet';

            return (
              <div
                key={entry.id}
                id={`entry-item-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                  isSelected
                    ? 'bg-slate-800/95 border-emerald-500/50 shadow-md shadow-slate-950/40'
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3
                    className={`text-xs font-medium leading-snug line-clamp-1 ${
                      isSelected ? 'text-emerald-300' : 'text-slate-200 group-hover:text-white'
                    }`}
                  >
                    {entry.title || 'Untitled Reflection'}
                  </h3>

                  <button
                    id={`btn-delete-${entry.id}`}
                    onClick={(e) => handleDelete(e, entry.id!)}
                    disabled={deletingId === entry.id}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/80 rounded transition-all cursor-pointer shrink-0"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                  {previewText}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/30">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] ${categoryMeta.color}`}>
                      {categoryMeta.label}
                    </span>
                    {MoodIcon && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <MoodIcon className="w-3 h-3 text-slate-400" />
                        <span className="capitalize">{entry.mood}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatDate(entry.updatedAt || entry.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
