import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplazar con la configuración de tu proyecto de Firebase
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un proyecto
// 3. Añade una aplicación web (</>)
// 4. Copia el objeto firebaseConfig y reemplázalo aquí
const firebaseConfig = {
  apiKey: "AIzaSyAgrUpH1GXOIB4oqsw5uq9FJ7M3RfKlY3Q",
  authDomain: "financial-app-b7fbb.firebaseapp.com",
  projectId: "financial-app-b7fbb",
  storageBucket: "financial-app-b7fbb.firebasestorage.app",
  messagingSenderId: "351602158123",
  appId: "1:351602158123:web:560c87f9032a6d2be2d86e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
