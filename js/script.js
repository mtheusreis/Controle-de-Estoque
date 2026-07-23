import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "XXXXXXXXXXXX",
    authDomain: "controlefreezer.firebaseapp.com",
    projectId: "controlefreezer",
    storageBucket: "controlefreezer.firebasestorage.app",
    messagingSenderId: "XXXXXXXXXX",
    appId: "XXXXXXXXXXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence);

onAuthStateChanged(auth, (user) => {
    const caminho = window.location.pathname;
    const estaNaPaginaDeLogin = caminho.includes("login.html");

    if (!user) {
        if (!estaNaPaginaDeLogin) {
            window.location.href = "login.html";
        }
    } else {
        if (estaNaPaginaDeLogin) {
            window.location.href = "index.html";
        }
    }
});
