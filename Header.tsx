import { useAppStore } from '../store/useAppStore';
import { Moon, Sun, Mic2 } from 'lucide-react';

export function Header() {
  const { theme, toggleTheme } = useAppStore();

  return (
    <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
          <Mic2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            Nexus TTS
          </h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Phát triển dựa trên Edge TTS & VietNormalizer</p>
        </div>
      </div>

      <button 
        onClick={toggleTheme}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
}
