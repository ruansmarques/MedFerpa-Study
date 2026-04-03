import { db } from './firebase.ts';
import { collection, getDocs } from 'firebase/firestore';

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
