import {MsEdgeTTS} from 'msedge-tts';
const tts = new MsEdgeTTS();
tts.getVoices().then(v => console.log(v.filter(x => x.Locale === 'vi-VN'))).catch(e => console.error(e));
