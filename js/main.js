import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { calculaValor, formatCurrency } from './utils/tools.js';
import { db, auth } from './script.js';

const DOM = {
    listaProdutos: document.getElementById('produtosList'),
    totalCompra: document.getElementById('total-compras'),
    totalProdutos: document.getElementById('total-produtos'),
    totalEstoque: document.getElementById('totalEstoque'),
};

const totais = {
    estoque: 0,
    compras: 0,
    produtos: 0
};

const collectionProdutos = collection(db, 'produtos');
let unsubscribeProdutos = null;

function startListeningProducts() {
    if (unsubscribeProdutos) {
        unsubscribeProdutos();
    }

    try {
        const produtosRef = collectionProdutos;

        unsubscribeProdutos = onSnapshot(produtosRef, (querySnapshot) => {

            DOM.listaProdutos.innerHTML = "";
            totais.compras = 0;
            totais.estoque = 0;
            totais.produtos = 0;

            querySnapshot.forEach(produto => {
                const data = produto.data();
                const id = produto.id;

                let caixasEmEstoque = (data.estoque / (data.mediaCaixa || 1)).toFixed(1);
                let valEstoque = calculaValor(data.linha, caixasEmEstoque, data.valorPeso) || 0;
                let valCompra = calculaValor(data.linha, data.comprar, data.valorPeso) || 0;

                totais.compras += valCompra;
                totais.estoque += valEstoque;
                totais.produtos++;

                DOM.listaProdutos.innerHTML += `
                    <tr>
                        <td>${data.nome}</td>
                        <td>${data.estoque} pct. ||  ${caixasEmEstoque}/${data.necessarias} cx.</td>
                        <td>${formatCurrency(valEstoque)}</td>
                        <td>${formatCurrency(valCompra)}</td>
                        <td>${data.comprar} cx.</td>
                        <td>
                            <a href="produto.html?id=${id}"><button class='editButton'>
                                <ion-icon name="settings"></ion-icon>
                                Editar
                            </button></a>
                        </td>
                    </tr>
                `;
            });

            DOM.totalCompra.innerHTML = `${formatCurrency(totais.compras)} <ion-icon name="cash"></ion-icon>`;
            DOM.totalEstoque.innerHTML = `${formatCurrency(totais.estoque)} <ion-icon name="cash"></ion-icon>`;
            DOM.totalProdutos.innerHTML = `${totais.produtos} <ion-icon name="file-tray-full"></ion-icon>`;

        }, (error) => {
            console.error("Erro ao buscar produtos:", error);
        });

    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        startListeningProducts();
    } else {
        if (unsubscribeProdutos) {
            unsubscribeProdutos();
            unsubscribeProdutos = null;
        }
    }
});

window.addEventListener('beforeunload', () => {
    if (unsubscribeProdutos) {
        unsubscribeProdutos();
    }
});
