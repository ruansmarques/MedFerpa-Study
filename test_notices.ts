import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  const qClasses = query(collection(db, 'lessons'), where('type', '==', 'class'));
  const snapClasses = await getDocs(qClasses);
  console.log(`Found ${snapClasses.docs.length} classes`);

  const q = query(collection(db, 'lessons'), where('type', '==', 'notice'));
  const snap = await getDocs(q);
  console.log(`Found ${snap.docs.length} notices`);
  process.exit(0);
}
test().catch(console.error);
