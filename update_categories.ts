import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import * as fs from 'fs';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf-8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
    const querySnapshot = await getDocs(collection(db, 'lessons'));
    let updated = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        if (data.subjectId === 'anat-patol' || data.subjectId === 'proc-patol') {
            const titleUpper = (data.title || '').toUpperCase();
            let newCat = data.category;
            
            if (titleUpper.includes('PARASIT')) {
                newCat = 'Parasitologia';
            } else if (titleUpper.includes('MICRO') || titleUpper.includes('BACTÉRIA') || titleUpper.includes('VÍRUS') || titleUpper.includes('INFECCIOSA')) {
                newCat = 'Microbiologia';
            } else if (titleUpper.includes('FUNG')) {
                newCat = 'Microbiologia';
            } else if (titleUpper.includes('HELMINT')) {
                newCat = 'Parasitologia';
            }
            
            if (newCat !== data.category) {
                console.log(`Updating ${data.title} to category ${newCat}`);
                await updateDoc(doc(db, 'lessons', docSnapshot.id), { category: newCat });
                updated++;
            }
        }
    }
    console.log(`Updated ${updated} lessons.`);
}

run().catch(console.error);
