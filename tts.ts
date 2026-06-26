import { RenderJob, HistoryItem } from '../types';
import { useAppStore } from '../store/useAppStore';
import { VietNormalizer } from '../lib/vietnormalizer';
import { db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

class TTSOrchestrator {
  private activeJobs: Set<string> = new Set();
  private timer: any = null;
  
  start() {
    if (!this.timer) {
      this.timer = setInterval(() => this.processQueue(), 1000);
    }
  }

  private async processQueue() {
    const state = useAppStore.getState();
    const pendingJobs = state.queue.filter(j => j.status === 'idle' || j.status === 'processing');
    
    for (const job of pendingJobs) {
      if (!this.activeJobs.has(job.id) && job.status !== 'paused') {
        this.activeJobs.add(job.id);
        this.processJob(job).catch(err => {
          console.error(err);
          useAppStore.getState().updateJob(job.id, { status: 'error', error: err.message });
          this.activeJobs.delete(job.id);
        });
      }
    }
  }

  private async processJob(initialJob: RenderJob) {
    const store = useAppStore.getState();
    store.updateJob(initialJob.id, { status: 'processing' });
    
    // 1. Normalize Text
    const rules = store.rules;
    const normalizedText = VietNormalizer.normalize(initialJob.text, rules);
    
    // 2. Chunk Text
    const chunks = VietNormalizer.chunkText(normalizedText, 200); // chunk size
    store.updateJob(initialJob.id, { chunksTotal: chunks.length, chunksCompleted: 0 });
    
    const audioBlobs: Blob[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      // Check for pause/cancel
      const currentJobState = useAppStore.getState().queue.find(j => j.id === initialJob.id);
      if (!currentJobState) break;
      if (currentJobState.status === 'canceled') {
        this.activeJobs.delete(initialJob.id);
        return;
      }
      while (useAppStore.getState().queue.find(j => j.id === initialJob.id)?.status === 'paused') {
        await new Promise(r => setTimeout(r, 1000));
      }

      // Simulate TTS API Call
      const blob = await this.mockTTSCall(chunks[i], currentJobState);
      audioBlobs.push(blob);
      
      const progress = Math.round(((i + 1) / chunks.length) * 100);
      const eta = (chunks.length - (i + 1)) * 2; // fake ETA 2s per chunk
      
      store.updateJob(initialJob.id, { 
        chunksCompleted: i + 1, 
        progress, 
        eta 
      });
    }

    // 3. Merge Audio (simplified, just take the last blob or pretend it's merged)
    // In reality, merging WAV/MP3 blobs requires an AudioContext or ffmpeg.wasm
    // We will just create a blob from the first chunk for mock purposes or concatenate.
    const mergedBlob = new Blob(audioBlobs, { type: initialJob.settings.format === 'wav' ? 'audio/wav' : 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(mergedBlob);
    
    store.updateJob(initialJob.id, { 
      status: 'completed', 
      progress: 100, 
      eta: 0, 
      audioUrl,
      audioBlob: mergedBlob,
      completedAt: Date.now()
    });

    // 4. Save to History
    const historyItem: HistoryItem = {
      id: uuidv4(),
      title: initialJob.title || 'Bản thu chưa đặt tên',
      textSnippet: initialJob.text.substring(0, 50) + '...',
      voiceId: initialJob.voiceId,
      createdAt: Date.now(),
      duration: chunks.length * 5, // mock duration
      format: initialJob.settings.format,
      audioBlob: mergedBlob
    };
    await db.addHistory(historyItem);
    store.loadHistory();
    
    this.activeJobs.delete(initialJob.id);
  }

  private async mockTTSCall(text: string, job: RenderJob): Promise<Blob> {
    // Call our Express Backend API instead of a fake delay
    const store = useAppStore.getState();
    const voice = store.voices.find(v => v.id === job.voiceId);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: job.voiceId,
          settings: {
             ...job.settings,
             elevenLabsVoiceId: voice?.elevenLabsVoiceId,
             elevenLabsApiKey: store.settings.elevenLabsApiKey,
             openSourceEngineUrl: store.settings.openSourceEngineUrl,
             hfToken: store.settings.hfToken
          }
        })
      });
      if (!response.ok) {
         const errText = await response.text();
         throw new Error(errText || 'API Error');
      }
      return await response.blob();
    } catch (e: any) {
      throw new Error(e.message || 'Lỗi tạo âm thanh');
    }
  }
}

export const orchestrator = new TTSOrchestrator();
