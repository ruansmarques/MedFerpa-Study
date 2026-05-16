import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCAgQfNO2wevnhRgEr6hTPBvJAHdOX0pJc",
  authDomain: "sp-medcenter.firebaseapp.com",
  projectId: "sp-medcenter",
  storageBucket: "sp-medcenter.firebasestorage.app",
  messagingSenderId: "101407635328",
  appId: "1:101407635328:web:03b85490c6a0edaf3a3365",
  measurementId: "G-3LW1184G83"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const notices = [
  { date: '2026-05-15', slots: ['2'], title: 'Aula não ministrada', subjectId: 'semio-sist', msg: 'A aula prevista não foi ministrada.' },
  { date: '2026-05-13', slots: ['3'], title: 'Aula não ministrada', subjectId: 'semio-sist', msg: 'A aula prevista não foi ministrada.' },
  { date: '2026-04-30', slots: ['3'], title: 'Aula não ministrada', subjectId: 'farma-med', msg: 'A aula prevista não foi ministrada.' },
  { date: '2026-04-29', slots: ['1'], title: 'Vista de Prova', subjectId: 'mbe', msg: 'Vista de prova disponível para os alunos.' },
  { date: '2026-04-28', slots: ['3'], title: 'Vista de Prova', subjectId: 'farma-med', msg: 'Vista de prova disponível para os alunos.' },
  { date: '2026-04-29', slots: ['3'], title: 'Aula não ministrada', subjectId: 'semio-sist', msg: 'A aula prevista não foi ministrada.' },
  { date: '2026-04-27', slots: ['3'], title: 'Aula não ministrada', subjectId: 'semio-sist', msg: 'A aula prevista não foi ministrada.' },
  { date: '2026-04-27', slots: ['1'], title: 'Vista de Prova', subjectId: 'pna', msg: 'Vista de prova disponível para os alunos.' },
  { date: '2026-04-07', slots: ['1', '2'], title: 'Período Avaliativo', subjectId: 'anat-patol', msg: 'Atividades referentes ao período avaliativo.' },
  { date: '2026-03-27', slots: ['2'], title: 'Aula não ministrada', subjectId: 'semio-sist', msg: 'A aula prevista não foi ministrada.' },
  { date: '2026-03-02', slots: ['2', '3'], title: 'Aula não ministrada', subjectId: 'semio-sist', msg: 'A aula prevista não foi ministrada.' },
  { date: '2026-02-24', slots: ['3'], title: 'Aula optativa', subjectId: 'farma-med', msg: 'Aula optativa da disciplina.' },
  { date: '2026-02-19', slots: ['3'], title: 'Aula não ministrada', subjectId: 'farma-med', msg: 'A aula prevista não foi ministrada.' },
  { date: '2026-02-17', slots: ['1', '2'], title: 'Dia não letivo', subjectId: 'anat-patol', msg: 'Não haverá aula neste dia letivo.' },
  { date: '2026-02-18', slots: ['1'], title: 'Dia não letivo', subjectId: 'mbe', msg: 'Não haverá aula neste dia letivo.' },
  { date: '2026-02-17', slots: ['3'], title: 'Dia não letivo', subjectId: 'farma-med', msg: 'Não haverá aula neste dia letivo.' },
  { date: '2026-02-18', slots: ['2', '3'], title: 'Dia não letivo', subjectId: 'semio-sist', msg: 'Não haverá aula neste dia letivo.' },
  { date: '2026-02-16', slots: ['2', '3'], title: 'Dia não letivo', subjectId: 'semio-sist', msg: 'Não haverá aula neste dia letivo.' },
  { date: '2026-02-16', slots: ['1'], title: 'Dia não letivo', subjectId: 'pna', msg: 'Não haverá aula neste dia letivo.' }
];

async function seed() {
  console.log('Seeding notices...');
  for (const n of notices) {
    await addDoc(collection(db, 'lessons'), {
      subjectId: n.subjectId,
      period: 5,
      date: n.date,
      title: n.title,
      targetSlots: n.slots,
      type: 'notice',
      description: n.msg,
      isContinuation: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: '',
      slideUrl: null,
      summaryUrl: null,
      youtubeIds: []
    });
    console.log(`Added notice: ${n.title}`);
  }
  console.log('Done!');
  process.exit(0);
}

seed().catch(console.error);
