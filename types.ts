export interface Voice {
  id: string;
  name: string;
  category: string;
  gender: 'Male' | 'Female' | 'Other';
  previewUrl: string;
  isPreloaded?: boolean;
  customVoiceSettings?: {
    baseVoiceId: string;
    customPitch: number;
    customRate?: number;
    referenceAudioBase64?: string;
    openSourceEngineUrl?: string;
    hfToken?: string;
  };
  elevenLabsVoiceId?: string;
}

export interface TextFilterRule {
  id: string;
  name: string;
  pattern: string; // regex string
  replacement: string;
  enabled: boolean;
  isSystem?: boolean; // system rules cannot be deleted
}

export interface TTSSettings {
  speed: number; // 0.5 to 2.0
  pitch: number; // -10 to 10
  volume: number; // 0 to 100
  format: 'mp3' | 'wav' | 'ogg';
  baseVoiceId?: string; // used by API
  customPitch?: number; // used by API
  customRate?: number; // used by API
  elevenLabsApiKey?: string;
  referenceAudioBase64?: string;
  openSourceEngineUrl?: string;
  hfToken?: string;
}

export type JobStatus = 'idle' | 'processing' | 'paused' | 'completed' | 'error' | 'canceled';

export interface RenderJob {
  id: string;
  text: string;
  title: string;
  voiceId: string;
  settings: TTSSettings;
  status: JobStatus;
  progress: number; // 0 to 100
  eta: number; // in seconds
  createdAt: number;
  completedAt?: number;
  audioUrl?: string; // object URL or server URL
  audioBlob?: Blob; // For download
  chunksTotal: number;
  chunksCompleted: number;
  error?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  textSnippet: string;
  voiceId: string;
  createdAt: number;
  duration: number; // seconds
  format: string;
  audioBlob: Blob;
}
