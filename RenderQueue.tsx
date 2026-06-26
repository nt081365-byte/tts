import { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatTime } from '../lib/utils';
import { PauseCircle, PlayCircle, XCircle, Loader2, Download, Play, Pause, CheckCircle2, AlertCircle } from 'lucide-react';

export function RenderQueue() {
  const { queue, pauseJob, resumeJob, cancelJob, voices } = useAppStore();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const displayJobs = queue.filter(j => j.status !== 'canceled');

  if (displayJobs.length === 0) return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
      <p>Chưa có tệp nào đang được xử lý.</p>
    </div>
  );

  const handleDownload = (job: any) => {
    if (!job.audioBlob) return;
    const url = URL.createObjectURL(job.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    const format = job.settings?.format || 'mp3';
    a.download = `${job.title.replace(/[^a-z0-9A-Z_À-ỹ]/gi, '_').toLowerCase()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePlay = (job: any) => {
    if (playingId === job.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      try {
        if (!job.audioBlob) return;
        const url = URL.createObjectURL(job.audioBlob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch(e => {
          console.warn("Failed to play audio:", e);
          setPlayingId(job.id);
          setTimeout(() => {
            setPlayingId((prev) => (prev === job.id ? null : prev));
          }, 2000);
        });
        setPlayingId(job.id);
        audio.onended = () => {
          setPlayingId(null);
          URL.revokeObjectURL(url);
        };
      } catch (e) {
        console.warn("Failed to initialize audio", e);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        Tiến trình tạo âm thanh ({displayJobs.length})
      </h3>

      <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
        {displayJobs.map(job => {
          const voice = voices.find(v => v.id === job.voiceId);
          return (
            <div key={job.id} className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border transition-colors ${
              job.status === 'completed' ? 'border-emerald-200 dark:border-emerald-800' : 
              job.status === 'error' ? 'border-red-200 dark:border-red-800' : 
              'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white line-clamp-1 flex items-center gap-2">
                    {job.title}
                    {job.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {job.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {voice?.name} • Đang xử lý đoạn {job.chunksCompleted}/{job.chunksTotal}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {job.status === 'processing' ? (
                    <button onClick={() => pauseJob(job.id)} className="p-1.5 text-amber-500 hover:text-amber-600 transition-colors bg-amber-50 dark:bg-amber-500/10 rounded-md" title="Tạm dừng">
                      <PauseCircle className="w-5 h-5" />
                    </button>
                  ) : job.status === 'paused' ? (
                    <button onClick={() => resumeJob(job.id)} className="p-1.5 text-emerald-500 hover:text-emerald-600 transition-colors bg-emerald-50 dark:bg-emerald-500/10 rounded-md" title="Tiếp tục">
                      <PlayCircle className="w-5 h-5" />
                    </button>
                  ) : null}
                  <button onClick={() => cancelJob(job.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md" title={job.status === 'completed' ? "Xóa" : "Hủy bỏ"}>
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2 shadow-inner">
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-300 rounded-full ${job.status === 'paused' ? 'bg-amber-400' : job.status === 'completed' ? 'bg-emerald-500' : job.status === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center text-sm font-medium mt-2">
                <span className={`px-2 py-0.5 rounded-md ${
                  job.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  job.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  job.status === 'paused' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {job.status === 'paused' ? 'Đã tạm dừng' : 
                   job.status === 'completed' ? 'Hoàn thành 100%' : 
                   job.status === 'error' ? 'Lỗi' : 
                   `Đang tạo... ${job.progress}%`}
                </span>
                
                {job.status === 'processing' && (
                  <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                    Còn lại khoảng {formatTime(job.eta)}
                  </span>
                )}
              </div>
              
              {job.status === 'error' && job.error && (
                <div className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md border border-red-100 dark:border-red-900/30">
                  {job.error}
                </div>
              )}

              {job.status === 'completed' && job.audioBlob && (
                <div className="mt-4 flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handlePlay(job)}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 py-2 rounded-lg font-medium transition-colors"
                  >
                    {playingId === job.id ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    {playingId === job.id ? 'Tạm dừng' : 'Nghe thử'}
                  </button>
                  <button
                    onClick={() => handleDownload(job)}
                    className="flex-[2] flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-medium shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5" />
                    Tải tệp âm thanh ({job.settings?.format?.toUpperCase() || 'MP3'})
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
