import React from 'react';
import { ModelConfig, DEFAULT_CONFIG } from '../types';
import { AVAILABLE_MODELS } from '../constants';
import { BrainIcon, GlobeIcon } from './Icons';

interface SettingsPanelProps {
  config: ModelConfig;
  setConfig: (config: ModelConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, setConfig, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <BrainIcon className="text-nebula-400" />
            Workspace Config
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            Close
          </button>
        </div>

        <div className="space-y-6">
          {/* Model Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setConfig({ ...config, modelId: model.id })}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                    config.modelId === model.id
                      ? 'bg-nebula-900/50 border-nebula-500 ring-1 ring-nebula-500'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="font-medium text-slate-200">{model.name}</div>
                  <div className="text-xs text-slate-400">{model.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Search Grounding Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <GlobeIcon className={`w-5 h-5 ${config.useSearch ? 'text-green-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-sm font-medium text-slate-200">Google Search</div>
                <div className="text-xs text-slate-400">Connect to real-time web info</div>
              </div>
            </div>
            <button
              onClick={() => setConfig({ ...config, useSearch: !config.useSearch })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.useSearch ? 'bg-green-500' : 'bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                config.useSearch ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Thinking Budget (Conditional on model support, but simplified for UI) */}
          {config.modelId.includes('gemini-2.5') && (
            <div>
               <label className="block text-sm font-medium text-slate-300 mb-2">
                 Thinking Budget (Tokens): {config.thinkingBudget}
               </label>
               <input 
                 type="range" 
                 min="0" 
                 max="8192" 
                 step="1024"
                 value={config.thinkingBudget}
                 onChange={(e) => setConfig({...config, thinkingBudget: parseInt(e.target.value)})}
                 className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-nebula-500"
               />
               <p className="text-xs text-slate-500 mt-1">
                 Increases reasoning time for complex queries. Set to 0 for speed.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;