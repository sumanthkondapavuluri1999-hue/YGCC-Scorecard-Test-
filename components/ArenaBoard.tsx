import React, { useMemo, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Picker, ThemeId } from '../types';
import { THEMES, MANUAL_LOGO_BASE64 } from '../constants';
import { ArrowLeft, Trophy, ArrowDownUp, Shuffle, ChevronDown, Repeat, Maximize, Minimize } from 'lucide-react';

interface ArenaBoardProps {
  data: Picker[];
  siteName: string;
  themeId: ThemeId;
  globalTarget: number;
  customLogo?: string;
  onBack: () => void;
}

type SortMode = 'desc' | 'asc' | 'random' | 'auto';

const ArenaBoard: React.FC<ArenaBoardProps> = ({ data, siteName, themeId, globalTarget, customLogo, onBack }) => {
  const theme = THEMES[themeId];
  const [sortMode, setSortMode] = useState<SortMode>('desc');
  // State to track the current phase of the auto loop
  const [autoPhase, setAutoPhase] = useState<'desc' | 'asc' | 'random'>('desc'); 
  const [randomSeed, setRandomSeed] = useState(0);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Close sort menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sortMenuRef]);

  // Handle Fullscreen toggle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Sync fullscreen state with browser events (e.g. user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto Loop Logic: Cycles every 40 seconds
  useEffect(() => {
    if (sortMode === 'auto') {
      // Reset to start of cycle when entering auto mode
      setAutoPhase('desc');
      
      const interval = setInterval(() => {
        setAutoPhase((prev) => {
          if (prev === 'desc') return 'asc';
          if (prev === 'asc') {
             // When switching to random, regenerate seed
             setRandomSeed(Date.now());
             return 'random';
          }
          return 'desc';
        });
      }, 40000); // 40 seconds

      return () => clearInterval(interval);
    }
  }, [sortMode]);

  // Determine the effective sort mode (Manual selection OR the current phase of Auto)
  const effectiveSortMode = sortMode === 'auto' ? autoPhase : sortMode;

  // Filter out empty entries (0 total)
  const filteredData = useMemo(() => {
    return data.filter(picker => picker.total > 0 && picker.name.trim() !== '');
  }, [data]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    const list = [...filteredData];
    
    // Use effectiveSortMode here
    if (effectiveSortMode === 'desc') {
        return list.sort((a, b) => b.total - a.total);
    } else if (effectiveSortMode === 'asc') {
        return list.sort((a, b) => a.total - b.total);
    } else {
        // Random (Fisher-Yates shuffle for true randomness)
        // We use randomSeed as a dependency to trigger re-shuffles
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
        return list;
    }
  }, [filteredData, effectiveSortMode, randomSeed]);

  // Progress Bar Calculations
  const totalSum = useMemo(() => filteredData.reduce((acc, p) => acc + p.total, 0), [filteredData]);
  const progressPercentage = Math.min(100, (totalSum / (globalTarget || 1)) * 100);

  // Helper for Heatmap Logic
  const getCellClass = (value: number, target: number) => {
    if (value === 0) return 'opacity-30';
    // Logic: Hourly target is roughly Target / 10
    const hourlyTarget = target / 10;
    
    if (value >= hourlyTarget) {
      return theme.styles.accent; // Good performance
    } else {
      return theme.styles.danger; // Needs improvement
    }
  };

  // Determine if total hit target
  const isTargetMet = (total: number, target: number) => total >= target;

  const handleRandomSort = () => {
    setSortMode('random');
    setRandomSeed(Date.now()); // Trigger re-shuffle
    setIsSortMenuOpen(false);
  };

  const handleSortSelect = (mode: SortMode) => {
    setSortMode(mode);
    setIsSortMenuOpen(false);
  };

  // --- Professional Theme Graphics Renderer ---
  const renderThemeGraphics = () => {
      switch(themeId) {
          case 'yg':
              // Priority: 1. UI Uploaded Logo (customLogo), 2. Manual Code Logo (MANUAL_LOGO_BASE64), 3. Default SVG
              const activeLogo = customLogo || MANUAL_LOGO_BASE64;

              return (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {/* Professional Industrial Caution Background - Updated to Orange */}
                      <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,#000,#000_40px,#FF6600_40px,#FF6600_80px)]"></div>
                      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-zinc-950 to-transparent"></div>
                      
                      {/* Moving Logo Loop - Updated Direction (Left to Right) and Size (1.5x) */}
                      <div className="absolute bottom-4 w-full z-10 opacity-90 overflow-hidden" style={{ height: '80px' }}>
                         <motion.div
                            className="flex items-center w-max"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100vw" }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                         >
                            {activeLogo ? (
                                <img src={activeLogo} alt="Team Logo" className="h-[75px] w-auto object-contain drop-shadow-lg" />
                            ) : (
                                <svg height="75" viewBox="0 0 400 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                                    {/* Orange Chevrons */}
                                    <path d="M20 15 L45 40 L20 65" stroke="#FF6600" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M50 15 L75 40 L50 65" stroke="#FF6600" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                                    
                                    {/* Text Group */}
                                    <g transform="translate(90, 0)">
                                    {/* Top Line */}
                                    <rect x="0" y="15" width="280" height="2" fill="#d4d4d8" />
                                    
                                    {/* Text */}
                                    <text x="140" y="52" fontFamily="sans-serif" fontSize="38" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="2">YOUNG GUNS</text>
                                    
                                    {/* Bottom Line */}
                                    <rect x="0" y="63" width="280" height="2" fill="#d4d4d8" />
                                    </g>
                                </svg>
                            )}
                         </motion.div>
                      </div>
                  </div>
              );
          case 'v8':
              return (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                       {/* Speed Streaks */}
                       <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(34,211,238,0.03)_50%,transparent_100%)]"></div>
                       
                       {/* Moving Asphalt Road Effect at Bottom */}
                       <div className="absolute bottom-0 left-0 w-full h-48 origin-bottom [transform:perspective(500px)_rotateX(60deg)] overflow-hidden z-10 opacity-60">
                          <div className="absolute inset-0 bg-zinc-900"></div>
                          {/* Moving Lane Markers */}
                          <motion.div 
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-[200%] bg-[repeating-linear-gradient(0deg,transparent,transparent_50px,#fff_50px,#fff_100px)]"
                            animate={{ translateY: ["0%", "50%"] }}
                            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                          ></motion.div>
                          <motion.div 
                            className="absolute top-0 left-1/4 -translate-x-1/2 w-2 h-[200%] bg-[repeating-linear-gradient(0deg,transparent,transparent_50px,rgba(255,255,255,0.2)_50px,rgba(255,255,255,0.2)_100px)]"
                            animate={{ translateY: ["0%", "50%"] }}
                            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                          ></motion.div>
                          <motion.div 
                            className="absolute top-0 right-1/4 translate-x-1/2 w-2 h-[200%] bg-[repeating-linear-gradient(0deg,transparent,transparent_50px,rgba(255,255,255,0.2)_50px,rgba(255,255,255,0.2)_100px)]"
                            animate={{ translateY: ["0%", "50%"] }}
                            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                          ></motion.div>
                       </div>
                       
                       {/* Vignette */}
                       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,#000_100%)]"></div>
                  </div>
              );
          case 'nrl':
              return (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden bg-green-950">
                      {/* Stadium Grass Pattern */}
                      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(0deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] bg-[size:100%_100px]"></div>
                      
                      {/* Stadium Lights Effect */}
                      <div className="absolute top-0 left-0 w-full h-full">
                         <motion.div 
                           className="absolute top-[-50%] left-[20%] w-32 h-[150%] bg-white/5 rotate-[20deg] blur-3xl origin-top"
                           animate={{ rotate: [15, 25, 15] }}
                           transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                         />
                         <motion.div 
                           className="absolute top-[-50%] right-[20%] w-32 h-[150%] bg-white/5 rotate-[-20deg] blur-3xl origin-top"
                           animate={{ rotate: [-15, -25, -15] }}
                           transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                         />
                      </div>

                      {/* Goal Posts - Static & Professional */}
                      <div className="absolute bottom-0 w-full flex justify-center items-end opacity-20">
                          <svg width="400" height="200" viewBox="0 0 200 100" className="opacity-50">
                              <path d="M60,100 L60,20 L140,20 L140,100" stroke="white" strokeWidth="4" fill="none" />
                              <path d="M60,50 L140,50" stroke="white" strokeWidth="2" />
                          </svg>
                      </div>
                  </div>
              );
          case 'arcade':
              return (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                       {/* Synthwave Sun */}
                       <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-t from-pink-500 to-yellow-500 blur-2xl opacity-20"></div>

                       {/* Moving 3D Grid Floor */}
                       <div className="absolute bottom-0 left-0 w-full h-[40vh] origin-bottom [transform:perspective(500px)_rotateX(60deg)] z-10">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.4)_2px,transparent_2px),linear-gradient(90deg,rgba(236,72,153,0.4)_2px,transparent_2px)] bg-[size:60px_60px] animate-[gridMove_2s_linear_infinite]" style={{ backgroundPosition: 'center bottom' }}></div>
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-950 to-transparent"></div>
                       </div>
                       
                       <style>{`
                         @keyframes gridMove {
                           from { background-position: 0 0; }
                           to { background-position: 0 60px; }
                         }
                       `}</style>
                  </div>
              );
          case 'cricket':
               return (
                   <div className="absolute inset-0 pointer-events-none bg-[#e8f5e9] opacity-10">
                       {/* Subtle Texture */}
                       <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23064e3b' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
                       
                       {/* Static Professional Composition at Bottom Right */}
                       <div className="absolute bottom-4 right-8 w-64 h-64 opacity-80 z-20">
                            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
                                {/* Stumps */}
                                <rect x="85" y="80" width="6" height="100" fill="#d4a373" stroke="#5c3d2e" strokeWidth="1"/>
                                <rect x="97" y="80" width="6" height="100" fill="#d4a373" stroke="#5c3d2e" strokeWidth="1"/>
                                <rect x="109" y="80" width="6" height="100" fill="#d4a373" stroke="#5c3d2e" strokeWidth="1"/>
                                {/* Bails */}
                                <rect x="85" y="78" width="12" height="3" fill="#d4a373" stroke="#5c3d2e" strokeWidth="1"/>
                                <rect x="103" y="78" width="12" height="3" fill="#d4a373" stroke="#5c3d2e" strokeWidth="1"/>
                                {/* Bat Leaning */}
                                <path d="M130 180 L160 50 L180 55 L150 185 Z" fill="#e6ccb2" stroke="#8d6e63" strokeWidth="2"/>
                                <path d="M160 50 L165 30 L185 35 L180 55 Z" fill="#3e2723"/> {/* Handle */}
                                {/* Ball */}
                                <circle cx="60" cy="170" r="10" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1"/>
                                <path d="M55 165 Q60 170 65 175" stroke="#fca5a5" strokeWidth="1" strokeDasharray="2 1"/>
                                <path d="M52 168 Q57 173 62 178" stroke="#fca5a5" strokeWidth="1" strokeDasharray="2 1"/>
                            </svg>
                       </div>
                       {/* Gradient fade at bottom */}
                       <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-emerald-900/10 to-transparent"></div>
                   </div>
               );
          default:
              return null;
      }
  };

  return (
    <div className={`min-h-screen w-full relative overflow-hidden ${theme.styles.background} ${theme.font} transition-colors duration-500`}>
      
      {/* Background Ambience & Graphics */}
      {renderThemeGraphics()}

      {/* Header */}
      <div className="relative z-30 p-6 flex flex-col md:flex-row justify-between items-end border-b-2 border-opacity-20 border-white mb-2 gap-4">
        {/* Fullscreen Toggle - Positioned Top Right Corner */}
        <button
            onClick={toggleFullScreen}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all backdrop-blur-sm z-50 border border-white/10 shadow-lg"
            title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
        >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>

        <div className="w-full md:w-auto text-left">
          {/* Site name is huge - textMain */}
          <h1 className={`text-4xl md:text-6xl font-black uppercase tracking-tight ${theme.styles.textMain} drop-shadow-2xl leading-none`}>
            {siteName}
          </h1>
          {/* Theme label is smaller */}
          <h2 className={`text-lg opacity-80 ${theme.styles.textMain} font-semibold mt-2 tracking-wide`}>
            {theme.label} Arena
          </h2>
        </div>

        {/* Global Progress Bar Section */}
        <div className="flex-1 w-full md:mx-12">
            <div className={`flex justify-between text-xs md:text-sm font-bold mb-2 opacity-90 ${theme.styles.textMain}`}>
                <span>Team Total: {totalSum.toLocaleString()}</span>
                <span>Goal: {globalTarget.toLocaleString()}</span>
            </div>
            <div className="w-full h-8 bg-black/40 rounded-full overflow-hidden border border-white/20 backdrop-blur-sm relative shadow-inner">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
                    className={`h-full shadow-[0_0_20px_rgba(255,255,255,0.4)] relative ${
                        themeId === 'yg' ? 'bg-gradient-to-r from-orange-600 to-orange-400' : // Changed to Orange
                        themeId === 'v8' ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' :
                        themeId === 'nrl' ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                        themeId === 'arcade' ? 'bg-gradient-to-r from-lime-600 to-lime-400' :
                        'bg-gradient-to-r from-emerald-600 to-emerald-400' // Cricket
                    }`}
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite] translate-x-[-100%]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)' }}></div>
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10">
                    {progressPercentage.toFixed(1)}%
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 shrink-0 items-center">
            {/* Sort Dropdown */}
            <div className="relative" ref={sortMenuRef}>
                <button 
                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl backdrop-blur-sm transition border border-white/10 font-bold shadow-lg"
                >
                    {sortMode === 'auto' ? (
                        <>
                            <Repeat size={20} className="animate-spin-slow" style={{ animationDuration: '3s' }} />
                            <span className="hidden md:inline text-sm">Auto Loop</span>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                        </>
                    ) : (
                        <>
                            <ArrowDownUp size={20} />
                            <span className="hidden md:inline text-sm">Sort</span>
                        </>
                    )}
                    
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                    {isSortMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-white text-gray-900 rounded-xl shadow-2xl overflow-hidden z-50 ring-1 ring-black/5"
                        >
                            <div className="p-1">
                                <button 
                                    onClick={() => handleSortSelect('desc')} 
                                    className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-50 text-sm font-bold flex justify-between items-center transition ${sortMode === 'desc' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                                >
                                    Top High (Desc)
                                    {sortMode === 'desc' && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                                </button>
                                <button 
                                    onClick={() => handleSortSelect('asc')} 
                                    className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-50 text-sm font-bold flex justify-between items-center transition ${sortMode === 'asc' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                                >
                                    Top Low (Asc)
                                    {sortMode === 'asc' && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                                </button>
                                <button 
                                    onClick={handleRandomSort} 
                                    className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-50 text-sm font-bold flex justify-between items-center transition ${sortMode === 'random' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                                >
                                     <span className="flex items-center gap-2">Random <Shuffle size={14} /></span>
                                     {sortMode === 'random' && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                                </button>
                                <div className="h-px bg-gray-200 my-1 mx-2"></div>
                                <button 
                                    onClick={() => handleSortSelect('auto')} 
                                    className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-50 text-sm font-bold flex justify-between items-center transition ${sortMode === 'auto' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                                >
                                     <span className="flex items-center gap-2">Auto Loop <Repeat size={14} /></span>
                                     {sortMode === 'auto' && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button 
                onClick={onBack}
                className="bg-white/10 hover:bg-white/20 text-white p-3.5 rounded-xl backdrop-blur-sm transition group border border-white/10 shadow-lg"
                title="Back to Admin"
            >
                <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={24} />
            </button>
        </div>
      </div>

      {/* Main Grid Container */}
      <div className="px-4 md:px-8 pb-32 relative z-20 h-[calc(100vh-200px)] overflow-y-auto no-scrollbar">
        <div className={`rounded-xl overflow-hidden shadow-2xl ${theme.styles.container}`}>
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-4 border-b border-opacity-20 border-white bg-black/40 backdrop-blur-md sticky top-0 z-30">
            <div className={`col-span-3 ${theme.styles.textHeader} font-black text-sm md:text-xl flex items-center pl-2 tracking-tighter`}>
              {theme.headers.operator}
            </div>
            
            {/* Hours Headers */}
            <div className="col-span-6 grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`text-center ${theme.styles.textHeader} text-xs md:text-sm font-bold opacity-90 flex items-center justify-center`}>
                  {theme.headers.hoursPrefix}{i + 1}
                </div>
              ))}
            </div>

            <div className={`col-span-2 text-center ${theme.styles.textHeader} font-black text-sm md:text-xl border-l border-white/10 flex items-center justify-center`}>
              {theme.headers.total}
            </div>
            {/* Target Header */}
            <div className={`col-span-1 text-center ${theme.styles.textHeader} font-black text-sm md:text-xl border-l border-white/10 flex items-center justify-center`}>
              {theme.headers.target}
            </div>
          </div>

          {/* Animated Rows */}
          <div className="flex flex-col">
            <AnimatePresence mode='popLayout'>
              {sortedData.map((picker, index) => {
                // Winner logic only applies if effective sort is descending
                const isWinner = index === 0 && picker.total > 0 && effectiveSortMode === 'desc';
                const targetMet = isTargetMet(picker.total, picker.target);
                const roundedTarget = Math.ceil(picker.target);
                
                return (
                  <motion.div
                    layout
                    key={picker.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 80, damping: 20 }}
                    className={`grid grid-cols-12 gap-2 p-2 md:p-3 items-center border-b ${theme.styles.border} ${
                        index % 2 === 0 ? theme.styles.rowEven : theme.styles.rowOdd
                    } ${targetMet ? 'brightness-110 saturate-120 z-10 relative' : ''}`}
                  >
                    {/* Name Column */}
                    <div className="col-span-3 flex items-center gap-4 pl-2 overflow-hidden">
                      <span className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-sm font-black shadow-lg ${
                          isWinner ? 'bg-yellow-400 text-black scale-110' : 'bg-black/30 text-white/80 border border-white/10'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex flex-col overflow-hidden">
                        {/* Use textRow style here for correct contrast in Cricket theme */}
                        <span className={`truncate font-bold text-sm md:text-xl ${theme.styles.textRow} ${isWinner ? 'text-yellow-400 drop-shadow-md' : ''}`}>
                          {picker.name}
                        </span>
                        {isWinner && <div className="text-[10px] md:text-xs text-yellow-400 font-bold uppercase tracking-widest flex items-center gap-1"><Trophy size={10} /> Leader</div>}
                      </div>
                    </div>

                    {/* Hourly Heatmap Columns */}
                    <div className="col-span-6 grid grid-cols-10 gap-1">
                      {picker.hours.map((h, i) => (
                        <div 
                            key={i} 
                            className={`
                                h-8 md:h-12 flex items-center justify-center rounded-sm text-xs md:text-lg font-black shadow-sm transition-transform hover:scale-105
                                ${getCellClass(h, picker.target)}
                            `}
                        >
                          {h > 0 ? h : <span className="opacity-0">-</span>}
                        </div>
                      ))}
                    </div>

                    {/* Total Column */}
                    <div className="col-span-2 flex justify-center">
                        <div className={`
                            px-2 py-1 md:py-2 w-full max-w-[140px] rounded-lg text-center font-black text-lg md:text-3xl tracking-tighter flex items-center justify-center
                            ${targetMet 
                                ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-105 border-2 border-yellow-300' 
                                : `text-white/90 bg-black/30 border border-white/10`}
                        `}>
                            {picker.total}
                        </div>
                    </div>

                    {/* Target Column */}
                    <div className="col-span-1 flex justify-center">
                         <div className={`
                            px-1 py-1 md:py-2 w-full max-w-[100px] rounded-lg text-center font-bold text-sm md:text-xl flex items-center justify-center shadow-lg
                            ${theme.styles.targetBox}
                        `}>
                            {roundedTarget}
                        </div>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
            {sortedData.length === 0 && (
                <div className="p-12 text-center flex flex-col items-center justify-center opacity-50">
                    <div className="text-6xl mb-4">👻</div>
                    <div className={`text-2xl font-bold ${theme.styles.textMain}`}>No active contestants found.</div>
                    <p className={`mt-2 ${theme.styles.textMain}`}>Upload data or add rows in Admin Panel.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArenaBoard;