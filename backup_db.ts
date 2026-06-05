import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

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

async function backup() {
  console.log('Fetching collections...');
  const collectionsToBackup = ['lessons', 'questions', 'question_lists', 'users', 'admins'];
  const dbBackup: Record<string, any[]> = {};

  for (const collectionName of collectionsToBackup) {
    console.log(`Backing up ${collectionName}...`);
    const snapshot = await getDocs(collection(db, collectionName));
    const items: any[] = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    dbBackup[collectionName] = items;
    console.log(`  Saved ${items.length} records from ${collectionName}`);
  }

  const backupData = JSON.stringify(dbBackup, null, 2);
  fs.writeFileSync('database_backup.json', backupData);
  console.log(`Database backup completed! Saved to database_backup.json`);
  process.exit(0);
}

backup().catch(console.error);
