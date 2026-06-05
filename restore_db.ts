import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';
import * as fs from 'fs';

// NOTA: Estas credenciais devem ser atualizadas pelo novo banco de dados antes da execução
const firebaseConfig = {
  apiKey: "AIzaSyAQ6u5V2yo0yjpQ8-2tAKGqrk9hBhFs7LE",
  authDomain: "ub-medcenter-a4ddc.firebaseapp.com",
  projectId: "ub-medcenter-a4ddc",
  storageBucket: "ub-medcenter-a4ddc.firebasestorage.app",
  messagingSenderId: "1057344228168",
  appId: "1:1057344228168:web:e4cdd495b212e785ce017d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function restore() {
  console.log('Reading database_backup.json...');
  const backupData = JSON.parse(fs.readFileSync('database_backup.json', 'utf8'));

  for (const collectionName of Object.keys(backupData)) {
    console.log(`Restoring ${collectionName}...`);
    const items = backupData[collectionName];
    
    // Chunk items into pieces of 50 to speed up
    const chunkSize = 50;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      
      await Promise.all(chunk.map((item: any) => {
        const id = item.id;
        const data = { ...item };
        delete data.id; // avoid storing the ID inside the document twice
        return setDoc(doc(db, collectionName, id), data);
      }));
      
      console.log(`  Restored chunk ${i + chunk.length}/${items.length} records in ${collectionName}`);
    }
    console.log(`  Finished restoring ${items.length} records in ${collectionName}.`);
  }

  console.log(`Database restore completed!`);
  process.exit(0);
}

restore().catch(console.error);
