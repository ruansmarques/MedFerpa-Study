import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuração do Firebase do projeto "ub-medcenter"
const firebaseConfig = {
  apiKey: "AIzaSyDnma4IDMFzM7TmPwY1HLULk2cwUaHPhxg",
  authDomain: "ub-medcenter.firebaseapp.com",
  projectId: "ub-medcenter",
  storageBucket: "ub-medcenter.firebasestorage.app",
  messagingSenderId: "436879223866",
  appId: "1:436879223866:web:c50058d8af0bc48d6b1903",
  measurementId: "G-60GVEZQ57M"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta o Banco de Dados (Firestore)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}),
  experimentalForceLongPolling: true,
});

// Inicializa e exporta o Storage (Arquivos)
const storage = getStorage(app);

export { db, storage };