import React, { useRef, useState } from 'react';
import { PaperclipIcon, SendIcon, StopIcon, ImageIcon } from './Icons';
import { Attachment } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onStop?: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading, onStop }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSend(text, attachments);
    setText('');
    setAttachments([]);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        const newAttachment: Attachment = {
          mimeType: file.type,
          data: base64String,
          name: file.name
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
    setText(target.value);
  };

  return (
    <div className="p-4 bg-slate-900 border-t border-slate-800/50">
      <div className="max-w-4xl mx-auto">
        
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex gap-3 mb-3 overflow-x-auto py-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group shrink-0">
                <div className="w-16 h-16 rounded-lg border border-slate-600 bg-slate-800 overflow-hidden flex items-center justify-center">
                  {att.mimeType.startsWith('image/') ? (
                    <img src={`data:${att.mimeType};base64,${att.data}`} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400">FILE</span>
                  )}
                </div>
                <button 
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-slate-800/50 border border-slate-700 rounded-xl p-2 focus-within:ring-2 focus-within:ring-nebula-500/50 transition-all">
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-nebula-400 hover:bg-slate-700/50 rounded-lg transition"
            title="Attach image"
          >
            <PaperclipIcon size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={autoResize}
            onKeyDown={handleKeyDown}
            placeholder="Ask Gemini anything..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 resize-none max-h-[200px] py-2 focus:outline-none"
            rows={1}
          />

          {isLoading ? (
            <button 
              onClick={onStop}
              className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
            >
              <StopIcon size={20} />
            </button>
          ) : (
            <button 
              onClick={handleSend}
              disabled={!text.trim() && attachments.length === 0}
              className="p-2 bg-nebula-600 text-white rounded-lg hover:bg-nebula-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-nebula-900/20"
            >
              <SendIcon size={20} />
            </button>
          )}
        </div>
        
        <div className="mt-2 text-center text-xs text-slate-500">
          Gemini may display inaccurate info, including about people, so double-check its responses.
        </div>
      </div>
    </div>
  );
};

export default InputArea;