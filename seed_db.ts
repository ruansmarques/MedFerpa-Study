import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc } from 'firebase/firestore';

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
const db = initializeFirestore(app, {});

const users = [
  { name: "Amanda Rodrigues", ra: "24151424-9" },
  { name: "Ana Clara Cacciari", ra: "24149473-1" },
  { name: "Ana Júlia Bonnaneti", ra: "24151346-4" },
  { name: "Angelo Noventa", ra: "24151426-4" },
  { name: "Eduardo", ra: "24151048-6" },
  { name: "Emanuel Schwamback", ra: "24151429-8" },
  { name: "Geovanna Carvalho", ra: "24151586-5" },
  { name: "Karine Lobo", ra: "25154540-6" },
  { name: "Kauã Novaes ", ra: "24151587-3" },
  { name: "Ruan Marques", ra: "24151433-0" }
];

async function seed() {
  console.log('Seeding users...');
  for (const user of users) {
    await setDoc(doc(db, 'users', user.ra), {
      name: user.name,
      ra: user.ra,
      completedLessons: [],
      totalXP: 0,
      listProgress: {},
      exerciseProgress: {}
    });
    console.log(`Inserted user: ${user.name}`);
  }

  console.log('Seeding admin...');
  await setDoc(doc(db, 'admins', 'Ruan'), {
    accessKey: 'batdoc'
  });
  console.log('Inserted admin: Ruan');

  console.log('Done.');
  process.exit(0);
}

seed().catch(console.error);
