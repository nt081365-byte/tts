import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Play, Download, Trash2, Edit2, Clock, Check, X, FileAudio } from 'lucide-react';
import { formatTime, formatBytes } from '../lib/utils';

export function HistoryList() {
  const { history, loadHistory, deleteHistoryItem, renameHistoryItem, voices, clearHistory } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDownload = (blob: Blob, title: string, format: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePlay = (id: string, blob: Blob) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      try {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch(e => {
          console.warn("Failed to play history audio:", e);
          setPlayingId(id);
          setTimeout(() => {
            setPlayingId((prev) => (prev === id ? null : prev));
          }, 2000);
        });
        setPlayingId(id);
        audio.onended = () => {
          setPlayingId(null);
          URL.revokeObjectURL(url);
        };
      } catch (e) {
        console.warn("Failed to initialize audio", e);
      }
    }
  };

  if (history.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Lịch sử tạo âm thanh
        </h3>
        {showClearConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Xác nhận xóa?</span>
            <button
              onClick={() => {
                clearHistory();
                setShowClearConfirm(false);
              }}
              className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition-colors"
            >
              Có
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      <div className="space-y-3">
        {history.map(item => {
          const voice = voices.find(v => v.id === item.voiceId);
          return (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 bg-gray-50/50 dark:bg-gray-900/50 transition-colors group">
              
              <button 
                onClick={() => handlePlay(item.id, item.audioBlob)}
                className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
              >
                {playingId === item.id ? <div className="w-3 h-3 bg-current rounded-sm" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <div className="flex-1 min-w-0">
                {editingId === item.id ? (
                  <div className="flex items-center gap-1 mb-1">
                    <input 
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="text-sm px-2 py-0.5 border border-indigo-300 rounded outline-none dark:bg-gray-800 dark:text-white dark:border-indigo-600"
                      autoFocus
                    />
                    <button onClick={() => { renameHistoryItem(item.id, editTitle); setEditingId(null); }} className="text-emerald-500 p-1"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 p-1"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.title}</h4>
                    <button onClick={() => { setEditingId(item.id); setEditTitle(item.title); }} className="text-gray-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.textSnippet}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1"><FileAudio className="w-3 h-3" /> {item.format.toUpperCase()}</span>
                  <span>{formatTime(item.duration)}</span>
                  <span>{formatBytes(item.audioBlob.size)}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>{voice?.name || 'Giọng không xác định'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDownload(item.audioBlob, item.title, item.format)}
                  className="p-1.5 text-gray-500 hover:text-blue-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-sm"
                  title="Tải xuống"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteHistoryItem(item.id)}
                  className="p-1.5 text-gray-500 hover:text-red-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-sm"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
