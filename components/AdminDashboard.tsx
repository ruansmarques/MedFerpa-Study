import React, { useState, useEffect, useRef } from 'react';
import { SUBJECTS, DEFAULT_SUBJECT_SLOTS } from '../constants';
import { db, storage } from '../firebase';
import { collection, query, orderBy, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { IconCheck, IconX, IconEdit, IconVideoOff, IconPresentation, IconBook } from './Icons';
import { Lesson } from '../types';

interface AdminDashboardProps {
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Filter State (Table)
  const [filterPeriod, setFilterPeriod] = useState<number | 'all'>(5);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');

  // Form State
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
  
  // Files State
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [summaryFile, setSummaryFile] = useState<File | null>(null);
  const slideInputRef = useRef<HTMLInputElement>(null);
  const summaryInputRef = useRef<HTMLInputElement>(null);
  
  // URLs existentes
  const [existingSlideUrl, setExistingSlideUrl] = useState<string | null>(null);
  const [existingSummaryUrl, setExistingSummaryUrl] = useState<string | null>(null);

  // Data Lists
  const [dbLessons, setDbLessons] = useState<Lesson[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --- BUSCA DADOS INICIAIS ---
  const fetchLessons = async () => {
    try {
      const q = query(collection(db, "lessons"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const lessons: Lesson[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        lessons.push({
          id: doc.id,
          subjectId: data.subjectId,
          title: data.title,
          youtubeIds: data.youtubeIds || [],
          duration: data.duration,
          category: data.category,
          slideUrl: data.slideUrl,
          summaryUrl: data.summaryUrl,
          date: data.date,
          type: data.type || 'class',
          description: data.description || '',
          targetSlots: data.targetSlots || []
        });
      });
      setDbLessons(lessons);
    } catch (err) {
      console.error("Erro ao buscar aulas:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLessons();
    }
  }, [isAuthenticated]);

  // --- AUTO-PREENCHIMENTO DE SLOTS AO MUDAR DISCIPLINA ---
  useEffect(() => {
    if (!editingId && subjectId && DEFAULT_SUBJECT_SLOTS[subjectId]) {
        setSelectedSlots(DEFAULT_SUBJECT_SLOTS[subjectId]);
    }
  }, [subjectId, editingId]);

  // --- FILTER LOGIC ---
  const getFilteredLessons = () => {
    return dbLessons.filter(lesson => {
      if (filterPeriod !== 'all') {
        const subj = SUBJECTS.find(s => s.id === lesson.subjectId);
        if (subj?.period !== filterPeriod) return false;
      }
      if (filterSubjectId !== 'all') {
        if (lesson.subjectId !== filterSubjectId) return false;
      }
      return true;
    });
  };

  const subjectsForFilter = filterPeriod === 'all' 
    ? SUBJECTS 
    : SUBJECTS.filter(s => s.period === filterPeriod);

  // --- AUTH ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const q = query(collection(db, "admins"), where("accessKey", "==", password.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setIsAuthenticated(true);
        setAuthError('');
      } else {
        setAuthError('Senha incorreta.');
        setPassword('');
      }
    } catch (err: any) {
      setAuthError('Erro de conexão: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const formSubjects = SUBJECTS.filter(s => s.period === period);
  
  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleUpload = async (file: File, path: string) => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSlotToggle = (slot: string) => {
    setSelectedSlots(prev => 
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  // --- PREPARAR EDIÇÃO ---
  const handleEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setEntryType(lesson.type || 'class');
    setTitle(lesson.title);
    setSubjectId(lesson.subjectId);
    setCategory(lesson.category || '');
    setNoticeMessage(lesson.description || '');
    setSelectedSlots(lesson.targetSlots || []);
    
    const subj = SUBJECTS.find(s => s.id === lesson.subjectId);
    if (subj) setPeriod(subj.period);

    if (lesson.youtubeIds && lesson.youtubeIds.length > 0) {
      setYoutubeLink(`https://www.youtube.com/watch?v=${lesson.youtubeIds[0]}`);
    } else {
      setYoutubeLink('');
    }

    setDate(lesson.date || '');
    setExistingSlideUrl(lesson.slideUrl || null);
    setExistingSummaryUrl(lesson.summaryUrl || null);
    
    setSlideFile(null);
    setSummaryFile(null);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSuccessMsg('');
    setErrorMsg('');
  };

  // --- CANCELAR EDIÇÃO / LIMPAR ---
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setYoutubeLink('');
    setCategory('');
    setNoticeMessage('');
    setSelectedSlots([]);
    setSlideFile(null);
    setSummaryFile(null);
    setExistingSlideUrl(null);
    setExistingSummaryUrl(null);
    
    if (slideInputRef.current) slideInputRef.current.value = '';
    if (summaryInputRef.current) summaryInputRef.current.value = '';
    
    setSuccessMsg('');
    setErrorMsg('');
  };

  // --- EXCLUIR ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir permanentemente?")) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, "lessons", id));
      await fetchLessons(); 
      setSuccessMsg("Excluído com sucesso.");
    } catch (err: any) {
      setErrorMsg("Erro ao excluir: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title || title.trim() === "") { alert("Título obrigatório."); return; }
    if (!subjectId) { alert("Disciplina obrigatória."); return; }
    if (!date) { alert("Data obrigatória."); return; } 
    if (selectedSlots.length === 0) { alert("Selecione pelo menos um horário de aula."); return; }

    setLoading(true);

    try {
      const subject = SUBJECTS.find(s => s.id === subjectId);
      
      let finalSlideUrl = existingSlideUrl;
      let finalSummaryUrl = existingSummaryUrl;
      const videoIds: string[] = [];

      if (entryType === 'class') {
          if (slideFile && subject) {
            const path = `materials/${subject.folderName || 'default'}/${category ? category + '/' : ''}slides/${slideFile.name}`;
            finalSlideUrl = await handleUpload(slideFile, path);
          }

          if (summaryFile && subject) {
            const path = `materials/${subject.folderName || 'default'}/${category ? category + '/' : ''}resumos/${summaryFile.name}`;
            finalSummaryUrl = await handleUpload(summaryFile, path);
          }

          if (youtubeLink && youtubeLink.trim() !== "") {
            const id = extractYoutubeId(youtubeLink);
            if (id) videoIds.push(id);
          }
      } else {
          finalSlideUrl = null;
          finalSummaryUrl = null;
      }

      const lessonPayload = {
        subjectId,
        title: title.trim(),
        youtubeIds: videoIds,
        duration: 'N/A', 
        category: category || null,
        slideUrl: finalSlideUrl || null,
        summaryUrl: finalSummaryUrl || null,
        date: date || null,
        updatedAt: new Date().toISOString(),
        type: entryType,
        description: entryType === 'notice' ? noticeMessage : null,
        targetSlots: selectedSlots
      };

      if (editingId) {
        await updateDoc(doc(db, "lessons", editingId), lessonPayload);
        setSuccessMsg("Registro atualizado com sucesso!");
        handleCancelEdit(); 
      } else {
        await addDoc(collection(db, "lessons"), {
          ...lessonPayload,
          createdAt: new Date().toISOString()
        });
        setSuccessMsg("Registro cadastrado com sucesso!");
        handleCancelEdit();
      }

      await fetchLessons(); 

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-800">Área Administrativa</h1>
            <p className="text-xs text-gray-400 mt-1">Validação via Servidor</p>
          </div>
          <form onSubmit={handleLogin}>
             <input 
               type="password" 
               placeholder="Chave de Acesso"
               className={`w-full text-center text-2xl tracking-widest px-4 py-3 border rounded-lg mb-4 focus:ring-2 outline-none transition-colors
                 ${authError ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-slate-800'}
               `}
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               disabled={authLoading}
             />
             <button 
               type="submit" 
               disabled={authLoading}
               className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition"
             >
               {authLoading ? 'Verificando...' : 'Entrar'}
             </button>
             {authError && <p className="text-red-500 text-sm mt-4 font-medium">{authError}</p>}
          </form>
          <button onClick={onExit} className="mt-6 text-gray-400 text-sm hover:text-gray-600 underline">Voltar ao site</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-slate-900 text-white px-6 py-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
         <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-xs font-bold px-2 py-1 rounded">ADMIN</div>
            <h1 className="text-lg font-bold tracking-tight">Painel de Gestão</h1>
         </div>
         <button onClick={onExit} className="text-gray-400 hover:text-white transition text-sm font-medium">Sair</button>
      </header>

      <main className="max-w-[95%] mx-auto mt-8 px-2 lg:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
               <div className="mb-6 flex justify-between items-start">
                 <div>
                    <h3 className="text-lg font-bold text-slate-800">Registros no Banco</h3>
                    <p className="text-xs text-gray-500 mt-1">Filtre para gerenciar os dados.</p>
                 </div>
               </div>
               
               <div className="bg-gray-50 p-3 rounded-xl mb-4 grid grid-cols-2 gap-3 border border-gray-100">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filtrar Período</label>
                    <select 
                      value={filterPeriod} 
                      onChange={e => {
                        const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                        setFilterPeriod(val);
                        setFilterSubjectId('all'); 
                      }}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">Todos</option>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p}>{p}º Período</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filtrar Disciplina</label>
                    <select 
                      value={filterSubjectId} 
                      onChange={e => setFilterSubjectId(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">Todas</option>
                      {subjectsForFilter.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
               </div>

               <div className="overflow-x-auto max-h-[800px] overflow-y-auto scrollbar-hide">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b sticky top-0 z-10">
                       <tr>
                         <th className="px-3 py-3">Título / Tipo</th>
                         <th className="px-3 py-3 text-right">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {getFilteredLessons().map((lesson) => (
                        <tr key={lesson.id} className="hover:bg-blue-50 transition-colors group">
                           <td className="px-3 py-3 text-slate-700">
                             <div className="flex items-center gap-2">
                                {lesson.type === 'notice' && (
                                    <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Aviso</span>
                                )}
                                <div className="font-medium text-xs lg:text-sm line-clamp-2">{lesson.title}</div>
                             </div>
                             <div className="text-[10px] text-gray-400 mt-1">
                               {SUBJECTS.find(s => s.id === lesson.subjectId)?.title} • 
                               {lesson.date && <span className="text-blue-500 font-bold">{lesson.date.split('-').reverse().join('/')}</span>} •
                               Slots: {lesson.targetSlots?.length ? lesson.targetSlots.join(', ') : 'N/A'}
                             </div>
                           </td>
                           <td className="px-3 py-3 text-right">
                             <div className="flex justify-end gap-1">
                               <button 
                                 onClick={() => handleEdit(lesson)}
                                 className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                               >
                                 <IconEdit className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => handleDelete(lesson.id)}
                                 className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                               >
                                 <IconX className="w-4 h-4" />
                               </button>
                             </div>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>

          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 sticky top-24">
              
              <div className="flex gap-4 mb-8 bg-gray-100 p-1.5 rounded-xl">
                 <button
                    type="button"
                    onClick={() => { setEntryType('class'); handleCancelEdit(); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${entryType === 'class' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                    ● Cadastrar Aula
                 </button>
                 <button
                    type="button"
                    onClick={() => { setEntryType('notice'); handleCancelEdit(); setTitle('Aula não ministrada'); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${entryType === 'notice' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                    ○ Cadastrar Aviso
                 </button>
              </div>

              <div className="mb-8 border-b border-gray-100 pb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">
                  {editingId ? 'Editar Registro' : (entryType === 'class' ? 'Nova Aula' : 'Novo Aviso')}
                </h2>
                {editingId && (
                    <button onClick={handleCancelEdit} className="text-xs text-gray-400 hover:text-red-500 font-bold uppercase underline">Cancelar Edição</button>
                )}
              </div>

              {(successMsg || errorMsg) && (
                <div className={`mb-6 p-4 border rounded-xl font-medium flex items-center gap-3 ${successMsg ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {successMsg ? <IconCheck className="w-5 h-5" /> : <IconX className="w-5 h-5" />}
                  {successMsg || errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Período *</label>
                    <select 
                      value={period} 
                      onChange={e => setPeriod(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p}>{p}º Período</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Data *</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Disciplina *</label>
                  <select 
                    value={subjectId} 
                    onChange={e => setSubjectId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                    required
                  >
                    <option value="">Selecione...</option>
                    {formSubjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>

                {/* --- SELEÇÃO DE SLOTS (HORÁRIOS) --- */}
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                    <label className="block text-sm font-bold text-blue-900 mb-4 uppercase tracking-widest">
                        Horários da Aula (Slots) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { id: '1', label: '1º Horário', time: '07:00 - 08:40' },
                            { id: '2', label: '2º Horário', time: '08:50 - 10:30' },
                            { id: '3', label: '3º Horário', time: '10:50 - 12:30' }
                        ].map(slot => (
                            <button
                                key={slot.id}
                                type="button"
                                onClick={() => handleSlotToggle(slot.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                    selectedSlots.includes(slot.id)
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                    : 'bg-white border-gray-200 text-slate-600 hover:border-blue-300'
                                }`}
                            >
                                <div className="text-[10px] font-black uppercase opacity-80 mb-1">{slot.label}</div>
                                <div className="text-sm font-bold">{slot.time}</div>
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-blue-400 mt-3 font-medium flex items-center gap-1">
                        <IconCheck className="w-3 h-3" /> Horários são preenchidos automaticamente conforme a grade.
                    </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {entryType === 'class' ? 'Título da Aula *' : 'Título do Aviso *'}
                  </label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
                    placeholder={entryType === 'class' ? "Ex: AULA 01 - Introdução..." : "Ex: Aula não ministrada"}
                    required
                  />
                </div>

                {entryType === 'notice' && (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-bold text-amber-800 mb-2">Motivo do Aviso *</label>
                        <textarea
                            value={noticeMessage}
                            onChange={e => setNoticeMessage(e.target.value)}
                            className="w-full px-4 py-3 border border-amber-300 bg-amber-50 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition shadow-sm h-28 resize-none text-amber-900"
                            placeholder="Ex: O professor não pôde comparecer por motivos de saúde. A aula será reposta em data oportuna."
                            required
                        />
                    </div>
                )}

                {entryType === 'class' && (
                    <div className="animate-fade-in space-y-6">
                        {subjectId === 'proc-patol' && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                            <label className="block text-sm font-bold text-orange-800 mb-2">Categoria (Processos Patológicos) *</label>
                            <select 
                                value={category} 
                                onChange={e => setCategory(e.target.value)}
                                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition bg-white"
                                required
                            >
                                <option value="">Selecione...</option>
                                <option value="Patologia Geral">Patologia Geral</option>
                                <option value="Imunologia">Imunologia</option>
                                <option value="Microbiologia">Microbiologia</option>
                                <option value="Parasitologia">Parasitologia</option>
                            </select>
                        </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* BOTÃO CUSTOMIZADO SLIDE */}
                            <div className="flex flex-col">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Material: Slides</label>
                                <input 
                                    type="file" 
                                    ref={slideInputRef}
                                    accept=".pdf" 
                                    onChange={e => setSlideFile(e.target.files?.[0] || null)} 
                                    className="hidden" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => slideInputRef.current?.click()}
                                    className={`w-full py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${
                                        slideFile || existingSlideUrl
                                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-blue-300'
                                    }`}
                                >
                                    <IconPresentation className="w-8 h-8 mb-1" />
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        {slideFile ? 'Trocar Slide' : existingSlideUrl ? 'Slide Salvo ✓' : 'Escolher Slide'}
                                    </span>
                                    {slideFile && <span className="text-[10px] mt-1 font-medium truncate max-w-[150px]">{slideFile.name}</span>}
                                </button>
                            </div>

                            {/* BOTÃO CUSTOMIZADO RESUMO */}
                            <div className="flex flex-col">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Material: Resumo</label>
                                <input 
                                    type="file" 
                                    ref={summaryInputRef}
                                    accept=".pdf" 
                                    onChange={e => setSummaryFile(e.target.files?.[0] || null)} 
                                    className="hidden" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => summaryInputRef.current?.click()}
                                    className={`w-full py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${
                                        summaryFile || existingSummaryUrl
                                        ? 'bg-purple-50 border-purple-400 text-purple-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-purple-300'
                                    }`}
                                >
                                    <IconBook className="w-8 h-8 mb-1" />
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        {summaryFile ? 'Trocar Resumo' : existingSummaryUrl ? 'Resumo Salvo ✓' : 'Escolher Resumo'}
                                    </span>
                                    {summaryFile && <span className="text-[10px] mt-1 font-medium truncate max-w-[150px]">{summaryFile.name}</span>}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">YouTube Link</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={youtubeLink}
                                    onChange={e => setYoutubeLink(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                                <div className="absolute left-3 top-3.5 text-red-500 opacity-30">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-6 flex gap-4">
                  {editingId && (
                    <button type="button" onClick={handleCancelEdit} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
                  )}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    {loading ? 'Processando...' : (editingId ? 'Salvar Alterações' : 'Cadastrar Registro')}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;