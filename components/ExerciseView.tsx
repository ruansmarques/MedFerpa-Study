import React, { useState, useEffect, useRef } from 'react';
import { SUBJECTS, EXERCISES } from '../constants';
import { db, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { User, Subject, Exercise, LevelProgress } from '../types';

interface ExerciseViewProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onExit: () => void;
}

// CORES E ESTILOS CÓSMICOS
const UNIVERSE_THEMES: Record<number, string> = {
  1: 'from-blue-900 via-purple-900 to-slate-900 border-blue-500/30',
  2: 'from-orange-900 via-red-900 to-slate-900 border-orange-500/30',
  3: 'from-emerald-900 via-teal-900 to-slate-900 border-emerald-500/30',
  4: 'from-indigo-900 via-violet-900 to-slate-900 border-indigo-500/30',
  5: 'from-rose-900 via-pink-900 to-slate-900 border-rose-500/30',
  6: 'from-cyan-900 via-blue-900 to-slate-900 border-cyan-500/30',
  7: 'from-amber-900 via-yellow-900 to-slate-900 border-amber-500/30',
  8: 'from-fuchsia-900 via-purple-900 to-slate-900 border-fuchsia-500/30',
};

const PLANET_GRADIENTS = [
  'bg-gradient-to-br from-blue-400 to-blue-700',
  'bg-gradient-to-br from-purple-400 to-purple-700',
  'bg-gradient-to-br from-emerald-400 to-emerald-700',
  'bg-gradient-to-br from-orange-400 to-orange-700',
  'bg-gradient-to-br from-rose-400 to-rose-700',
  'bg-gradient-to-br from-cyan-400 to-cyan-700',
];

// --- SUBCOMPONENTE: TerrainView (Mapa de Níveis) ---
interface TerrainViewProps {
  currentUser: User;
  selectedSubject: Subject | null;
  mascotUrl: string | null;
  onBack: () => void;
  onStartQuiz: (level: number) => void;
}

