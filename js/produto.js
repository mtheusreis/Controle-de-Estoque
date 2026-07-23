import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, auth } from './script.js';
import { formatCurrency, homePage, PRECOS_LINHA } from './utils/tools.js';

const DOM = {
    form: document.getElementById('edit-produto'),
    tituloPagina: document.getElementById('titulo-pagina'),

    inputNome: document.getElementById('nome'),
    inputLinha: document.getElementById('linha'),
    inputConsumo: document.getElementById('consumoMedioDiario'),
    inputMediaPacote: document.getElementById('mediaPacote'),
    inputMediaCaixa: document.getElementById('mediaCaixa'),
    inputEstoqueAtual: document.getElementById('estoque'),
    inputValorPeso: document.getElementById('valorPeso'),

    txtConsumoTotal8Dias: document.getElementById('consumo-total-8dias'),
    txtTotalUnidadesCaixa: document.getElementById('total-unidades-caixa'),
    txtCaixasNecessarias: document.getElementById('caixas-necessarias'),
    txtCaixasEstoque: document.getElementById('caixas-estoque'),
    txtCaixasAComprar: document.getElementById('caixas-a-comprar'),
    txtvalorLinha: document.getElementById('valorLinha'),

    btnDelete: document.getElementById("btn-del"),
    btnDecrementar: document.getElementById('btn-decrementar'),
    btnIncrementar: document.getElementById('btn-incrementar')
};

const urlParams = new URLSearchParams(window.location.search);
const produtoId = urlParams.get('id');
const collectionProdutos = collection(db, 'produtos');

function atualizarValorLinhaUI(linhaSelecionada) {
    const preco = PRECOS_LINHA[linhaSelecionada] || 0;
    DOM.txtvalorLinha.innerHTML = formatCurrency(preco);
}

function atualizarEstoque(mudanca) {
    const valorAtual = parseInt(DOM.inputEstoqueAtual.value) || 0;
    let novoValor = valorAtual + mudanca;

    const min = parseInt(DOM.inputEstoqueAtual.getAttribute('min'));

    if (!isNaN(min) && novoValor < min) {
        novoValor = min;
    }

    DOM.inputEstoqueAtual.value = novoValor;
    DOM.inputEstoqueAtual.dispatchEvent(new Event('input', { bubbles: true }));
    DOM.inputEstoqueAtual.dispatchEvent(new Event('change', { bubbles: true }));
}

function calcularEstoque() {
    const DIAS_PERIODO = 8;

    const consumoDiario = Number(DOM.inputConsumo.value) || 0;
    const unidadesPorPacote = Number(DOM.inputMediaPacote.value) || 0;
    const pacotesPorCaixa = Number(DOM.inputMediaCaixa.value) || 0;
    const estoque = Number(DOM.inputEstoqueAtual.value) || 0;

    const consumoTotalUnidades = consumoDiario * DIAS_PERIODO;
    DOM.txtConsumoTotal8Dias.textContent = consumoTotalUnidades;

    const unidadesPorCaixa = unidadesPorPacote * pacotesPorCaixa;
    DOM.txtTotalUnidadesCaixa.textContent = unidadesPorCaixa;
    const totalCaixasNoEstoque = Math.floor(estoque / (pacotesPorCaixa || 1)) || 0;

    let caixasNecessariasParaConsumo = 0;
    let caixasAComprar = 0;

    if (unidadesPorCaixa > 0) {
        caixasNecessariasParaConsumo = Math.ceil(consumoTotalUnidades / unidadesPorCaixa);
        caixasAComprar = caixasNecessariasParaConsumo - Math.ceil(estoque / (pacotesPorCaixa || 1));

        if (caixasAComprar < 0) caixasAComprar = 0;
    }

    DOM.txtCaixasNecessarias.textContent = caixasNecessariasParaConsumo;
    DOM.txtCaixasAComprar.textContent = caixasAComprar;
    DOM.txtCaixasEstoque.textContent = totalCaixasNoEstoque;
}

