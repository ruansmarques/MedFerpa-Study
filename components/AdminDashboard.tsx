
import React, { useState, useEffect, useRef } from 'react';
import { SUBJECTS, DEFAULT_SUBJECT_SLOTS } from '../constants';
import { db, storage } from '../firebase';
import { collection, query, orderBy, where, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [summaryFile, setSummaryFile] = useState<File | null>(null);
  
  const [dbLessons, setDbLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
    const q = query(collection(db, "lessons"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: Lesson[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Lesson));
    setDbLessons(list);
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
    setSubjectId('');
    setCategory('');
    setDate('');
    setNoticeMessage('');
    setSelectedSlots([]);
    setYoutubeLink('');
    setSlideFile(null);
    setSummaryFile(null);
    setEntryType('class');
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
  };

  // Fix: Handle Delete
  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este registro?")) {
        setLoading(true);
        try {
            await deleteDoc(doc(db, "lessons", id));
            fetchLessons();
        } catch (e) {
            alert("Erro ao excluir: " + e.message);
        } finally {
            setLoading(false);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let slideUrl = null;
      let summaryUrl = null;
      
      const currentLesson = dbLessons.find(l => l.id === editingId);

      if (slideFile) {
        const sRef = ref(storage, `materials/uploads/slides/${Date.now()}_${slideFile.name}`);
        await uploadBytes(sRef, slideFile);
        slideUrl = await getDownloadURL(sRef);
      } else {
        slideUrl = currentLesson?.slideUrl || null;
      }

      if (summaryFile) {
        const rRef = ref(storage, `materials/uploads/resumos/${Date.now()}_${summaryFile.name}`);
        await uploadBytes(rRef, summaryFile);
        summaryUrl = await getDownloadURL(rRef);
      } else {
        summaryUrl = currentLesson?.summaryUrl || null;
      }

      const payload: any = {
        subjectId, title, period, date, category, type: entryType,
        description: entryType === 'notice' ? noticeMessage : null,
        targetSlots: selectedSlots,
        slideUrl, summaryUrl,
        youtubeIds: youtubeLink ? [youtubeLink.split('v=')[1]?.split('&')[0] || youtubeLink] : (currentLesson?.youtubeIds || []),
        updatedAt: new Date().toISOString()
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
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
    if (l.period !== period) return false;
    if (subjectId && l.subjectId !== subjectId) return false;
    if (category && l.category !== category) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b p-4 px-8 flex justify-between items-center sticky top-0 z-50">
         <div className="flex items-center gap-4">
            <h1 className="font-black text-xl">MEDFERPA <span className="text-blue-600">ADMIN</span></h1>
         </div>
         <button onClick={onExit} className="text-gray-400 hover:text-slate-800 font-bold">Sair do Painel</button>
      </header>

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
                            <label className={`flex-1 p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition ${slideFile ? 'bg-blue-50 border-blue-400 text-blue-600' : 'bg-gray-50 border-gray-200'}`}>
                                <input type="file" className="hidden" onChange={e => setSlideFile(e.target.files?.[0] || null)} />
                                <div className="flex flex-col items-center"><IconPresentation className="w-6 h-6 mb-1" /> <span className="text-[10px] font-bold uppercase">{slideFile ? 'Slide Selecionado' : 'Carregar Slide'}</span></div>
                            </label>
                            <label className={`flex-1 p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition ${summaryFile ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : 'bg-gray-50 border-gray-200'}`}>
                                <input type="file" className="hidden" onChange={e => setSummaryFile(e.target.files?.[0] || null)} />
                                <div className="flex flex-col items-center"><IconBook className="w-6 h-6 mb-1" /> <span className="text-[10px] font-bold uppercase">{summaryFile ? 'Resumo Selecionado' : 'Carregar Resumo'}</span></div>
                            </label>
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
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase">Data / Título</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {filteredLessons.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50">
                            <td className="p-4">
                                <div className="text-[10px] font-bold text-blue-500 mb-1">{l.date?.split('-').reverse().join('/')} | Slots: {l.targetSlots?.join(', ') || 'N/A'}</div>
                                <div className="text-sm font-bold text-slate-800 line-clamp-1">{l.title}</div>
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
    </div>
  );
};

export default AdminDashboard;
