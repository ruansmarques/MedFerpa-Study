import React, { useState } from 'react';
import { SUBJECTS, LESSONS, EXERCISES } from '../constants';
import { Subject, Lesson } from '../types';

const ExerciseView: React.FC = () => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  
  // Quiz State: map of exerciseId -> selected option index
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});

  const filteredLessons = LESSONS.filter(l => l.subjectId === selectedSubjectId);
  
  const filteredExercises = EXERCISES.filter(ex => {
    if (selectedSubjectId && ex.subjectId !== selectedSubjectId) return false;
    if (selectedLessonId && ex.lessonId !== selectedLessonId) return false;
    return true;
  });

  const handleSelectOption = (exerciseId: string, optionIndex: number) => {
    if (showResults[exerciseId]) return; // Lock if checked
    setAnswers(prev => ({ ...prev, [exerciseId]: optionIndex }));
  };

  const handleCheckAnswer = (exerciseId: string) => {
    if (answers[exerciseId] === undefined) return;
    setShowResults(prev => ({ ...prev, [exerciseId]: true }));
  };

  return (
    <div className="p-4 lg:p-10 max-w-4xl mx-auto pb-20">
      <h2 className="text-xl lg:text-2xl font-bold text-slate-800 mb-6 lg:mb-8">Banco de Questões</h2>

      {/* Filters */}
      <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Disciplina</label>
          <select 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setSelectedLessonId(''); // Reset lesson
            }}
          >
            <option value="">Todas as Disciplinas</option>
            {SUBJECTS.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Aula (Tema)</label>
          <select 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            disabled={!selectedSubjectId}
          >
            <option value="">Todos os Temas</option>
            {filteredLessons.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            Nenhuma questão encontrada para os filtros selecionados.
          </div>
        ) : (
          filteredExercises.map((exercise, index) => {
            const isAnswered = answers[exercise.id] !== undefined;
            const isChecked = showResults[exercise.id];
            const isCorrect = isChecked && answers[exercise.id] === exercise.correctOptionIndex;

            return (
              <div key={exercise.id} className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wide">
                    Questão {index + 1}
                  </span>
                  {isChecked && (
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isCorrect ? 'Correto' : 'Incorreto'}
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-medium text-slate-800 mb-6">{exercise.question}</h3>

                <div className="space-y-3">
                  {exercise.options.map((option, idx) => {
                    let btnClass = "border-gray-200 hover:bg-gray-50 text-slate-600";
                    
                    if (answers[exercise.id] === idx) {
                        btnClass = "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500";
                    }

                    if (isChecked) {
                      if (idx === exercise.correctOptionIndex) {
                        btnClass = "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500 font-medium";
                      } else if (answers[exercise.id] === idx) {
                         btnClass = "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500";
                      } else {
                         btnClass = "opacity-50 border-gray-100";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(exercise.id, idx)}
                        disabled={isChecked}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${btnClass}`}
                      >
                        <span className="inline-block w-6 font-bold opacity-50 mr-2">{String.fromCharCode(65 + idx)}.</span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                {!isChecked && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => handleCheckAnswer(exercise.id)}
                      disabled={!isAnswered}
                      className="w-full lg:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Verificar Resposta
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExerciseView;