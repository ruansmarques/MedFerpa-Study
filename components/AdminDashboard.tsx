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

  const filteredSubjects = SUBJECTS.filter(s => s.period === period);
  
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

    // Rola para o topo
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
    if (!date && !editingId) { alert("Data obrigatória."); return; } // Data obrigatória apenas na criação, na edição é opcional se quiser manter

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
        // Reset parcial para facilitar cadastros seguidos
        setTitle('');
        setYoutubeLink('');
        setSlideFile(null);
        setSummaryFile(null);
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input) => { (input as HTMLInputElement).value = ''; });
      }

      await fetchLessons(); // Atualiza a lista lá embaixo

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

      <main className="max-w-5xl mx-auto mt-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- COLUNA DA ESQUERDA: FORMULÁRIO --- */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Editar Aula' : 'Nova Aula'}
                </h2>
                <p className="text-gray-500 text-xs mt-1">
                  {editingId ? 'Atualize os dados abaixo.' : 'Preencha para cadastrar.'}
                </p>
              </div>

              {successMsg && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <IconCheck className="w-4 h-4" /> {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <IconX className="w-4 h-4" /> {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Título *</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Período *</label>
                    <select 
                      value={period} 
                      onChange={e => setPeriod(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p}>{p}º</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Data *</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Disciplina *</label>
                  <select 
                    value={subjectId} 
                    onChange={e => {
                       setSubjectId(e.target.value);
                       if (e.target.value !== 'proc-patol') setCategory('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    required
                  >
                    <option value="">Selecione...</option>
                    {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>

                {subjectId === 'proc-patol' && (
                   <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Categoria *</label>
                      <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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

                <div>
                   <label className="block text-xs font-bold text-gray-700 mb-1">Slide (PDF)</label>
                   <input type="file" accept=".pdf" onChange={e => setSlideFile(e.target.files?.[0] || null)} className="w-full text-xs" />
                   {existingSlideUrl && <p className="text-[10px] text-green-600 mt-1">✓ Arquivo atual salvo.</p>}
                </div>

                <div>
                   <label className="block text-xs font-bold text-gray-700 mb-1">Resumo (PDF)</label>
                   <input type="file" accept=".pdf" onChange={e => setSummaryFile(e.target.files?.[0] || null)} className="w-full text-xs" />
                   {existingSummaryUrl && <p className="text-[10px] text-green-600 mt-1">✓ Arquivo atual salvo.</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">YouTube Link</label>
                  <input 
                    type="text" 
                    value={youtubeLink}
                    onChange={e => setYoutubeLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="https://..."
                  />
                </div>

                <div className="pt-4 flex gap-2">
                  {editingId && (
                    <button 
                      type="button" 
                      onClick={handleCancelEdit}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Cadastrar')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* --- COLUNA DA DIREITA: LISTA DE AULAS --- */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
               <h3 className="text-lg font-bold text-slate-800 mb-4">Aulas Cadastradas no Banco</h3>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                       <tr>
                         <th className="px-4 py-3">Título</th>
                         <th className="px-4 py-3">Disciplina</th>
                         <th className="px-4 py-3 text-right">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dbLessons.map((lesson) => (
                        <tr key={lesson.id} className="hover:bg-blue-50 transition-colors">
                           <td className="px-4 py-3 font-medium text-slate-800">
                             {lesson.title}
                             {lesson.category && <span className="block text-[10px] text-gray-400">{lesson.category}</span>}
                           </td>
                           <td className="px-4 py-3 text-gray-500">
                             {SUBJECTS.find(s => s.id === lesson.subjectId)?.title || lesson.subjectId}
                           </td>
                           <td className="px-4 py-3 text-right flex justify-end gap-2">
                             <button 
                               onClick={() => handleEdit(lesson)}
                               className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                               title="Editar"
                             >
                               <IconEdit className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleDelete(lesson.id)}
                               className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                               title="Excluir"
                             >
                               <IconX className="w-4 h-4" />
                             </button>
                           </td>
                        </tr>
                      ))}
                      {dbLessons.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                            Nenhuma aula encontrada no banco de dados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;