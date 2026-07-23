import { doc, getDocs, getDoc, updateDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, auth } from './script.js';

const DOM = {
    tableBody: document.getElementById('table-body'),
    saveButton: document.getElementById('salvar-btn')
};

const STATE = {
    currentData: {},
    change: {},
    wasChanged: false
};

const collectionProdutos = collection(db, 'produtos');

function handleEstoque(action, id) {
    if (STATE.currentData[id] === undefined) return;

    if (action === 'add') {
        STATE.currentData[id] += 1;
    } else if (action === 'rm') {
        STATE.currentData[id] = Math.max(0, STATE.currentData[id] - 1);
    }

    STATE.change[id] = STATE.currentData[id];

    const estoqueValue = document.getElementById(`estoque-${id}`);
    if (estoqueValue) {
        estoqueValue.innerText = STATE.currentData[id];
    }

    STATE.wasChanged = true;
    DOM.saveButton.disabled = false;
}

window.handleEstoque = handleEstoque;

function resetState() {
    STATE.currentData = {};
    STATE.change = {};
    STATE.wasChanged = false;
    DOM.saveButton.disabled = true;
}

async function loadEstoque() {
    DOM.tableBody.innerHTML = `<tr><td colspan="3">Carregando...</td></tr>`;
    resetState();

    try {
        const queryEstoque = await getDocs(collectionProdutos);

        if (queryEstoque.empty) {
            DOM.tableBody.innerHTML = `<tr><td colspan="3">Nenhum produto encontrado.</td></tr>`;
            return;
        }

        const rowsHtml = queryEstoque.docs.map(produtoDoc => {
            const data = produtoDoc.data();
            const produtoId = produtoDoc.id;
            STATE.currentData[produtoId] = Number(data.estoque) || 0;

            return `
                <tr>
                    <td>${data.nome}</td>
                    <td id="estoque-${produtoId}">${STATE.currentData[produtoId]}</td>
                    <td>
                        <button class="rm-btn" onclick="handleEstoque('rm', '${produtoId}')">-</button>
                        <button class="add-btn" onclick="handleEstoque('add', '${produtoId}')">+</button>
                    </td>
                </tr>
            `;
        }).join('');

        DOM.tableBody.innerHTML = rowsHtml;

    } catch (error) {
        console.error("Erro ao carregar o estoque: ", error);
        DOM.tableBody.innerHTML = `<tr><td colspan="3">Erro ao carregar dados.</td></tr>`;
    }
}

DOM.saveButton.addEventListener('click', async () => {
    if (!STATE.wasChanged || Object.keys(STATE.change).length === 0) return;

    DOM.saveButton.disabled = true;

    try {
        const updates = Object.keys(STATE.change).map(async (produtoId) => {
            const produtoRef = doc(db, 'produtos', produtoId);
            const docSnap = await getDoc(produtoRef);

            if (docSnap.exists()) {
                const produto = docSnap.data();

                const novoEstoque = Number(STATE.change[produtoId]) || 0;
                const mediaCaixa = Number(produto.mediaCaixa) || 1;
                const caixasNecessarias = Number(produto.necessarias) || 0;

                let comprarQtd = caixasNecessarias - Math.ceil(novoEstoque / mediaCaixa);
                if (comprarQtd < 0) comprarQtd = 0;

                await updateDoc(produtoRef, {
                    estoque: novoEstoque,
                    comprar: Math.round(comprarQtd)
                });
            }
        });

        await Promise.all(updates);

        await loadEstoque();

    } catch (error) {
        console.error("Erro ao salvar estoque: ", error);
        DOM.saveButton.disabled = false;
    }
});

loadEstoque();
