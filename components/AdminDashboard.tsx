import React, { useState, useEffect } from 'react';
import { SUBJECTS } from '../constants';
import { db, storage } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { IconCheck, IconX, IconEdit } from './Icons';
import { Lesson } from '../types';

interface AdminDashboardProps {
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Filter State (Table)
  const [filterPeriod, setFilterPeriod] = useState<number | 'all'>('all');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState<number>(5);
  const [subjectId, setSubjectId] = useState('');
  const [category, setCategory] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [date, setDate] = useState('');
  
  // Files State
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [summaryFile, setSummaryFile] = useState<File | null>(null);
  
  // URLs existentes (para manter o arquivo se não for feito novo upload na edição)
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
          date: data.date
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

  // --- FILTER LOGIC ---
  const getFilteredLessons = () => {
    return dbLessons.filter(lesson => {
      // Filter by Period
      if (filterPeriod !== 'all') {
        const subj = SUBJECTS.find(s => s.id === lesson.subjectId);
        if (subj?.period !== filterPeriod) return false;
      }
      // Filter by Subject
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
      const adminsRef = collection(db, "admins");
      const q = query(adminsRef, where("accessKey", "==", password.trim()));
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
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // --- PREPARAR EDIÇÃO ---
  const handleEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setTitle(lesson.title);
    setSubjectId(lesson.subjectId);
    setCategory(lesson.category || '');
    
    // Tenta encontrar o período baseado na disciplina
    const subj = SUBJECTS.find(s => s.id === lesson.subjectId);
    if (subj) setPeriod(subj.period);

    // Youtube (Pega o primeiro ID e transforma em link para edição)
    if (lesson.youtubeIds && lesson.youtubeIds.length > 0) {
      setYoutubeLink(`https://www.youtube.com/watch?v=${lesson.youtubeIds[0]}`);
    } else {
      setYoutubeLink('');
    }

    setDate(lesson.date || '');
    setExistingSlideUrl(lesson.slideUrl || null);
    setExistingSummaryUrl(lesson.summaryUrl || null);
    
    // Limpa arquivos selecionados novos
    setSlideFile(null);
    setSummaryFile(null);

    // Rola para o topo (agora topo direita)
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSuccessMsg('');
    setErrorMsg('');
  };

  // --- CANCELAR EDIÇÃO ---
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setYoutubeLink('');
    setCategory('');
    setDate('');
    setSlideFile(null);
    setSummaryFile(null);
    setExistingSlideUrl(null);
    setExistingSummaryUrl(null);
    
    // Reset file inputs visualmente
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => { (input as HTMLInputElement).value = ''; });
  };

