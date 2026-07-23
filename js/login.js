import { auth } from './script.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { homePage } from './utils/tools.js';

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        homePage();
    } catch (error) {
        alert("Erro ao fazer login: Verifique suas credenciais.");
    }
});
