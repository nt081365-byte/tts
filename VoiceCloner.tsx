import { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Mic, Upload, X, Check, Activity, AudioLines, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Voice } from '../types';

export function VoiceCloner({ onClose }: { onClose: () => void }) {
  const { addVoice, voices } = useAppStore();
  const [name, setName] = useState('Giọng Nhân Bản Mới');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [elevenLabsKey, setElevenLabsKey] = useState(useAppStore.getState().settings.elevenLabsApiKey || '');
  const [useRealCloning, setUseRealCloning] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Input, 2: Processing, 3: Success
  const [mode, setMode] = useState<'record' | 'upload' | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        handleProcess(url, audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing mic:", err);
      alert("Không thể truy cập microphone. Vui lòng cấp quyền hoặc sử dụng chức năng tải file.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleUpload = () => {
    // Mock file input click
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        handleProcess(url, file);
      }
    };
    input.click();
  };

  const handleProcess = async (audioUrl: string, audioBlob?: Blob) => {
    setErrorMsg('');
    if (useRealCloning && !elevenLabsKey.trim()) {
      setErrorMsg('Vui lòng nhập ElevenLabs API Key để tiếp tục.');
      return;
    }

    setStep(2);
    
    // Save API key if used
    if (useRealCloning && elevenLabsKey) {
      useAppStore.getState().updateSettings({ elevenLabsApiKey: elevenLabsKey });
    }

    try {
      let elevenLabsVoiceId = undefined;
      let openSourceUrl = undefined;
      let refBase64 = undefined;
      
      let hfTokenForVoice = undefined;
      
      if (useRealCloning && elevenLabsKey && audioBlob) {
        // Convert blob to base64
        const buffer = await audioBlob.arrayBuffer();
        const base64Audio = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const mimeType = audioBlob.type || 'audio/webm';
        const fileName = (audioBlob as any).name || 'sample.webm';

        const response = await fetch('/api/clone-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            base64Audio,
            apiKey: elevenLabsKey,
            mimeType,
            fileName
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.error || "Lỗi khi gọi API nhân bản ElevenLabs.");
        }
        
        const data = await response.json();
        elevenLabsVoiceId = data.voice_id;
      } else if ((elevenLabsKey === 'huggingface' || elevenLabsKey === 'custom') && audioBlob) {
        const buffer = await audioBlob.arrayBuffer();
        refBase64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        if (elevenLabsKey === 'huggingface') {
          openSourceUrl = "coqui/xtts";
          const hfTokenInput = document.getElementById('hfTokenInput') as HTMLInputElement;
          hfTokenForVoice = hfTokenInput?.value || undefined;
          useAppStore.getState().updateSettings({ openSourceEngineUrl: "coqui/xtts", hfToken: hfTokenForVoice });
        } else {
          const customUrlInput = document.getElementById('customUrl') as HTMLInputElement;
          openSourceUrl = customUrlInput?.value || "http://localhost:8000";
          useAppStore.getState().updateSettings({ openSourceEngineUrl: openSourceUrl });
        }
      }

      // Create a cloned voice
      const baseVoices = voices.filter(v => {
        if (v.id.startsWith('v_custom')) return false;
        if (language === 'vi' && !v.name.includes('English')) return true;
        if (language === 'en' && v.name.includes('English')) return true;
        return false;
      });
      const fallbackVoice = voices[0];
      const randomBase = baseVoices.length > 0 ? baseVoices[Math.floor(Math.random() * baseVoices.length)] : fallbackVoice;
      
      const newVoice: Voice = {
        id: `v_custom_${uuidv4()}`,
        name: name,
        category: useRealCloning ? 'Giọng Nhân Bản (ElevenLabs Cao Cấp)' : (elevenLabsKey === 'huggingface' || elevenLabsKey === 'custom' ? 'Giọng Nhân Bản (Mã nguồn mở AI)' : `Giọng Nhân Bản (${language === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'})`),
        gender: 'Other',
        previewUrl: audioUrl,
        isPreloaded: true,
        elevenLabsVoiceId,
        customVoiceSettings: {
          baseVoiceId: randomBase.id,
          customPitch: 0,
          customRate: 0,
          referenceAudioBase64: refBase64,
          openSourceEngineUrl: openSourceUrl,
          hfToken: hfTokenForVoice
        }
      };
      
      addVoice(newVoice);
      setStep(3);
      
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Đã xảy ra lỗi khi nhân bản giọng nói. Vui lòng thử lại sau.");
      setStep(1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <AudioLines className="w-5 h-5 text-rose-500" />
            Nhân bản giọng nói
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Phương thức nhân bản</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Chọn engine để clone giọng</p>
                  </div>
                  <select 
                    value={useRealCloning ? 'elevenlabs' : (elevenLabsKey === 'custom' ? 'custom' : (elevenLabsKey === 'huggingface' ? 'huggingface' : 'mock'))}
                    onChange={(e) => {
                      if (e.target.value === 'elevenlabs') {
                        setUseRealCloning(true);
                        setElevenLabsKey(useAppStore.getState().settings.elevenLabsApiKey || '');
                      } else if (e.target.value === 'custom') {
                        setUseRealCloning(false);
                        setElevenLabsKey('custom');
                      } else if (e.target.value === 'huggingface') {
                        setUseRealCloning(false);
                        setElevenLabsKey('huggingface');
                      } else {
                        setUseRealCloning(false);
                        setElevenLabsKey('');
                      }
                    }}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                  >
                    <option value="mock">Giả lập (Miễn phí)</option>
                    <option value="huggingface">Hugging Face / Coqui XTTS (Mã nguồn mở miễn phí)</option>
                    <option value="elevenlabs">ElevenLabs (Cao cấp)</option>
                    <option value="custom">Custom API</option>
                  </select>
                </div>
                
                {useRealCloning ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      ElevenLabs API Key
                    </label>
                    <input 
                      type="password" 
                      value={elevenLabsKey}
                      onChange={(e) => setElevenLabsKey(e.target.value)}
                      placeholder="Nhập API Key của bạn"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">API Key chỉ được lưu cục bộ trên trình duyệt của bạn.</p>
                  </div>
                ) : elevenLabsKey === 'custom' ? (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-700 dark:text-indigo-300">
                    <strong>Custom API (VD: Coqui XTTS, F5-TTS, OpenVoice):</strong>
                    <br />Bạn cần tự chạy các model mã nguồn mở từ GitHub trên máy tính cá nhân (hoặc Google Colab) và cung cấp Local API URL (vd: http://localhost:8000/tts).
                    <input 
                      type="text" 
                      id="customUrl"
                      placeholder="http://localhost:8000/api/tts"
                      className="w-full px-3 py-1.5 mt-2 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-md text-xs outline-none"
                    />
                  </div>
                ) : elevenLabsKey === 'huggingface' ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-700 dark:text-emerald-300">
                    <strong>Hugging Face Space:</strong> Ứng dụng sẽ kết nối với máy chủ cộng đồng Coqui XTTS miễn phí (Mã nguồn mở).
                    <br /><em>Lưu ý: Có thể hơi chậm hoặc quá tải do chạy trên máy chủ công cộng miễn phí. Tỷ lệ giống giọng gốc đạt khoảng 85-90%.</em>
                    <input 
                      type="text" 
                      id="hfTokenInput"
                      placeholder="Hugging Face Token (Tùy chọn, giúp tránh lỗi quá tải)"
                      className="w-full px-3 py-1.5 mt-2 bg-white dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs outline-none"
                    />
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-300">
                    <strong>Lưu ý (Chế độ giả lập):</strong> Bản thu chỉ dùng để nghe lại. Khi chuyển đổi văn bản, AI sẽ sử dụng giọng giả lập có sẵn gần giống nhất. Để clone y chang 100%, hãy bật chế độ Cao cấp.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Tên giọng nhân bản
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Ngôn ngữ của mẫu giọng
                </label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'vi' | 'en')}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">Tiếng Anh</option>
                </select>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cung cấp mẫu giọng (Ít nhất 10 giây)</p>
                
                {!isRecording ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={startRecording}
                      className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-rose-200 dark:border-rose-900/50 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mic className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">Thu âm trực tiếp</span>
                    </button>
                    
                    <button 
                      onClick={handleUpload}
                      className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">Tải file âm thanh</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                        00:{recordingTime.toString().padStart(2, '0')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-6 text-rose-400">
                      <Activity className="w-6 h-6 animate-pulse" />
                      <Activity className="w-6 h-6 animate-pulse delay-75" />
                      <Activity className="w-6 h-6 animate-pulse delay-150" />
                    </div>
                    
                    <button 
                      onClick={stopRecording}
                      className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-medium transition-colors shadow-sm shadow-rose-200 dark:shadow-none"
                    >
                      Dừng & Xử lý
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="py-10 flex flex-col items-center justify-center space-y-5">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-100 dark:border-gray-700 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-rose-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                <AudioLines className="w-8 h-8 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Đang phân tích mẫu giọng...</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Trích xuất đặc trưng sinh trắc học</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-10 flex flex-col items-center justify-center text-emerald-500">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4 relative">
                <Check className="w-8 h-8 relative z-10" />
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nhân bản thành công!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">"{name}" đã sẵn sàng sử dụng.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
