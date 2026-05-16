
import React, { useState, useEffect, useRef } from 'react';
import { SUBJECTS, DEFAULT_SUBJECT_SLOTS } from '../constants';
import { db, storage, auth } from '../firebase';
import { collection, query, orderBy, where, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { IconCheck, IconX, IconEdit, IconPresentation, IconBook } from './Icons';
import { Lesson } from '../types';
import { AdminQuestions } from './AdminQuestions';

interface AdminDashboardProps {
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState<'content' | 'questions'>('content');
  
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
      const q = query(collection(db, "lessons"));
      const snap = await getDocs(q);
      const list: Lesson[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Lesson));
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

  useEffect(() => { if (isAuthenticated) fetchLessons(); }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query(collection(db, "admins"), where("accessKey", "==", password.trim()));
    const snap = await getDocs(q);
    if (!snap.empty) setIsAuthenticated(true); else alert("Senha incorreta");
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
            await deleteDoc(doc(db, "lessons", id));
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
      const storageRef = ref(storage, `uploads/${type}s/${uniqueFileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      if (type === 'slide') {
        setSlideUrlInput(downloadURL);
      } else {
        setSummaryUrlInput(downloadURL);
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
          const batch = writeBatch(db);
          selectedLessonIds.forEach(id => {
              const docRef = doc(db, "lessons", id);
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
              
              batch.update(docRef, updatePayload);
          });
          await batch.commit();
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
        await updateDoc(doc(db, "lessons", editingId), payload);
      } else {
        payload.createdAt = new Date().toISOString();
        await addDoc(collection(db, "lessons"), payload);
      }
      setSuccessMsg("Salvo com sucesso!");
      fetchLessons();
      clearForm();
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b p-4 px-8 flex justify-between items-center sticky top-0 z-50">
         <div className="flex items-center gap-8">
            <h1 className="font-black text-xl">MEDFERPA <span className="text-blue-600">ADMIN</span></h1>
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveAdminTab('content')}
                className={`font-bold pb-1 border-b-2 transition-colors ${activeAdminTab === 'content' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                Conteúdos
              </button>
              <button 
                onClick={() => setActiveAdminTab('questions')}
                className={`font-bold pb-1 border-b-2 transition-colors ${activeAdminTab === 'questions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                Questões
              </button>
            </div>
         </div>
         <button onClick={onExit} className="text-gray-400 hover:text-slate-800 font-bold">Sair do Painel</button>
      </header>

      {activeAdminTab === 'content' ? (
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
        <AdminQuestions />
      )}
    </div>
  );
};

export default AdminDashboard;