const TerrainView: React.FC<TerrainViewProps> = ({ currentUser, selectedSubject, mascotUrl, onBack, onStartQuiz }) => {
    // 6 níveis
    const levels = [1, 2, 3, 4, 5, 6];
    
    // Recupera progresso do usuário
    const getLevelData = (lvl: number) => {
      if (!currentUser.exerciseProgress) return null;
      const key = `${selectedSubject?.id}_level_${lvl}`;
      return currentUser.exerciseProgress[key];
    };

    const isLevelUnlocked = (lvl: number) => {
      if (lvl === 1) return true;
      
      // Verifica se o nível ATUAL está explicitamente desbloqueado
      const currentData = getLevelData(lvl);
      if (currentData && currentData.unlocked) return true;

      // OU Verifica se o nível ANTERIOR foi completado com sucesso (score >= 50)
      const prevLevelData = getLevelData(lvl - 1);
      return !!prevLevelData && prevLevelData.score >= 50;
    };

    // --- CÁLCULO DO CAMINHO (SNAKE PATH) ---
    // Usamos larguras fixas para cálculo geométrico, mas o SVG escala via CSS
    const ITEM_HEIGHT = 140; 
    const VIEW_WIDTH = 360; // Largura base para cálculo
    const CENTER_X = VIEW_WIDTH / 2;
    const AMPLITUDE = 100; // Curva mais acentuada
    
    const TOTAL_HEIGHT = (levels.length * ITEM_HEIGHT) + 200; 

    // Gera os pontos da curva
    const pathPoints = levels.map((lvl, i) => {
      // Inversão lógica do Y: Nível 1 embaixo
      const inverseIndex = i; 
      const y = TOTAL_HEIGHT - (inverseIndex * ITEM_HEIGHT) - 150;

      // Zig Zag no X
      const xOffset = Math.sin(inverseIndex * (Math.PI / 1.5)) * AMPLITUDE; 
      const x = CENTER_X + xOffset;
      return { x, y, level: lvl };
    });

    let svgPath = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
    for (let i = 0; i < pathPoints.length - 1; i++) {
        const current = pathPoints[i];
        const next = pathPoints[i + 1];
        // Curva de Bézier cúbica para suavizar
        const cp1x = current.x;
        const cp1y = current.y - (ITEM_HEIGHT / 2);
        const cp2x = next.x;
        const cp2y = next.y + (ITEM_HEIGHT / 2);
        svgPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    // Encontrar posição do mascote
    let currentActiveLevel = 1;
    for (let l of levels) {
        if (isLevelUnlocked(l)) currentActiveLevel = l;
    }
    // Se completou o nível atual com sucesso (>0 score), mas o próximo ainda não foi jogado, mascote vai para o próximo
    const activeData = getLevelData(currentActiveLevel);
    if (activeData && activeData.score >= 50 && currentActiveLevel < levels.length) {
        currentActiveLevel++;
    }
    const mascotPoint = pathPoints.find(p => p.level === currentActiveLevel) || pathPoints[0];

    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (containerRef.current) {
            // Centraliza o mascote verticalmente na tela
            const targetScroll = mascotPoint.y - (window.innerHeight / 2);
            containerRef.current.scrollTop = targetScroll; 
        }
    }, [mascotPoint]);

    return (
      <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center">
         {/* HEADER */}
         <div className="w-full max-w-4xl flex justify-between items-center p-6 z-20 bg-gradient-to-b from-[#020617] to-transparent absolute top-0 pointer-events-none">
            <button 
              onClick={onBack}
              className="text-white/70 hover:text-white flex items-center gap-2 transition-colors bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 pointer-events-auto"
            >
              ← Voltar à Órbita
            </button>
            <div className="text-right pointer-events-auto">
                <h3 className="text-white font-bold text-lg text-shadow">{selectedSubject?.title}</h3>
                <p className="text-xs text-blue-300 uppercase tracking-widest font-bold">Setor de Treinamento</p>
            </div>
         </div>

         {/* SCROLL CONTAINER */}
         <div 
            ref={containerRef}
            className="flex-1 w-full overflow-y-auto overflow-x-hidden scrollbar-hide relative"
         >
            {/* O Container interno tem a altura total calculada e centraliza o conteúdo */}
            <div className="relative mx-auto" style={{ height: TOTAL_HEIGHT, width: '100%', maxWidth: '450px' }}>
                
                {/* SVG Background Path - Usando viewBox para alinhamento perfeito */}
                <svg 
                    className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible"
                    viewBox={`0 0 ${VIEW_WIDTH} ${TOTAL_HEIGHT}`}
                    preserveAspectRatio="xMidYMin slice"
                >
                    <path 
                        d={svgPath} 
                        fill="none" 
                        stroke="rgba(255,255,255,0.15)" 
                        strokeWidth="16" 
                        strokeLinecap="round"
                    />
                    <path 
                        d={svgPath} 
                        fill="none" 
                        stroke="rgba(255,255,255,0.3)" 
                        strokeWidth="4" 
                        strokeDasharray="12,12" 
                        strokeLinecap="round"
                        className="animate-[dash_20s_linear_infinite]"
                    />
                </svg>

                {/* MASCOTE */}
                <div 
                    className="absolute z-30 transition-all duration-1000 ease-in-out pointer-events-none"
                    style={{ 
                        // Mapeamento proporcional da posição X baseada no VIEW_WIDTH
                        left: `${(mascotPoint.x / VIEW_WIDTH) * 100}%`,
                        top: mascotPoint.y,
                        // Translada para o centro e depois offset para o lado
                        transform: 'translate(calc(-50% + 50px), -50%)', 
                    }}
                >
                    <div style={{ animation: 'float-mascot 4s ease-in-out infinite' }}>
                        {mascotUrl ? (
                            <img 
                                src={mascotUrl}
                                alt="Mascote" 
                                className="w-24 md:w-32 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        ) : (
                            <span className="text-4xl filter drop-shadow-lg">🐶👨‍🚀</span>
                        )}
                    </div>
                </div>

                {/* Níveis (Botões) */}
                {pathPoints.map((p, index) => {
                    const lvl = p.level;
                    const data = getLevelData(lvl);
                    const unlocked = isLevelUnlocked(lvl);
                    const stars = data?.stars || 0;
                    
                    return (
                        <div 
                            key={lvl} 
                            className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                            style={{ 
                                // Posicionamento absoluto percentual baseado no VIEW_WIDTH para alinhar com SVG
                                left: `${(p.x / VIEW_WIDTH) * 100}%`, 
                                top: p.y
                            }}
                        >
                             {/* Informações Superiores (Estrelas e Porcentagem) */}
                             <div className="absolute -top-12 flex flex-col items-center w-32 pointer-events-none z-30">
                                {unlocked && stars > 0 && (
                                    <div className="flex justify-center gap-1 mb-0.5">
                                        {Array(3).fill(0).map((_, i) => (
                                            <span key={i} className={`text-lg drop-shadow-md leading-none ${i < stars ? 'text-yellow-400' : 'text-slate-700'}`}>
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                )}
                                
                                {/* FEATURE: Porcentagem de Acerto */}
                                {/* score -1 indica desbloqueado mas não jogado, então só mostra se >= 0 */}
                                {unlocked && data && data.score >= 0 && (
                                    <span className="text-[11px] font-black text-green-400 bg-slate-900/80 px-2 rounded-full border border-green-500/30 shadow-sm leading-tight">
                                        {data.score}%
                                    </span>
                                )}
                             </div>

                            <button
                                disabled={!unlocked}
                                onClick={() => onStartQuiz(lvl)}
                                className={`
                                    w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-2xl font-black shadow-2xl transition-all duration-300
                                    relative group z-20
                                    ${unlocked 
                                    ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white hover:scale-110 hover:-translate-y-1 border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 ring-4 ring-blue-500/30' 
                                    : 'bg-slate-800 text-slate-600 border-b-4 border-slate-900 cursor-not-allowed'
                                    }
                                `}
                            >
                                {unlocked ? (
                                    <span className="drop-shadow-md">{lvl}</span>
                                ) : (
                                    <span className="text-xl opacity-30">🔒</span>
                                )}
                            </button>
                            
                            {/* Placa de Nível (Chão) */}
                            <div className={`
                                mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                backdrop-blur-sm border border-white/5 whitespace-nowrap
                                ${unlocked ? 'bg-blue-900/60 text-blue-200' : 'bg-slate-900/60 text-slate-600'}
                            `}>
                                Nível {lvl}
                            </div>
                        </div>
                    );
                })}
            </div>
         </div>
      </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const ExerciseView: React.FC<ExerciseViewProps> = ({ currentUser, onUpdateUser, onExit }) => {
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1); // 1: Galáxias, 2: Sistema Solar, 3: Mapa, 4: Quiz
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [quizQuestions, setQuizQuestions] = useState<Exercise[]>([]);
  const [mascotUrl, setMascotUrl] = useState<string | null>(null);
  
  // Mobile Carousel State
  const [mobileSubjectIndex, setMobileSubjectIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Quiz Logic State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Carrega o Mascote do Storage
  useEffect(() => {
    const fetchMascot = async () => {
        try {
            const url = await getDownloadURL(ref(storage, 'assets/mascote_astronauta.png'));
            setMascotUrl(url);
        } catch (error) {
            console.log("Mascote não encontrado no storage, usando fallback local se existir ou placeholder.");
            setMascotUrl('/mascote_astronauta.png'); 
        }
    };
    fetchMascot();
  }, []);

  // Efeito de Fundo Estrelado
  const StarBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#020617]">
      <div className="absolute w-[2px] h-[2px] bg-white rounded-full top-10 left-10 animate-pulse opacity-50"></div>
      <div className="absolute w-[3px] h-[3px] bg-blue-300 rounded-full top-1/4 left-1/3 animate-pulse opacity-70"></div>
      <div className="absolute w-[2px] h-[2px] bg-white rounded-full top-3/4 left-1/4 animate-pulse opacity-40"></div>
      <div className="absolute w-[3px] h-[3px] bg-purple-300 rounded-full top-1/2 left-3/4 animate-pulse opacity-60"></div>
      <div className="absolute w-[1px] h-[1px] bg-white rounded-full top-10 right-20 opacity-80"></div>
      
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes float-mascot {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes orbit-pulse {
            0% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.1); }
            50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.3); }
            100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.1); }
        }
        /* Mobile Carousel Animations */
        .carousel-item {
          transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
      `}</style>
    </div>
  );

  // --- ETAPA 1: SELEÇÃO DE UNIVERSO (PERÍODO) ---
  const renderGalaxies = () => {
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];
    return (
      <div className="relative z-10 w-full max-w-6xl mx-auto p-4 flex flex-col items-center animate-fade-in">
        <button 
          onClick={onExit}
          className="self-start text-white/50 hover:text-white flex items-center gap-2 mb-8 transition-colors px-2 py-1 rounded hover:bg-white/10"
        >
          ← Sair
        </button>

        <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 text-center mb-12 drop-shadow-lg tracking-tight">
          Mapa das Galáxias
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => {
                setSelectedPeriod(p);
                setStage(2);
              }}
              className={`
                group relative h-64 rounded-3xl border border-white/10 p-6 flex flex-col items-center justify-center 
                bg-gradient-to-br ${UNIVERSE_THEMES[p] || UNIVERSE_THEMES[1]}
                hover:scale-105 transition-all duration-500 shadow-2xl hover:shadow-[0_0_30px_rgba(100,100,255,0.3)]
              `}
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
              <div className="z-10 text-6xl mb-4 group-hover:animate-spin-slow transition-transform duration-1000">🌌</div>
              <h3 className="z-10 text-2xl font-bold text-white mb-1">Universo {p}º</h3>
              <p className="z-10 text-white/60 text-sm font-medium">Período</p>
              
              <div className="absolute inset-0 rounded-3xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // --- ETAPA 2: SISTEMA SOLAR ORBITAL (DISCIPLINAS) ---
  const renderSolarSystem = () => {
    const subjects = SUBJECTS.filter(s => s.period === selectedPeriod);
    
    // Configurações da Órbita Desktop
    // Ajustado para usar lógica de transformação CSS (rotate/translate)
    const containerSize = 550; 
    const orbitRadius = containerSize / 2; // Raio visual da órbita

    // Logic for Mobile Swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };
    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const minSwipeDistance = 50;
        
        if (distance > minSwipeDistance) {
            // Swipe Left -> Next
            setMobileSubjectIndex((prev) => (prev + 1) % subjects.length);
        } else if (distance < -minSwipeDistance) {
            // Swipe Right -> Prev
            setMobileSubjectIndex((prev) => (prev - 1 + subjects.length) % subjects.length);
        }
        setTouchStart(null);
        setTouchEnd(null);
    };

    return (
      <div className="relative z-10 w-full h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        <button 
          onClick={() => setStage(1)}
          className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-50 bg-black/20 px-3 py-1 rounded-full backdrop-blur-md"
        >
          ← Voltar às Galáxias
        </button>

        {/* --- MOBILE CAROUSEL VIEW (< md) --- */}
        <div 
            className="md:hidden relative w-full h-full flex flex-col items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
             <h2 className="text-3xl font-black text-white text-shadow-lg mb-8 relative z-20">
                {selectedPeriod}º Período
             </h2>
             
             <div className="relative w-full h-[400px] flex items-center justify-center perspective-1000">
                {subjects.map((subj, idx) => {
                    // Calcula posição relativa ao index ativo
                    let relativeIdx = idx - mobileSubjectIndex;
                    
                    // Ajuste para looping infinito visual
                    const total = subjects.length;
                    if (relativeIdx < -1) relativeIdx += total;
                    if (relativeIdx > 1) relativeIdx -= total;

                    // Se estiver muito longe, esconde ou joga pra trás
                    const isActive = idx === mobileSubjectIndex;
                    const isPrev = relativeIdx === -1 || (mobileSubjectIndex === 0 && idx === total - 1);
                    const isNext = relativeIdx === 1 || (mobileSubjectIndex === total - 1 && idx === 0);
                    
                    let styleClass = "opacity-0 scale-50 z-0 pointer-events-none absolute";
                    let translateX = "0px";
                    
                    if (isActive) {
                        styleClass = "opacity-100 scale-110 z-20 cursor-pointer absolute";
                    } else if (isPrev) {
                        styleClass = "opacity-40 scale-75 z-10 -translate-x-32 absolute grayscale";
                        translateX = "-140px";
                    } else if (isNext) {
                        styleClass = "opacity-40 scale-75 z-10 translate-x-32 absolute grayscale";
                        translateX = "140px";
                    }

                    const gradient = PLANET_GRADIENTS[idx % PLANET_GRADIENTS.length];

                    return (
                        <button
                            key={subj.id}
                            onClick={() => {
                                if (isActive) {
                                    setSelectedSubject(subj);
                                    setStage(3);
                                } else {
                                    setMobileSubjectIndex(idx);
                                }
                            }}
                            className={`carousel-item transition-all duration-500 ease-out flex flex-col items-center justify-center ${styleClass}`}
                            style={{ transform: isActive ? 'scale(1.2)' : `translateX(${translateX}) scale(0.8)` }}
                        >
                            <div className={`
                                w-40 h-40 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.8)] 
                                ${gradient} relative flex items-center justify-center
                                border-4 border-white/20
                            `}>
                                <span className="text-5xl drop-shadow-md relative z-10">{subj.icon}</span>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-black/40 pointer-events-none"></div>
                            </div>
                            
                            <div className={`mt-6 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                                <span className="bg-slate-900/80 backdrop-blur-md border border-white/10 text-white font-bold text-sm px-4 py-2 rounded-xl shadow-lg">
                                    {subj.title}
                                </span>
                            </div>
                        </button>
                    );
                })}
             </div>
             <p className="text-white/40 text-xs mt-4 animate-pulse">Deslize para navegar • Toque para entrar</p>
        </div>

        {/* --- DESKTOP ORBITAL VIEW (>= md) --- */}
        {/* Usando transform rotate/translate para posicionamento perfeito */}
        <div 
            className="hidden md:flex relative items-center justify-center rounded-full"
            style={{ 
                width: containerSize, 
                height: containerSize,
            }}
        >
            {/* Linha da Órbita (Visual) */}
            <div className="absolute inset-0 rounded-full border border-white/5 animate-[orbit-pulse_4s_ease-in-out_infinite]"></div>
            <div className="absolute inset-[15%] rounded-full border border-white/5 border-dashed opacity-30"></div>

            {/* CENTRO: SOL / TÍTULO */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 flex flex-col items-center justify-center text-center p-4">
                 <h2 className="text-4xl md:text-5xl font-black text-white text-shadow-lg leading-none">
                    {selectedPeriod}º
                 </h2>
                 <span className="text-blue-300 uppercase tracking-[0.3em] text-sm mt-2">Período</span>
                 <div className="w-32 h-32 bg-yellow-500/10 rounded-full absolute blur-3xl -z-10"></div>
            </div>

            {/* PLANETAS ORBITANDO */}
            {subjects.map((subj, idx) => {
               const total = subjects.length;
               // Ângulo para distribuição uniforme. -90 para começar do topo.
               const angle = (360 / total) * idx - 90;
               const gradient = PLANET_GRADIENTS[idx % PLANET_GRADIENTS.length];
               
               return (
                 <button
                   key={subj.id}
                   onClick={() => {
                     setSelectedSubject(subj);
                     setStage(3);
                   }}
                   className="absolute flex flex-col items-center justify-center focus:outline-none z-20"
                   style={{
                     top: '50%',
                     left: '50%',
                     // LÓGICA DE ALINHAMENTO ORBITAL:
                     transform: `rotate(${angle}deg) translate(${orbitRadius}px) rotate(${-angle}deg)`,
                     width: '120px', 
                     height: '120px',
                     marginTop: '-60px', 
                     marginLeft: '-60px',
                   }}
                 >
                   {/* Container interno para a animação de flutuação e escala */}
                   <div 
                     className="w-full h-full flex flex-col items-center group"
                     style={{
                        animation: `float ${3 + (idx%2)}s ease-in-out infinite ${idx * 0.5}s`
                     }}
                   >
                       {/* Planeta */}
                       <div className={`
                          w-20 h-20 md:w-24 md:h-24 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.8)] 
                          ${gradient} relative flex items-center justify-center
                          group-hover:scale-125 group-hover:brightness-125 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.6)]
                          transition-all duration-300 ease-out border-2 border-white/20
                       `}>
                          <span className="text-3xl md:text-4xl drop-shadow-md relative z-10">{subj.icon}</span>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-black/40 pointer-events-none"></div>
                       </div>
                       
                       {/* Nome (Abaixo do planeta) */}
                       <div className="absolute top-[85%] z-30 transition-all duration-300 pointer-events-none group-hover:z-50 w-[200px] flex justify-center">
                           <span className="
                               block bg-slate-900/90 backdrop-blur-md border border-white/10 
                               text-white font-bold text-xs md:text-sm text-center px-3 py-1.5 rounded-lg 
                               shadow-lg leading-tight
                               group-hover:bg-blue-900/90 group-hover:border-blue-400 group-hover:text-blue-100 group-hover:scale-110
                           ">
                               {subj.title}
                           </span>
                       </div>
                   </div>
                 </button>
               );
            })}
        </div>
      </div>
    );
  };

  // --- LOGICA DO QUIZ ---
  const startQuiz = (level: number) => {
    setCurrentLevel(level);
    const subjectExercises = EXERCISES.filter(e => e.subjectId === selectedSubject?.id);
    const pool = subjectExercises.length > 0 ? subjectExercises : EXERCISES;
    const questions: Exercise[] = [];
    for (let i = 0; i < 10; i++) {
        const randomEx = pool[i % pool.length]; 
        questions.push({ ...randomEx, id: `${randomEx.id}_run_${i}` });
    }
    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizFinished(false);
    setIsAnswerChecked(false);
    setSelectedOption(null);
    setStage(4);
  };

  const handleOptionClick = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
    setIsAnswerChecked(true);

    const currentQ = quizQuestions[currentQuestionIndex];
    if (idx === currentQ.correctOptionIndex) {
      setScore(prev => prev + 1);
    }
    setTimeout(() => {
       if (currentQuestionIndex < quizQuestions.length - 1) {
           setCurrentQuestionIndex(prev => prev + 1);
           setSelectedOption(null);
           setIsAnswerChecked(false);
       } else {
           setQuizFinished(true);
       }
    }, 1500);
  };

  const saveProgress = async (finalScore: number, stars: number) => {
     if (!currentUser || !selectedSubject) return;
     const key = `${selectedSubject.id}_level_${currentLevel}`;
     const currentData = currentUser.exerciseProgress?.[key];
     
     // Se já tiver uma pontuação melhor, não sobrescreve, mas pode precisar desbloquear o próximo
     if (currentData && currentData.score > finalScore) {
         // Mesmo se não sobrescrever o score, verifica se precisa desbloquear o próximo
         if (finalScore >= 50) {
             const nextKey = `${selectedSubject.id}_level_${currentLevel + 1}`;
             if (!currentUser.exerciseProgress?.[nextKey]) {
                  const updatedWithNext = {
                      ...currentUser.exerciseProgress,
                      [nextKey]: {
                          score: -1, // Use -1 to represent "unlocked but not played"
                          stars: 0,
                          unlocked: true,
                          completedAt: ''
                      }
                  };
                  onUpdateUser({ ...currentUser, exerciseProgress: updatedWithNext });
                  try {
                      const userRef = doc(db, "users", currentUser.ra);
                      await updateDoc(userRef, { exerciseProgress: updatedWithNext });
                  } catch(e) { console.error(e); }
             }
         }
         return;
     }

     const newProgress: LevelProgress = {
         score: finalScore,
         stars: stars,
         unlocked: true, 
         completedAt: new Date().toISOString()
     };
     
     const updatedProgress = { 
         ...currentUser.exerciseProgress, 
         [key]: newProgress 
     };

     // Desbloquear o próximo nível se passou
     if (finalScore >= 50) {
         const nextKey = `${selectedSubject.id}_level_${currentLevel + 1}`;
         // Cria o próximo nível como desbloqueado se ele não existir
         if (!updatedProgress[nextKey]) {
             updatedProgress[nextKey] = {
                 score: -1, // Use -1 to represent "unlocked but not played"
                 stars: 0,
                 unlocked: true,
                 completedAt: ''
             }
         } else {
             // Garante que está desbloqueado se já existia
             updatedProgress[nextKey].unlocked = true;
         }
     }

     const updatedUser = { ...currentUser, exerciseProgress: updatedProgress };
     onUpdateUser(updatedUser);
     try {
         const userRef = doc(db, "users", currentUser.ra);
         await updateDoc(userRef, { exerciseProgress: updatedProgress });
     } catch (e) {
         console.error("Erro ao salvar progresso", e);
     }
  };

  useEffect(() => {
     if (quizFinished) {
        const finalPercentage = Math.round((score / quizQuestions.length) * 100);
        let stars = 0;
        if (finalPercentage >= 90) stars = 3;
        else if (finalPercentage >= 70) stars = 2;
        else if (finalPercentage >= 50) stars = 1;
        saveProgress(finalPercentage, stars);
     }
  }, [quizFinished]);

  // --- ETAPA 4: ARENA (QUIZ) ---
  const renderArena = () => {
    if (quizFinished) {
       const percentage = Math.round((score / quizQuestions.length) * 100);
       return (
         // Container FullScreen para o Quiz Result
         <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center text-center p-6 animate-fade-in-up">
            <div className="text-8xl mb-4">
                {percentage >= 90 ? '🏆' : percentage >= 50 ? '🚀' : '💥'}
            </div>
            <h2 className="text-4xl font-black text-white mb-2">Missão Cumprida!</h2>
            <p className="text-blue-200 text-xl mb-8">Você completou o Nível {currentLevel}</p>
            
            <div className="bg-slate-800 p-8 rounded-3xl border border-white/10 w-full max-w-sm mb-8">
               <div className="text-5xl font-bold text-white mb-2">{percentage}%</div>
               <div className="text-sm text-gray-400 uppercase tracking-widest font-bold">Precisão</div>
               <div className="flex justify-center gap-2 mt-4 text-3xl text-yellow-400">
                  {percentage >= 50 ? '★' : '☆'}
                  {percentage >= 70 ? '★' : '☆'}
                  {percentage >= 90 ? '★' : '☆'}
               </div>
            </div>

            <div className="flex gap-4">
               <button 
                 onClick={() => setStage(3)}
                 className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-blue-50 transition-colors"
               >
                 Voltar ao Mapa
               </button>
               <button 
                 onClick={() => startQuiz(currentLevel)} // Replay
                 className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors"
               >
                 Tentar Novamente
               </button>
            </div>
         </div>
       );
    }

    const currentQ = quizQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / quizQuestions.length) * 100;

    return (
      // Container FullScreen para o Quiz
      <div className="fixed inset-0 z-50 bg-[#020617] overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto p-6 flex flex-col min-h-full">
            {/* Top Bar */}
            <div className="flex items-center gap-4 mb-10 pt-4">
                <button onClick={() => setStage(3)} className="text-gray-400 hover:text-white">
                <span className="text-2xl">×</span>
                </button>
                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
                </div>
                <div className="text-white font-mono font-bold">
                {score} pts
                </div>
            </div>

            {/* Question */}
            <div className="flex-1 flex flex-col justify-center pb-20">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 leading-relaxed">
                {currentQ.question}
                </h2>

                <div className="grid grid-cols-1 gap-4">
                {currentQ.options.map((opt, idx) => {
                    let btnClass = "bg-slate-800 text-white border-b-4 border-slate-950 hover:bg-slate-700 active:border-b-0 active:translate-y-1";
                    
                    if (isAnswerChecked) {
                        if (idx === currentQ.correctOptionIndex) {
                            btnClass = "bg-green-600 text-white border-b-4 border-green-800";
                        } else if (idx === selectedOption) {
                            btnClass = "bg-red-500 text-white border-b-4 border-red-700";
                        } else {
                            btnClass = "bg-slate-800/50 text-gray-500 border-transparent cursor-not-allowed";
                        }
                    }

                    return (
                        <button
                        key={idx}
                        onClick={() => handleOptionClick(idx)}
                        disabled={isAnswerChecked}
                        className={`
                            w-full p-5 rounded-2xl font-bold text-left text-lg transition-all
                            ${btnClass}
                        `}
                        >
                        {opt}
                        </button>
                    );
                })}
                </div>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] font-sans overflow-hidden relative">
       <StarBackground />
       
       <div className="relative z-10 pt-8 pb-20">
          {stage === 1 && renderGalaxies()}
          {stage === 2 && renderSolarSystem()}
          {stage === 3 && (
             <TerrainView 
                currentUser={currentUser}
                selectedSubject={selectedSubject}
                mascotUrl={mascotUrl}
                onBack={() => setStage(2)}
                onStartQuiz={startQuiz}
             />
          )}
          {stage === 4 && renderArena()}
       </div>
    </div>
  );
};

export default ExerciseView;