  // --- EXCLUIR ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta aula permanentemente?")) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, "lessons", id));
      await fetchLessons(); // Recarrega lista
      setSuccessMsg("Aula excluída com sucesso.");
    } catch (err: any) {
      setErrorMsg("Erro ao excluir: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SUBMIT (CRIAR ou EDITAR) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title || title.trim() === "") { alert("Título obrigatório."); return; }
    if (!subjectId) { alert("Disciplina obrigatória."); return; }
    if (!date && !editingId) { alert("Data obrigatória."); return; } 

    if (subjectId === 'proc-patol' && !category) {
        alert("Para 'Processos Patológicos', selecione a Categoria.");
        return;
    }

    setLoading(true);

    try {
      const subject = SUBJECTS.find(s => s.id === subjectId);
      
      // Upload ou Manter URL existente
      let finalSlideUrl = existingSlideUrl;
      let finalSummaryUrl = existingSummaryUrl;

      if (slideFile && subject) {
        const path = `materials/${subject.folderName || 'default'}/${category ? category + '/' : ''}slides/${slideFile.name}`;
        finalSlideUrl = await handleUpload(slideFile, path);
      }

      if (summaryFile && subject) {
        const path = `materials/${subject.folderName || 'default'}/${category ? category + '/' : ''}resumos/${summaryFile.name}`;
        finalSummaryUrl = await handleUpload(summaryFile, path);
      }

      // Process Youtube
      const videoIds: string[] = [];
      if (youtubeLink && youtubeLink.trim() !== "") {
        const id = extractYoutubeId(youtubeLink);
        if (id) videoIds.push(id);
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
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        // UPDATE
        const docRef = doc(db, "lessons", editingId);
        await updateDoc(docRef, lessonPayload);
        setSuccessMsg("Aula atualizada com sucesso!");
        handleCancelEdit(); // Sai do modo edição e limpa form
      } else {
        // CREATE
        await addDoc(collection(db, "lessons"), {
          ...lessonPayload,
          createdAt: new Date().toISOString()
        });
        setSuccessMsg("Aula cadastrada com sucesso!");
        // Reset parcial
        setTitle('');
        setYoutubeLink('');
        setSlideFile(null);
        setSummaryFile(null);
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input) => { (input as HTMLInputElement).value = ''; });
      }

      await fetchLessons(); // Atualiza a lista

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
          
          {/* --- COLUNA DA ESQUERDA: LISTA DE AULAS (40% de largura) --- */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
               <div className="mb-6">
                 <h3 className="text-lg font-bold text-slate-800">Aulas Cadastradas no Banco de Dados</h3>
                 <p className="text-xs text-gray-500 mt-1">Use os filtros para encontrar aulas.</p>
               </div>
               
               {/* FILTROS */}
               <div className="bg-gray-50 p-3 rounded-xl mb-4 grid grid-cols-2 gap-3 border border-gray-100">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filtrar por Período</label>
                    <select 
                      value={filterPeriod} 
                      onChange={e => {
                        const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                        setFilterPeriod(val);
                        setFilterSubjectId('all'); // Reset subject when period changes
                      }}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">Todos os Períodos</option>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p}>{p}º Período</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filtrar por Disciplina</label>
                    <select 
                      value={filterSubjectId} 
                      onChange={e => setFilterSubjectId(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">Todas as Disciplinas</option>
                      {subjectsForFilter.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
               </div>

               <div className="overflow-x-auto max-h-[800px] overflow-y-auto scrollbar-hide">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b sticky top-0 z-10">
                       <tr>
                         <th className="px-3 py-3">Título</th>
                         <th className="px-3 py-3 text-right">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {getFilteredLessons().map((lesson) => (
                        <tr key={lesson.id} className="hover:bg-blue-50 transition-colors group">
                           <td className="px-3 py-3 text-slate-700">
                             <div className="font-medium text-xs lg:text-sm line-clamp-2" title={lesson.title}>{lesson.title}</div>
                             <div className="text-[10px] text-gray-400 mt-1">
                               {SUBJECTS.find(s => s.id === lesson.subjectId)?.title || lesson.subjectId}
                               {lesson.category && <span className="ml-1 text-blue-500">• {lesson.category}</span>}
                             </div>
                           </td>
                           <td className="px-3 py-3 text-right">
                             <div className="flex justify-end gap-1 opacity-100 lg:opacity-50 lg:group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => handleEdit(lesson)}
                                 className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                 title="Editar"
                               >
                                 <IconEdit className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => handleDelete(lesson.id)}
                                 className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                                 title="Excluir"
                               >
                                 <IconX className="w-4 h-4" />
                               </button>
                             </div>
                           </td>
                        </tr>
                      ))}
                      {getFilteredLessons().length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-4 py-12 text-center text-gray-400">
                            Nenhuma aula encontrada com os filtros atuais.
                          </td>
                        </tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>

          {/* --- COLUNA DA DIREITA: FORMULÁRIO (60% de largura) --- */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 sticky top-24">
              <div className="mb-8 border-b border-gray-100 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {editingId ? 'Editar Aula' : 'Nova Aula'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {editingId ? 'Atualize os dados e clique em Atualizar.' : 'Preencha os campos para cadastrar.'}
                  </p>
                </div>
                {editingId && (
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                    MODO EDIÇÃO
                  </span>
                )}
              </div>

              {successMsg && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium flex items-center gap-3">
                  <IconCheck className="w-5 h-5" /> {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium flex items-center gap-3">
                  <IconX className="w-5 h-5" /> {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Título da Aula *</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
                    placeholder="Ex: AULA 01 - Introdução..."
                    required
                  />
                </div>

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
                    <label className="block text-sm font-bold text-gray-700 mb-2">Data da Aula *</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Disciplina *</label>
                  <select 
                    value={subjectId} 
                    onChange={e => {
                       setSubjectId(e.target.value);
                       if (e.target.value !== 'proc-patol') setCategory('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                    required
                  >
                    <option value="">Selecione a disciplina...</option>
                    {formSubjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>

                {subjectId === 'proc-patol' && (
                   <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                      <label className="block text-sm font-bold text-orange-800 mb-2">Categoria (Processos Patológicos) *</label>
                      <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition bg-white text-orange-900"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                   <div>
                      <div className="flex justify-between mb-2">
                        <label className="block text-sm font-bold text-gray-700">Slide (PDF)</label>
                        {existingSlideUrl && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">SALVO</span>}
                      </div>
                      <input type="file" accept=".pdf" onChange={e => setSlideFile(e.target.files?.[0] || null)} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                   </div>

                   <div>
                      <div className="flex justify-between mb-2">
                        <label className="block text-sm font-bold text-gray-700">Resumo (PDF)</label>
                        {existingSummaryUrl && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">SALVO</span>}
                      </div>
                      <input type="file" accept=".pdf" onChange={e => setSummaryFile(e.target.files?.[0] || null)} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
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
                      placeholder="Cole o link do YouTube aqui..."
                    />
                    <div className="absolute left-3 top-3.5 text-gray-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  {editingId && (
                    <button 
                      type="button" 
                      onClick={handleCancelEdit}
                      className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
                  >
                    {loading ? 'Salvando...' : (editingId ? 'Atualizar Aula' : 'Cadastrar Aula')}
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