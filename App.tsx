
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Language, VoiceOption, TTSRequest, AudioHistoryItem, UserTier, Emotion, UserState } from './types';
import { VOICE_OPTIONS, MAX_TEXT_LENGTH, PLANS } from './constants';
import { ttsService } from './services/geminiTTS';
import { audioBufferToWav } from './utils/audioUtils';

const Modal: React.FC<{ title: string; isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div className="p-10 overflow-y-auto text-slate-300 space-y-6 custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // User State - Free Characters: 12,000
  const [user, setUser] = useState<UserState>({
    tier: 'free',
    charactersRemaining: 12000,
    referralCount: 0,
    referralCode: 'VOX-' + Math.random().toString(36).substr(2, 6).toUpperCase()
  });

  const [text, setText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [pitch, setPitch] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [emotion, setEmotion] = useState<Emotion>(Emotion.NONE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AudioHistoryItem[]>([]);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  
  const [activeModal, setActiveModal] = useState<'about' | 'privacy' | 'terms' | 'pricing' | 'referral' | 'feedback' | 'login' | 'signup' | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const filteredVoices = VOICE_OPTIONS.filter(v => v.language === selectedLanguage);

  useEffect(() => {
    const defaultVoice = filteredVoices.find(v => isVoiceAccessible(v));
    if (defaultVoice) setSelectedVoiceId(defaultVoice.id);
  }, [selectedLanguage, user.tier]);

  const isVoiceAccessible = (voice: VoiceOption) => {
    if (user.tier === 'pro') return true;
    if (user.tier === 'elite') return voice.tier === 'free' || voice.tier === 'starter' || voice.tier === 'elite';
    if (user.tier === 'starter') return voice.tier === 'free' || voice.tier === 'starter';
    return voice.tier === 'free';
  };

  const playAudio = useCallback(async (url: string, playerRef: React.RefObject<HTMLAudioElement | null>) => {
    if (!playerRef.current) return;
    playerRef.current.src = url;
    playerRef.current.load();
    try { await playerRef.current.play(); } catch (e) {}
  }, []);

  const handlePreview = async (voice: VoiceOption) => {
    setPreviewingId(voice.id);
    setError(null);
    const previewTxt = voice.previewText || "Sample Voice Preview";
    try {
      const buffer = await ttsService.generateSpeech({ text: previewTxt, voiceId: voice.id, pitch: 0, speed: 1 });
      const url = URL.createObjectURL(audioBufferToWav(buffer));
      await playAudio(url, previewAudioRef);
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setPreviewingId(null); 
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    if (text.length > MAX_TEXT_LENGTH) {
      setError(`Character count per speech exceeds the ${MAX_TEXT_LENGTH} limit.`);
      return;
    }
    if (text.length > user.charactersRemaining) {
      setError("Insufficient total character balance. Upgrade your plan.");
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    try {
      const buffer = await ttsService.generateSpeech({ 
        text, 
        voiceId: selectedVoiceId, 
        pitch, 
        speed,
        emotion: user.tier === 'pro' ? emotion : undefined
      });
      const url = URL.createObjectURL(audioBufferToWav(buffer));
      setCurrentAudioUrl(url);
      
      setUser(prev => ({ ...prev, charactersRemaining: prev.charactersRemaining - text.length }));
      
      const voice = VOICE_OPTIONS.find(v => v.id === selectedVoiceId);
      setHistory(prev => [{
        id: Date.now().toString(),
        text: text.substr(0, 40) + '...',
        voiceName: voice?.name || 'Unknown',
        timestamp: new Date(),
        audioBlobUrl: url
      }, ...prev]);
      
      await playAudio(url, audioRef);
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(`Join VoxNova with code ${user.referralCode} for 500 bonus chars!`);
    alert("Referral code copied!");
  };

  const submitUtr = () => {
    if (!utrNumber) {
      alert("Please enter the UTR number first.");
      return;
    }
    alert(`Payment verification for UTR ${utrNumber} submitted. Our team will verify and upgrade your account within 30 minutes.`);
    setUtrNumber('');
    setSelectedPlanId(null);
    setActiveModal(null);
  };

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#02040a] text-slate-100 overflow-hidden font-sans relative">
      <button 
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className="fixed top-6 right-6 z-[60] p-4 bg-slate-900 border border-slate-800 rounded-full hover:border-blue-500 transition-all shadow-2xl group"
      >
        <svg className={`w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-transform ${isDrawerOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>

      <div className={`fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 z-[55] transition-transform duration-500 transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'} shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col`}>
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-sm font-black text-blue-500 uppercase tracking-widest">Account Menu</h2>
          <button onClick={() => setIsDrawerOpen(false)} className="text-slate-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div className="flex-1 p-8 space-y-6 overflow-y-auto">
          <div className="space-y-3">
             <button onClick={() => { setIsDrawerOpen(false); setActiveModal('login'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 hover:bg-blue-600/10 hover:text-blue-400 transition-all text-xs font-bold uppercase tracking-widest border border-transparent hover:border-blue-500/20">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
               Login
             </button>
             <button onClick={() => { setIsDrawerOpen(false); setActiveModal('signup'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 hover:bg-emerald-600/10 hover:text-emerald-400 transition-all text-xs font-bold uppercase tracking-widest border border-transparent hover:border-emerald-500/20">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
               Sign Up
             </button>
          </div>
          <div className="h-px bg-slate-800"></div>
          <button onClick={() => { setIsDrawerOpen(false); setActiveModal('referral'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-indigo-600/5 hover:bg-indigo-600/20 hover:text-indigo-400 transition-all text-xs font-black uppercase tracking-widest border border-indigo-500/10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Affiliate Link
          </button>
          <button onClick={() => { setIsDrawerOpen(false); setActiveModal('feedback'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 hover:bg-blue-600/10 hover:text-blue-400 transition-all text-xs font-bold uppercase tracking-widest border border-transparent hover:border-blue-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Send Feedback
          </button>
        </div>
        <div className="p-8 border-t border-slate-800 bg-slate-900/30">
          <p className="text-[10px] text-slate-500 font-bold uppercase text-center">VoxNova v2.5 Stable</p>
        </div>
      </div>

      <aside className="w-full md:w-80 bg-slate-900/40 border-r border-slate-800 flex flex-col z-20">
        <div className="p-8 border-b border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-[10px] font-black tracking-widest text-blue-500 uppercase">Dashboard</h2>
            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${user.tier === 'free' ? 'bg-slate-700' : 'bg-blue-600'}`}>
              {user.tier}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span>Characters</span>
              <span>{user.charactersRemaining.toLocaleString()}</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (user.charactersRemaining / 70000) * 100)}%` }}></div>
            </div>
          </div>
          <button onClick={() => { setSelectedPlanId(null); setActiveModal('pricing'); }} className="w-full py-2 bg-blue-600/10 border border-blue-500/30 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-500 hover:text-white transition-all">Upgrade Plan</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Synthesis History</p>
          {history.length === 0 ? (
            <div className="text-[9px] text-slate-700 text-center pt-10 uppercase font-black tracking-tighter italic">Void Buffer</div>
          ) : (
            history.map(item => (
              <div key={item.id} onClick={() => playAudio(item.audioBlobUrl, audioRef)} className="p-4 rounded-2xl bg-slate-800/20 border border-slate-800/50 hover:border-blue-500/50 cursor-pointer group transition-all">
                <p className="text-[10px] text-slate-300 truncate font-bold">{item.text}</p>
                <div className="flex justify-between text-[8px] mt-2 text-slate-500 font-bold uppercase">
                  <span>{item.voiceName}</span>
                  <span>{item.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col p-8 md:p-16 space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-blue-500 bg-clip-text text-transparent">VOXNOVA</h1>
            <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.5em]">High-Fidelity Studio Layers</p>
          </div>
        </header>

        <section className="space-y-6">
          <div className="relative group shadow-2xl rounded-[3rem] overflow-hidden border border-slate-800">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to articulate (Max 2500 per speech)..."
              className="w-full h-64 p-10 bg-slate-900/40 outline-none resize-none text-2xl placeholder-slate-800 font-medium"
              maxLength={MAX_TEXT_LENGTH}
            />
            <div className="absolute bottom-6 right-10 text-[10px] font-black text-slate-700 uppercase tracking-widest">
              {text.length} / {MAX_TEXT_LENGTH}
            </div>
          </div>
          {error && (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div className="flex-1">
                  <p>{error}</p>
                  {error.includes("limit") && <p className="mt-1 text-[10px] opacity-60">Try again in 60 seconds.</p>}
                </div>
                <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded-lg transition-colors">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg>
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-slate-800 space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Dialect Select</label>
              <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value as Language)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-bold outline-none cursor-pointer focus:border-blue-500">
                {Object.entries(Language).map(([k, v]) => <option key={v} value={v}>{k}</option>)}
              </select>
            </div>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Neural Voices</label>
              <div className="grid gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {filteredVoices.map(v => (
                  <div key={v.id} onClick={() => setSelectedVoiceId(v.id)} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedVoiceId === v.id ? 'bg-blue-600 border-blue-400' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'}`}>
                    <div className="flex-1">
                      <div className="text-[10px] font-black uppercase tracking-tight">{v.name}</div>
                      {!isVoiceAccessible(v) && <div className="text-[7px] font-black text-amber-500 uppercase tracking-tighter mt-1 flex items-center gap-1">
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                        {v.tier}
                      </div>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handlePreview(v); }} className="p-2 bg-slate-800 rounded-full hover:text-blue-400 transition-colors">
                      {previewingId === v.id ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/40 p-12 rounded-[4rem] border border-slate-800 flex flex-col justify-between shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-6">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase">
                    <span>Speed</span>
                    <span className="text-blue-500">{speed}x</span>
                  </div>
                  <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full h-1 bg-slate-800 accent-blue-600 appearance-none rounded-full cursor-pointer" />
               </div>
               <div className="space-y-6">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase">
                    <span>Pitch</span>
                    <span className="text-blue-500">{pitch}</span>
                  </div>
                  <input type="range" min="-10" max="10" step="1" value={pitch} onChange={e => setPitch(parseInt(e.target.value))} className="w-full h-1 bg-slate-800 accent-blue-600 appearance-none rounded-full cursor-pointer" />
               </div>
               <div className="col-span-full space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase">
                    <span>Emotion Modulation</span>
                    {user.tier !== 'pro' && <span className="text-amber-500 text-[8px] flex items-center gap-1"><svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" /></svg>PRO EXCLUSIVE</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(Emotion).map(e => (
                      <button 
                        key={e} 
                        disabled={user.tier !== 'pro'} 
                        onClick={() => setEmotion(e)}
                        className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase transition-all shadow-lg ${emotion === e ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700 disabled:opacity-20'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 pt-10 mt-10 border-t border-slate-800">
              <button onClick={handleGenerate} disabled={isGenerating || !text} className="px-14 py-6 bg-blue-600 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-2xl shadow-blue-500/30">
                {isGenerating ? "Processing Studio Audio..." : "Start Studio Synthesis"}
              </button>
              {currentAudioUrl && (
                <div className="flex-1 flex items-center gap-4 bg-black/40 p-3 rounded-[2rem] border border-slate-800 shadow-inner">
                   <audio ref={audioRef} src={currentAudioUrl} controls className="flex-1 h-8 invert opacity-30" />
                   <a href={currentAudioUrl} download="voxnova_export.wav" className="p-4 bg-slate-800 rounded-2xl hover:text-blue-400 transition-colors shadow-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></a>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="pt-20 pb-10 flex flex-col items-center gap-6 opacity-30 border-t border-slate-800">
           <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.4em]">
              <button onClick={() => setActiveModal('privacy')} className="hover:text-white transition-colors">Privacy</button>
              <button onClick={() => setActiveModal('terms')} className="hover:text-white transition-colors">Usage Terms</button>
              <button onClick={() => setActiveModal('about')} className="hover:text-white transition-colors">The Vision</button>
           </div>
           <p className="text-[9px] font-black tracking-widest uppercase">VOXNOVA &copy; 2024. ALL RIGHTS RESERVED.</p>
        </footer>
      </main>

      <audio ref={previewAudioRef} hidden />

      <Modal title="Access Core" isOpen={activeModal === 'login'} onClose={() => setActiveModal(null)}>
        <div className="space-y-6">
          <input type="email" placeholder="Email Address" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-bold focus:border-blue-500 outline-none" />
          <input type="password" placeholder="Key Phrase" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-bold focus:border-blue-500 outline-none" />
          <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-xl">Identify</button>
        </div>
      </Modal>

      <Modal title="Register Unit" isOpen={activeModal === 'signup'} onClose={() => setActiveModal(null)}>
        <div className="space-y-6">
          <input type="text" placeholder="Identity Name" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-bold focus:border-blue-500 outline-none" />
          <input type="email" placeholder="Email Contact" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-bold focus:border-blue-500 outline-none" />
          <input type="password" placeholder="Set Key Phrase" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-bold focus:border-blue-500 outline-none" />
          <button onClick={() => { setActiveModal(null); setUser(prev => ({...prev, charactersRemaining: prev.charactersRemaining + 500})); }} className="w-full py-4 bg-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-colors shadow-xl">Initialize</button>
          <p className="text-[9px] text-slate-500 text-center uppercase font-bold tracking-widest">Initial Credit: 12,000 Chars + 500 Bonus</p>
        </div>
      </Modal>

      <Modal title="User Intelligence Report" isOpen={activeModal === 'feedback'} onClose={() => setActiveModal(null)}>
        <div className="space-y-6">
          <p className="text-xs text-slate-400 font-medium">Your feedback optimizes our neural layers.</p>
          <textarea 
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Report anomaly or suggest enhancements..." 
            className="w-full h-40 bg-slate-950 border border-slate-800 p-6 rounded-2xl text-xs font-bold focus:border-blue-500 outline-none resize-none"
          />
          <button onClick={() => { alert("Report logged. Thank you."); setFeedbackText(''); setActiveModal(null); }} className="w-full py-4 bg-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-colors">Transmit Report</button>
        </div>
      </Modal>

      <Modal title={selectedPlanId ? `Checkout: ${selectedPlan?.name}` : "Subscription Protocols"} isOpen={activeModal === 'pricing'} onClose={() => setActiveModal(null)}>
        {!selectedPlanId ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.id} className={`p-8 rounded-[2.5rem] border-2 flex flex-col justify-between transition-all ${user.tier === p.id ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}`}>
                 <div>
                   <h3 className="text-sm font-black uppercase text-white tracking-widest">{p.name}</h3>
                   <div className="text-3xl font-black mt-3">₹{p.price} <span className="text-[10px] opacity-40 uppercase">Credit / Mo</span></div>
                   <ul className="mt-8 space-y-4">
                     <li className="text-[10px] font-bold text-slate-400 flex items-center gap-3"><svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3"/></svg>{p.chars.toLocaleString()} Chars</li>
                     {p.features.map(f => (
                       <li key={f} className="text-[10px] font-bold text-slate-400 flex items-center gap-3"><svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3"/></svg>{f}</li>
                     ))}
                   </ul>
                 </div>
                 <button 
                  onClick={() => setSelectedPlanId(p.id)}
                  className="mt-10 w-full py-4 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-xl"
                 >
                   Select Plan
                 </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-950/60 p-10 rounded-[3rem] border border-slate-800 space-y-8 shadow-inner animate-in fade-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-4">
               <button onClick={() => setSelectedPlanId(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                 Back to Plans
               </button>
               <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Payment Step</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col items-center justify-center space-y-4">
                   <div className="w-48 h-48 bg-white p-4 rounded-3xl flex items-center justify-center shadow-2xl relative">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=8052803520@ybl&pn=VoxNova&am=${selectedPlan?.price}&cu=INR`} alt="UPI QR" className="w-full" />
                   </div>
                   <div className="text-center space-y-1">
                     <p className="text-[10px] font-black text-slate-300 uppercase">Amount: ₹{selectedPlan?.price}</p>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">UPI: 8052803520@ybl</p>
                   </div>
                </div>
                
                <div className="space-y-6 flex flex-col justify-center">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Verification System</label>
                      <input 
                        type="text" 
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="Enter 12-digit UTR Number" 
                        className="w-full bg-black/40 border border-slate-800 p-5 rounded-2xl text-xs font-bold text-blue-400 placeholder-slate-700 outline-none focus:border-blue-500 shadow-inner" 
                      />
                   </div>
                   <button 
                     onClick={submitUtr}
                     className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:shadow-2xl hover:shadow-blue-500/30 transition-all active:scale-95"
                   >
                     Confirm Transaction
                   </button>
                   <p className="text-[8px] text-slate-600 font-bold uppercase leading-relaxed text-center italic">Submit the UTR / Ref ID found in your bank statement after payment.</p>
                </div>
             </div>
          </div>
        )}
      </Modal>

      <Modal title="Growth Protocol (Affiliate)" isOpen={activeModal === 'referral'} onClose={() => setActiveModal(null)}>
        <div className="bg-indigo-600/10 border border-indigo-500/20 p-10 rounded-[3rem] text-center space-y-8 shadow-2xl">
           <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-indigo-500/10">
             <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
           </div>
           <div className="space-y-3">
             <h3 className="text-2xl font-black text-white uppercase tracking-tight">Expand the Neural Network</h3>
             <p className="text-xs text-slate-400 leading-relaxed font-medium">Your link grants <span className="text-indigo-400 font-bold tracking-widest">+1,000 Chars</span> to your unit and <span className="text-emerald-400 font-bold tracking-widest">+500 Chars</span> to new signups.</p>
           </div>
           <div className="p-5 bg-black/40 rounded-2xl flex items-center justify-between border border-slate-800 group transition-all hover:border-indigo-500/30">
              <span className="text-xs font-black text-indigo-500 tracking-[0.4em] ml-2 uppercase">{user.referralCode}</span>
              <button onClick={copyReferral} className="px-6 py-2.5 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg active:scale-95">Copy Link</button>
           </div>
           <div className="flex justify-between items-center px-4 pt-4 border-t border-slate-800">
             <p className="text-[10px] font-black text-slate-600 uppercase">Successful Links</p>
             <p className="text-lg font-black text-white">{user.referralCount}</p>
           </div>
        </div>
      </Modal>

      <Modal title="Privacy Core" isOpen={activeModal === 'privacy'} onClose={() => setActiveModal(null)}>
        <p className="leading-relaxed">VoxNova operates under a Zero-Permanence protocol. Your articulation inputs are processed in volatile memory and purged immediately. User records are encrypted using SHA-256 and stored solely for subscription management. No third-party data extraction occurs within our neural layers.</p>
      </Modal>

      <Modal title="Usage Accord" isOpen={activeModal === 'terms'} onClose={() => setActiveModal(null)}>
        <p className="leading-relaxed">Subscription tiers are non-transferable. Character balances reset monthly unless explicitly banked. UTR submissions for payment verification are cross-checked against UPI logs. Misuse of synthesis for malicious impersonation or hate speech will result in immediate identity termination without refund. Maximum limit per speech is 2500 characters.</p>
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        input[type=range] {
          -webkit-appearance: none;
          background: #1e293b;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 3px solid #0f172a;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          transition: transform 0.2s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default App;
