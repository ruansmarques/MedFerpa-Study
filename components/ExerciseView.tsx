
import React, { useState } from 'react';
import { SUBJECTS } from '../constants';
import { User, Exercise } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { BookOpen, Brain, Target, CheckCircle, XCircle, Loader2, Filter, ChevronLeft } from 'lucide-react';

interface ExerciseViewProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onExit: () => void;
  onAddXP: (amount: number) => void; 
}

const ExerciseView: React.FC<ExerciseViewProps> = ({ currentUser, onExit, onAddXP }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [quantity, setQuantity] = useState<number>(5);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Exercise[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async () => {
    if (!selectedSubjectId) {
      alert("Selecione uma disciplina primeiro.");
      return;
    }
    
    const subject = SUBJECTS.find(s => s.id === selectedSubjectId);
    if (!subject) return;

    setIsGenerating(true);
    setQuestions([]);
    setAnswers({});
    setShowResults(false);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: `Você é um professor de medicina. Gere ${quantity} questões de múltipla escolha sobre o assunto "${subject.title}" para estudantes de medicina. 
            Nível de dificuldade: ${difficulty} de 6 (1 é básico, 6 é avançado/especializado). 
            As questões devem ser em Português do Brasil.
            Retorne um array JSON de objetos com as propriedades: "question" (string), "options" (array de exatas 4 strings), "correctOptionIndex" (inteiro 0-3) e "explanation" (string com a resolução/explicação da resposta correta).`,
            config: {
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

        const generatedData = JSON.parse(response.text || '[]');
        const newQuestions: Exercise[] = generatedData.map((q: any, i: number) => ({
            ...q,
            id: `ai-gen-${subject.id}-${Date.now()}-${i}`,
            subjectId: subject.id,
            lessonId: 'ai-generated'
        }));

        setQuestions(newQuestions);
    } catch (error) {
        console.error("Erro ao gerar questões com AI:", error);
        alert("Ocorreu um erro ao gerar as questões. Tente novamente.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleFinish = () => {
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm("Você não respondeu todas as questões. Deseja finalizar mesmo assim?")) {
        return;
      }
    }
    
    setShowResults(true);
    
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const xpEarned = correctCount * 10 * difficulty;
    if (xpEarned > 0) {
      onAddXP(xpEarned);
    }
  };

  const correctAnswersCount = questions.filter(q => answers[q.id] === q.correctOptionIndex).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar de Filtros */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-auto md:h-screen sticky top-0 z-10 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <button 
            onClick={onExit}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            title="Voltar"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen size={24} className="text-blue-600" />
              Banco de Questões
            </h2>
            <p className="text-sm text-gray-500 mt-1">Gere questões personalizadas</p>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              Disciplina
            </label>
            <select 
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            >
              <option value="">Selecione uma disciplina...</option>
              {SUBJECTS.map(s => (
                <option key={s.id} value={s.id}>{s.period}º Período - {s.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Brain size={16} className="text-gray-400" />
              Dificuldade ({difficulty})
            </label>
            <input 
              type="range" 
              min="1" 
              max="6" 
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 font-medium">
              <span>Básico</span>
              <span>Avançado</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Target size={16} className="text-gray-400" />
              Quantidade
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map(num => (
                <button
                  key={num}
                  onClick={() => setQuantity(num)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    quantity === num 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedSubjectId}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
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
        </div>
      </div>

      {/* Área Principal de Questões */}
      <div className="flex-1 h-screen overflow-y-auto bg-gray-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {isGenerating ? (
            <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-gray-400 space-y-4">
              <Loader2 size={48} className="animate-spin text-blue-500" />
              <p className="text-lg font-medium text-gray-600">Nossa IA está elaborando as questões...</p>
              <p className="text-sm">Isso pode levar alguns segundos.</p>
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-8 pb-24">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                    {questions.length}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Questões Geradas</h3>
                    <p className="text-xs text-gray-500">Nível {difficulty} • {SUBJECTS.find(s => s.id === selectedSubjectId)?.title}</p>
                  </div>
                </div>
                {showResults && (
                  <div className="text-right">
                    <div className="text-2xl font-black text-blue-600">
                      {correctAnswersCount}/{questions.length}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Acertos</div>
                  </div>
                )}
              </div>

              {questions.map((q, qIndex) => (
                <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center font-bold text-sm">
                        {qIndex + 1}
                      </span>
                      <h4 className="text-lg font-semibold text-gray-800 leading-relaxed pt-1">
                        {q.question}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-3">
                    {q.options.map((opt, optIndex) => {
                      const isSelected = answers[q.id] === optIndex;
                      const isCorrect = q.correctOptionIndex === optIndex;
                      
                      let optionClass = "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700";
                      let icon = null;

                      if (isSelected && !showResults) {
                        optionClass = "border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500";
                      } else if (showResults) {
                        if (isCorrect) {
                          optionClass = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500";
                          icon = <CheckCircle size={20} className="text-emerald-600" />;
                        } else if (isSelected && !isCorrect) {
                          optionClass = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500 opacity-70";
                          icon = <XCircle size={20} className="text-red-600" />;
                        } else {
                          optionClass = "border-gray-200 text-gray-400 opacity-50";
                        }
                      }

                      return (
                        <button
                          key={optIndex}
                          onClick={() => handleOptionSelect(q.id, optIndex)}
                          disabled={showResults}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-4 ${optionClass}`}
                        >
                          <span className="flex-1">{opt}</span>
                          {icon}
                        </button>
                      );
                    })}
                  </div>
                  
                  {showResults && q.explanation && (
                    <div className="px-6 pb-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-900">
                        <h5 className="font-bold flex items-center gap-2 mb-2">
                          <BookOpen size={16} /> Resolução
                        </h5>
                        <p className="leading-relaxed">{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!showResults ? (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleFinish}
                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Finalizar e Ver Resultados
                  </button>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800">Treinamento Concluído!</h3>
                  <p className="text-gray-600">
                    Você acertou <strong className="text-blue-600">{correctAnswersCount}</strong> de {questions.length} questões.
                    {correctAnswersCount > 0 && ` Ganhou ${correctAnswersCount * 10 * difficulty} XP!`}
                  </p>
                  <button
                    onClick={() => {
                      setQuestions([]);
                      setAnswers({});
                      setShowResults(false);
                    }}
                    className="mt-6 px-8 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                  >
                    Gerar Novas Questões
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 opacity-60">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-2">
                <BookOpen size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-700">Nenhuma questão gerada</h3>
              <p className="text-gray-500 max-w-sm">
                Selecione uma disciplina, ajuste a dificuldade e clique em "Gerar Questões" para começar seu treinamento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseView;

