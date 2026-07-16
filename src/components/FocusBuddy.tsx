import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Clock, 
  HelpCircle, 
  Music, 
  Zap, 
  CheckCircle2, 
  RotateCw,
  Sliders,
  Flame
} from "lucide-react";

interface FocusBuddyProps {
  onAddMinutes?: (mins: number) => void;
}

export const FocusBuddy: React.FC<FocusBuddyProps> = ({ onAddMinutes }) => {
  // Timer State
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);

  // Audio State
  const [soundType, setSoundType] = useState<"none" | "space" | "binaural" | "rain">("none");
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<{
    osc1?: OscillatorNode;
    osc2?: OscillatorNode;
    gainNode?: GainNode;
    noiseNode?: AudioWorkletNode | ScriptProcessorNode;
    filterNode?: BiquadFilterNode;
  }>({});
  const secondsAccumulatedRef = useRef<number>(0);
  const onAddMinutesRef = useRef(onAddMinutes);

  useEffect(() => {
    onAddMinutesRef.current = onAddMinutes;
  }, [onAddMinutes]);

  // Countdown clock effect
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            setTimerCompleted(true);
            playCompletionChime();
            if (onAddMinutesRef.current) {
              onAddMinutesRef.current(1);
            }
            secondsAccumulatedRef.current = 0;
            return 0;
          }
          secondsAccumulatedRef.current += 1;
          if (secondsAccumulatedRef.current >= 60) {
            if (onAddMinutesRef.current) {
              onAddMinutesRef.current(1);
            }
            secondsAccumulatedRef.current = 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Audio synth control effect
  useEffect(() => {
    if (isPlayingSound) {
      startSynth(soundType);
    } else {
      stopSynth();
    }
    return () => stopSynth();
  }, [isPlayingSound, soundType]);

  const handleSelectTime = (mins: number) => {
    setTimerActive(false);
    setTimerMinutes(mins);
    setTimeLeft(mins * 60);
    setTimerCompleted(false);
    secondsAccumulatedRef.current = 0;
  };

  const handleToggleTimer = () => {
    setTimerActive(!timerActive);
    setTimerCompleted(false);
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimeLeft(timerMinutes * 60);
    setTimerCompleted(false);
    secondsAccumulatedRef.current = 0;
  };

  const playCompletionChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45); // C6

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.log("AudioContext blocked or unsupported", e);
    }
  };

  const startSynth = (type: typeof soundType) => {
    try {
      stopSynth(); // clean previous

      if (type === "none") return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.12, ctx.currentTime);
      mainGain.connect(ctx.destination);
      soundNodesRef.current.gainNode = mainGain;

      if (type === "space") {
        // Deep Space Hum: 2 detuned low sine/triangle waves with slight modulation
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        
        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(72, ctx.currentTime); // low D
        
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(72.5, ctx.currentTime); // slightly detuned

        osc1.connect(mainGain);
        osc2.connect(mainGain);
        
        osc1.start();
        osc2.start();

        soundNodesRef.current.osc1 = osc1;
        soundNodesRef.current.osc2 = osc2;
      } 
      else if (type === "binaural") {
        // Binaural Focus Wave: Detuned sine waves in left/right channels
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        
        const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        oscL.type = "sine";
        oscL.frequency.setValueAtTime(100, ctx.currentTime); // carrier freq

        oscR.type = "sine";
        oscR.frequency.setValueAtTime(108, ctx.currentTime); // +8Hz delta for alpha wave focus

        if (pannerL && pannerR) {
          pannerL.pan.setValueAtTime(-1, ctx.currentTime);
          pannerR.pan.setValueAtTime(1, ctx.currentTime);
          oscL.connect(pannerL).connect(mainGain);
          oscR.connect(pannerR).connect(mainGain);
        } else {
          oscL.connect(mainGain);
          oscR.connect(mainGain);
        }

        oscL.start();
        oscR.start();

        soundNodesRef.current.osc1 = oscL;
        soundNodesRef.current.osc2 = oscR;
      }
      else if (type === "rain") {
        // Rain Simulator: Synthesized white-noise filtered down dynamically
        // Create noise buffer
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, ctx.currentTime); // muffles noise to sound like rain/wind
        filter.Q.setValueAtTime(1.2, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(mainGain);

        whiteNoise.start();

        // Keep reference of node to stop later
        soundNodesRef.current.filterNode = filter;
        // script processor reference stored inside osc1 ref slot
        soundNodesRef.current.osc1 = whiteNoise as any;
      }

    } catch (e) {
      console.error("Failed to start synthesizer soundscape:", e);
    }
  };

  const stopSynth = () => {
    try {
      if (soundNodesRef.current.osc1) {
        try { (soundNodesRef.current.osc1 as any).stop(); } catch(e){}
      }
      if (soundNodesRef.current.osc2) {
        try { (soundNodesRef.current.osc2 as any).stop(); } catch(e){}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch(e) {
      console.warn("Could not stop audio context", e);
    }
    soundNodesRef.current = {};
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleSound = (type: typeof soundType) => {
    if (soundType === type && isPlayingSound) {
      setIsPlayingSound(false);
      setSoundType("none");
    } else {
      setSoundType(type);
      setIsPlayingSound(true);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 space-y-4">
      
      {/* Title & Badge */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4.5 h-4.5 text-[#FF9900]" />
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">
              Focus Study Companion
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">
              Time your study sessions and isolate distractions with synth soundscapes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-widest font-mono">
          <Flame className="w-3 h-3 text-amber-500 fill-amber-100" />
          Focus Zone
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TIMER COLUMN */}
        <div className="space-y-3.5 bg-slate-50/50 p-4 rounded border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest">
              Study Countdown
            </span>
            <div className="flex gap-1.5">
              {[15, 25, 45].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleSelectTime(mins)}
                  className={`px-2 py-0.5 text-[9px] font-bold font-mono rounded border transition-colors cursor-pointer ${
                    timerMinutes === mins 
                      ? "bg-slate-900 text-white border-slate-900" 
                      : "bg-white text-slate-500 border-slate-150 hover:bg-slate-50"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div className="text-center py-2">
            <div className={`text-3xl font-black font-mono tracking-wider ${timerActive ? "text-slate-800" : "text-slate-400 animate-pulse"}`}>
              {formatTime(timeLeft)}
            </div>
            {timerCompleted ? (
              <div className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1 mt-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Session Finished! Take a quick 5 min break.
              </div>
            ) : timerActive ? (
              <div className="text-[9px] text-amber-600 font-black uppercase tracking-wider flex items-center justify-center gap-1 mt-1 animate-pulse">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-100" />
                Syncing with Daily Goal
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleToggleTimer}
              className={`flex-1 py-1.5 text-white text-[10px] font-black uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
                timerActive ? "bg-rose-600 hover:bg-rose-500" : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {timerActive ? "Pause Session" : "Start Focus Run"}
            </button>
            <button
              onClick={handleResetTimer}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-sm transition-all cursor-pointer"
              title="Reset Timer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AMBIENT AUDIO SYNTH COLUMN */}
        <div className="space-y-3 p-4 rounded bg-slate-50/50 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest flex items-center gap-1">
                <Music className="w-3 h-3 text-slate-400" />
                Offline Ambient Synth
              </span>
              {isPlayingSound && (
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 leading-normal mb-3">
              Web Audio oscillators isolate noisy real-world study environments without downloading external MP3 data.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => toggleSound("binaural")}
              className={`p-2.5 rounded-sm border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                soundType === "binaural" && isPlayingSound
                  ? "bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Zap className="w-3.5 h-3.5 mx-auto mb-1 text-[#FF9900]" />
              Alpha Wave
            </button>

            <button
              onClick={() => toggleSound("space")}
              className={`p-2.5 rounded-sm border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                soundType === "space" && isPlayingSound
                  ? "bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 mx-auto mb-1 text-[#FF9900]" />
              Deep Space
            </button>

            <button
              onClick={() => toggleSound("rain")}
              className={`p-2.5 rounded-sm border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                soundType === "rain" && isPlayingSound
                  ? "bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 mx-auto mb-1 text-[#FF9900]" />
              White Rain
            </button>
          </div>

          <div className="flex justify-end pt-1">
            {isPlayingSound ? (
              <button
                onClick={() => setIsPlayingSound(false)}
                className="text-[9px] font-bold text-rose-600 uppercase flex items-center gap-1 transition-all hover:scale-102 cursor-pointer"
              >
                <VolumeX className="w-3.5 h-3.5" />
                Mute Audio
              </button>
            ) : (
              <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">
                Select custom frequency profile
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
