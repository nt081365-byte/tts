import { TextFilterRule } from '../types';

export const defaultSystemRules: TextFilterRule[] = [
  { id: 'sys_url', name: 'Xóa URLs', pattern: 'https?:\\/\\/[^\\s]+', replacement: '', enabled: true, isSystem: true },
  { id: 'sys_email', name: 'Xóa Emails', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', replacement: '', enabled: true, isSystem: true },
  { id: 'sys_ellipsis', name: 'Thay thế Dấu chấm lửng', pattern: '\\.{2,}', replacement: '.', enabled: true, isSystem: true },
  { id: 'sys_brackets', name: 'Xóa nội dung trong ngoặc', pattern: '\\([^)]*\\)|\\[[^\\]]*\\]|\\{[^}]*\\}', replacement: '', enabled: true, isSystem: true },
  { id: 'sys_etc', name: 'Thay thế v.v.', pattern: 'v\\.v\\.', replacement: 'vân vân', enabled: true, isSystem: true },
  { id: 'sys_emoji', name: 'Xóa Emojis', pattern: '[\\u2700-\\u27BF]|[\\uE000-\\uF8FF]|\\uD83C[\\uDC00-\\uDFFF]|\\uD83D[\\uDC00-\\uDFFF]|[\\u2011-\\u26FF]|\\uD83E[\\uDD10-\\uDDFF]', replacement: '', enabled: true, isSystem: true },
];

export class VietNormalizer {
  static normalize(text: string, rules: TextFilterRule[]): string {
    let normalizedText = text;

    // Apply rules
    for (const rule of rules) {
      if (rule.enabled) {
        try {
          const regex = new RegExp(rule.pattern, 'gu');
          normalizedText = normalizedText.replace(regex, rule.replacement);
        } catch (error) {
          console.error(`Invalid regex in rule ${rule.name}:`, error);
        }
      }
    }

    // Basic Vietnamese normalization
    // Collapse multiple spaces
    normalizedText = normalizedText.replace(/\s+/g, ' ');
    
    return normalizedText.trim();
  }

  // Split text into chunks for TTS processing (e.g. max 500 chars, split by punctuation)
  static chunkText(text: string, maxLength: number = 500): string[] {
    if (!text) return [];
    
    // Split by sentence terminators first
    const sentences = text.match(/[^.!?\\n]+[.!?\\n]+/g) || [text];
    
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        // If a single sentence is still too long, split by comma or spaces
        if (sentence.length > maxLength) {
          const subChunks = sentence.match(new RegExp(`.{1,${maxLength}}(\\s|$)`, 'g')) || [sentence];
          chunks.push(...subChunks.map(s => s.trim()));
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
