import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkDriveLinks() {
  const snapshot = await getDocs(collection(db, 'lessons'));
  const driveLinks = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.slideUrl && data.slideUrl.includes('drive.google.com')) {
      driveLinks.push({ id: doc.id, url: data.slideUrl });
    }
    if (data.summaryUrl && data.summaryUrl.includes('drive.google.com')) {
      driveLinks.push({ id: doc.id, url: data.summaryUrl });
    }
  });
  console.log(`Found ${driveLinks.length} Google Drive links.`);
  console.log(driveLinks.slice(0, 5));
}

checkDriveLinks();
