import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Sparkles, Sliders, X, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Voice } from '../types';

export function VoiceBuilder({ onClose }: { onClose: () => void }) {
  const { addVoice, voices } = useAppStore();
  const [name, setName] = useState('Giọng Mới');
  const [description, setDescription] = useState('');
  const [baseVoiceId, setBaseVoiceId] = useState(voices[0].id);
  const [pitchShift, setPitchShift] = useState(0);
  const [isBuilding, setIsBuilding] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBuild = () => {
    if (!description && pitchShift === 0) return;
    
    setIsBuilding(true);
    // Simulate AI voice building
    setTimeout(() => {
      const newVoice: Voice = {
        id: `v_custom_${uuidv4()}`,
        name: name,
        category: 'Tự tạo (AI)',
        gender: 'Other',
        previewUrl: '',
        isPreloaded: true,
        customVoiceSettings: {
          baseVoiceId,
          customPitch: pitchShift,
          customRate: 0 // Default unchanged for now, but could be adjusted
        }
      };
      
      addVoice(newVoice);
      setIsBuilding(false);
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Xưởng tạo giọng nói AI
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-emerald-500">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold">Tạo giọng thành công!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Đã thêm vào thư viện giọng đọc.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên giọng đọc
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Miêu tả giọng đọc (AI Prompt)
                </label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Giọng nữ miền Bắc, ấm áp, nhịp điệu chậm rãi..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Trộn giọng nền (Tùy chọn)
                </label>
                
                <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Giọng cơ sở</label>
                    <select 
                      value={baseVoiceId}
                      onChange={(e) => setBaseVoiceId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none"
                    >
                      {voices.filter(v => !v.id.startsWith('v_custom')).map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Độ trầm bổng (Pitch Mix)</label>
                      <span className="text-xs text-gray-500">{pitchShift}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="-50" 
                      max="50" 
                      value={pitchShift}
                      onChange={(e) => setPitchShift(parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleBuild}
                  disabled={isBuilding || (!description && pitchShift === 0)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {isBuilding ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang tổng hợp giọng...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Khởi tạo giọng đọc
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
