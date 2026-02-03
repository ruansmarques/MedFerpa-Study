import React, { useState } from 'react';
import { SUBJECTS, LESSONS } from '../constants';
import { db, storage } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { IconCheck, IconX, IconSave } from './Icons';

interface AdminDashboardProps {
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState<number>(5);
  const [subjectId, setSubjectId] = useState('');
  const [category, setCategory] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [date, setDate] = useState('');
  
  // Files
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [summaryFile, setSummaryFile] = useState<File | null>(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Lógica de Login via Firestore
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');

    try {
      console.log("Tentando autenticar com senha:", password);
      
      const adminsRef = collection(db, "admins");
      // Busca exata pelo campo accessKey
      const q = query(adminsRef, where("accessKey", "==", password.trim()));
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.log("Usuário autenticado!");
        setIsAuthenticated(true);
        setError('');
      } else {
        console.warn("Senha incorreta / Nenhum documento encontrado.");
        setError('Senha incorreta.');
        setPassword('');
      }
    } catch (err: any) {
      console.error("Erro detalhado do Firebase:", err);
      
      // Tratamento específico para erro de permissão (Regras do Firestore)
      if (err.code === 'permission-denied') {
        setError('Erro de Permissão: Libere a leitura da coleção "admins" nas Regras do Firestore.');
      } else {
        setError('Erro de conexão: ' + (err.message || 'Verifique o console.'));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const filteredSubjects = SUBJECTS.filter(s => s.period === period);
  
  // Helper to extract ID
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // --- 1. VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS ---
    if (!title || title.trim() === "") {
        alert("Por favor, preencha o Título da Aula.");
        return;
    }
    if (!period) {
        alert("Por favor, selecione o Período.");
        return;
    }
    if (!subjectId || subjectId.trim() === "") {
        alert("Por favor, selecione uma Disciplina válida.");
        return;
    }
    if (!date) {
        alert("Por favor, informe a Data da Aula.");
        return;
    }

    // Validação específica para categoria se for a matéria que exige
    if (subjectId === 'proc-patol' && (!category || category.trim() === "")) {
        alert("Para 'Processos Patológicos', é obrigatório selecionar o Módulo/Categoria.");
        return;
    }

    setLoading(true);

    try {
      let slideUrl = '';
      let summaryUrl = '';
      const subject = SUBJECTS.find(s => s.id === subjectId);
      
      // Upload Slide
      if (slideFile && subject) {
        const path = `materials/${subject.folderName || 'default'}/${category ? category + '/' : ''}slides/${slideFile.name}`;
        slideUrl = await handleUpload(slideFile, path);
      }

      // Upload Summary
      if (summaryFile && subject) {
        const path = `materials/${subject.folderName || 'default'}/${category ? category + '/' : ''}resumos/${summaryFile.name}`;
        summaryUrl = await handleUpload(summaryFile, path);
      }

      // Process Video
      const videoIds: string[] = [];
      if (youtubeLink && youtubeLink.trim() !== "") {
        const id = extractYoutubeId(youtubeLink);
        if (id) videoIds.push(id);
      }

      // --- 2. CONSTRUÇÃO DO OBJETO (Evitando undefined) ---
      // O Firestore rejeita 'undefined'. Usamos 'null' para campos opcionais vazios.
      const lessonData = {
        subjectId,
        title: title.trim(),
        youtubeIds: videoIds,
        duration: 'N/A', 
        // Se category for string vazia, envia null
        category: category && category.trim() !== "" ? category : null,
        // Se não tiver URL, envia null
        slideUrl: slideUrl || null,
        summaryUrl: summaryUrl || null,
        date: date || null,
        createdAt: new Date().toISOString()
      };

      console.log("Enviando dados para o Firestore:", lessonData);

      await addDoc(collection(db, "lessons"), lessonData);

      setSuccess(true);
      // Reset Form
      setTitle('');
      setYoutubeLink('');
      setSlideFile(null);
      setSummaryFile(null);
      // Não resetamos período/disciplina/data pois o usuário pode querer cadastrar várias seguidas
      
      // Reset input de arquivo visualmente com tipagem correta
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input) => {
        (input as HTMLInputElement).value = '';
      });

    } catch (err: any) {
      console.error("Erro no cadastro:", err);
      setError(err.message || 'Erro ao salvar aula. Verifique o console.');
      alert("Erro ao salvar: " + (err.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  // --- FERRAMENTA DE MIGRAÇÃO (USO ÚNICO) ---
  const handleMigrate4thPeriod = async () => {
    if (!window.confirm("ATENÇÃO: Isso irá ler todas as aulas do 4º Período do arquivo 'constants.ts' e salvá-las no Banco de Dados (Firestore).\n\nRecomenda-se fazer isso apenas UMA VEZ para evitar duplicidade.\n\nDeseja continuar?")) {
      return;
    }

    setLoading(true);
    try {
      // 1. Identificar disciplinas do 4º período
      const p4SubjectIds = SUBJECTS.filter(s => s.period === 4).map(s => s.id);
      
      // 2. Filtrar aulas dessas disciplinas
      const lessonsToMigrate = LESSONS.filter(l => p4SubjectIds.includes(l.subjectId));

      console.log(`Encontradas ${lessonsToMigrate.length} aulas para migrar.`);

      let count = 0;
      // 3. Loop e upload
      for (const lesson of lessonsToMigrate) {
         await addDoc(collection(db, "lessons"), {
           subjectId: lesson.subjectId,
           title: lesson.title,
           youtubeIds: lesson.youtubeIds || [],
           duration: lesson.duration || 'N/A',
           category: lesson.category || null,
           // Como estamos migrando dados antigos, não temos URLs do Storage novas, 
           // nem data específica definida, enviamos null
           slideUrl: null, 
           summaryUrl: null,
           date: null,
           createdAt: new Date().toISOString(),
           isMigrated: true // Flag opcional para controle
         });
         count++;
      }

      alert(`Sucesso! ${count} aulas foram migradas para o banco de dados.`);
    } catch (err: any) {
      console.error(err);
      alert("Erro durante a migração: " + err.message);
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
                 ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-slate-800'}
                 ${authLoading ? 'opacity-50 cursor-wait' : ''}
               `}
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               disabled={authLoading}
             />
             <button 
               type="submit" 
               disabled={authLoading}
               className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
             >
               {authLoading ? 'Verificando...' : 'Entrar'}
             </button>
             {error && <p className="text-red-500 text-sm mt-4 font-medium animate-pulse">{error}</p>}
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
            <h1 className="text-lg font-bold tracking-tight">Painel de Cadastro</h1>
         </div>
         <button onClick={onExit} className="text-gray-400 hover:text-white transition text-sm font-medium">Sair</button>
      </header>

      <main className="max-w-3xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-10">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-bold text-slate-800">Nova Aula</h2>
            <p className="text-gray-500 text-sm mt-1">Preencha os dados para adicionar conteúdo à plataforma.</p>
          </div>

          {success && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 animate-fadeIn">
              <IconCheck className="w-6 h-6" />
              <span className="font-bold">Aula cadastrada com sucesso!</span>
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <IconX className="w-6 h-6" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Título */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Título da Aula <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Ex: AULA 01 - Introdução ao Sistema..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Período */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Período <span className="text-red-500">*</span></label>
                <select 
                  value={period} 
                  onChange={e => setPeriod(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p}>{p}º Período</option>)}
                </select>
              </div>

              {/* Disciplina */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Disciplina <span className="text-red-500">*</span></label>
                <select 
                  value={subjectId} 
                  onChange={e => {
                     setSubjectId(e.target.value);
                     // Auto-detect special categories needed
                     if (e.target.value !== 'proc-patol') setCategory('');
                  }}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                >
                  <option value="">Selecione...</option>
                  {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
            </div>

            {/* Categoria Opcional (apenas se for Processos Patológicos ou similar) */}
            {subjectId === 'proc-patol' && (
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Módulo / Categoria <span className="text-red-500">*</span></label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Upload Slide */}
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Arquivo de Slide (PDF)</label>
                 <div className="relative">
                   <input 
                     type="file" 
                     accept=".pdf"
                     onChange={e => setSlideFile(e.target.files ? e.target.files[0] : null)}
                     className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                   />
                 </div>
               </div>

               {/* Upload Resumo */}
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Arquivo de Resumo (PDF)</label>
                 <div className="relative">
                   <input 
                     type="file" 
                     accept=".pdf"
                     onChange={e => setSummaryFile(e.target.files ? e.target.files[0] : null)}
                     className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                   />
                 </div>
               </div>
            </div>

            {/* Video Link */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Link da Gravação (YouTube)</label>
              <input 
                type="text" 
                value={youtubeLink}
                onChange={e => setYoutubeLink(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-400 mt-1">O ID será extraído automaticamente.</p>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Data da Aula <span className="text-red-500">*</span></label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg
                  ${loading ? 'bg-gray-400 cursor-wait' : 'bg-slate-900 hover:bg-slate-800 hover:scale-[1.01]'}
                `}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Aula'}
              </button>
            </div>

          </form>

          {/* --- FERRAMENTAS AVANÇADAS --- */}
          <div className="mt-16 pt-10 border-t-2 border-dashed border-gray-200">
            <h3 className="text-lg font-bold text-gray-500 mb-4 uppercase tracking-wider text-xs">Ferramentas de Banco de Dados</h3>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="text-left">
                   <h4 className="font-bold text-slate-800">Importar Aulas do 4º Período</h4>
                   <p className="text-sm text-gray-500 mt-1">
                     Transfere as aulas do arquivo local (constants.ts) para o Firebase.
                     <br/><span className="text-orange-600 font-bold">Use apenas uma vez para não duplicar!</span>
                   </p>
                 </div>
                 <button 
                   onClick={handleMigrate4thPeriod}
                   disabled={loading}
                   className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all shadow-sm whitespace-nowrap"
                 >
                   Importar (Local -&gt; Banco)
                 </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;