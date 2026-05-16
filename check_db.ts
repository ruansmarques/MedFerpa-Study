import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const d = await getDoc(doc(db, 'users', '24151433-0'));
  console.log('Exists?', d.exists());
  if (d.exists()) {
    console.log(d.data());
  }
  process.exit(0);
}

check().catch(console.error);
