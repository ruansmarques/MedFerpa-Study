import React, { useState } from 'react';
import { 
  GraduationCap, 
  Video, 
  Calendar, 
  Dumbbell, 
  Trophy, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  UserCheck, 
  Sparkles, 
  Target, 
  Zap, 
  Clock, 
  FileText, 
  ChevronRight, 
  X, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  BarChart3,
  BookMarked
} from 'lucide-react';
import Login from './Login';
import Register from './Register';
import { User } from '../types';

interface LandingPageProps {
  onLogin: (user: User) => void;
  initialAuthModal?: 'none' | 'login' | 'register';
  onOpenAdmin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, initialAuthModal = 'none', onOpenAdmin }) => {
  const [authModal, setAuthModal] = useState<'none' | 'login' | 'register'>(initialAuthModal);
  const [activeFeatureTab, setActiveFeatureTab] = useState<'aulas' | 'cronograma' | 'exercicios' | 'rank' | 'biblioteca'>('aulas');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* --- BACKGROUND DECORATION --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
      </div>

      {/* --- NAVBAR --- */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white font-mono">MED<span className="text-blue-500">FERPA</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Medicina</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
            <button 
              onClick={() => scrollToSection('aulas')} 
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
            >
              Aulas
            </button>
            <button 
              onClick={() => scrollToSection('cronograma')} 
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
            >
              Cronograma
            </button>
            <button 
              onClick={() => scrollToSection('exercicios')} 
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
            >
              Exercícios
            </button>
            <button 
              onClick={() => scrollToSection('rank')} 
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
            >
              Rank
            </button>
            <button 
              onClick={() => scrollToSection('biblioteca')} 
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
            >
              Biblioteca
            </button>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthModal('login')}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition flex items-center gap-2"
            >
              <LogIn className="w-4 h-4 text-blue-400" />
              <span>Entrar</span>
            </button>
            <button
              onClick={() => setAuthModal('register')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 transition shadow-lg shadow-blue-600/25 flex items-center gap-2 active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold tracking-wide uppercase mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Plataforma de Estudos para Medicina</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1] mb-6">
            Sua rotina acadêmica de <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Medicina integrada e gamificada
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
            Acesse videoaulas organizadas, resolva milhares de questões de provas e do ENAMED com gabarito, acompanhe o cronograma de aulas e evolua no Rank de XP.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => setAuthModal('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 group active:scale-98"
            >
              <span>Criar Conta com Nome e RA</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setAuthModal('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-base border border-slate-700/80 transition flex items-center justify-center gap-2 active:scale-98"
            >
              <LogIn className="w-5 h-5 text-blue-400" />
              <span>Já tenho conta (Entrar)</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-black text-blue-400 font-mono mb-1">100+</div>
              <div className="text-xs sm:text-sm font-medium text-slate-400">Videoaulas Mapeadas</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-black text-indigo-400 font-mono mb-1">1.000+</div>
              <div className="text-xs sm:text-sm font-medium text-slate-400">Questões Clínicas</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono mb-1">100%</div>
              <div className="text-xs sm:text-sm font-medium text-slate-400">Grade do Semestre</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono mb-1">Rank XP</div>
              <div className="text-xs sm:text-sm font-medium text-slate-400">Gamificação de Turma</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PLATFORM FEATURES OVERVIEW TABS --- */}
      <section className="py-16 bg-slate-900/50 border-y border-slate-800/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-3">Tudo em um só lugar</h2>
            <p className="text-3xl sm:text-4xl font-black text-white">Explorar os pilares da plataforma MEDFERPA</p>
          </div>

          {/* Tabs header */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
            {[
              { id: 'aulas', label: 'Aulas', icon: Video },
              { id: 'cronograma', label: 'Cronograma', icon: Calendar },
              { id: 'exercicios', label: 'Exercícios', icon: Dumbbell },
              { id: 'rank', label: 'Rank XP', icon: Trophy },
              { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id as any)}
                  className={`px-5 py-3 rounded-2xl font-bold text-sm transition flex items-center gap-2.5 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
            {activeFeatureTab === 'aulas' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
                    <Video className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                    Sessão de Aulas Organizadas por Disciplina
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    Módulos estruturados por período e matéria. Cada aula conta com reprodução de vídeo direto do YouTube, links oficiais para baixar Slides e Resumos em PDF, e botão instantâneo de resolução de exercícios.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                      <span>Integração de vídeo, slides e resumos no mesmo card</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                      <span>Botão <strong className="text-purple-300">"Resolver Questões"</strong> direcionado especificamente para a aula</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                      <span>Marcação de progresso da aula (+10 XP ao concluir)</span>
                    </li>
                  </ul>
                  <button onClick={() => setAuthModal('register')} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition flex items-center gap-2">
                    <span>Experimentar Aulas</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">Anatpatologia • 5º Período</span>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-extrabold">Concluída +10 XP</span>
                  </div>
                  <div className="bg-slate-950 aspect-video rounded-xl flex items-center justify-center border border-slate-800 mb-4 relative overflow-hidden group">
                    <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                      <Video className="w-6 h-6 fill-current" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-amber-300 font-bold">📄 Baixar Slide</div>
                    <div className="flex-1 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-blue-300 font-bold">📚 Baixar Resumo</div>
                    <div className="flex-1 px-3 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-xl text-center text-xs font-bold">✍️ Resolver Questões</div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'cronograma' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                    Cronograma Curricular Sincronizado
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    Acompanhe sua rotina acadêmica diária. O cronograma identifica os horários de aula, slots de grade, períodos de provas (N1, N2, Práticas) e fornece atalhos para os conteúdos correspondentes.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Filtro de calendário por dias letivos e semestres</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Identificação de avaliações, provas teóricas e práticas</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Navegação direta do dia letivo para a aula em video</span>
                    </li>
                  </ul>
                  <button onClick={() => setAuthModal('register')} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition flex items-center gap-2">
                    <span>Ver Cronograma</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-sm font-bold text-white">Quarta-feira • 28 de Julho</span>
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-xs font-bold">Slot 1 & 2</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-blue-400 font-bold">Farmacologia Médica</div>
                      <div className="text-sm font-bold text-white">AULA 08 - Anti-hipertensivos e Diuréticos</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg">N1</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-purple-400 font-bold">Anatomia Patológica</div>
                      <div className="text-sm font-bold text-white">AULA 05 - Neoplasias Benignas e Malignas</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-lg">Prática</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'exercicios' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                    Banco de Exercícios Clínicos e ENAMED
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    Pratique com milhares de questões direcionadas. Monte sessões customizadas filtrando por disciplina, período, banca, nível de dificuldade ou estude no modo simulado com cronômetro.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                      <span>Aulas específicas ou banco de dados global do ENAMED</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                      <span>Modo Simulado com cronômetro de prova</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                      <span>Acumulação de XP de acordo com o índice de acertos</span>
                    </li>
                  </ul>
                  <button onClick={() => setAuthModal('register')} className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition flex items-center gap-2">
                    <span>Acessar Exercícios</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-cyan-400">Questão 04 de 10 • Nível Médio</span>
                    <span className="text-xs px-2.5 py-1 bg-cyan-500/10 text-cyan-300 rounded-full font-bold">+15 XP</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    Homem de 54 anos apresenta dor torácica opressiva com irradiação para membro superior esquerdo. O ECG demonstra supra do segmento ST em V1-V4. Qual a conduta imediata?
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">A) Prescrever analgésico comum e alta hospitalar.</div>
                    <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-between">
                      <span>B) Encaminhamento urgente para angioplastia primária.</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">C) Realizar TC de tórax sem contraste.</div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'rank' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                    Rank de XP e Gamificação da Turma
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    Estudar Medicina fica mais estimulante quando seu esforço se reflete em conquistas. Complete aulas, acerte questões e suba posições na tabela da turma com privacidade controlável.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>Cálculo automático e transparente de XP</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>Classificação em tempo real da turma</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>Controle para ocultar/exibir nome no ranking quando desejar</span>
                    </li>
                  </ul>
                  <button onClick={() => setAuthModal('register')} className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition flex items-center gap-2">
                    <span>Entrar no Ranking</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Liderança do Semestre</div>
                  {[
                    { pos: '1º', name: 'Ruan Marques', xp: '1.450 XP', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
                    { pos: '2º', name: 'Ana Beatriz', xp: '1.280 XP', color: 'text-slate-300 bg-slate-800/80 border-slate-700' },
                    { pos: '3º', name: 'Carlos Eduardo', xp: '1.110 XP', color: 'text-amber-600 bg-amber-900/20 border-amber-800/40' },
                  ].map((u, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${u.color}`}>{u.pos}</span>
                        <span className="text-sm font-bold text-white">{u.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">{u.xp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeFeatureTab === 'biblioteca' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                    Biblioteca de Materiais e Livros
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    Acesse resumos em PDF, apostilas de estudo, indicações bibliográficas e drives oficiais organizados por matéria para facilitar suas revisões.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Resumos de semiologia, patologia e farmacologia</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Organização por pastas de disciplinas</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Download rápido sem complicações</span>
                    </li>
                  </ul>
                  <button onClick={() => setAuthModal('register')} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition flex items-center gap-2">
                    <span>Acessar Biblioteca</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-32">
                    <BookMarked className="w-6 h-6 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Resumos de Semiologia</div>
                      <div className="text-[10px] text-slate-400">PDFs Didáticos</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-32">
                    <BookOpen className="w-6 h-6 text-blue-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Farmacologia Médica</div>
                      <div className="text-[10px] text-slate-400">Mapas Mentais</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS / REGISTRATION INFO --- */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-3">Acesso Simples</h2>
            <h3 className="text-3xl sm:text-5xl font-black text-white mb-4">
              Cadastro descomplicado sem senha
            </h3>
            <p className="text-slate-400 text-base sm:text-lg">
              Basta informar seu **Nome Completo** e seu **Registro Acadêmico (RA)** para começar a usar a plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-left relative overflow-hidden">
              <div className="text-4xl font-black text-blue-500/30 font-mono mb-4">01</div>
              <h4 className="text-xl font-bold text-white mb-2">Informe seu Nome e RA</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Preencha seu Nome e o número do seu RA acadêmico no formulário de registro.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-left relative overflow-hidden">
              <div className="text-4xl font-black text-indigo-500/30 font-mono mb-4">02</div>
              <h4 className="text-xl font-bold text-white mb-2">Acesso Imediato</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sem emails ou confirmações demoradas. Você entra direto no seu painel de aulas e cronograma.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-left relative overflow-hidden">
              <div className="text-4xl font-black text-cyan-500/30 font-mono mb-4">03</div>
              <h4 className="text-xl font-bold text-white mb-2">Evolua no Rank</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Assista aulas, resolva questões e acumule XP para subir na tabela da sua turma.
              </p>
            </div>
          </div>

          {/* Bottom Call to action box */}
          <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-blue-500/30 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="text-left">
              <h4 className="text-2xl font-black text-white mb-1">Pronto para organizar seus estudos?</h4>
              <p className="text-slate-300 text-sm">Crie sua conta em menos de 10 segundos.</p>
            </div>
            <button
              onClick={() => setAuthModal('register')}
              className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm transition shadow-xl shadow-blue-600/30 shrink-0 flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Registrar com Nome e RA</span>
            </button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-10 bg-slate-950 border-t border-slate-900 relative z-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-slate-300 font-mono">MEDFERPA</span>
            <span>— Plataforma Acadêmica de Medicina</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setAuthModal('login')} className="hover:text-slate-300 transition">
              Entrar
            </button>
            <button onClick={() => setAuthModal('register')} className="hover:text-slate-300 transition">
              Registrar
            </button>
            {onOpenAdmin && (
              <button 
                onClick={onOpenAdmin}
                className="hover:text-blue-400 transition underline underline-offset-4"
              >
                Painel Administrativo
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* --- AUTH MODAL (LOGIN / REGISTER OVERLAY) --- */}
      {authModal !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Close Button */}
            <button
              onClick={() => setAuthModal('none')}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition z-10"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Render Login or Register inside Modal */}
            <div className="p-2 sm:p-4">
              {authModal === 'login' ? (
                <div>
                  <Login onLogin={(user) => {
                    setAuthModal('none');
                    onLogin(user);
                  }} />
                  <div className="pb-6 text-center text-sm text-slate-500">
                    Não tem uma conta ainda?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthModal('register')}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Cadastrar-se com Nome e RA
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <Register onAutoLogin={(user) => {
                    setAuthModal('none');
                    onLogin(user);
                  }} />
                  <div className="pb-6 text-center text-sm text-slate-500">
                    Já possui um cadastro?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthModal('login')}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Fazer login com RA
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
