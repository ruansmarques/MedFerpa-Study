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
        if (data.subjectId === 'anat-patol') {
            const titleUpper = (data.title || '').toUpperCase();
            let newCat = data.category;
            
            if (titleUpper.includes('PARASITO') || titleUpper.includes('HELMINTOS') || titleUpper.includes('LEISHMANIOSE')) {
                newCat = 'Parasitologia';
            } else if (titleUpper.includes('INFECCIOSAS') || titleUpper.includes('BACTÉRIA') || titleUpper.includes('VÍRUS') || titleUpper.includes('FUNGOS')) {
                newCat = 'Microbiologia';
            } else {
                newCat = 'Geral';
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
