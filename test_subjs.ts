import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyCAgQfNO2wevnhRgEr6hTPBvJAHdOX0pJc",
  projectId: "sp-medcenter",
};
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {});
getDocs(query(collection(db, 'lessons'), orderBy('createdAt', 'desc'))).then(s => {
  console.log('success', s.size);
  process.exit(0);
}).catch(e => {
  console.log('error', e.message);
  process.exit(0);
});
