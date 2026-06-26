import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { TextEditor } from './components/TextEditor';
import { VoiceSelector } from './components/VoiceSelector';
import { SettingsPanel } from './components/SettingsPanel';
import { FilterSettings } from './components/FilterSettings';
import { RenderQueue } from './components/RenderQueue';
import { HistoryList } from './components/HistoryList';
import { orchestrator } from './workers/tts';

export default function App() {
  const { loadRules, loadHistory } = useAppStore();

  useEffect(() => {
    loadRules();
    loadHistory();
    orchestrator.start();
    
    // Ensure dark mode initial state
    if (useAppStore.getState().theme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        // Settings are auto-saved by zustand/idb in this architecture,
        // so we just prevent the browser from opening the save dialog.
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadRules, loadHistory]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0E14] text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-500/30">
      <Header />
      
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full">
            <div className="flex-1">
              <TextEditor />
            </div>
          </div>

          {/* Right Column: Settings & Voices */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-1 pb-4">
            <VoiceSelector />
            <SettingsPanel />
            <FilterSettings />
          </div>
        </div>

        {/* Bottom Section: Queue & History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          <RenderQueue />
          <HistoryList />
        </div>
      </main>
    </div>
  );
}
