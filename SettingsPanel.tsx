import { useAppStore } from '../store/useAppStore';
import { Sliders, Volume2, Activity, Disc } from 'lucide-react';

export function SettingsPanel() {
  const { settings, updateSettings } = useAppStore();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
        <Sliders className="w-5 h-5 text-blue-500" />
        Cài đặt âm thanh
      </h3>
      
      <div className="space-y-4">
        {/* Speed */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Tốc độ
            </label>
            <span className="text-sm text-gray-500">{settings.speed}x</span>
          </div>
          <input 
            type="range" min="0.5" max="2.0" step="0.1" 
            value={settings.speed}
            onChange={e => updateSettings({ speed: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
          />
        </div>

        {/* Pitch */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Độ cao (Pitch)
            </label>
            <span className="text-sm text-gray-500">{settings.pitch}</span>
          </div>
          <input 
            type="range" min="-10" max="10" step="1" 
            value={settings.pitch}
            onChange={e => updateSettings({ pitch: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
          />
        </div>

        {/* Volume */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Âm lượng
            </label>
            <span className="text-sm text-gray-500">{settings.volume}%</span>
          </div>
          <input 
            type="range" min="0" max="100" step="1" 
            value={settings.volume}
            onChange={e => updateSettings({ volume: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
          />
        </div>

        {/* Format */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
            <Disc className="w-4 h-4" /> Định dạng xuất
          </label>
          <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
            {['mp3', 'wav', 'ogg'].map(fmt => (
              <button
                key={fmt}
                onClick={() => updateSettings({ format: fmt as any })}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  settings.format === fmt 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
