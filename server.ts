import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import * as googleTTS from "google-tts-api";
import axios from "axios";
import FormData from "form-data";

import { Client } from "@gradio/client";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post("/api/clone-voice", async (req, res) => {
    const { name, base64Audio, apiKey, mimeType = 'audio/webm', fileName = 'sample.webm' } = req.body;
    try {
      if (!apiKey) throw new Error("Missing ElevenLabs API Key");
      
      const buffer = Buffer.from(base64Audio, 'base64');
      const formData = new FormData();
      formData.append('name', name);
      formData.append('files', buffer, { filename: fileName, contentType: mimeType });

      const response = await axios.post('https://api.elevenlabs.io/v1/voices/add', formData, {
        headers: {
          'xi-api-key': apiKey,
          ...formData.getHeaders()
        }
      });
      
      res.json({ voice_id: response.data.voice_id });
    } catch (e: any) {
      console.error("Clone error:", e.response?.data || e.message);
      const errDetails = e.response?.data ? JSON.stringify(e.response.data) : e.message;
      res.status(500).json({ error: "Failed to clone voice with ElevenLabs. Details: " + errDetails });
    }
  });

  app.post("/api/tts", async (req, res) => {
    const { text, voiceId, settings } = req.body;
    
    try {
      // ElevenLabs Handling
      if (settings?.elevenLabsVoiceId && settings?.elevenLabsApiKey) {
        const response = await axios.post(
          `https://api.elevenlabs.io/v1/text-to-speech/${settings.elevenLabsVoiceId}?output_format=mp3_44100_128`,
          {
            text: text || "Xin chào",
            model_id: "eleven_multilingual_v2"
          },
          {
            headers: {
              'xi-api-key': settings.elevenLabsApiKey,
              'Content-Type': 'application/json'
            },
            responseType: 'stream'
          }
        );
        res.set('Content-Type', 'audio/mpeg');
        response.data.pipe(res);
        return;
      }

      // Open Source Engine (Hugging Face / Gradio)
      if (settings?.openSourceEngineUrl && settings?.referenceAudioBase64) {
        try {
          const buffer = Buffer.from(settings.referenceAudioBase64, 'base64');
          const file = new File([buffer], 'audio.webm', { type: 'audio/webm' });
          
          let endpoint = settings.openSourceEngineUrl;
          if (endpoint === 'coqui/xtts') {
            endpoint = 'tonyassi/voice-clone';
          }
          
          const clientOptions = settings.hfToken ? { hf_token: settings.hfToken } : {};
          const appClient = await Client.connect(endpoint, clientOptions);
          
          // Different models have different endpoints. We'll try to support tonyassi/voice-clone
          let result: any;
          if (endpoint === 'tonyassi/voice-clone') {
             result = await appClient.predict("/clone", [
                text || "Xin chào",
                file
             ]);
          } else {
             // Fallback to older predict (for coqui/xtts format if they run locally)
             result = await appClient.predict("/predict", [
               text || "Xin chào",
               "vi", // language
               file, // ref audio
               null, // mic audio
               false, // cleanup
               false, // no lang detect
               true, // agree
             ]);
          }

          if (result && result.data && result.data[0] && result.data[0].url) {
             const audioRes = await axios({ url: result.data[0].url, responseType: 'stream' });
             res.set('Content-Type', 'audio/wav');
             audioRes.data.pipe(res);
             return;
          } else if (result && result.data && result.data[1] && result.data[1].url) {
             const audioRes = await axios({ url: result.data[1].url, responseType: 'stream' });
             res.set('Content-Type', 'audio/wav');
             audioRes.data.pipe(res);
             return;
          } else {
             throw new Error("Invalid Gradio response format or API Error: " + JSON.stringify(result));
          }
        } catch (e: any) {
          console.error("Open source clone error:", e);
          const errMsg = e?.message || String(e);
          if (errMsg.includes('quota') || errMsg.includes('ZeroGPU')) {
            res.status(500).send("Máy chủ AI cộng đồng đang quá tải (Hết quota ZeroGPU). Vui lòng thử lại sau ít phút hoặc dùng API Key.");
          } else {
            res.status(500).send("Lỗi kết nối máy chủ AI clone giọng: " + errMsg);
          }
          return;
        }
      }

      if (voiceId === "v5") {
         // Google Translate Voice
         const url = googleTTS.getAudioUrl(text || "Xin chào", {
           lang: "vi",
           slow: settings?.speed ? parseFloat(settings.speed) < 1 : false,
           host: "https://translate.google.com",
         });
         const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
         });
         res.set('Content-Type', 'audio/mpeg');
         response.data.pipe(res);
         return;
      }

      const tts = new MsEdgeTTS();
      
      let msVoice = "vi-VN-HoaiMyNeural";
      let baseRate = 0;
      let basePitch = 0;
      
      if (voiceId === "v2") {
         msVoice = "vi-VN-NamMinhNeural";
      } else if (voiceId === "v3") {
         msVoice = "en-US-AriaNeural"; 
      } else if (voiceId === "v4") {
         msVoice = "en-US-GuyNeural";
      } else if (voiceId.startsWith('v_custom_')) {
         // If a custom voice, check if settings are passed, otherwise fallback
         if (settings && settings.baseVoiceId) {
            if (settings.baseVoiceId === "v2") msVoice = "vi-VN-NamMinhNeural";
            else if (settings.baseVoiceId === "v3") msVoice = "en-US-AriaNeural";
            else if (settings.baseVoiceId === "v4") msVoice = "en-US-GuyNeural";
            else msVoice = "vi-VN-HoaiMyNeural";
         } else {
            msVoice = "vi-VN-HoaiMyNeural";
         }
         
         if (settings && settings.customPitch !== undefined) {
            basePitch = settings.customPitch;
         }
         if (settings && settings.customRate !== undefined) {
            baseRate = settings.customRate;
         }
      }

      let finalRate = baseRate;
      let finalPitch = basePitch;

      if (settings && settings.speed) {
         const speedVal = parseFloat(settings.speed);
         if (speedVal !== 1) {
            finalRate += Math.round((speedVal - 1) * 100);
         }
      }
      if (settings && settings.pitch) {
         const pitchVal = parseFloat(settings.pitch);
         if (pitchVal !== 1) {
            finalPitch += Math.round((pitchVal - 1) * 50);
         }
      }

      const rateStr = finalRate >= 0 ? `+${finalRate}%` : `${finalRate}%`;
      const pitchStr = finalPitch >= 0 ? `+${finalPitch}%` : `${finalPitch}%`;

      const format = settings?.format === 'wav' ? OUTPUT_FORMAT.RIFF_24KHZ_16BIT_MONO_PCM : OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3;

      await tts.setMetadata(msVoice, format);
      const { audioStream } = await tts.toStream(text || "Xin chào", { rate: rateStr, pitch: pitchStr });
      
      res.set('Content-Type', settings?.format === 'wav' ? 'audio/wav' : 'audio/mpeg');
      audioStream.pipe(res);
    } catch (e) {
      console.error(e);
      res.status(500).send("Error generating TTS");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
