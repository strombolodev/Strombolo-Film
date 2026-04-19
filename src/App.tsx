/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Clapperboard, 
  Copy, 
  Check, 
  RotateCcw, 
  ChevronRight,
  Database,
  Cpu,
  Globe,
  Film,
  Layers,
  LayoutGrid
} from "lucide-react";
import { generateCinematicPrompts, type PromptOutput } from "./lib/gemini";

const ENGINE_TOPICS = [
  "Normal",
  "Alur Cerita",
  "Iklan",
  "Action / High Octane",
  "Sci-Fi / Cyberpunk",
  "Fantasy / Magical",
  "Horror / Thriller",
  "Romantic / Ethereal",
  "Documentary / Realistic",
  "Noir / Moody",
  "Animation / Vibrant",
  "Steampunk / Industrial",
  "Post-Apocalyptic / Gritty"
];

const GEMINI_MODELS = [
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro (Recommended)" },
  { id: "gemini-2.0-flash-thinking-exp", name: "Gemini 2.0 Flash Thinking" },
  { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
  { id: "custom", name: "Custom Model / Provider" }
];

export default function App() {
  const [description, setDescription] = useState("");
  const [numScenes, setNumScenes] = useState(3);
  const [numSubjects, setNumSubjects] = useState(1);
  const [engineTopic, setEngineTopic] = useState(ENGINE_TOPICS[0]); // Normal
  const [selectedModel, setSelectedModel] = useState(GEMINI_MODELS[0].id);
  
  // Custom Model State
  const [customConfig, setCustomConfig] = useState(() => {
    const saved = localStorage.getItem('cineprompt_custom_config');
    return saved ? JSON.parse(saved) : { baseUrl: "", modelName: "", apiKey: "" };
  });

  const [enableLastFrame, setEnableLastFrame] = useState(false);
  const [plusOutfit, setPlusOutfit] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PromptOutput | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Record<number, boolean>>({});
  const [currentI2IIndex, setCurrentI2IIndex] = useState(0);
  const [currentI2VIndex, setCurrentI2VIndex] = useState(0);

  const saveCustomConfig = () => {
    localStorage.setItem('cineprompt_custom_config', JSON.stringify(customConfig));
    setError("Configuration Saved.");
    setTimeout(() => setError(null), 2000);
  };

  const toggleScene = (idx: number) => {
    setExpandedScenes(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    setIsLoading(true);
    setExpandedScenes({});
    setResult(null);
    setError(null);
    setCurrentI2IIndex(0);
    setCurrentI2VIndex(0);
    try {
      const data = await generateCinematicPrompts(
        description, 
        "Cinematic Sequence", 
        numScenes, 
        engineTopic, 
        numSubjects, 
        enableLastFrame, 
        plusOutfit, 
        selectedModel,
        selectedModel === 'custom' ? customConfig : undefined
      );
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate prompts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAll = (type: 'i2i' | 'i2v') => {
    if (!result) return;
    const allPrompts = result.scenes.map(s => 
      type === 'i2i' 
        ? `${s.image_to_image.first_frame_prompt}\n\n${s.image_to_image.last_frame_prompt}` 
        : s.image_to_video.full_prompt
    ).join('\n\n');
    copyToClipboard(allPrompts, `all-${type}`);
  };

  const copySequential = (type: 'i2i' | 'i2v') => {
    if (!result) return;
    const scenes = result.scenes;
    if (scenes.length === 0) return;

    if (type === 'i2i') {
      const scene = scenes[currentI2IIndex];
      const text = scene.image_to_image.last_frame_prompt 
        ? `${scene.image_to_image.first_frame_prompt}\n\n${scene.image_to_image.last_frame_prompt}`
        : scene.image_to_image.first_frame_prompt;
      
      copyToClipboard(text, `seq-i2i`);
      setCurrentI2IIndex((prev) => (prev + 1) % scenes.length);
    } else {
      const scene = scenes[currentI2VIndex];
      const text = scene.image_to_video.full_prompt;
      
      copyToClipboard(text, `seq-i2v`);
      setCurrentI2VIndex((prev) => (prev + 1) % scenes.length);
    }
  };

  const reset = () => {
    setResult(null);
    setDescription("");
    setNumScenes(3);
    setNumSubjects(1);
    setExpandedScenes({});
    setError(null);
    setCurrentI2IIndex(0);
    setCurrentI2VIndex(0);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-app-bg text-white">
      {/* Header Bar */}
      <header className="px-10 py-5 border-b border-app-border flex justify-between items-end shrink-0">
        <div className="font-black text-2xl tracking-tighter uppercase leading-none flex items-center gap-3">
          <Film className="w-6 h-6 text-app-accent" />
          <span>Cine<span className="text-app-accent">Prompt</span>.AI</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-[9px] bg-app-accent/10 text-app-accent px-3 py-1 rounded border border-app-accent/20 tracking-widest uppercase">
            {result ? `SESSION_ACTIVE: ${result.scenes.length} SCENES` : 'STANDBY_MODE'}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="sidebar-panel w-[380px] shrink-0 border-r border-app-border bg-app-surface overflow-y-auto">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-3 h-3 text-app-accent" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-app-text-dim">Input_Matrix</span>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-6">
            <div className="space-y-5">
              <div className="input-group">
                <label className="input-label">AI Agent Brainstorm Model</label>
                <div className="relative">
                  <select 
                    className="tech-input appearance-none bg-black pr-10"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {GEMINI_MODELS.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                  <Cpu className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-accent/50 pointer-events-none" />
                </div>
              </div>

              {selectedModel === 'custom' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="space-y-4 bg-app-accent/5 p-4 rounded-lg border border-app-accent/20 overflow-hidden mb-2"
                >
                  <div className="input-group">
                    <label className="input-label !text-app-accent">Base URL (OpenAI Compatible)</label>
                    <input 
                      type="text"
                      className="tech-input !border-app-accent/30"
                      placeholder="e.g. https://api.sumopod.com/v1"
                      value={customConfig.baseUrl}
                      onChange={(e) => setCustomConfig({...customConfig, baseUrl: e.target.value})}
                    />
                    <p className="text-[8px] text-app-accent/50 mt-1 uppercase tracking-tighter">Endpoint must support /chat/completions</p>
                  </div>
                  <div className="input-group">
                    <label className="input-label !text-app-accent">Model Name</label>
                    <input 
                      type="text"
                      className="tech-input !border-app-accent/30"
                      placeholder="e.g. gpt-4, claude-3, etc."
                      value={customConfig.modelName}
                      onChange={(e) => setCustomConfig({...customConfig, modelName: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label !text-app-accent">API Key</label>
                    <input 
                      type="password"
                      className="tech-input !border-app-accent/30"
                      placeholder="sk-..."
                      value={customConfig.apiKey}
                      onChange={(e) => setCustomConfig({...customConfig, apiKey: e.target.value})}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={saveCustomConfig}
                    className="w-full py-2 bg-app-accent/20 text-app-accent border border-app-accent/30 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-app-accent hover:text-black transition-all"
                  >
                    Save Configuration
                  </button>
                </motion.div>
              )}

              <div className="input-group">
                <label className="input-label">Story / Sequence Description</label>
                <textarea 
                  className="tech-input h-32 resize-none leading-relaxed"
                  placeholder="Define the narrative flow..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Number of Scenes</label>
                  <input 
                    type="number"
                    min="1"
                    className="tech-input"
                    value={numScenes}
                    onChange={(e) => setNumScenes(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Number of Subjects</label>
                  <select 
                    className="tech-input appearance-none bg-black"
                    value={numSubjects}
                    onChange={(e) => setNumSubjects(parseInt(e.target.value))}
                  >
                    {[1, 2, 3].map(n => (
                      <option key={n} value={n}>{n} Subject{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Engine Topic</label>
                <select 
                  className="tech-input appearance-none bg-black"
                  value={engineTopic}
                  onChange={(e) => setEngineTopic(e.target.value)}
                >
                  {ENGINE_TOPICS.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-red-500 text-[10px] font-bold uppercase animate-pulse">{error}</p>}

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 px-1 py-1 group cursor-pointer" onClick={() => setEnableLastFrame(!enableLastFrame)}>
                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${enableLastFrame ? 'bg-app-accent border-app-accent' : 'border-app-border'}`}>
                  {enableLastFrame && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-app-text-dim group-hover:text-white transition-colors">Generate Last Frame Continuity</span>
              </div>

              <div className="flex items-center gap-3 px-1 py-2 group cursor-pointer" onClick={() => setPlusOutfit(!plusOutfit)}>
                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${plusOutfit ? 'bg-app-accent border-app-accent' : 'border-app-border'}`}>
                  {plusOutfit && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-app-text-dim group-hover:text-white transition-colors">Plus Outfit</span>
                  <span className="text-[8px] text-app-text-dim/50 uppercase tracking-tighter">Fix outfit from reference vs dynamic creation</span>
                </div>
              </div>
            </div>

            <button 
              disabled={isLoading || !description}
              className="btn-primary flex items-center justify-center gap-3 py-5"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-black" />
                  <span className="text-black">Analyzing Script...</span>
                </>
              ) : (
                <>
                  <span className="text-black">Execute Scene Generation</span>
                  <ChevronRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>
        </aside>

        {/* Content Area */}
        <section className="flex-1 flex flex-col overflow-hidden bg-app-bg">
          <div className="p-10 pb-4 shrink-0 flex items-end justify-between border-b border-app-border bg-app-bg/80 backdrop-blur-md z-10">
            <div>
              {result && <span className="text-app-text-dim text-[10px] items-center gap-2 mt-4 tracking-widest font-bold uppercase">Sequence Alpha</span>}
            </div>

            {result && (
              <div className="flex gap-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => copySequential('i2i')} 
                    className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest border rounded transition-all flex flex-col items-center justify-center leading-none gap-1 ${copiedField === 'seq-i2i' ? 'bg-green-500 text-black border-green-500' : 'border-app-accent/30 text-app-accent hover:bg-app-accent hover:text-black hover:border-app-accent'}`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3 h-3" />
                      {copiedField === 'seq-i2i' ? `Scene ${((currentI2IIndex + result.scenes.length - 1) % result.scenes.length) + 1} Copied` : `Copy Per Scene I2I`}
                    </span>
                    <span className="text-[7px] opacity-60">
                      Next: Scene {currentI2IIndex + 1}
                    </span>
                  </button>
                  <button 
                    onClick={() => copyAll('i2i')} 
                    className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest border rounded transition-all flex items-center gap-2 ${copiedField === 'all-i2i' ? 'bg-green-500 text-black border-green-500' : 'border-app-accent/30 text-app-accent hover:bg-app-accent hover:text-black hover:border-app-accent'}`}
                  >
                    <Layers className="w-3 h-3" />
                    {copiedField === 'all-i2i' ? 'All I2I Copied' : 'Copy All I2I'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => copySequential('i2v')} 
                    className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest border rounded transition-all flex flex-col items-center justify-center leading-none gap-1 ${copiedField === 'seq-i2v' ? 'bg-green-500 text-black border-green-500' : 'border-app-accent/30 text-app-accent hover:bg-app-accent hover:text-black hover:border-app-accent'}`}
                  >
                    <span className="flex items-center gap-2">
                      <LayoutGrid className="w-3 h-3" />
                      {copiedField === 'seq-i2v' ? `Scene ${((currentI2VIndex + result.scenes.length - 1) % result.scenes.length) + 1} Copied` : `Copy Per Scene I2V`}
                    </span>
                    <span className="text-[7px] opacity-60">
                      Next: Scene {currentI2VIndex + 1}
                    </span>
                  </button>
                  <button 
                    onClick={() => copyAll('i2v')} 
                    className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest border rounded transition-all flex items-center gap-2 ${copiedField === 'all-i2v' ? 'bg-green-500 text-black border-green-500' : 'border-app-accent/30 text-app-accent hover:bg-app-accent hover:text-black hover:border-app-accent'}`}
                  >
                    <LayoutGrid className="w-3 h-3" />
                    {copiedField === 'all-i2v' ? 'All I2V Copied' : 'Copy All I2V'}
                  </button>
                </div>

                <button onClick={reset} className="px-4 py-2 text-[9px] font-black border border-white/10 text-white/40 hover:text-white uppercase tracking-widest transition-all rounded hover:bg-white/5 h-full">
                  Re-Initialize
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-4">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 0.1 }} 
                  className="h-full border border-dashed border-app-border rounded-xl flex flex-col items-center justify-center gap-6"
                >
                  <Clapperboard className="w-16 h-16" />
                  <span className="font-mono text-xs uppercase tracking-[1em] ml-[1em]">Engine Idle</span>
                </motion.div>
              ) : (
                <div className="space-y-4 pb-20">
                  {result.scenes.map((scene, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border border-app-border rounded-lg bg-app-surface/30 overflow-hidden"
                    >
                      {/* Accordion Header */}
                      <button 
                        onClick={() => toggleScene(idx)}
                        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black bg-app-accent text-black px-2 py-0.5 rounded leading-none">0{idx + 1}</span>
                          <h2 className="text-xl font-black uppercase tracking-tighter group-hover:text-app-accent transition-colors">{scene.scene}</h2>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-app-text-dim transition-transform duration-300 ${expandedScenes[idx] ? 'rotate-90' : ''}`} />
                      </button>

                      {/* Accordion Content */}
                      <AnimatePresence>
                        {expandedScenes[idx] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-app-border"
                          >
                            <div className="p-6 space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                {/* Image to Image Block */}
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold tracking-widest text-app-accent uppercase">I2I_Technical_Rig</span>
                                    <button 
                                      onClick={() => {
                                        const text = scene.image_to_image.last_frame_prompt 
                                          ? `[A] First Frame Prompt: ${scene.image_to_image.first_frame_prompt}\n\n[B] Last Frame Prompt: ${scene.image_to_image.last_frame_prompt}`
                                          : scene.image_to_image.first_frame_prompt;
                                        copyToClipboard(text, `i2i-${idx}`);
                                      }} 
                                      className="text-[9px] font-bold uppercase tracking-widest hover:text-app-accent flex items-center gap-1 transition-colors group"
                                    >
                                      {copiedField === `i2i-${idx}` ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />}
                                      {scene.image_to_image.last_frame_prompt ? 'Copy Both' : 'Copy Prompt'}
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] uppercase font-bold text-app-text-dim/60 ml-1">{scene.image_to_image.last_frame_prompt ? '[A] First Frame Prompt' : 'Static Frame Prompt'}</label>
                                      <div className="json-card !p-4">
                                        <div className="text-[11px] leading-relaxed text-app-text-dim/80">
                                          <div className="text-green-400 font-bold border-l border-white/10 pl-2">
                                            {scene.image_to_image.first_frame_prompt}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {scene.image_to_image.last_frame_prompt && (
                                      <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase font-bold text-app-text-dim/60 ml-1">[B] Last Frame Prompt</label>
                                        <div className="json-card !p-4">
                                          <div className="text-[11px] leading-relaxed text-app-text-dim/80">
                                            <div className="text-blue-400 font-bold border-l border-white/10 pl-2">
                                              {scene.image_to_image.last_frame_prompt}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Image to Video Block */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold tracking-widest text-app-accent uppercase">I2V_Motion_Vector</span>
                                    <button onClick={() => copyToClipboard(scene.image_to_video.full_prompt, `i2v-${idx}`)} className="text-[9px] font-bold uppercase tracking-widest hover:text-app-accent flex items-center gap-1 transition-colors group">
                                      {copiedField === `i2v-${idx}` ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />}
                                      Copy Prompt
                                    </button>
                                  </div>
                                  <div className="json-card !p-4">
                                     <div className="text-[11px] leading-relaxed text-app-text-dim/80">
                                      <div className="flex gap-2">
                                        <span className="text-orange-400 shrink-0">"movement":</span>
                                        <span className="text-green-500/80 italic">"{scene.image_to_video.camera_movement}"</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <span className="text-orange-400 shrink-0">"atmosphere":</span>
                                        <span className="text-green-500/80 italic">"{scene.image_to_video.atmosphere}"</span>
                                      </div>
                                      <div className="mt-2 text-green-400 font-bold border-l border-white/10 pl-2">
                                        {scene.image_to_video.full_prompt}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* ASMR Block */}
                              <div className="space-y-2 border-t border-white/5 pt-4">
                                <div className="flex items-center gap-2">
                                  <Database className="w-3 h-3 text-app-accent opacity-50" />
                                  <span className="text-[9px] font-bold tracking-widest text-app-text-dim uppercase">Spatial_ASMR_Data</span>
                                </div>
                                <div className="json-card !p-4 bg-app-accent/5">
                                  <div className="text-[11px] font-mono text-app-accent/80 italic leading-relaxed">
                                    {scene.asmr}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Footer Bar */}
      <footer className="h-12 border-t border-app-border shrink-0 px-10 flex items-center gap-10 text-[9px] uppercase font-bold tracking-widest text-app-text-dim bg-app-surface/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
          Neural Processor Online
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-3 h-3" />
          Model: {GEMINI_MODELS.find(m => m.id === selectedModel)?.name}
        </div>
        <div className="flex items-center gap-1.5">
          <Database className="w-3 h-3" />
          Topic: <span className="text-app-accent">{engineTopic}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 font-mono opacity-50">
          <Globe className="w-3 h-3" />
          LAT: 34.05 / LONG: -118.24
        </div>
      </footer>
    </div>
  );
}
