import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Play, Pause, DownloadCloud, CheckCircle2, Wand2, AudioLines } from 'lucide-react';
import { VoiceBuilder } from './VoiceBuilder';
import { VoiceCloner } from './VoiceCloner';

export function VoiceSelector() {
  const { voices, selectedVoiceId, selectVoice, preloadVoice } = useAppStore();
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showCloner, setShowCloner] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredVoices = voices.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  const togglePlay = async (url: string, id: string) => {
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(id);
      
      try {
        if (url) {
          // Play the provided URL (e.g. cloned voice sample)
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.play().catch(e => {
            console.warn("Failed to play audio preview:", e);
            setPlayingId(id);
            setTimeout(() => {
              setPlayingId((prev) => (prev === id ? null : prev));
            }, 2000);
          });
          audio.onended = () => {
            setPlayingId(null);
          };
          return;
        }

        const voice = voices.find(v => v.id === id);
        const settings: any = { format: 'mp3' };
        
        if (voice?.customVoiceSettings) {
          settings.baseVoiceId = voice.customVoiceSettings.baseVoiceId;
          settings.customPitch = voice.customVoiceSettings.customPitch;
          settings.customRate = voice.customVoiceSettings.customRate;
        }

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: 'Xin chào, đây là giọng đọc thử nghiệm.',
            voiceId: id,
            settings: {
              ...settings,
              elevenLabsVoiceId: voice?.elevenLabsVoiceId,
              elevenLabsApiKey: useAppStore.getState().settings.elevenLabsApiKey,
              referenceAudioBase64: voice?.customVoiceSettings?.referenceAudioBase64,
              openSourceEngineUrl: useAppStore.getState().settings.openSourceEngineUrl,
              hfToken: useAppStore.getState().settings.hfToken,
            }
          })
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        const audio = new Audio(objectUrl);
        audioRef.current = audio;
        
        audio.play().catch(e => {
          console.warn("Failed to play audio preview:", e);
          setPlayingId(id);
          setTimeout(() => {
            setPlayingId((prev) => (prev === id ? null : prev));
          }, 2000);
        });

        audio.onended = () => {
          setPlayingId(null);
          URL.revokeObjectURL(objectUrl);
        };
      } catch (e) {
        console.warn("Failed to initialize audio", e);
        setPlayingId(id);
        setTimeout(() => {
          setPlayingId((prev) => (prev === id ? null : prev));
        }, 2000);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full max-h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thư viện giọng đọc</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowCloner(true)}
            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <AudioLines className="w-4 h-4" />
            <span className="hidden sm:inline">Nhân bản</span>
          </button>
          <button 
            onClick={() => setShowBuilder(true)}
            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <Wand2 className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo AI</span>
          </button>
        </div>
      </div>
      
      <input 
        type="text"
        placeholder="Tìm kiếm giọng đọc..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 dark:text-gray-200"
      />

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
        {filteredVoices.map(voice => (
          <div 
            key={voice.id}
            onClick={() => selectVoice(voice.id)}
            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              selectedVoiceId === voice.id 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); togglePlay(voice.previewUrl, voice.id); }}
                className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                {playingId === voice.id ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  {voice.name}
                  {selectedVoiceId === voice.id && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{voice.category}</span>
                  <span>{voice.gender}</span>
                </div>
              </div>
            </div>

            {!voice.isPreloaded ? (
              <button 
                onClick={(e) => { e.stopPropagation(); preloadVoice(voice.id); }}
                title="Tải mô-đun để sử dụng ngoại tuyến/nhanh hơn"
                className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
              >
                <DownloadCloud className="w-5 h-5" />
              </button>
            ) : (
              <span className="text-xs font-medium text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
              </span>
            )}
          </div>
        ))}
        {filteredVoices.length === 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
            Không tìm thấy giọng đọc nào.
          </div>
        )}
      </div>
      
      {showBuilder && <VoiceBuilder onClose={() => setShowBuilder(false)} />}
      {showCloner && <VoiceCloner onClose={() => setShowCloner(false)} />}
    </div>
  );
}
