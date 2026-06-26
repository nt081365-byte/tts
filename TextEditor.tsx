import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../store/useAppStore';
import mammoth from 'mammoth';
import { FileText, Type, UploadCloud } from 'lucide-react';

export function TextEditor() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const { addJob } = useAppStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!title) {
      setTitle(file.name.split('.')[0]);
    }

    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setText(result.value);
    } else {
      const text = await file.text();
      setText(text);
    }
  }, [title]);

  const dropzoneOptions: any = { 
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/vtt': ['.vtt'],
      'text/srt': ['.srt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  const handleRender = useCallback(() => {
    if (!text.trim()) return;
    addJob(text, title || 'Bản thu chưa đặt tên');
    setText('');
    setTitle('');
  }, [text, title, addJob]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleRender();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRender]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <input 
          type="text" 
          placeholder="Tên dự án (không bắt buộc)" 
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100 font-medium"
        />
        <div {...getRootProps()} className="cursor-pointer">
          <input {...getInputProps()} />
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
            <UploadCloud className="w-4 h-4" />
            Tải tệp lên
          </button>
        </div>
      </div>

      <div className={`flex-1 relative rounded-xl border-2 transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 focus-within:border-blue-400'
      }`}>
        <textarea 
          placeholder="Nhập, dán văn bản hoặc kéo thả tệp vào đây (TXT, DOCX, SRT, VTT)..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.ctrlKey && e.key === 'Enter') {
              e.preventDefault();
              handleRender();
            }
          }}
          className="w-full h-full p-4 bg-transparent outline-none resize-none text-gray-800 dark:text-gray-200 custom-scrollbar"
        />
        {isDragActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl">
            <div className="flex flex-col items-center text-blue-500 font-medium">
              <FileText className="w-10 h-10 mb-2 animate-bounce" />
              Thả tệp vào đây để trích xuất văn bản
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Type className="w-4 h-4" />
          {text.length.toLocaleString()} ký tự
        </div>
        <button 
          onClick={handleRender}
          disabled={!text.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-all active:scale-95"
        >
          Tạo âm thanh (Ctrl+Enter)
        </button>
      </div>
    </div>
  );
}
