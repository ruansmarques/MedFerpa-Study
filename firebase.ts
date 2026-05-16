// Standard Firebase v9+ modular SDK initialization
import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCAgQfNO2wevnhRgEr6hTPBvJAHdOX0pJc",
  authDomain: "sp-medcenter.firebaseapp.com",
  projectId: "sp-medcenter",
  storageBucket: "sp-medcenter.firebasestorage.app",
  messagingSenderId: "101407635328",
  appId: "1:101407635328:web:03b85490c6a0edaf3a3365",
  measurementId: "G-3LW1184G83"
};

// Initialize the Firebase app instance
const app = initializeApp(firebaseConfig);

// Inicializa e exporta o Banco de Dados (Firestore) com persistência local e suporte a múltiplas abas
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}),
  experimentalForceLongPolling: true,
});

// Inicializa e exporta o Storage (Arquivos)
const storage = getStorage(app);

// Inicializa e exporta a Autenticação
const auth = getAuth(app);

export { db, storage, auth };