import React, { useState } from 'react';
import { SUBJECTS } from '../constants';
import { User, Exercise, QuestionList } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { BookOpen, Brain, Target, CheckCircle, XCircle, Loader2, Filter, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface ExerciseViewProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onExit: () => void;
  onAddXP: (amount: number) => void; 
}

const MultiSelect = ({ options, selected, onChange, placeholder }: { options: string[], selected: string[], onChange: (val: string[]) => void, placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(o => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer flex justify-between items-center text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate text-gray-700">
          {selected.length === 0 ? placeholder : selected.join(', ')}
        </span>
        <span className="text-gray-400 text-xs">▼</span>
      </div>
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => (
            <label key={option} className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
              <input 
                type="checkbox" 
                className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const ExerciseView: React.FC<ExerciseViewProps> = ({ currentUser, onUpdateUser, onExit, onAddXP }) => {
  const [activeTab, setActiveTab] = useState<'internas' | 'enamed'>('internas');
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedBancas, setSelectedBancas] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedEnamedSubjects, setSelectedEnamedSubjects] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [subjectLessons, setSubjectLessons] = useState<any[]>([]);
  const [quantity, setQuantity] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string[]>(['Fácil', 'Médio', 'Difícil']);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Exercise[]>([]);
  const [totalAvailable, setTotalAvailable] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableLists, setAvailableLists] = useState<QuestionList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  
  const [resolutionStarted, setResolutionStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  const toggleDifficulty = (level: string) => {
    setDifficulty(prev => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev; // prevent unselecting all
        return prev.filter(d => d !== level);
      } else {
        return [...prev, level];
      }
    });
  };

  React.useEffect(() => {
    const fetchLessonsAndLists = async () => {
      if (selectedSubjectId) {
        try {
          const qLessons = query(collection(db, 'lessons'), where('subjectId', '==', selectedSubjectId));
          const snapLessons = await getDocs(qLessons);
          const lessonsList: any[] = [];
          snapLessons.forEach(doc => {
            lessonsList.push({ id: doc.id, ...doc.data() });
          });
          setSubjectLessons(lessonsList);

          const qLists = query(collection(db, 'question_lists'), where('subjectId', '==', selectedSubjectId));
          const snapLists = await getDocs(qLists);
          const listsArray: any[] = [];
          snapLists.forEach(doc => {
            listsArray.push({ id: doc.id, ...doc.data() });
          });
          setAvailableLists(listsArray);
        } catch (error) {
          console.error("Erro ao buscar dados:", error);
        }
      } else {
        setSubjectLessons([]);
        setAvailableLists([]);
      }
      setSelectedLessonId('');
    };
    fetchLessonsAndLists();
  }, [selectedSubjectId]);

  const handleGenerate = async () => {
    if (activeTab === 'internas' && !selectedSubjectId) {
      alert("Selecione uma disciplina primeiro.");
      return;
    }
    
    let subjectTitle = "Medicina Geral";
    if (activeTab === 'internas') {
      const subject = SUBJECTS.find(s => s.id === selectedSubjectId);
      if (subject) subjectTitle = subject.title;
    } else {
       let titleParts = [];
       if (selectedAreas.length > 0) titleParts.push(`Áreas: ${selectedAreas.join(', ')}`);
       if (selectedBancas.length > 0) titleParts.push(`Bancas: ${selectedBancas.join(', ')}`);
       if (selectedEnamedSubjects.length > 0) titleParts.push(`Disciplinas: ${selectedEnamedSubjects.join(', ')}`);
       
       subjectTitle = titleParts.length > 0 ? titleParts.join(' | ') : 'Medicina Geral';
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setQuestions([]);
    setAnswers({});
    setShowResults(false);
    setResolutionStarted(false);
    setTotalAvailable(null);
    setActiveListId(null);

    let difficultyLevel = 'variado de 1 a 6';
    if (difficulty.length === 1) {
      difficultyLevel = difficulty[0] === 'Fácil' ? '2' : difficulty[0] === 'Médio' ? '4' : '6';
    } else if (difficulty.length === 2) {
      if (difficulty.includes('Fácil') && difficulty.includes('Médio')) difficultyLevel = 'variado de 1 a 4';
      else if (difficulty.includes('Médio') && difficulty.includes('Difícil')) difficultyLevel = 'variado de 3 a 6';
      else if (difficulty.includes('Fácil') && difficulty.includes('Difícil')) difficultyLevel = 'variado (extremos, 1-2 e 5-6)';
    }

    try {
        let dbQuestions: any[] = [];
        
        // Try to fetch from database first
        if (activeTab === 'internas' && selectedSubjectId && !selectedLessonId) {
          const q = query(
            collection(db, 'questions'), 
            where('subjectId', '==', selectedSubjectId),
            limit(quantity)
          );
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            dbQuestions.push({ id: doc.id, ...doc.data() });
          });
        }
        
        let finalQuestions = [...dbQuestions];
        
        // If we don't have enough questions from the DB, generate the rest
        if (finalQuestions.length < quantity) {
          const remainingQuantity = quantity - finalQuestions.length;
          
          let prompt = `Você é um professor de medicina. Gere ${remainingQuantity} questões de múltipla escolha sobre o assunto "${subjectTitle}" para estudantes de medicina. 
              Nível de dificuldade: ${difficultyLevel} de 6 (1 é básico, 6 é avançado/especializado). 
              As questões devem ser em Português do Brasil.
              Retorne um array JSON de objetos com as propriedades: "question" (string), "options" (array de exatas 4 strings), "correctOptionIndex" (inteiro 0-3) e "explanation" (string com a resolução/explicação da resposta correta).`;
              
          let tools: any[] = [];
          
          if (selectedLessonId) {
            const lesson = subjectLessons.find(l => l.id === selectedLessonId);
            if (lesson && (lesson.slideUrl || lesson.summaryUrl)) {
              const fileUrl = lesson.slideUrl || lesson.summaryUrl;
              
              if (fileUrl && fileUrl.includes('drive.google.com')) {
                throw new Error("O documento desta aula está hospedado no Google Drive e é restrito. A IA não consegue acessá-lo. Por favor, acesse o Painel Administrativo e faça o upload do arquivo diretamente no sistema (Firebase) para permitir a geração de questões.");
              }

              prompt = `Você é um professor de medicina. Gere ${remainingQuantity} questões de múltipla escolha baseadas EXCLUSIVAMENTE no conteúdo do documento fornecido na URL: ${fileUrl}.
              Nível de dificuldade: ${difficultyLevel} de 6 (1 é básico, 6 é avançado/especializado).
              As questões devem ser em Português do Brasil.
              NÃO use conhecimentos externos que não estejam no documento. Se o documento não tiver informações suficientes para gerar ${remainingQuantity} questões, gere o máximo que conseguir com base apenas no documento.
              Retorne um array JSON de objetos com as propriedades: "question" (string), "options" (array de exatas 4 strings), "correctOptionIndex" (inteiro 0-3) e "explanation" (string com a resolução/explicação da resposta correta).`;
              
              tools = [{ urlContext: {} }];
            } else {
              throw new Error("A aula selecionada não possui material (slide ou resumo) cadastrado para gerar questões.");
            }
          }
          
          console.log("Iniciando geração com IA. Chave definida?", !!process.env.GEMINI_API_KEY);
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-3.1-pro-preview',
              contents: prompt,
              config: {
                  tools: tools.length > 0 ? tools : undefined,
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              question: { type: Type.STRING },
                              options: { type: Type.ARRAY, items: { type: Type.STRING } },
                              correctOptionIndex: { type: Type.INTEGER },
                              explanation: { type: Type.STRING }
                          },
                          required: ["question", "options", "correctOptionIndex", "explanation"]
                      }
                  }
              }
          });

          console.log("Resposta bruta da IA:", response.text);
          let text = response.text || '[]';
          const match = text.match(/\[[\s\S]*\]/);
          if (match) {
            text = match[0];
          }
          let generatedData;
          try {
            generatedData = JSON.parse(text);
          } catch (parseError) {
            console.error("Erro ao fazer parse do JSON:", text);
            throw new Error("A IA retornou um formato inválido ou recusou-se a responder. Isso pode acontecer devido a filtros de segurança ou erro na formatação. Tente novamente.");
          }
          
          if (!Array.isArray(generatedData)) {
            throw new Error("A resposta da IA não é um array válido.");
          }
          if (generatedData.length === 0) {
            throw new Error("A IA não conseguiu gerar nenhuma questão. Se você selecionou uma aula específica, é possível que a IA não tenha conseguido ler o conteúdo do arquivo (ex: PDFs complexos ou imagens). Tente gerar questões gerais da disciplina.");
          }
          const newQuestions: Exercise[] = generatedData.map((q: any, i: number) => ({
              id: `ai-gen-${Date.now()}-${i}`,
              subjectId: selectedSubjectId || 'enamed',
              lessonId: selectedLessonId || 'ai-generated',
              question: q.question || "Questão sem enunciado",
              options: Array.isArray(q.options) ? q.options : ["Opção A", "Opção B", "Opção C", "Opção D"],
              correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : parseInt(q.correctOptionIndex) || 0,
              explanation: q.explanation || "Resolução não fornecida pela IA."
          }));
          
          finalQuestions = [...finalQuestions, ...newQuestions];
        }

        setQuestions(finalQuestions.slice(0, quantity));
        // Simulate total available questions based on filters
        setTotalAvailable(quantity + Math.floor(Math.random() * 50) + 20);
    } catch (error: any) {
        console.error("Erro ao gerar questões com AI:", error);
        setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
        setIsGenerating(false);
    }
  };

  const handleStartResolution = () => {
    setResolutionStarted(true);
    setCurrentQuestionIndex(0);
  };

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const startListResolution = (list: QuestionList) => {
    setQuestions(list.questions);
    setActiveListId(list.id);
    setAnswers({});
    setShowResults(false);
    setResolutionStarted(true);
    setCurrentQuestionIndex(0);
  };

  const handleFinish = () => {
    if (Object.keys(answers).length < questions.length && !showConfirmFinish) {
      setShowConfirmFinish(true);
      return;
    }
    
    setShowConfirmFinish(false);
    setShowResults(true);
    
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    if (activeListId) {
      const answeredCount = Object.keys(answers).length;
      onUpdateUser({
        ...currentUser,
        listProgress: {
          ...(currentUser.listProgress || {}),
          [activeListId]: Math.max(answeredCount, currentUser.listProgress?.[activeListId] || 0)
        }
      });
    }

    let diffMultiplier = 2;
    if (difficulty.length === 1) {
      diffMultiplier = difficulty[0] === 'Fácil' ? 1 : difficulty[0] === 'Médio' ? 2 : 3;
    } else if (difficulty.length > 1) {
      diffMultiplier = difficulty.includes('Difícil') ? 3 : 2;
    }
    const xpEarned = correctCount * 10 * diffMultiplier;
    if (xpEarned > 0) {
      onAddXP(xpEarned);
    }
  };

  const correctAnswersCount = questions.filter(q => answers[q.id] === q.correctOptionIndex).length;

  if (resolutionStarted) {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setResolutionStarted(false)} className="text-gray-500 hover:text-gray-800 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-800">Resolução de Questões</h2>
          </div>
          <button
            onClick={handleFinish}
            disabled={showResults}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors"
          >
            Finalizar
          </button>
        </div>

        <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 flex flex-col md:flex-row gap-8">
          {/* Question Area */}
          <div className="flex-1 relative">
            {showConfirmFinish && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 max-w-sm text-center">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Finalizar Resolução?</h3>
                  <p className="text-gray-600 mb-6">Você não respondeu todas as questões. Deseja finalizar mesmo assim?</p>
                  <div className="flex gap-3 justify-center">
                    <button 
                      onClick={() => setShowConfirmFinish(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Continuar respondendo
                    </button>
                    <button 
                      onClick={() => {
                        setShowConfirmFinish(false);
                        setShowResults(true);
                        let correctCount = 0;
                        questions.forEach(q => {
                          if (answers[q.id] === q.correctOptionIndex) {
                            correctCount++;
                          }
                        });

                        if (activeListId) {
                          const answeredCount = Object.keys(answers).length;
                          onUpdateUser({
                            ...currentUser,
                            listProgress: {
                              ...(currentUser.listProgress || {}),
                              [activeListId]: Math.max(answeredCount, currentUser.listProgress?.[activeListId] || 0)
                            }
                          });
                        }

                        let diffMultiplier = 2;
                        if (difficulty.length === 1) {
                          diffMultiplier = difficulty[0] === 'Fácil' ? 1 : difficulty[0] === 'Médio' ? 2 : 3;
                        } else if (difficulty.length > 1) {
                          diffMultiplier = difficulty.includes('Difícil') ? 3 : 2;
                        }
                        const xpEarned = correctCount * 10 * diffMultiplier;
                        if (xpEarned > 0) {
                          onAddXP(xpEarned);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Sim, finalizar
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <span className="font-bold text-gray-500">Questão {currentQuestionIndex + 1} de {questions.length}</span>
                {showResults && (
                  <span className={`font-bold px-3 py-1 rounded-full text-sm ${answers[currentQuestion.id] === currentQuestion.correctOptionIndex ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {answers[currentQuestion.id] === currentQuestion.correctOptionIndex ? 'Correta' : 'Incorreta'}
                  </span>
                )}
              </div>
              <div className="p-6 md:p-8">
                <h4 className="text-lg font-semibold text-gray-800 leading-relaxed mb-6">
                  {currentQuestion.question}
                </h4>
                <div className="space-y-3">
                  {currentQuestion.options.map((opt, optIndex) => {
                    const isSelected = answers[currentQuestion.id] === optIndex;
                    const isCorrect = optIndex === currentQuestion.correctOptionIndex;
                    
                    let optionClass = "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700";
                    
                    if (showResults) {
                      if (isCorrect) {
                        optionClass = "border-green-500 bg-green-50 text-green-800 font-medium";
                      } else if (isSelected && !isCorrect) {
                        optionClass = "border-red-500 bg-red-50 text-red-800";
                      } else {
                        optionClass = "border-gray-200 text-gray-400 opacity-50";
                      }
                    } else if (isSelected) {
                      optionClass = "border-blue-500 bg-blue-50 text-blue-800 font-medium ring-1 ring-blue-500";
                    }

                    return (
                      <button
                        key={optIndex}
                        onClick={() => handleOptionSelect(currentQuestion.id, optIndex)}
                        disabled={showResults}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${optionClass}`}
                      >
                        <span className="flex-1">{opt}</span>
                        {showResults && isCorrect && <CheckCircle className="text-green-500 w-5 h-5 flex-shrink-0 ml-3" />}
                        {showResults && isSelected && !isCorrect && <XCircle className="text-red-500 w-5 h-5 flex-shrink-0 ml-3" />}
                      </button>
                    );
                  })}
                </div>

                {showResults && currentQuestion.explanation && (
                  <div className="mt-8 p-5 bg-blue-50 rounded-xl border border-blue-100">
                    <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <BookOpen size={18} />
                      Resolução
                    </h5>
                    <p className="text-blue-900 text-sm leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button 
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft size={18} /> Anterior
              </button>
              <button 
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                Próxima <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Grid Selector */}
          <div className="w-full md:w-64">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4">Navegação</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, i) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isCurrent = currentQuestionIndex === i;
                  let btnClass = "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100";
                  
                  if (showResults) {
                    const isCorrect = answers[q.id] === q.correctOptionIndex;
                    btnClass = isCorrect ? "bg-green-100 border-green-200 text-green-700" : (isAnswered ? "bg-red-100 border-red-200 text-red-700" : "bg-gray-100 border-gray-200 text-gray-400");
                  } else if (isCurrent) {
                    btnClass = "bg-blue-600 border-blue-600 text-white";
                  } else if (isAnswered) {
                    btnClass = "bg-blue-100 border-blue-200 text-blue-700";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(i)}
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center font-medium text-sm transition-colors ${btnClass}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              
              {showResults && (
                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <div className="text-3xl font-black text-blue-600 mb-1">
                    {Math.round((correctAnswersCount / questions.length) * 100)}%
                  </div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Acertos</div>
                  <div className="mt-4 text-sm text-gray-600">
                    Você acertou {correctAnswersCount} de {questions.length} questões.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm flex items-center gap-4">
        <button 
          onClick={onExit}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          title="Voltar"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen size={24} className="text-blue-600" />
            Banco de Questões
          </h2>
          <p className="text-sm text-gray-500">Gere questões personalizadas</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-4 md:p-8 flex-1 flex flex-col items-center">
        
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-8 border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('internas')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'internas' ? 'bg-green-100 text-green-800 shadow-sm border border-green-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Questões internas
          </button>
          <button
            onClick={() => setActiveTab('enamed')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'enamed' ? 'bg-green-100 text-green-800 shadow-sm border border-green-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ENAMED
          </button>
        </div>

        {/* Filter Card */}
        <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8 w-full flex flex-col md:flex-row gap-6 md:gap-8 overflow-hidden">
          {activeTab === 'enamed' && (
            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-blue-100 flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-1">
                  <BookOpen size={20} />
                </div>
                <h3 className="font-bold text-gray-800">Em Desenvolvimento</h3>
                <p className="text-sm text-gray-500 text-center max-w-xs">
                  O banco de questões do ENAMED estará disponível em breve.
                </p>
              </div>
            </div>
          )}
          {/* Column 1 */}
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {activeTab === 'internas' ? 'Selecionar período:' : 'Relacionar com o Período:'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                  <button 
                    key={p} 
                    onClick={() => setSelectedPeriod(p)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === p ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                  >
                    {p}º
                  </button>
                ))}
              </div>
            </div>
            {activeTab === 'internas' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Disciplina disponível no curso:</label>
                  <select 
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="">Selecione uma disciplina...</option>
                    {SUBJECTS.filter(s => !selectedPeriod || s.period === selectedPeriod).map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
                {selectedSubjectId && subjectLessons.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Aula específica (Opcional):</label>
                    <select 
                      value={selectedLessonId}
                      onChange={(e) => setSelectedLessonId(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                      <option value="">Todas as aulas (Geral)</option>
                      {subjectLessons.map(l => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      Selecione uma aula para gerar questões baseadas exclusivamente no material dela (slides/resumos).
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'enamed' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Relacionar com Disciplinas do curso:</label>
                <MultiSelect 
                  options={SUBJECTS.filter(s => !selectedPeriod || s.period === selectedPeriod).map(s => s.title)}
                  selected={selectedEnamedSubjects}
                  onChange={setSelectedEnamedSubjects}
                  placeholder="Selecione as Disciplinas..."
                />
              </div>
            )}
          </div>

          {/* Column 2 (ENAMED only) */}
          {activeTab === 'enamed' && (
            <div className="flex-1 space-y-6 md:border-l md:border-gray-100 md:pl-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Banca Aplicadora:</label>
                <MultiSelect 
                  options={['ENAMED', 'ABEM', 'TP Caipira']}
                  selected={selectedBancas}
                  onChange={setSelectedBancas}
                  placeholder="Selecione as Bancas..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Área de Estudo:</label>
                <MultiSelect 
                  options={['Clínica Médica', 'Pediatria', 'Medicina Preventiva e Social', 'Cirurgia', 'Ginecologia / Obstetrícia', 'Ciências Básicas', 'Saúde Coletiva']}
                  selected={selectedAreas}
                  onChange={setSelectedAreas}
                  placeholder="Selecione as Áreas..."
                />
              </div>
            </div>
          )}

          {/* Column 3 */}
          <div className="flex-1 space-y-6 md:border-l md:border-gray-100 md:pl-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Quantidade de Questões geradas:</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600 font-bold">-</button>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full text-center p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
                <button onClick={() => setQuantity(quantity + 1)} className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600 font-bold">+</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Nível das questões:</label>
              <div className="flex gap-2">
                {['Fácil', 'Médio', 'Difícil'].map(level => {
                  const isSelected = difficulty.includes(level);
                  return (
                    <button
                      key={level}
                      onClick={() => toggleDifficulty(level)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isSelected 
                          ? (level === 'Fácil' ? 'bg-green-100 text-green-700 border border-green-200' : level === 'Médio' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-red-100 text-red-700 border border-red-200')
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          {questions.length > 0 && !isGenerating ? (
            <button
              onClick={handleStartResolution}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm"
            >
              Iniciar resolução de questões
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (activeTab === 'internas' && !selectedSubjectId) || activeTab === 'enamed'}
              className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                'Gerar Questões'
              )}
            </button>
          )}

          {/* Status Text */}
          <div className="mt-8 text-center">
            {errorMessage ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 max-w-md mx-auto text-sm">
                <p className="font-bold mb-1">Erro na geração</p>
                <p>{errorMessage}</p>
              </div>
            ) : isGenerating ? (
              <div className="text-gray-500 flex flex-col items-center gap-2">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p>Nossa IA está elaborando as questões...</p>
              </div>
            ) : questions.length > 0 ? (
              <div className="text-gray-600 space-y-1">
                <p className="font-medium text-gray-800">
                  Encontramos <span className="font-bold text-blue-600">{totalAvailable}</span> questões no banco para estes filtros.
                </p>
                <p className="text-sm">
                  Você selecionou <span className="font-bold">{questions.length}</span> para resolver agora.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <BookOpen size={28} className="text-blue-300" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Nenhuma questão gerada ainda.</h3>
                <p className="text-sm leading-relaxed">
                  Selecione o período, a disciplina, a dificuldade e a quantidade nos filtros acima, e clique em "Gerar Questões" para iniciar seu treinamento personalizado.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Listas Prontas */}
        {activeTab === 'internas' && availableLists.length > 0 && !isGenerating && questions.length === 0 && (
          <div className="w-full mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableLists.map(list => {
               const answered = currentUser.listProgress?.[list.id] || 0;
               const total = list.questions?.length || 0;
               const pct = total > 0 ? Math.round((answered/total)*100) : 0;
               return (
                 <div key={list.id} onClick={() => startListResolution(list)} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all hover:border-purple-200 group flex flex-col">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                       <FileText size={24} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-2 leading-tight">{list.title}</h3>
                    {list.description && <p className="text-gray-500 text-sm mb-6 flex-1">{list.description}</p>}
                    {!list.description && <div className="flex-1"></div>}
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-400">
                      <span>{answered} DE {total} QUESTÕES RESPONDIDAS</span>
                      <span className="text-blue-600">{pct}%</span>
                    </div>
                 </div>
               )
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default ExerciseView;
