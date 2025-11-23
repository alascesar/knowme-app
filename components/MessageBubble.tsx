import React from 'react';
import { Message, Role } from '../types';
import { SparklesIcon } from './Icons';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  // Simple formatter to handle newlines and code blocks lightly without heavy deps
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-slate-700' : 'bg-nebula-600'
          }`}>
          {isUser ? (
            <span className="text-xs font-bold text-white">U</span>
          ) : (
            <SparklesIcon className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col gap-2 p-4 rounded-2xl shadow-sm ${
          isUser 
            ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
            : 'bg-slate-900/50 border border-slate-700 text-slate-200 rounded-tl-none'
        }`}>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {message.attachments.map((att, idx) => (
                <img 
                  key={idx}
                  src={`data:${att.mimeType};base64,${att.data}`}
                  alt="Attachment"
                  className="max-w-full h-auto max-h-64 rounded-lg border border-slate-600 object-cover"
                />
              ))}
            </div>
          )}

          {/* Text Content */}
          <div className="prose prose-invert prose-sm max-w-none leading-relaxed whitespace-pre-wrap">
             {/* Note: In a real production app, use react-markdown here. 
                 For this single-file output without package manager, we render raw text safely. */}
             {message.text}
          </div>

          {/* Grounding Sources */}
          {message.groundingChunks && message.groundingChunks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Sources</p>
              <div className="flex flex-wrap gap-2">
                {message.groundingChunks.map((chunk, idx) => {
                  if (chunk.web?.uri) {
                    return (
                      <a 
                        key={idx} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-nebula-400 bg-nebula-900/30 hover:bg-nebula-900/50 px-2 py-1 rounded border border-nebula-800 transition truncate max-w-[200px]"
                      >
                        {chunk.web.title || new URL(chunk.web.uri).hostname}
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;