async function deleteProduto(itemId) {
    const itemDelete = doc(db, 'produtos', itemId);

    try {
        await deleteDoc(itemDelete);
        alert("Produto deletado com sucesso.");
        homePage();
    } catch (error) {
        console.error("Erro ao deletar produto: ", error);
        alert("Erro ao deletar produto.");
    }
}

['input', 'change'].forEach(eventType => {
    [DOM.inputConsumo, DOM.inputMediaPacote, DOM.inputMediaCaixa, DOM.inputEstoqueAtual].forEach(input => {
        input.addEventListener(eventType, calcularEstoque);
    });
});

DOM.inputLinha.addEventListener('change', (e) => {
    atualizarValorLinhaUI(e.target.value);
});

DOM.btnDecrementar.addEventListener('click', () => atualizarEstoque(-1));
DOM.btnIncrementar.addEventListener('click', () => atualizarEstoque(1));

DOM.btnDelete.addEventListener('click', () => {
    if (confirm("Deseja deletar esse produto?")) {
        deleteProduto(produtoId);
    }
});

window.addEventListener('DOMContentLoaded', async () => {
    atualizarValorLinhaUI(DOM.inputLinha.value);

    if (produtoId) {
        DOM.tituloPagina.textContent = "Editar Produto";

        try {
            const docRef = doc(db, 'produtos', produtoId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const produto = docSnap.data();

                DOM.inputNome.value = produto.nome || '';
                DOM.inputLinha.value = produto.linha || '';
                DOM.inputConsumo.value = produto.consumoMedioDiario || '';
                DOM.inputMediaPacote.value = produto.mediaPacote || '';
                DOM.inputMediaCaixa.value = produto.mediaCaixa || '';
                DOM.inputEstoqueAtual.value = produto.estoque || 0;
                DOM.inputValorPeso.value = produto.valorPeso || 0;

                atualizarValorLinhaUI(DOM.inputLinha.value);
                calcularEstoque();
            } else {
                alert("Erro: Produto não encontrado.");
                homePage();
            }
        } catch (error) {
            console.error("Erro ao carregar produto: ", error);
        }
    } else {
        DOM.btnDelete.style.display = 'none';
        DOM.tituloPagina.textContent = "Adicionar Novo Produto";
    }
});

DOM.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const estoqueAtual = Number(DOM.inputEstoqueAtual.value) || 0;
    const mediaCaixaAtual = Number(DOM.inputMediaCaixa.value) || 1;
    const mediaPacoteAtual = Number(DOM.inputMediaPacote.value) || 0;
    const consumoDiarioAtual = Number(DOM.inputConsumo.value) || 0;

    const unidadesPorCaixa = (mediaPacoteAtual * mediaCaixaAtual) || 1;
    const caixasNecessarias = Math.ceil((consumoDiarioAtual * 8) / unidadesPorCaixa);

    let comprarQtd = caixasNecessarias - Math.ceil(estoqueAtual / mediaCaixaAtual);
    if (comprarQtd < 0) comprarQtd = 0;

    const dadosProduto = {
        nome: DOM.inputNome.value,
        linha: DOM.inputLinha.value,
        consumoMedioDiario: consumoDiarioAtual,
        mediaPacote: mediaPacoteAtual,
        mediaCaixa: mediaCaixaAtual,
        valorPeso: Number(DOM.inputValorPeso.value) || 0,
        necessarias: caixasNecessarias,
        estoque: estoqueAtual,
        comprar: comprarQtd
    };

    try {
        if (produtoId) {
            const docRef = doc(db, 'produtos', produtoId);
            await updateDoc(docRef, dadosProduto);
            alert("Produto atualizado com sucesso!");
        } else {
            await addDoc(collectionProdutos, dadosProduto);
            alert("Produto adicionado com sucesso!");
        }

        homePage();
    } catch (error) {
        console.error("Erro ao salvar o produto: ", error);
    }
});
