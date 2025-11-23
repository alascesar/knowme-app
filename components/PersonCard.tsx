import React from 'react';
import { MapPin, Sparkles, MessageCircle, Clock } from 'lucide-react';

export interface Person {
  id: string;
  name: string;
  photoUrl: string;
  context: string;
  timestamp: string | number;
  aiMemoryHook?: {
    mnemonic: string;
    conversationStarters: string[];
  };
}

interface PersonCardProps {
  person: Person;
  onClick: () => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({ person, onClick }) => {
  const date = new Date(person.timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div 
      onClick={onClick}
      className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 cursor-pointer hover:border-brand-500 transition-all active:scale-[0.99]"
    >
      <div className="relative h-48 w-full">
        <img 
          src={person.photoUrl} 
          alt={person.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-xl font-bold text-white truncate">{person.name}</h3>
          <div className="flex items-center text-slate-300 text-sm mt-1">
            <MapPin size={14} className="mr-1 text-brand-500" />
            <span className="truncate">{person.context}</span>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {person.aiMemoryHook && (
          <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
             <div className="flex items-start gap-2">
                <Sparkles size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-slate-200 text-sm italic">"{person.aiMemoryHook.mnemonic}"</p>
             </div>
          </div>
        )}
        
        <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
           <div className="flex items-center">
             <Clock size={12} className="mr-1" />
             {date}
           </div>
           {person.aiMemoryHook && (
              <div className="flex items-center text-brand-400">
                <MessageCircle size={12} className="mr-1" />
                {person.aiMemoryHook.conversationStarters.length} tips
              </div>
           )}
        </div>
      </div>
    </div>
  );
};