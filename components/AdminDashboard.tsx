
import React, { useState, useEffect } from 'react';
import { SUBJECTS, DEFAULT_SUBJECT_SLOTS } from '../constants';
import { supabase } from '../supabase';
import { IconCheck, IconX, IconEdit, IconPresentation, IconBook } from './Icons';
import { Lesson } from '../types';

interface AdminDashboardProps {
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Form state
  const [entryType, setEntryType] = useState<'class' | 'notice'>('class');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState<number>(5);
  const [subjectId, setSubjectId] = useState('');
  const [category, setCategory] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [date, setDate] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isContinuation, setIsContinuation] = useState(false);
  const [examPeriod, setExamPeriod] = useState<'N1' | 'N2' | 'Práticas'>('N2');
  
  const [slideUrlInput, setSlideUrlInput] = useState('');
  const [summaryUrlInput, setSummaryUrlInput] = useState('');
  const [uploadingSlide, setUploadingSlide] = useState(false);
  const [uploadingSummary, setUploadingSummary] = useState(false);
  
  const [dbLessons, setDbLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);

  // --- Questions & Tagging States (v2.031) ---
  const [adminTab, setAdminTab] = useState<'classes' | 'questions'>('classes');
  const [dbQuestions, setDbQuestions] = useState<any[]>([]);
  const [q_editingId, setQ_editingId] = useState<string | null>(null);
  const [q_questionText, setQ_questionText] = useState('');
  const [q_options, setQ_options] = useState<string[]>(['', '', '', '']);
  const [q_correctOptionIndex, setQ_correctOptionIndex] = useState<number>(0);
  const [q_explanation, setQ_explanation] = useState('');
  const [q_difficulty, setQ_difficulty] = useState<'Fácil' | 'Médio' | 'Difícil'>('Médio');
  const [q_area, setQ_area] = useState<string>('Clínica Médica');
  const [q_banca, setQ_banca] = useState<string>('');
  const [q_ano, setQ_ano] = useState<string>('');
  const [q_subjectId, setQ_subjectId] = useState<string>('');
  const [q_lessonId, setQ_lessonId] = useState<string>('');
  const [q_selectedPeriod, setQ_selectedPeriod] = useState<number>(5);
  const [q_selectedDisciplines, setQ_selectedDisciplines] = useState<string[]>([]);
  const [q_selectedLessons, setQ_selectedLessons] = useState<string[]>([]);
  const [customBancas, setCustomBancas] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('medferpa_custom_bancas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isBancaDropdownOpen, setIsBancaDropdownOpen] = useState(false);
  const [isTag4Expanded, setIsTag4Expanded] = useState(false);
  const [isTag5Expanded, setIsTag5Expanded] = useState(false);
  const [bancaConfirmDelete, setBancaConfirmDelete] = useState<string | null>(null);
  const [isCreatingNewBanca, setIsCreatingNewBanca] = useState(false);
  const [newBancaName, setNewBancaName] = useState('');

  useEffect(() => {
    localStorage.setItem('medferpa_custom_bancas', JSON.stringify(customBancas));
  }, [customBancas]);

  // Filtering states for question bank
  const [q_filterSubjectId, setQ_filterSubjectId] = useState<string>('');
  const [q_filterDifficulty, setQ_filterDifficulty] = useState<string>('');
  const [q_filterArea, setQ_filterArea] = useState<string>('');
  const [q_search, setQ_search] = useState<string>('');

  // Bulk Import state
  const [q_importOpen, setQ_importOpen] = useState<boolean>(false);
  const [showBulkImportHelper, setShowBulkImportHelper] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [q_importText, setQ_importText] = useState<string>('');
  const [q_bulkParsedQuestions, setQ_bulkParsedQuestions] = useState<any[]>([]);
  const [q_bulkSubjectId, setQ_bulkSubjectId] = useState<string>('');
  const [q_bulkLessonId, setQ_bulkLessonId] = useState<string>('');
  const [q_bulkDifficulty, setQ_bulkDifficulty] = useState<'Fácil' | 'Médio' | 'Difícil'>('Médio');
  const [q_bulkArea, setQ_bulkArea] = useState<string>('Clínica Médica');
  const [q_bulkBanca, setQ_bulkBanca] = useState<string>('');

  // Helper to get current lesson being edited
  const editingLesson = editingId ? dbLessons.find(l => l.id === editingId) : null;

  // --- AUTOMATION: Pre-select slots based on subject ---
  useEffect(() => {
    if (subjectId && !editingId) {
      const defaultSlots = DEFAULT_SUBJECT_SLOTS[subjectId] || [];
      setSelectedSlots(defaultSlots);
    }
    
    // Auto-set period based on subject if subject changes
    const subj = SUBJECTS.find(s => s.id === subjectId);
    if (subj) {
      setPeriod(subj.period);
    }
  }, [subjectId, editingId]);

  const fetchLessons = async () => {
    try {
      const { data: snap, error } = await supabase.from('lessons').select('*');
      if (error) throw error;
      
      const list: Lesson[] = (snap || []).map((d: any) => ({ ...d }));
      // Sort in memory to avoid needing Firestore index
      list.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
      });
      setDbLessons(list);
    } catch (err: any) {
      console.error("Error fetching admin lessons: ", err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase.from('questions').select('*');
      if (error) throw error;
      
      const list = (data || []).map((q: any) => {
        let explanation = q.explanation || '';
        let difficulty = q.difficulty || 'Médio';
        let area = q.area || 'Clínica Médica';
        let banca = q.banca || 'Outros';
        let ano = '';

        if (q.explanation && q.explanation.startsWith('{"tags":')) {
          try {
            const parsed = JSON.parse(q.explanation);
            if (parsed.tags) {
              difficulty = parsed.tags.difficulty || difficulty;
              area = parsed.tags.area || area;
              banca = parsed.tags.banca || banca;
              ano = parsed.tags.ano || '';
              explanation = parsed.explanation || '';
            }
          } catch (e) {
            // Keep original
          }
        }

        return {
          ...q,
          explanation,
          difficulty,
          area,
          banca,
          ano
        };
      });
      setDbQuestions(list);
    } catch (err: any) {
      console.error("Error fetching questions: ", err);
    }
  };

  useEffect(() => { 
    if (isAuthenticated) {
      fetchLessons(); 
      fetchQuestions();
    }
  }, [isAuthenticated]);

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (q_selectedDisciplines.length === 0) {
      alert("Selecione pelo menos uma disciplina.");
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        subjectId: q_selectedDisciplines.join(','),
        lessonId: q_selectedLessons.length > 0 ? q_selectedLessons.join(',') : null,
        question: q_questionText.trim(),
        options: q_options.map(o => o.trim()),
        correctOptionIndex: q_correctOptionIndex,
        explanation: JSON.stringify({
          tags: {
            difficulty: q_difficulty,
            area: q_area,
            banca: q_banca.trim() || 'Outros',
            ano: q_ano.trim()
          },
          explanation: q_explanation.trim()
        }),
        difficulty: q_difficulty,
        area: q_area,
        banca: q_banca.trim() || 'Outros'
      };

      if (q_editingId) {
        const { error } = await supabase.from('questions').update(payload).eq('id', q_editingId);
        if (error) {
          const fallbackPayload = {
            subjectId: payload.subjectId,
            lessonId: payload.lessonId,
            question: payload.question,
            options: payload.options,
            correctOptionIndex: payload.correctOptionIndex,
            explanation: payload.explanation
          };
          const { error: fallbackError } = await supabase.from('questions').update(fallbackPayload).eq('id', q_editingId);
          if (fallbackError) throw fallbackError;
        }
      } else {
        payload.id = crypto.randomUUID();
        const { error } = await supabase.from('questions').insert(payload);
        if (error) {
          const fallbackPayload = {
            id: payload.id,
            subjectId: payload.subjectId,
            lessonId: payload.lessonId,
            question: payload.question,
            options: payload.options,
            correctOptionIndex: payload.correctOptionIndex,
            explanation: payload.explanation
          };
          const { error: fallbackError } = await supabase.from('questions').insert(fallbackPayload);
          if (fallbackError) throw fallbackError;
        }
      }

      setSuccessMsg("Questão salva com sucesso!");
      fetchQuestions();
      clearQuestionForm();
    } catch (err: any) {
      alert("Erro ao salvar questão: " + err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleQuestionDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir esta questão?")) {
      setLoading(true);
      try {
        const { error } = await supabase.from('questions').delete().eq('id', id);
        if (error) throw error;
        fetchQuestions();
      } catch (err: any) {
        alert("Erro ao excluir questão: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const clearQuestionForm = () => {
    setQ_editingId(null);
    setQ_questionText('');
    setQ_options(['', '', '', '']);
    setQ_correctOptionIndex(0);
    setQ_explanation('');
    setQ_difficulty('Médio');
    setQ_area('Clínica Médica');
    setQ_banca('ENAMED');
    setQ_ano('');
    setQ_selectedPeriod(5);
    setQ_selectedDisciplines([]);
    setQ_selectedLessons([]);
    setIsBancaDropdownOpen(false);
    setIsTag4Expanded(false);
    setIsTag5Expanded(false);
  };

  const handleQuestionEdit = (q: any) => {
    setQ_editingId(q.id);
    setQ_questionText(q.question);
    setQ_options([...q.options]);
    setQ_correctOptionIndex(q.correctOptionIndex);
    setQ_explanation(q.explanation);
    setQ_difficulty(q.difficulty);
    setQ_area(q.area);
    setQ_banca(q.banca || 'ENAMED');
    setQ_ano(q.ano || '');
    
    // Parse disciplines
    const disciplines = q.subjectId ? q.subjectId.split(',').map((s: string) => s.trim()) : [];
    setQ_selectedDisciplines(disciplines);
    
    // Parse lessons
    const lessons = q.lessonId ? q.lessonId.split(',').map((s: string) => s.trim()) : [];
    setQ_selectedLessons(lessons);

    // Find period from first discipline
    if (disciplines.length > 0) {
      const firstSubjId = disciplines[0].split(':')[0];
      const foundSubj = SUBJECTS.find(s => s.id === firstSubjId);
      if (foundSubj) {
        setQ_selectedPeriod(foundSubj.period);
      }
    }
  };

  const handleProcessBulkImport = () => {
    if (!q_importText.trim()) {
      alert("Por favor, cole o texto das questões primeiro.");
      return;
    }
    
    const lines = q_importText.split('\n');
    const parsed: any[] = [];
    let currentQuestion: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const questionMatch = line.match(/^(?:Quest[ãa]o\s+)?(\d+)[.)\s:-]+(.*)/i);
      if (questionMatch) {
        if (currentQuestion) {
          parsed.push(currentQuestion);
        }
        currentQuestion = {
          tempId: crypto.randomUUID(),
          question: questionMatch[2].trim(),
          options: [],
          correctOptionIndex: 0,
          explanation: '',
          difficulty: q_bulkDifficulty,
          area: q_bulkArea,
          banca: q_bulkBanca.trim() || 'ENAMED',
          subjectId: q_bulkSubjectId || '',
          lessonId: q_bulkLessonId || ''
        };
        continue;
      }
      
      if (currentQuestion) {
        const optionMatch = line.match(/^[a-eA-E][.)\s:-]+(.*)/);
        if (optionMatch) {
          currentQuestion.options.push(optionMatch[1].trim());
          continue;
        }
        
        const gabaritoMatch = line.match(/^(?:Gabarito|Resposta|Resp|Gabarit)[.:\s]+([a-eA-E])/i);
        if (gabaritoMatch) {
          const letter = gabaritoMatch[1].toUpperCase();
          currentQuestion.correctOptionIndex = letter.charCodeAt(0) - 65;
          continue;
        }

        const anoMatch = line.match(/^(?:Ano)[.:\s]+(\d+)/i);
        if (anoMatch) {
          currentQuestion.ano = anoMatch[1].trim();
          continue;
        }
        
        const explanationMatch = line.match(/^(?:Explica[çc][ãa]o|Justificativa|Resolu[çc][ãa]o)[.:\s]+(.*)/i);
        if (explanationMatch) {
          currentQuestion.explanation = explanationMatch[1].trim();
          continue;
        }
        
        if (currentQuestion.explanation) {
          currentQuestion.explanation += '\n' + line;
        } else if (currentQuestion.options.length === 0) {
          currentQuestion.question += '\n' + line;
        } else {
          const lastIdx = currentQuestion.options.length - 1;
          currentQuestion.options[lastIdx] += '\n' + line;
        }
      }
    }
    
    if (currentQuestion) {
      parsed.push(currentQuestion);
    }
    
    if (parsed.length === 0) {
      alert("Nenhuma questão foi identificada. Certifique-se de que o texto colado tenha numeração de questões (ex: 1., 2., Questão 3) e alternativas (ex: A), B), C)).");
      return;
    }
    
    setQ_bulkParsedQuestions(parsed);
  };

  const handleSaveBulkQuestions = async () => {
    if (q_bulkParsedQuestions.length === 0) return;
    
    const invalid = q_bulkParsedQuestions.some(q => !q.subjectId);
    if (invalid) {
      alert("Por favor, garanta que todas as questões importadas tenham uma Disciplina selecionada antes de salvar.");
      return;
    }
    
    setLoading(true);
    try {
      let savedCount = 0;
      
      for (const q of q_bulkParsedQuestions) {
        const payload: any = {
          id: crypto.randomUUID(),
          subjectId: q.subjectId,
          lessonId: q.lessonId || null,
          question: q.question.trim(),
          options: q.options.map((o: string) => o.trim()),
          correctOptionIndex: q.correctOptionIndex,
          explanation: JSON.stringify({
            tags: {
              difficulty: q.difficulty,
              area: q.area,
              banca: q.banca || 'ENAMED',
              ano: q.ano || ''
            },
            explanation: q.explanation.trim()
          }),
          difficulty: q.difficulty,
          area: q.area,
          banca: q.banca || 'ENAMED'
        };
        
        const { error } = await supabase.from('questions').insert(payload);
        if (error) {
          const fallbackPayload = {
            id: payload.id,
            subjectId: payload.subjectId,
            lessonId: payload.lessonId,
            question: payload.question,
            options: payload.options,
            correctOptionIndex: payload.correctOptionIndex,
            explanation: payload.explanation
          };
          const { error: fallbackError } = await supabase.from('questions').insert(fallbackPayload);
          if (fallbackError) throw fallbackError;
        }
        savedCount++;
      }
      
      setSuccessMsg(`${savedCount} questões salvas com sucesso no banco!`);
      fetchQuestions();
      setQ_bulkParsedQuestions([]);
      setQ_importText('');
      setQ_importOpen(false);
    } catch (err: any) {
      alert("Erro ao salvar lote de questões: " + err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('admins').select('*').eq('accessKey', password.trim());
    if (!error && data && data.length > 0) setIsAuthenticated(true); 
    else alert("Senha incorreta");
  };



  // Fix: Clear form state
  const clearForm = () => {
    setEditingId(null);
    setTitle('');
    setDate('');
    setNoticeMessage('');
    setSelectedSlots([]);
    setYoutubeLink('');
    setSlideUrlInput('');
    setSummaryUrlInput('');
    setIsContinuation(false);
    setExamPeriod('N2');
    // Don't reset period to 5, keep user context or let it update via subject
  };

  // Fix: Handle Edit
  const handleEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setEntryType(lesson.type || 'class');
    setTitle(lesson.title);
    setSubjectId(lesson.subjectId);
    setCategory(lesson.category || '');
    setDate(lesson.date || '');
    setNoticeMessage(lesson.description || '');
    setSelectedSlots(lesson.targetSlots || []);
    setYoutubeLink(lesson.youtubeIds?.[0] ? `https://www.youtube.com/watch?v=${lesson.youtubeIds[0]}` : '');
    setPeriod(lesson.period);
    setIsContinuation(lesson.isContinuation || false);
    setExamPeriod(lesson.examPeriod || 'N2');
    setSlideUrlInput(lesson.slideUrl || '');
    setSummaryUrlInput(lesson.summaryUrl || '');
  };

  // Fix: Handle Delete
  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este registro?")) {
        setLoading(true);
        try {
            const { error } = await supabase.from('lessons').delete().eq('id', id);
            if (error) throw error;
            fetchLessons();
        } catch (e: any) {
            alert("Erro ao excluir: " + e.message);
        } finally {
            setLoading(false);
        }
    }
  };

  const handleToggleSelectAll = (filteredSubset: Lesson[]) => {
      if (selectedLessonIds.length === filteredSubset.length && filteredSubset.length > 0) {
          setSelectedLessonIds([]);
      } else {
          setSelectedLessonIds(filteredSubset.map(l => l.id));
      }
  };

  const handleToggleSelectRow = (id: string) => {
      setSelectedLessonIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'slide' | 'summary') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'slide') setUploadingSlide(true);
    else setUploadingSummary(true);

    try {
      const extension = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
      
      const { data, error } = await supabase.storage
        .from('materials')
        .upload(`uploads/${type}s/${uniqueFileName}`, file);
        
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('materials')
        .getPublicUrl(`uploads/${type}s/${uniqueFileName}`);

      if (type === 'slide') {
        setSlideUrlInput(urlData.publicUrl);
      } else {
        setSummaryUrlInput(urlData.publicUrl);
      }
    } catch (err: any) {
      alert("Erro ao fazer upload: " + err.message);
    } finally {
      if (type === 'slide') setUploadingSlide(false);
      else setUploadingSummary(false);
    }
  };

  const handleMassEdit = async (action: string) => {
      if (selectedLessonIds.length === 0) return;
      
      setLoading(true);
      try {
          const promises = selectedLessonIds.map(id => {
              let updatePayload: any = {};
              if (action === 'continuation-true') updatePayload.isContinuation = true;
              if (action === 'continuation-false') updatePayload.isContinuation = false;
              if (action === 'exam-n1') updatePayload.examPeriod = 'N1';
              if (action === 'exam-n2') updatePayload.examPeriod = 'N2';
              if (action === 'exam-praticas') updatePayload.examPeriod = 'Práticas';
              if (action === 'cat-geral') updatePayload.category = 'Geral';
              if (action === 'cat-micro') updatePayload.category = 'Microbiologia';
              if (action === 'cat-parasi') updatePayload.category = 'Parasitologia';
              if (action === 'cat-imuno') updatePayload.category = 'Imunologia';
              if (action === 'cat-patogeral') updatePayload.category = 'Patologia Geral';
              
              return supabase.from('lessons').update(updatePayload).eq('id', id);
          });
          
          await Promise.all(promises);
          
          setSuccessMsg("Edição em massa concluída!");
          fetchLessons();
          setSelectedLessonIds([]);
      } catch (e: any) {
          alert("Erro na edição em massa: " + e.message);
      } finally {
          setTimeout(() => setSuccessMsg(""), 3000);
          setLoading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const currentLesson = dbLessons.find(l => l.id === editingId);

      const payload: any = {
        subjectId, title, period, date, category, type: entryType,
        description: entryType === 'notice' ? noticeMessage : null,
        targetSlots: selectedSlots,
        slideUrl: slideUrlInput ? slideUrlInput : null,
        summaryUrl: summaryUrlInput ? summaryUrlInput : null,
        youtubeIds: youtubeLink ? [youtubeLink.split('v=')[1]?.split('&')[0] || youtubeLink] : (currentLesson?.youtubeIds || []),
        updatedAt: new Date().toISOString(),
        isContinuation,
        examPeriod
      };

      if (editingId) {
        const { error } = await supabase.from('lessons').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        payload.id = crypto.randomUUID();
        payload.createdAt = new Date().toISOString();
        const { error } = await supabase.from('lessons').insert(payload);
        if (error) throw error;
      }
      setSuccessMsg("Salvo com sucesso!");
      fetchLessons();
      clearForm();
    } catch(err: any) {
        alert("Erro: " + err.message);
    } finally { setLoading(false); }
  };

  if (!isAuthenticated) return (
    <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full">
        <h1 className="text-2xl font-black mb-6 text-center">Admin Access</h1>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Access Key" className="w-full p-4 border rounded-xl mb-4 text-center tracking-widest outline-none focus:ring-2 ring-blue-500" />
        <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition">Entrar</button>
      </form>
    </div>
  );

  // Filter lessons based on form state
  const filteredLessons = dbLessons.filter(l => {
    const type = l.type || 'class';
    if (type !== entryType) return false;
    
    // Fix: If a subject is selected, we want to see ALL lessons for that subject,
    // regardless of the period stored in the lesson (in case of data inconsistency).
    // Only filter by period if NO subject is selected.
    if (!subjectId && l.period !== period) return false;
    
    if (subjectId && l.subjectId !== subjectId) return false;
    if (category && l.category !== category) return false;
    return true;
  }).sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;
    const ca = a.createdAt || '';
    const cb = b.createdAt || '';
    if (ca > cb) return -1;
    if (ca < cb) return 1;
    return 0;
  });

  // Computed available disciplines based on selected period
  const getDisciplinesForPeriod = (p: number) => {
    const list: any[] = [];
    const filteredSubjects = SUBJECTS.filter(s => s.period === p);
    
    filteredSubjects.forEach(s => {
      if (s.id === 'proc-patol') {
        list.push({ value: 'proc-patol:cat-patogeral', label: 'Processos Patológicos: Patologia Geral', subjectId: 'proc-patol', category: 'cat-patogeral' });
        list.push({ value: 'proc-patol:cat-parasi', label: 'Processos Patológicos: Parasitologia', subjectId: 'proc-patol', category: 'cat-parasi' });
        list.push({ value: 'proc-patol:cat-micro', label: 'Processos Patológicos: Microbiologia', subjectId: 'proc-patol', category: 'cat-micro' });
        list.push({ value: 'proc-patol:cat-imuno', label: 'Processos Patológicos: Imunologia', subjectId: 'proc-patol', category: 'cat-imuno' });
      } else if (s.id === 'anat-patol') {
        list.push({ value: 'anat-patol:cat-geral', label: 'Anatomia Patológica: Geral', subjectId: 'anat-patol', category: 'cat-geral' });
        list.push({ value: 'anat-patol:cat-parasi', label: 'Anatomia Patológica: Parasitologia', subjectId: 'anat-patol', category: 'cat-parasi' });
        list.push({ value: 'anat-patol:cat-micro', label: 'Anatomia Patológica: Microbiologia', subjectId: 'anat-patol', category: 'cat-micro' });
      } else {
        list.push({ value: s.id, label: s.title, subjectId: s.id, category: null });
      }
    });
    return list;
  };

  const getLessonsForDisciplines = (selectedDisciplineValues: string[]) => {
    if (selectedDisciplineValues.length === 0) return [];
    
    // Category mapping from internal ID to DB value
    const catMap: Record<string, string> = {
      'cat-patogeral': 'Patologia Geral',
      'cat-parasi': 'Parasitologia',
      'cat-micro': 'Microbiologia',
      'cat-imuno': 'Imunologia',
      'cat-geral': 'Geral'
    };

    // Parse selected discipline values
    const parsed = selectedDisciplineValues.map(val => {
      const parts = val.split(':');
      const rawCat = parts[1] || null;
      return {
        subjectId: parts[0],
        category: rawCat ? (catMap[rawCat] || rawCat) : null
      };
    });
    
    return dbLessons.filter(l => {
      return parsed.some(p => {
        if (l.subjectId !== p.subjectId) return false;
        if (p.category) {
          return l.category === p.category;
        }
        return true;
      });
    });
  };

  const executeBancaDelete = async (bancaToDelete: string) => {
    const DEFAULT_BANCAS_LIST = ['ENAMED', 'ENARE', 'USP/HCRP', 'Revalida', 'Outros'];
    if (DEFAULT_BANCAS_LIST.includes(bancaToDelete)) {
      setSuccessMsg("Não é possível excluir bancas padrão.");
      setTimeout(() => setSuccessMsg(''), 4000);
      setBancaConfirmDelete(null);
      return;
    }

    const count = dbQuestions.filter((q: any) => q.banca === bancaToDelete).length;
    if (count > 0) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('questions')
          .update({ banca: 'Outros' })
          .eq('banca', bancaToDelete);
          
        if (error) throw error;
        
        setSuccessMsg(`Banca "${bancaToDelete}" excluída e ${count} questões atualizadas.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchQuestions();
      } catch (err: any) {
        console.error("Erro ao atualizar questões: ", err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setSuccessMsg(`Banca "${bancaToDelete}" excluída.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }

    // Remove from customBancas
    setCustomBancas(prev => prev.filter(b => b !== bancaToDelete));
    if (q_banca === bancaToDelete) {
      setQ_banca('Outros');
    }
    setBancaConfirmDelete(null);
  };

  const availableDisciplinesForSelectedPeriod = getDisciplinesForPeriod(q_selectedPeriod);
  const availableLessonsForSelectedDisciplines = getLessonsForDisciplines(q_selectedDisciplines);

  const uniqueBancas = Array.from(new Set(
    dbQuestions
      .map(q => q.banca)
      .filter(b => b && typeof b === 'string' && b.trim() !== '')
  ));
  const DEFAULT_BANCAS = ['ENAMED', 'ENARE', 'USP/HCRP', 'Revalida', 'Outros'];
  const allBancas = Array.from(new Set([...DEFAULT_BANCAS, ...uniqueBancas, ...customBancas]));
  if (q_banca && !allBancas.includes(q_banca)) {
    allBancas.push(q_banca);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b p-4 px-8 flex justify-between items-center sticky top-0 z-50">
         <div className="flex items-center gap-8">
            <h1 className="font-black text-xl">MEDFERPA <span className="text-blue-600">ADMIN</span></h1>
         </div>
         {successMsg && (
           <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100 animate-pulse">
             {successMsg}
           </div>
         )}
         <button onClick={onExit} className="text-gray-400 hover:text-slate-800 font-bold">Sair do Painel</button>
      </header>

      {/* Selector de Abas de Administração */}
      <div className="bg-slate-900 text-white border-b border-slate-800 px-8 flex gap-6">
        <button 
          onClick={() => setAdminTab('classes')} 
          className={`py-4 font-bold text-sm border-b-2 transition-all ${adminTab === 'classes' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Aulas e Avisos
        </button>
        <button 
          onClick={() => setAdminTab('questions')} 
          className={`py-4 font-bold text-sm border-b-2 transition-all ${adminTab === 'questions' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Banco de Questões
        </button>
      </div>

      {adminTab === 'classes' ? (
        <main className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1400px] mx-auto w-full">
            {/* Formulário */}
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 sticky top-24 h-fit">
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                  <button onClick={() => setEntryType('class')} className={`flex-1 py-2 font-bold rounded-lg ${entryType === 'class' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>Aula</button>
                  <button onClick={() => setEntryType('notice')} className={`flex-1 py-2 font-bold rounded-lg ${entryType === 'notice' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>Aviso</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-400 uppercase">Período *</label>
                          <select value={period} onChange={e => setPeriod(Number(e.target.value))} className="p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 ring-blue-500" required>
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(p => <option key={p} value={p}>{p}º Período</option>)}
                          </select>
                      </div>
                      <div className="col-span-2 flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-400 uppercase">Disciplina *</label>
                          <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setCategory(''); }} className="p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 ring-blue-500" required>
                              <option value="">Selecione a Disciplina</option>
                              {SUBJECTS.filter(s => s.period === period).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                          </select>
                      </div>
                  </div>

                  {(subjectId === 'proc-patol' || subjectId === 'anat-patol') && (
                      <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-400 uppercase">Categoria</label>
                          <select value={category} onChange={e => setCategory(e.target.value)} className="p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 ring-blue-500">
                              <option value="">Selecione a Categoria</option>
                              {subjectId === 'proc-patol' && (
                                  <>
                                      <option value="Patologia Geral">Patologia Geral</option>
                                      <option value="Imunologia">Imunologia</option>
                                      <option value="Parasitologia">Parasitologia</option>
                                      <option value="Microbiologia">Microbiologia</option>
                                  </>
                              )}
                              {subjectId === 'anat-patol' && (
                                  <>
                                      <option value="Geral">Geral</option>
                                      <option value="Parasitologia">Parasitologia</option>
                                      <option value="Microbiologia">Microbiologia</option>
                                  </>
                              )}
                          </select>
                      </div>
                  )}

                  <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Data *</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-3 border rounded-xl bg-gray-50" required />
                  </div>

                  <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Período de Prova *</label>
                      <select value={examPeriod} onChange={e => setExamPeriod(e.target.value as 'N1' | 'N2' | 'Práticas')} className="p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 ring-blue-500" required>
                          <option value="N1">N1 (1º Bimestre)</option>
                          <option value="N2">N2 (2º Bimestre)</option>
                          <option value="Práticas">Aulas Práticas</option>
                      </select>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-800 mb-3 uppercase">Horários da Grade</p>
                      <div className="flex gap-2">
                          {['1', '2', '3'].map(s => (
                              <button key={s} type="button" onClick={() => setSelectedSlots(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])} 
                                  className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all ${selectedSlots.includes(s) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-100 text-blue-300'}`}>
                                  Slot {s}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Título *</label>
                      <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do Conteúdo" className="w-full p-3 border rounded-xl focus:ring-2 ring-blue-500" required />
                      
                      <div className="flex items-center gap-2 mt-2">
                          <input 
                              type="checkbox" 
                              id="isContinuation" 
                              checked={isContinuation} 
                              onChange={e => setIsContinuation(e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="isContinuation" className="text-sm text-gray-600 font-medium cursor-pointer">
                              Esta aula é uma continuação (Ocultar da Lista de Conteúdos)
                          </label>
                      </div>
                  </div>

                  {entryType === 'notice' ? (
                      <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-400 uppercase">Mensagem do Aviso *</label>
                          <textarea value={noticeMessage} onChange={e => setNoticeMessage(e.target.value)} placeholder="Motivo do cancelamento..." className="w-full p-3 border rounded-xl h-32" required />
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-gray-400 uppercase">Link do YouTube</label>
                              <input type="text" value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)} placeholder="URL do YouTube" className="w-full p-3 border rounded-xl" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1">
                                  <label className="text-xs font-bold text-gray-400 uppercase">Link do Slide</label>
                                  <div className="flex bg-white border rounded-xl overflow-hidden focus-within:ring-2 ring-blue-500 relative">
                                    <input type="url" value={slideUrlInput} onChange={e => setSlideUrlInput(e.target.value)} placeholder="URL do Google Drive (Slide)" className="w-full p-3 outline-none" />
                                    <label className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 flex items-center justify-center font-bold text-sm cursor-pointer border-l transition">
                                      {uploadingSlide ? '...' : 'Upload'}
                                      <input type="file" className="hidden" accept=".pdf,.ppt,.pptx" onChange={e => handleFileUpload(e, 'slide')} disabled={uploadingSlide} />
                                    </label>
                                  </div>
                                  {editingLesson?.slideUrl && !slideUrlInput && (
                                      <span className="text-xs text-blue-500 truncate mt-1">Atual: {editingLesson.slideUrl}</span>
                                  )}
                              </div>

                              <div className="flex flex-col gap-1">
                                  <label className="text-xs font-bold text-gray-400 uppercase">Link do Resumo</label>
                                  <div className="flex bg-white border rounded-xl overflow-hidden focus-within:ring-2 ring-blue-500 relative">
                                    <input type="url" value={summaryUrlInput} onChange={e => setSummaryUrlInput(e.target.value)} placeholder="URL do Google Drive (Resumo)" className="w-full p-3 outline-none" />
                                    <label className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 flex items-center justify-center font-bold text-sm cursor-pointer border-l transition">
                                      {uploadingSummary ? '...' : 'Upload'}
                                      <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => handleFileUpload(e, 'summary')} disabled={uploadingSummary} />
                                    </label>
                                  </div>
                                  {editingLesson?.summaryUrl && !summaryUrlInput && (
                                      <span className="text-xs text-blue-500 truncate mt-1">Atual: {editingLesson.summaryUrl}</span>
                                  )}
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="flex gap-4">
                      {editingId && (
                          <button type="button" onClick={clearForm} className="flex-1 py-4 bg-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-300 transition">Cancelar</button>
                      )}
                      <button type="submit" disabled={loading} className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition shadow-lg">{loading ? 'Salvando...' : editingId ? 'Atualizar Registro' : 'Publicar Registro'}</button>
                  </div>
              </form>
            </section>

            {/* Tabela de aulas */}
            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-fit">
                {selectedLessonIds.length > 0 && (
                   <div className="bg-blue-50 p-4 border-b border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div className="text-sm font-bold text-blue-700 whitespace-nowrap">
                           <span className="text-xl md:text-sm">{selectedLessonIds.length} selecionados</span>
                       </div>
                       <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-2 w-full md:w-auto md:justify-end">
                           <button type="button" onClick={() => handleMassEdit('continuation-true')} className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 w-full sm:w-auto leading-tight">Marcar como Continuação</button>
                           <button type="button" onClick={() => handleMassEdit('continuation-false')} className="px-3 py-2 bg-gray-600 text-white text-xs font-bold rounded-lg hover:bg-gray-700 w-full sm:w-auto leading-tight">Desmarcar Continuação</button>
                           <button type="button" onClick={() => handleMassEdit('exam-n1')} className="px-3 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 w-full sm:w-auto leading-tight">Mudar para N1</button>
                           <button type="button" onClick={() => handleMassEdit('exam-n2')} className="px-3 py-2 bg-pink-600 text-white text-xs font-bold rounded-lg hover:bg-pink-700 w-full sm:w-auto leading-tight">Mudar para N2</button>
                           <button type="button" onClick={() => handleMassEdit('exam-praticas')} className="px-3 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 w-full sm:w-auto leading-tight">Aulas Práticas</button>
                           
                           {(subjectId === 'anat-patol' || subjectId === 'proc-patol') && (
                              <>
                                 <div className="col-span-2 w-full h-px bg-blue-100 my-1 lg:hidden"></div>
                                 <span className="hidden lg:flex items-center text-blue-200 mx-1">|</span>
                                 <button type="button" onClick={() => handleMassEdit(subjectId === 'proc-patol' ? 'cat-patogeral' : 'cat-geral')} className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 w-full sm:w-auto leading-tight">Cat: {subjectId === 'proc-patol' ? 'Patologia Geral' : 'Geral'}</button>
                                 <button type="button" onClick={() => handleMassEdit('cat-parasi')} className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 w-full sm:w-auto leading-tight">Cat: Parasitologia</button>
                                 <button type="button" onClick={() => handleMassEdit('cat-micro')} className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 w-full sm:w-auto leading-tight">Cat: Microbiologia</button>
                                 {subjectId === 'proc-patol' && <button type="button" onClick={() => handleMassEdit('cat-imuno')} className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 w-full sm:w-auto leading-tight">Cat: Imunologia</button>}
                              </>
                           )}
                       </div>
                   </div>
                )}
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 w-10">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                    checked={selectedLessonIds.length === filteredLessons.length && filteredLessons.length > 0}
                                    onChange={() => handleToggleSelectAll(filteredLessons)} />
                            </th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Data / Título ({filteredLessons.length})</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredLessons.map(l => (
                            <tr key={l.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                        checked={selectedLessonIds.includes(l.id)} 
                                        onChange={() => handleToggleSelectRow(l.id)} />
                                </td>
                                <td className="p-4">
                                    <div className="text-[10px] font-bold text-blue-500 mb-1">
                                        {l.date?.split('-').reverse().join('/')} | Slots: {l.targetSlots?.join(', ') || 'N/A'} | {l.examPeriod || 'N2'} {l.isContinuation ? '| CONTINUAÇÃO' : ''} {l.category ? `| CAT: ${l.category.toUpperCase()}` : ''}
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 line-clamp-1">
                                        {l.title}
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase">{SUBJECTS.find(s => s.id === l.subjectId)?.title}</div>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => handleEdit(l)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><IconEdit className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(l.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><IconX className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredLessons.length === 0 && (
                    <div className="p-10 text-center text-gray-400">Nenhum registro encontrado para os filtros selecionados.</div>
                )}
            </section>
        </main>
      ) : (
        /* Questions Management Panel (v2.031) */
        <main className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1550px] mx-auto w-full">
          {/* Column 1 & 2: Form and Bulk Importer */}
          <div className="lg:col-span-2 space-y-8">
             
             {/* Question form */}
             <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
               <div className="flex justify-between items-center border-b pb-4">
                 <div>
                   <h2 className="text-lg font-black text-slate-800">
                     {q_editingId ? 'Editar Questão do Banco' : 'Cadastrar Nova Questão'}
                   </h2>
                   <p className="text-[10px] text-gray-400">Associe as 5 tags obrigatórias exigidas na plataforma para cada questão.</p>
                 </div>
                 {q_editingId && (
                   <button onClick={clearQuestionForm} className="text-xs text-red-500 font-bold hover:underline">
                     Cancelar Edição
                   </button>
                 )}
               </div>

               <form onSubmit={handleQuestionSubmit} className="space-y-4">
                 {/* Academic parameters: Period, Tag 4, and Tag 5 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left block: Period and Banca */}
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Período Letivo</label>
                        <select 
                          value={q_selectedPeriod} 
                          onChange={e => {
                            const newPeriod = Number(e.target.value);
                            setQ_selectedPeriod(newPeriod);
                            setQ_selectedDisciplines([]);
                            setQ_selectedLessons([]);
                          }} 
                          className="p-3 border rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 ring-blue-500 w-full font-bold"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(p => <option key={p} value={p}>{p}º Período</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Tag 3: Banca / Origem *</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsBancaDropdownOpen(!isBancaDropdownOpen);
                              setIsTag4Expanded(false);
                              setIsTag5Expanded(false);
                            }}
                            className="p-3 border rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 ring-blue-500 w-full font-bold flex justify-between items-center text-left"
                          >
                            <span className="truncate">{q_banca || 'Selecione...'}</span>
                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isBancaDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {isBancaDropdownOpen && (
                            <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto font-medium">
                              {isCreatingNewBanca ? (
                                <div className="p-2 border-b border-slate-100 flex gap-2 items-center bg-slate-50/50">
                                  <input
                                    type="text"
                                    placeholder="Nome da banca..."
                                    value={newBancaName}
                                    onChange={e => setNewBancaName(e.target.value)}
                                    className="flex-1 p-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 ring-blue-500 font-bold bg-white"
                                    autoFocus
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (newBancaName.trim()) {
                                          const cleaned = newBancaName.trim();
                                          if (!customBancas.includes(cleaned)) {
                                            setCustomBancas(prev => [...prev, cleaned]);
                                          }
                                          setQ_banca(cleaned);
                                          setNewBancaName('');
                                          setIsCreatingNewBanca(false);
                                          setIsBancaDropdownOpen(false);
                                        }
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (newBancaName.trim()) {
                                        const cleaned = newBancaName.trim();
                                        if (!customBancas.includes(cleaned)) {
                                          setCustomBancas(prev => [...prev, cleaned]);
                                        }
                                        setQ_banca(cleaned);
                                        setNewBancaName('');
                                        setIsCreatingNewBanca(false);
                                        setIsBancaDropdownOpen(false);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition shrink-0"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsCreatingNewBanca(false);
                                      setNewBancaName('');
                                    }}
                                    className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-bold transition shrink-0"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCreatingNewBanca(true);
                                  }}
                                  className="w-full text-left p-3 text-xs font-bold text-blue-600 hover:bg-blue-50 border-b border-slate-100 flex items-center gap-2"
                                >
                                  <span>➕ Criar origem</span>
                                </button>
                              )}
                              
                              {allBancas.map(b => {
                                const isSelected = q_banca === b;
                                const isDefault = DEFAULT_BANCAS.includes(b);
                                const isPendingDelete = bancaConfirmDelete === b;

                                return (
                                  <div
                                    key={b}
                                    onClick={() => {
                                      if (!isPendingDelete) {
                                        setQ_banca(b);
                                        setIsBancaDropdownOpen(false);
                                      }
                                    }}
                                    className={`p-3 text-xs flex justify-between items-center hover:bg-slate-50 cursor-pointer transition ${
                                      isSelected ? 'bg-blue-50/50 text-blue-700 font-bold' : 'text-slate-750'
                                    }`}
                                  >
                                    {isPendingDelete ? (
                                      <div className="flex items-center justify-between w-full" onClick={e => e.stopPropagation()}>
                                        <span className="text-red-600 font-semibold truncate mr-2">Excluir "{b}"?</span>
                                        <div className="flex gap-2 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => executeBancaDelete(b)}
                                            className="px-2 py-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-[10px]"
                                          >
                                            Sim
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setBancaConfirmDelete(null)}
                                            className="px-2 py-1 bg-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-300 text-[10px]"
                                          >
                                            Não
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <span className="truncate flex-1 pr-2">{b}</span>
                                        {!isDefault && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setBancaConfirmDelete(b);
                                            }}
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                                            title="Excluir banca"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Input de Ano de Aplicação */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Ano de Aplicação</label>
                        <input
                          type="text"
                          value={q_ano}
                          onChange={e => setQ_ano(e.target.value)}
                          placeholder="Ex: 2024"
                          className="p-3 border rounded-xl bg-gray-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Middle block: Tag 4 Checkbox list */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Tag 4: Disciplina(s) *</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsTag4Expanded(!isTag4Expanded);
                            setIsBancaDropdownOpen(false);
                            setIsTag5Expanded(false);
                          }}
                          className="p-3 border rounded-xl bg-gray-50 text-xs font-bold text-slate-700 flex justify-between items-center w-full outline-none focus:ring-2 ring-blue-500"
                        >
                          <span className="truncate text-left font-bold block max-w-[170px]">
                            {q_selectedDisciplines.length === 0 
                              ? "Selecionar disciplinas..." 
                              : `${q_selectedDisciplines.length} selecionada(s)`}
                          </span>
                          <svg className={`w-4 h-4 text-slate-400 transition-transform ${isTag4Expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isTag4Expanded && (
                          <div className="absolute top-[100%] left-0 right-0 z-40 mt-1 border border-slate-200 rounded-xl bg-white shadow-xl p-3 max-h-56 overflow-y-auto space-y-2">
                            {availableDisciplinesForSelectedPeriod.map(d => {
                              const isChecked = q_selectedDisciplines.includes(d.value);
                              return (
                                <label key={d.value} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 p-1.5 rounded transition">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked} 
                                    onChange={() => {
                                      let next;
                                      if (isChecked) {
                                        next = q_selectedDisciplines.filter(v => v !== d.value);
                                      } else {
                                        next = [...q_selectedDisciplines, d.value];
                                      }
                                      setQ_selectedDisciplines(next);
                                      
                                      // Auto-filter lessons that are no longer valid
                                      const nextAvailableLessons = getLessonsForDisciplines(next);
                                      const nextAvailableLessonIds = nextAvailableLessons.map(l => l.id);
                                      setQ_selectedLessons(prev => prev.filter(id => nextAvailableLessonIds.includes(id)));
                                    }} 
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <span>{d.label}</span>
                                </label>
                              );
                            })}
                            {availableDisciplinesForSelectedPeriod.length === 0 && (
                              <span className="text-xs text-gray-400">Nenhuma disciplina para este período.</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right block: Tag 5 Checkbox list */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Tag 5: Aula(s) Específica(s)</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsTag5Expanded(!isTag5Expanded);
                            setIsBancaDropdownOpen(false);
                            setIsTag4Expanded(false);
                          }}
                          className="p-3 border rounded-xl bg-gray-50 text-xs font-bold text-slate-700 flex justify-between items-center w-full outline-none focus:ring-2 ring-blue-500"
                        >
                          <span className="truncate text-left font-bold block max-w-[170px]">
                            {q_selectedLessons.length === 0 
                              ? "Selecionar aulas..." 
                              : `${q_selectedLessons.length} selecionada(s)`}
                          </span>
                          <svg className={`w-4 h-4 text-slate-400 transition-transform ${isTag5Expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isTag5Expanded && (
                          <div className="absolute top-[100%] left-0 right-0 z-40 mt-1 border border-slate-200 rounded-xl bg-white shadow-xl p-3 max-h-56 overflow-y-auto space-y-2">
                            {availableLessonsForSelectedDisciplines.map(l => {
                              const isChecked = q_selectedLessons.includes(l.id);
                              return (
                                <label key={l.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 p-1.5 rounded transition">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked} 
                                    onChange={() => {
                                      if (isChecked) {
                                        setQ_selectedLessons(prev => prev.filter(v => v !== l.id));
                                      } else {
                                        setQ_selectedLessons(prev => [...prev, l.id]);
                                      }
                                    }} 
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <span>{l.title}</span>
                                </label>
                              );
                            })}
                            {availableLessonsForSelectedDisciplines.length === 0 && (
                              <span className="text-xs text-gray-400">Selecione uma disciplina para ver as aulas.</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags Row: Dificuldade, Grande Área */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tag 1: Dificuldade *</label>
                      <select 
                        value={q_difficulty} 
                        onChange={e => setQ_difficulty(e.target.value as any)} 
                        className="p-2.5 border rounded-xl bg-white text-sm outline-none focus:ring-2 ring-blue-500 font-bold"
                      >
                        <option value="Fácil">Fácil</option>
                        <option value="Médio">Médio</option>
                        <option value="Difícil">Difícil</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tag 2: Grande Área *</label>
                      <select 
                        value={q_area} 
                        onChange={e => setQ_area(e.target.value)} 
                        className="p-2.5 border rounded-xl bg-white text-xs outline-none focus:ring-2 ring-blue-500 font-bold"
                      >
                        {['Ciências Biológicas', 'Clínica Médica', 'Pediatria', 'Cirurgia', 'Ginecologia e Obstetrícia', 'Medicina Preventiva e Social'].map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                 {/* Question text */}
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase">Enunciado da Questão *</label>
                   <textarea 
                     value={q_questionText} 
                     onChange={e => setQ_questionText(e.target.value)} 
                     placeholder="Digite o enunciado completo da questão..." 
                     className="w-full p-3 border rounded-xl h-24 text-sm focus:ring-2 ring-blue-500" 
                     required 
                   />
                 </div>

                 {/* Options */}
                 <div className="space-y-2">
                   <p className="text-[10px] font-bold text-gray-400 uppercase">Alternativas e Gabarito Correto *</p>
                   {q_options.map((option, idx) => (
                     <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                       <input 
                         type="radio" 
                         name="correctOption" 
                         checked={q_correctOptionIndex === idx} 
                         onChange={() => setQ_correctOptionIndex(idx)} 
                         className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                       />
                       <span className="font-black text-xs text-slate-400 w-4">{String.fromCharCode(65 + idx)})</span>
                       <input 
                         type="text" 
                         value={option} 
                         onChange={e => {
                           const copy = [...q_options];
                           copy[idx] = e.target.value;
                           setQ_options(copy);
                         }} 
                         placeholder={`Alternativa ${String.fromCharCode(65 + idx)}`} 
                         className="flex-1 bg-transparent p-1 outline-none text-sm border-b border-transparent focus:border-slate-300"
                         required
                       />
                     </div>
                   ))}
                 </div>

                 {/* Explanation / Resolução */}
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase">Explicação / Resolução Comentada</label>
                   <textarea 
                     value={q_explanation} 
                     onChange={e => setQ_explanation(e.target.value)} 
                     placeholder="Insira comentários detalhados e explicações sobre o gabarito..." 
                     className="w-full p-3 border rounded-xl h-20 text-sm focus:ring-2 ring-blue-500" 
                   />
                 </div>

                 {/* Action buttons */}
                 <div className="flex gap-4">
                   <button 
                     type="submit" 
                     disabled={loading} 
                     className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition text-sm shadow-md"
                   >
                     {loading ? 'Processando...' : q_editingId ? 'Atualizar Questão' : 'Salvar Questão'}
                   </button>
                 </div>
               </form>
             </section>

             {/* Bulk Importer Section (PDF/Text extraction) */}
             <section className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
               <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                 <div>
                   <h3 className="text-md font-black text-white flex items-center gap-2">
                     <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                     Extrator Inteligente de PDF / Texto em Massa
                   </h3>
                   <p className="text-[10px] text-slate-400 mt-0.5">Extraia questões inteiras de PDF de forma instantânea através do nosso RegEx parser.</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <button 
                     type="button"
                     onClick={() => setShowBulkImportHelper(true)}
                     className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg transition"
                     title="Instruções e Prompt de IA"
                   >
                     <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <span>Como usar IA</span>
                   </button>
                   <button 
                     onClick={() => setQ_importOpen(!q_importOpen)} 
                     className="text-xs bg-slate-800 hover:bg-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition"
                   >
                     {q_importOpen ? 'Ocultar Extrator' : 'Abrir Extrator'}
                   </button>
                 </div>
               </div>

               {q_importOpen && (
                 <div className="space-y-4">
                   {/* Default parameters */}
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-800 p-4 rounded-xl border border-slate-750">
                     <div className="flex flex-col gap-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase">Disciplina Padrão *</label>
                       <select 
                         value={q_bulkSubjectId} 
                         onChange={e => {
                           setQ_bulkSubjectId(e.target.value);
                           setQ_bulkLessonId('');
                           setQ_bulkParsedQuestions(prev => prev.map(q => ({ ...q, subjectId: e.target.value, lessonId: '' })));
                         }} 
                         className="p-2 bg-slate-850 text-xs border border-slate-700 rounded-lg text-white"
                         required
                       >
                         <option value="">Selecione...</option>
                         {SUBJECTS.map(s => (
                           <option key={s.id} value={s.id}>{s.period}º P - {s.title}</option>
                         ))}
                       </select>
                     </div>

                     <div className="flex flex-col gap-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase">Aula Padrão</label>
                       <select 
                         value={q_bulkLessonId} 
                         onChange={e => {
                           setQ_bulkLessonId(e.target.value);
                           setQ_bulkParsedQuestions(prev => prev.map(q => ({ ...q, lessonId: e.target.value })));
                         }} 
                         className="p-2 bg-slate-850 text-xs border border-slate-700 rounded-lg text-white"
                       >
                         <option value="">Nenhuma...</option>
                         {dbLessons.filter(l => l.subjectId === q_bulkSubjectId).map(l => (
                           <option key={l.id} value={l.id}>{l.title}</option>
                         ))}
                       </select>
                     </div>

                     <div className="flex flex-col gap-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase">Dificuldade</label>
                       <select 
                         value={q_bulkDifficulty} 
                         onChange={e => {
                           setQ_bulkDifficulty(e.target.value as any);
                           setQ_bulkParsedQuestions(prev => prev.map(q => ({ ...q, difficulty: e.target.value })));
                         }} 
                         className="p-2 bg-slate-850 text-xs border border-slate-700 rounded-lg text-white"
                       >
                         <option value="Fácil">Fácil</option>
                         <option value="Médio">Médio</option>
                         <option value="Difícil">Difícil</option>
                       </select>
                     </div>

                     <div className="flex flex-col gap-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase">Banca / Origem</label>
                       <input 
                         type="text" 
                         value={q_bulkBanca} 
                         onChange={e => {
                           setQ_bulkBanca(e.target.value);
                           setQ_bulkParsedQuestions(prev => prev.map(q => ({ ...q, banca: e.target.value })));
                         }} 
                         placeholder="Ex: ENARE" 
                         className="p-2 bg-slate-850 text-xs border border-slate-700 rounded-lg text-white"
                       />
                     </div>
                   </div>

                   <textarea 
                     value={q_importText} 
                     onChange={e => setQ_importText(e.target.value)} 
                     placeholder="Cole o texto aqui. O parser processará as questões de forma automática. Exemplo:&#10;1. Qual o foco cirúrgico na apendicite?&#10;A) Tratamento expectante&#10;B) Cirurgia imediata&#10;C) Medicamentoso apenas&#10;D) Sem conduta&#10;Gabarito: B&#10;Explicação: Tratamento padrão é apendicectomia cirúrgica." 
                     className="w-full h-44 bg-slate-950 border border-slate-800 p-4 text-xs font-mono text-orange-200 rounded-xl focus:ring-1 ring-orange-500 outline-none"
                   />

                   <div className="flex justify-end gap-3">
                     <button 
                       type="button" 
                       onClick={handleProcessBulkImport} 
                       className="py-2.5 px-6 bg-orange-600 hover:bg-orange-500 font-bold rounded-lg text-xs transition"
                     >
                       Processar e Extrair Questões
                     </button>
                   </div>

                   {q_bulkParsedQuestions.length > 0 && (
                     <div className="border border-slate-800 rounded-xl bg-slate-950 p-4 space-y-4">
                       <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                         <span className="text-xs font-bold text-orange-400">{q_bulkParsedQuestions.length} questões extraídas prontas para lote!</span>
                         <button 
                           onClick={handleSaveBulkQuestions} 
                           className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg text-xs uppercase tracking-wider transition"
                         >
                           Salvar Lote no Banco
                         </button>
                       </div>

                       <div className="max-h-72 overflow-y-auto space-y-3 pr-2 divide-y divide-slate-800">
                         {q_bulkParsedQuestions.map((pq, pqIdx) => (
                           <div key={pq.tempId} className="pt-3 text-xs space-y-2">
                             <div className="flex justify-between items-center">
                               <span className="font-bold text-slate-300">Questão {pqIdx + 1}</span>
                               <button 
                                 onClick={() => setQ_bulkParsedQuestions(p => p.filter(x => x.tempId !== pq.tempId))} 
                                 className="text-[10px] text-rose-400 hover:underline"
                               >
                                 Remover deste lote
                               </button>
                             </div>
                             
                             <textarea 
                               value={pq.question} 
                               onChange={e => {
                                 const copy = [...q_bulkParsedQuestions];
                                 copy[pqIdx].question = e.target.value;
                                 setQ_bulkParsedQuestions(copy);
                               }} 
                               className="w-full bg-slate-900 p-2 text-slate-100 border border-slate-800 rounded text-[11px]"
                             />

                             <div className="grid grid-cols-2 gap-2">
                               {pq.options.map((opt: string, optIdx: number) => (
                                 <input 
                                   key={optIdx}
                                   type="text" 
                                   value={opt} 
                                   onChange={e => {
                                     const copy = [...q_bulkParsedQuestions];
                                     copy[pqIdx].options[optIdx] = e.target.value;
                                     setQ_bulkParsedQuestions(copy);
                                   }} 
                                   placeholder={`Alt ${String.fromCharCode(65 + optIdx)}`} 
                                   className="bg-slate-900 p-2 text-slate-100 border border-slate-800 rounded text-[11px]"
                                 />
                               ))}
                             </div>

                             <div className="grid grid-cols-2 gap-2 text-[10px]">
                               <div className="flex items-center gap-2">
                                 <span className="text-slate-400">Gabarito:</span>
                                 <select 
                                   value={pq.correctOptionIndex} 
                                   onChange={e => {
                                     const copy = [...q_bulkParsedQuestions];
                                     copy[pqIdx].correctOptionIndex = Number(e.target.value);
                                     setQ_bulkParsedQuestions(copy);
                                   }} 
                                   className="bg-slate-900 text-slate-100 border border-slate-800 rounded p-1"
                                 >
                                   {pq.options.map((_: any, idx: number) => (
                                     <option key={idx} value={idx}>{String.fromCharCode(65 + idx)}</option>
                                   ))}
                                 </select>
                               </div>

                               <div className="flex items-center gap-2">
                                 <span className="text-slate-400">Disciplina:</span>
                                 <select 
                                   value={pq.subjectId} 
                                   onChange={e => {
                                     const copy = [...q_bulkParsedQuestions];
                                     copy[pqIdx].subjectId = e.target.value;
                                     copy[pqIdx].lessonId = ''; 
                                     setQ_bulkParsedQuestions(copy);
                                   }} 
                                   className="bg-slate-900 text-slate-100 border border-slate-800 rounded p-1 w-full max-w-[120px]"
                                 >
                                   <option value="">Selecione...</option>
                                   {SUBJECTS.map(s => (
                                     <option key={s.id} value={s.id}>{s.title}</option>
                                   ))}
                                 </select>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </section>
          </div>

          {/* Column 3: Filters & List of Questions */}
          <div className="space-y-6">
             <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
               <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Filtros do Banco</h3>
               
               <div className="space-y-3">
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase">Pesquisa de Conteúdo</label>
                   <input 
                     type="text" 
                     value={q_search} 
                     onChange={e => setQ_search(e.target.value)} 
                     placeholder="Palavra-chave no enunciado..." 
                     className="p-2.5 border rounded-xl bg-gray-50 text-xs w-full"
                   />
                 </div>

                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase">Filtrar por Disciplina</label>
                   <select 
                     value={q_filterSubjectId} 
                     onChange={e => setQ_filterSubjectId(e.target.value)} 
                     className="p-2.5 border rounded-xl bg-gray-50 text-xs w-full"
                   >
                     <option value="">Todas as Disciplinas</option>
                     {SUBJECTS.map(s => (
                       <option key={s.id} value={s.id}>{s.period}º P - {s.title}</option>
                     ))}
                   </select>
                 </div>

                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase">Filtrar por Dificuldade</label>
                   <select 
                     value={q_filterDifficulty} 
                     onChange={e => setQ_filterDifficulty(e.target.value)} 
                     className="p-2.5 border rounded-xl bg-gray-50 text-xs w-full"
                   >
                     <option value="">Todas as Dificuldades</option>
                     <option value="Fácil">Fácil</option>
                     <option value="Médio">Médio</option>
                     <option value="Difícil">Difícil</option>
                   </select>
                 </div>

                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase">Filtrar por Grande Área</label>
                   <select 
                     value={q_filterArea} 
                     onChange={e => setQ_filterArea(e.target.value)} 
                     className="p-2.5 border rounded-xl bg-gray-50 text-xs w-full"
                   >
                     <option value="">Todas as Áreas</option>
                     {['Ciências Biológicas', 'Clínica Médica', 'Pediatria', 'Cirurgia', 'Ginecologia e Obstetrícia', 'Medicina Preventiva e Social'].map(a => (
                       <option key={a} value={a}>{a}</option>
                     ))}
                   </select>
                 </div>
               </div>
             </section>

             {/* Questions list results */}
             <div className="space-y-4">
               <div className="flex justify-between items-center px-2">
                 <span className="text-xs font-bold text-gray-500 uppercase">Resultados</span>
                 <span className="text-xs bg-gray-200 px-2.5 py-0.5 rounded-full font-bold text-slate-750">
                   {dbQuestions.filter(q => {
                     if (q_filterSubjectId) {
                        const subjects = q.subjectId ? q.subjectId.split(',').map((s: string) => s.trim()) : [];
                        const match = subjects.some((sub: string) => sub.split(':')[0] === q_filterSubjectId);
                        if (!match) return false;
                      }
                     if (q_filterDifficulty && q.difficulty !== q_filterDifficulty) return false;
                     if (q_filterArea && q.area !== q_filterArea) return false;
                     if (q_search && !q.question.toLowerCase().includes(q_search.toLowerCase())) return false;
                     return true;
                   }).length}
                 </span>
               </div>

               <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                 {dbQuestions.filter(q => {
                   if (q_filterSubjectId) {
                        const subjects = q.subjectId ? q.subjectId.split(',').map((s: string) => s.trim()) : [];
                        const match = subjects.some((sub: string) => sub.split(':')[0] === q_filterSubjectId);
                        if (!match) return false;
                      }
                   if (q_filterDifficulty && q.difficulty !== q_filterDifficulty) return false;
                   if (q_filterArea && q.area !== q_filterArea) return false;
                   if (q_search && !q.question.toLowerCase().includes(q_search.toLowerCase())) return false;
                   return true;
                 }).map(q => {
                   const matchingSubject = SUBJECTS.find(s => s.id === q.subjectId);
                   const matchingLesson = dbLessons.find(l => l.id === q.lessonId);
                   
                   return (
                     <div key={q.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-slate-300 transition space-y-3">
                       {/* 5 Mandatory Tag Display Grid for verification */}
                       <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                         {/* Row 1: Difficulty, Area, Banca */}
                         <div className="flex flex-wrap gap-1.5 items-center">
                           <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                             q.difficulty === 'Fácil' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                             q.difficulty === 'Médio' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                             'bg-rose-100 text-rose-800 border border-rose-200'
                           }`}>
                             {q.difficulty}
                           </span>

                           <span className="text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded">
                             {q.area}
                           </span>

                           <span className="text-[9px] font-bold bg-indigo-900 text-white px-2 py-0.5 rounded">
                             {q.banca}
                           </span>
                         </div>

                         {/* Row 2: Subject, Lesson */}
                         <div className="flex flex-wrap gap-1.5 items-center mt-1 pt-1 border-t border-dashed border-slate-200">
                           <span className="text-[9px] font-medium bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded max-w-[120px] truncate">
                             {matchingSubject ? matchingSubject.title : q.subjectId}
                           </span>

                           <span className="text-[9px] font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded max-w-[120px] truncate">
                             {matchingLesson ? matchingLesson.title : 'Aula Geral'}
                           </span>
                         </div>
                       </div>

                       <div className="text-xs font-bold text-slate-800 line-clamp-3">
                         {q.question}
                       </div>

                       <div className="text-[10px] text-gray-550">
                         Gabarito: <span className="font-bold text-blue-600">{String.fromCharCode(65 + q.correctOptionIndex)}</span>
                       </div>

                       <div className="flex justify-end gap-2 pt-2 border-t">
                         <button 
                           onClick={() => handleQuestionEdit(q)} 
                           className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg text-xs font-bold flex items-center gap-1"
                         >
                           <IconEdit className="w-4 h-4" /> Editar
                         </button>
                         <button 
                           onClick={() => handleQuestionDelete(q.id)} 
                           className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-1"
                         >
                           <IconX className="w-4 h-4" /> Excluir
                         </button>
                       </div>
                     </div>
                   );
                 })}
                 {dbQuestions.length === 0 && (
                   <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border">
                     Nenhuma questão cadastrada. Use o formulário ou o importador acima!
                   </div>
                 )}
               </div>
             </div>
          </div>
        </main>
      )}
      {showBulkImportHelper && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Extração de Questões via IA (Google Gemini)
                </h3>
                <p className="text-xs text-gray-550 mt-1 text-left">
                  Converta qualquer prova antiga em PDF no formato correto para importação em lote em poucos segundos.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowBulkImportHelper(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Instructions Steps */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider text-left">Passo a Passo do Administrador:</h4>
                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div className="flex gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 text-left">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">1</span>
                    <p className="text-slate-700 leading-relaxed pt-0.5">
                      Abra o <a href="https://gemini.google.com/app" target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5">Google Gemini <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a> em seu navegador.
                    </p>
                  </div>

                  <div className="flex gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 text-left">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">2</span>
                    <p className="text-slate-700 leading-relaxed pt-0.5">
                      Clique no botão de clipe/anexo do chat do Gemini e <strong>faça o upload do arquivo PDF</strong> da prova antiga que você deseja extrair.
                    </p>
                  </div>

                  <div className="flex gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 text-left">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">3</span>
                    <p className="text-slate-700 leading-relaxed pt-0.5">
                      Copie o <strong>prompt de comando especial</strong> listado abaixo e cole no chat junto com o PDF enviado.
                    </p>
                  </div>

                  <div className="flex gap-3 bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-left">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">4</span>
                    <p className="text-slate-700 leading-relaxed pt-0.5">
                      O Gemini retornará o texto perfeitamente estruturado. Basta <strong>copiar a resposta dele e colá-la</strong> na caixa de texto do nosso extrator inteligente!
                    </p>
                  </div>
                </div>
              </div>

              {/* Prompt Box */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider text-left">Prompt para copiar:</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const promptText = `Você é um extrator de questões médicas de alta precisão.
Analise o arquivo PDF de prova que anexei e extraia todas as questões contidas nele, formatando-as estritamente no modelo abaixo para que eu possa importá-las em lote no meu sistema via RegEx parser.

Siga exatamente estas regras de formatação para CADA questão extraída:
1. Comece a questão com o número e o enunciado na mesma linha, no formato:
[Número]. [Enunciado completo da questão]

2. Liste as alternativas de "A" a "E" (ou de "A" a "D", dependendo da questão), cada uma em uma nova linha, começando exatamente com a letra e um parêntese, no formato:
A) [Texto da alternativa A]
B) [Texto da alternativa B]
C) [Texto da alternativa C]
D) [Texto da alternativa D]
E) [Texto da alternativa E]

3. Logo abaixo das alternativas, inclua a indicação do ano de aplicação no formato:
Ano: [Ano de aplicação, ex: 2024]

4. Abaixo, indique a alternativa correta com a palavra "Gabarito:", seguida de espaço e a letra correspondente, no formato:
Gabarito: [Letra correspondente, ex: A]

5. Abaixo, inclua uma justificativa ou explicação da resposta, começando com "Explicação:" seguida de espaço, no formato:
Explicação: [Explicação médica detalhada do porquê o gabarito está correto e comentários sobre as outras alternativas, se relevante]

6. Deixe exatamente uma linha em branco entre o final de uma questão e o início da próxima.

---
EXEMPLO DE FORMATO ESPERADO:

1. Um paciente de 45 anos apresenta febre e tosse produtiva há 3 dias. O exame físico revela estertores crepitantes em base pulmonar direita. Qual o diagnóstico mais provável?
A) Pneumonia adquirida na comunidade
B) Tuberculose pulmonar ativa
C) Asma brônquica aguda
D) Embolia pulmonar
Ano: 2024
Gabarito: A
Explicação: O quadro clínico de febre, tosse produtiva e estertores crepitantes localizados é clássico de pneumonia adquirida na comunidade (PAC).

2. Qual é a conduta inicial padrão frente a uma apendicite aguda não complicada?
A) Tratamento expectante
B) Apendicectomia cirúrgica imediata
C) Antibioticoterapia isolada por 30 dias
D) Analgésicos e repouso
Ano: 2024
Gabarito: B
Explicação: A apendicectomia continua sendo o padrão ouro e conduta indicada no tratamento da apendicite aguda para evitar perfuração e peritonite.
---

Extraia agora as questões do PDF anexado seguindo estritamente este padrão.`;
                      navigator.clipboard.writeText(promptText);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3000);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      copied 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Copiado!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copiar Prompt
                      </>
                    )}
                  </button>
                </div>

                <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 text-left">
                  <div className="absolute top-3 right-3 text-[10px] text-slate-500 font-mono">PROMPT DE EXTRAÇÃO</div>
                  <pre className="text-[10px] font-mono text-slate-300 p-4 overflow-y-auto max-h-60 leading-relaxed whitespace-pre-wrap">
{`Você é um extrator de questões médicas de alta precisão.
Analise o arquivo PDF de prova que anexei e extraia todas as questões contidas nele, formatando-as estritamente no modelo abaixo para que eu possa importá-las em lote no meu sistema via RegEx parser.

Siga exatamente estas regras de formatação para CADA questão extraída:
1. Comece a questão com o número e o enunciado na mesma linha, no formato:
[Número]. [Enunciado completo da questão]

2. Liste as alternativas de "A" a "E" (ou de "A" a "D", dependendo da questão), cada uma em uma nova linha, começando exatamente com a letra e um parêntese, no formato:
A) [Texto da alternativa A]
B) [Texto da alternativa B]
C) [Texto da alternativa B]
D) [Texto da alternativa D]
E) [Texto da alternativa E]

3. Logo abaixo das alternativas, inclua a indicação do ano de aplicação no formato:
Ano: [Ano de aplicação, ex: 2024]

4. Abaixo, indique a alternativa correta com a palavra "Gabarito:", seguida de espaço e a letra correspondente, no formato:
Gabarito: [Letra correspondente, ex: A]

5. Abaixo, inclua uma justificativa ou explicação da resposta, começando com "Explicação:" seguida de espaço, no formato:
Explicação: [Explicação médica detalhada do porquê o gabarito está correto e comentários sobre as outras alternativas, se relevante]

6. Deixe exatamente uma linha em branco entre o final de uma questão e o início da próxima.

---
EXEMPLO DE FORMATO ESPERADO:

1. Um paciente de 45 anos apresenta febre e tosse produtiva há 3 dias. O exame físico revela estertores crepitantes em base pulmonar direita. Qual o diagnóstico mais provável?
A) Pneumonia adquirida na comunidade
B) Tuberculose pulmonar ativa
C) Asma brônquica aguda
D) Embolia pulmonar
Ano: 2024
Gabarito: A
Explicação: O quadro clínico de febre, tosse produtiva e estertores crepitantes localizados é clássico de pneumonia adquirida na comunidade (PAC).

2. Qual é a conduta inicial padrão frente a uma apendicite aguda não complicada?
A) Tratamento expectante
B) Apendicectomia cirúrgica imediata
C) Antibioticoterapia isolada por 30 dias
D) Analgésicos e repouso
Ano: 2024
Gabarito: B
Explicação: A apendicectomia continua sendo o padrão ouro e conduta indicada no tratamento da apendicite aguda para evitar perfuração e peritonite.
---

Extraia agora as questões do PDF anexado seguindo estritamente este padrão.`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <a
                href="https://gemini.google.com/app"
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowBulkImportHelper(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-md inline-flex items-center gap-1.5"
              >
                Entendi, ir para o Gemini
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
