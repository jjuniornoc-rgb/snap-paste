import React, { useState } from 'react';
import { ClipItem, deleteClip, clearAllClips } from '../lib/storage';
import { 
  Trash2, 
  Copy, 
  Download, 
  Search, 
  Calendar, 
  HardDrive, 
  Check, 
  Plus 
} from 'lucide-react';
import { useI18n } from '../i18n';

interface ClipsGalleryProps {
  clips: ClipItem[];
  onSelectClip: (clip: ClipItem) => void;
  onRefreshClips: () => void;
  onNewClip: () => void;
  onTriggerToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ClipsGallery: React.FC<ClipsGalleryProps> = ({
  clips,
  onSelectClip,
  onRefreshClips,
  onNewClip,
  onTriggerToast
}) => {
  const { strings } = useI18n();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique tags
  const allTags = Array.from(new Set(clips.flatMap(c => c.tags || ['General'])));

  const filteredClips = clips.filter(clip => {
    const matchesSearch = clip.title.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag === 'all' || (clip.tags && clip.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this clip from local storage?')) {
      await deleteClip(id);
      onRefreshClips();
      onTriggerToast('Clip deleted.', 'info');
    }
  };

  const handleCopyImage = async (clip: ClipItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(clip.dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiedId(clip.id);
      setTimeout(() => setCopiedId(null), 2000);
      onTriggerToast(strings.editor.toasts.copied, 'success');
    } catch (err) {
      console.error('Clipboard copy error:', err);
      onTriggerToast(strings.editor.toasts.copyError, 'error');
    }
  };

  const handleDownload = (clip: ClipItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = clip.dataUrl;
    a.download = `${clip.title.replace(/\s+/g, '_').toLowerCase()}.png`;
    a.click();
    onTriggerToast('Download started.', 'success');
  };

  const handleClearAll = async () => {
    if (confirm('Clear all local clips?')) {
      await clearAllClips();
      onRefreshClips();
      onTriggerToast('Clips cleared.', 'info');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Bar */}
      <div data-tour="clips-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {strings.clips.title}
            </h1>
            <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-accent border border-amber-500/20 px-2 py-0.5 rounded-full">
              {clips.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {strings.clips.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {clips.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{strings.clips.clearAll}</span>
            </button>
          )}

          <button
            onClick={onNewClip}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-accent hover:bg-amber-glow text-obsidian-950 font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>{strings.hero.pasteClipboard}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div data-tour="clips-search" className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={strings.clips.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-obsidian-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-accent/80 transition-colors"
          />
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedTag === 'all'
                ? 'bg-amber-500/20 text-amber-accent border border-amber-500/30'
                : 'bg-obsidian-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {strings.clips.all} ({clips.length})
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedTag === tag
                  ? 'bg-amber-500/20 text-amber-accent border border-amber-500/30'
                  : 'bg-obsidian-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Clips Grid */}
      {filteredClips.length === 0 ? (
        <div className="w-full py-20 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-zinc-800 bg-obsidian-900/40 p-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-4">
            <HardDrive className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">{strings.clips.emptyTitle}</h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-sm">
            {strings.clips.emptySubtitle}
          </p>
          <button
            onClick={onNewClip}
            className="mt-5 px-4 py-2 rounded-xl bg-amber-accent hover:bg-amber-glow text-obsidian-950 font-bold text-xs sm:text-sm transition-all shadow-md"
          >
            {strings.hero.pasteClipboard}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredClips.map((clip) => (
            <div
              key={clip.id}
              onClick={() => onSelectClip(clip)}
              className="group relative flex flex-col bg-obsidian-900 border border-zinc-800 hover:border-amber-500/50 rounded-xl overflow-hidden shadow-lg hover:shadow-amber-500/10 cursor-pointer transition-all hover:-translate-y-1"
            >
              {/* Thumbnail Container */}
              <div className="relative w-full aspect-[4/3] bg-obsidian-950 overflow-hidden flex items-center justify-center border-b border-zinc-800/80">
                <img
                  src={clip.thumbnail || clip.dataUrl}
                  alt={clip.title}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Floating Quick Action Overlay on Hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                  <button
                    onClick={(e) => handleCopyImage(clip, e)}
                    className="p-2.5 rounded-xl bg-zinc-800/90 hover:bg-amber-accent hover:text-obsidian-950 text-white shadow-md transition-colors"
                    title="Copiar imagem para o clipboard"
                  >
                    {copiedId === clip.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={(e) => handleDownload(clip, e)}
                    className="p-2.5 rounded-xl bg-zinc-800/90 hover:bg-amber-accent hover:text-obsidian-950 text-white shadow-md transition-colors"
                    title="Baixar imagem"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(clip.id, e)}
                    className="p-2.5 rounded-xl bg-zinc-800/90 hover:bg-red-500 hover:text-white text-zinc-300 shadow-md transition-colors"
                    title="Excluir captura"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-amber-glow truncate">
                    {clip.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      {new Date(clip.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span>{new Date(clip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>{clip.sizeKb} KB</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1 mt-3 flex-wrap">
                  {(clip.tags || ['Geral']).map(t => (
                    <span key={t} className="text-[10px] font-mono bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700/50">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
