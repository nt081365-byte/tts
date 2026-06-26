import { create } from 'zustand';
import { Voice, TextFilterRule, TTSSettings, RenderJob, HistoryItem } from '../types';
import { db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export const VOICES: Voice[] = [
  { id: 'v1', name: 'Hoài My - Chuẩn Miền Nam', category: 'Microsoft Edge', gender: 'Female', previewUrl: '', isPreloaded: true },
  { id: 'v2', name: 'Nam Minh - Chuẩn Miền Bắc', category: 'Microsoft Edge', gender: 'Male', previewUrl: '', isPreloaded: true },
  { id: 'v5', name: 'Google Dịch - Nữ (Cổ điển)', category: 'Google TTS', gender: 'Female', previewUrl: '', isPreloaded: true },
  { 
    id: 'v_custom_1', 
    name: 'Ngọc Huyền (Trầm ấm)', 
    category: 'Giọng Tùy Chỉnh (AI)', 
    gender: 'Female', 
    previewUrl: '', 
    isPreloaded: false,
    customVoiceSettings: { baseVoiceId: 'v1', customPitch: -15, customRate: -5 }
  },
  { 
    id: 'v_custom_2', 
    name: 'Mai Phương (Sôi nổi)', 
    category: 'Giọng Tùy Chỉnh (AI)', 
    gender: 'Female', 
    previewUrl: '', 
    isPreloaded: false,
    customVoiceSettings: { baseVoiceId: 'v1', customPitch: 5, customRate: 15 }
  },
  { 
    id: 'v_custom_3', 
    name: 'Bé Dâu Tây (Nhí nhảnh)', 
    category: 'Giọng Tùy Chỉnh (AI)', 
    gender: 'Female', 
    previewUrl: '', 
    isPreloaded: false,
    customVoiceSettings: { baseVoiceId: 'v1', customPitch: 20, customRate: 5 }
  },
  { 
    id: 'v_custom_4', 
    name: 'BTV Quang Minh (Tin tức)', 
    category: 'Giọng Tùy Chỉnh (AI)', 
    gender: 'Male', 
    previewUrl: '', 
    isPreloaded: false,
    customVoiceSettings: { baseVoiceId: 'v2', customPitch: -10, customRate: 10 }
  },
  { 
    id: 'v_custom_5', 
    name: 'Bác Ba Phi (Kể chuyện)', 
    category: 'Giọng Tùy Chỉnh (AI)', 
    gender: 'Male', 
    previewUrl: '', 
    isPreloaded: false,
    customVoiceSettings: { baseVoiceId: 'v2', customPitch: -20, customRate: -10 }
  },
  { 
    id: 'v_custom_6', 
    name: 'VIP Podcast - Nữ Trầm Ấm', 
    category: 'Giọng VIP (Miễn phí)', 
    gender: 'Female', 
    previewUrl: '', 
    isPreloaded: false,
    customVoiceSettings: { baseVoiceId: 'v1', customPitch: -18, customRate: -8 }
  },
  { 
    id: 'v_custom_7', 
    name: 'VIP Audiobook - Nam Truyền Cảm', 
    category: 'Giọng VIP (Miễn phí)', 
    gender: 'Male', 
    previewUrl: '', 
    isPreloaded: false,
    customVoiceSettings: { baseVoiceId: 'v2', customPitch: -12, customRate: -12 }
  },
  { 
    id: 'v_custom_8', 
    name: 'YouTube - Nữ Review Phim (Nhanh, Sôi nổi)', 
    category: 'Giọng VIP (Miễn phí)', 
    gender: 'Female', 
    previewUrl: '', 
    isPreloaded: false,
    customVoiceSettings: { baseVoiceId: 'v1', customPitch: 8, customRate: 28 }
  },
  { 
    id: 'v_custom_9', 
    name: 'YouTube - Nam Review Phim (Cuốn hút)', 
    category: 'Giọng VIP (Miễn phí)', 
    gender: 'Male', 
    previewUrl: '', 
    isPreloaded: false,
    customVoiceSettings: { baseVoiceId: 'v2', customPitch: -2, customRate: 25 }
  },
  { 
    id: 'v_custom_10', 
    name: 'YouTube - Kể Chuyện Ma (Trầm, Chậm)', 
    category: 'Giọng VIP (Miễn phí)', 
    gender: 'Male', 
    previewUrl: '', 
    isPreloaded: false,
    customVoiceSettings: { baseVoiceId: 'v2', customPitch: -25, customRate: -15 }
  },
  { id: 'v3', name: 'Aria - English (US)', category: 'Microsoft Edge', gender: 'Female', previewUrl: '', isPreloaded: false },
  { id: 'v4', name: 'Guy - English (US)', category: 'Microsoft Edge', gender: 'Male', previewUrl: '', isPreloaded: false },
];

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  settings: TTSSettings;
  updateSettings: (settings: Partial<TTSSettings>) => void;
  
  voices: Voice[];
  selectedVoiceId: string;
  selectVoice: (id: string) => void;
  preloadVoice: (id: string) => Promise<void>;
  
  rules: TextFilterRule[];
  loadRules: () => Promise<void>;
  addRule: (rule: TextFilterRule) => Promise<void>;
  updateRule: (rule: TextFilterRule) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  
  queue: RenderJob[];
  addJob: (text: string, title: string) => void;
  updateJob: (id: string, updates: Partial<RenderJob>) => void;
  pauseJob: (id: string) => void;
  resumeJob: (id: string) => void;
  cancelJob: (id: string) => void;
  
  history: HistoryItem[];
  loadHistory: () => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  renameHistoryItem: (id: string, newTitle: string) => Promise<void>;
  addVoice: (voice: Voice) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'dark',
  toggleTheme: () => set(state => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return { theme: newTheme };
  }),
  
  settings: {
    speed: 1.0,
    pitch: 0,
    volume: 100,
    format: 'mp3',
  },
  updateSettings: (s) => set(state => ({ settings: { ...state.settings, ...s } })),
  
  voices: VOICES,
  selectedVoiceId: VOICES[0].id,
  selectVoice: (id) => set({ selectedVoiceId: id }),
  preloadVoice: async (id) => {
    // Simulate preloading
    set(state => ({
      voices: state.voices.map(v => v.id === id ? { ...v, isPreloaded: true } : v)
    }));
  },
  
  rules: [],
  loadRules: async () => {
    const rules = await db.getRules();
    set({ rules });
  },
  addRule: async (rule) => {
    await db.putRule(rule);
    get().loadRules();
  },
  updateRule: async (rule) => {
    await db.putRule(rule);
    get().loadRules();
  },
  deleteRule: async (id) => {
    await db.deleteRule(id);
    get().loadRules();
  },
  
  queue: [],
  addJob: (text, title) => {
    const selectedVoice = get().voices.find(v => v.id === get().selectedVoiceId);
    const customSettings = selectedVoice?.customVoiceSettings;
    const settings = { ...get().settings };
    
    if (customSettings) {
      settings.baseVoiceId = customSettings.baseVoiceId;
      settings.customPitch = customSettings.customPitch;
      settings.customRate = customSettings.customRate;
      settings.referenceAudioBase64 = customSettings.referenceAudioBase64;
      if (customSettings.openSourceEngineUrl) settings.openSourceEngineUrl = customSettings.openSourceEngineUrl;
      if (customSettings.hfToken) settings.hfToken = customSettings.hfToken;
    }

    const job: RenderJob = {
      id: uuidv4(),
      text,
      title,
      voiceId: get().selectedVoiceId,
      settings,
      status: 'idle',
      progress: 0,
      eta: 0,
      createdAt: Date.now(),
      chunksTotal: 0,
      chunksCompleted: 0
    };
    set(state => ({ queue: [job, ...state.queue] }));
    // In a real app, we would notify the worker here or the worker polls the store.
  },
  updateJob: (id, updates) => set(state => ({
    queue: state.queue.map(j => j.id === id ? { ...j, ...updates } : j)
  })),
  pauseJob: (id) => set(state => ({
    queue: state.queue.map(j => j.id === id && j.status === 'processing' ? { ...j, status: 'paused' } : j)
  })),
  resumeJob: (id) => set(state => ({
    queue: state.queue.map(j => j.id === id && j.status === 'paused' ? { ...j, status: 'processing' } : j)
  })),
  cancelJob: (id) => set(state => ({
    queue: state.queue.map(j => j.id === id ? { ...j, status: 'canceled' } : j)
  })),
  
  history: [],
  loadHistory: async () => {
    const history = await db.getHistory();
    // sort desc by date
    history.sort((a, b) => b.createdAt - a.createdAt);
    set({ history });
  },
  deleteHistoryItem: async (id) => {
    await db.deleteHistory(id);
    get().loadHistory();
  },
  clearHistory: async () => {
    await db.clearHistory();
    get().loadHistory();
  },
  renameHistoryItem: async (id, title) => {
    await db.updateHistoryTitle(id, title);
    get().loadHistory();
  },
  addVoice: (voice) => set(state => ({ voices: [voice, ...state.voices] }))
}));
