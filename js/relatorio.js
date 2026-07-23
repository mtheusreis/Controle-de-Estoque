import { where, getDocs, query, collection, getDoc, doc, updateDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { calculaValor, formatCurrency, DATA } from './utils/tools.js';
import { db, auth } from './script.js';

const DOM = {
    relatorioBody: document.getElementById('relatorio-body'),
    btnSalvar: document.getElementById('btn-adicionar'),
    btnEstoque: document.getElementById('btn-estoque'),
    textData: document.getElementById('title-text'),
    botoesGrupo: document.querySelector('.grupo-botoes'),
    totais: {
        caixas: document.getElementById('total-caixas'),
        produtos: document.getElementById('total-produtos'),
        valor: document.getElementById('total-valor')
    }
};

const STATE = {
    relatorio: {},
    totais: {
        caixas: 0,
        produtos: 0,
        valor: 0
    }
};

DOM.textData.innerHTML += `${DATA.dia}/${DATA.mes}/${DATA.ano}`;

function loadInfoTexts() {
    DOM.totais.caixas.innerHTML = `${STATE.totais.caixas} <ion-icon name="file-tray"></ion-icon>`;
    DOM.totais.valor.innerHTML = `${formatCurrency(STATE.totais.valor)}  <ion-icon name="cash"></ion-icon>`;
    DOM.totais.produtos.innerHTML = `${STATE.totais.produtos} <ion-icon name="file-tray-full"></ion-icon>`;
}

function handleRemove(id) {
    if (!STATE.relatorio[id]) return;

    STATE.totais.produtos--;
    STATE.totais.caixas -= STATE.relatorio[id].caixas;
    STATE.totais.valor -= STATE.relatorio[id].valor;
    delete STATE.relatorio[id];

    const row = document.getElementById(`line-${id}`);
    if (row) row.remove();

    loadInfoTexts();
}

window.handleRemove = handleRemove;

function resetTotais() {
    STATE.totais.caixas = 0;
    STATE.totais.produtos = 0;
    STATE.totais.valor = 0;

    for (const prop in STATE.relatorio) {
        delete STATE.relatorio[prop];
    }
}

async function limparRelatorios() {
    const relatoriosRef = collection(db, 'relatorios');
    const queryRelatorios = await getDocs(relatoriosRef);

    const deletePromises = queryRelatorios.docs.map(docSnap =>
        deleteDoc(doc(db, 'relatorios', docSnap.id))
    );

    await Promise.all(deletePromises);
}

async function gerarRelatorio() {
    resetTotais();
    DOM.relatorioBody.innerHTML = ``;

    try {
        const relatoriosRef = collection(db, 'relatorios');
        const queryRelatorioSalvo = await getDocs(relatoriosRef);

        if (!queryRelatorioSalvo.empty) {
            queryRelatorioSalvo.forEach(docSnap => {
                const data = docSnap.data();
                const produtoId = data.produtoId || docSnap.id;

                STATE.relatorio[produtoId] = {
                    'produtoId': produtoId,
                    'nome': data.nome,
                    'valor': data.valor,
                    'caixas': data.caixas,
                    'docRelatorioId': docSnap.id
                };

                DOM.relatorioBody.innerHTML += `
                    <tr id="line-${produtoId}">
                        <td>${data.nome}</td>
                        <td>${data.caixas}</td>
                        <td>${formatCurrency(data.valor)}</td>
                        <td>
                            <button class='btn-remove' onclick="handleRemove('${produtoId}')">
                                <ion-icon name="remove-circle"></ion-icon>
                            </button>
                        </td>
                    </tr>
                `;

                STATE.totais.caixas += data.caixas;
                STATE.totais.valor += data.valor;
                STATE.totais.produtos++;
            });

            loadInfoTexts();
            return;
        }

        const prod = collection(db, 'produtos');
        const p = query(prod, where("comprar", ">", 0));
        const queryProdutos = await getDocs(p);

        queryProdutos.forEach(produto => {
            const data = produto.data();
            const produtoId = produto.id;
            const valorFinalProduto = calculaValor(data.linha, data.comprar, data.valorPeso);

            STATE.relatorio[produtoId] = {
                'produtoId': produtoId,
                'nome': data.nome,
                'valor': valorFinalProduto,
                'caixas': data.comprar
            };

            DOM.relatorioBody.innerHTML += `
                <tr id="line-${produtoId}">
                    <td>${data.nome}</td>
                    <td>${data.comprar}</td>
                    <td>${formatCurrency(valorFinalProduto)}</td>
                    <td>
                        <button class='btn-remove' onclick="handleRemove('${produtoId}')">
                            <ion-icon name="remove-circle"></ion-icon>
                        </button>
                    </td>
                </tr>
            `;

            STATE.totais.caixas += data.comprar;
            STATE.totais.valor += valorFinalProduto;
            STATE.totais.produtos++;
        });

        loadInfoTexts();

    } catch (error) {
        console.log('Erro ao gerar relatório: ', error);
    }
}

DOM.btnSalvar.addEventListener("click", gerarPDF);
DOM.btnEstoque.addEventListener("click", atualizaEstoque);

gerarRelatorio();

async function atualizaEstoque() {
    const produtosNoRelatorio = Object.keys(STATE.relatorio);

    if (produtosNoRelatorio.length === 0) {
        alert("Não há produtos no relatório para atualizar o estoque.");
        return;
    }

    try {
        for (const produtoId of produtosNoRelatorio) {
            try {
                const produtoRef = doc(db, 'produtos', produtoId);
                const snapshot = await getDoc(produtoRef);

                if (snapshot.exists()) {
                    const data = snapshot.data();
                    const quantidadeCaixasCompradas = STATE.relatorio[produtoId].caixas;
                    const mediaCaixa = data.mediaCaixa || 1;
                    const quantidadeComprada = quantidadeCaixasCompradas * mediaCaixa;

                    const estoqueAtual = data.estoque || 0;
                    const comprarAtual = data.comprar || 0;
                    const novoEstoque = estoqueAtual + quantidadeComprada;
                    const novaCompra = comprarAtual - quantidadeCaixasCompradas;

                    await updateDoc(produtoRef, {
                        estoque: novoEstoque,
                        comprar: novaCompra
                    });

                } else {
                    console.log(`Produto ID ${produtoId} não foi encontrado.`);
                }

            } catch (error) {
                console.log(`Erro ao atualizar o produto ID ${produtoId}: `, error);
            }
        }

        await limparRelatorios();

        alert("Estoque atualizado com sucesso.");
        gerarRelatorio();

    } catch (error) {
        console.log("Erro geral na atualização de estoque: ", error);
    }
}

async function gerarPDF() {
    try {
        await limparRelatorios();

        const relatorioCompleto = Object.entries(STATE.relatorio);
        const savePromises = relatorioCompleto.map(([itemID, itemValue]) => {
            return addDoc(collection(db, 'relatorios'), {
                produtoId: itemID,
                nome: itemValue.nome,
                caixas: itemValue.caixas,
                valor: itemValue.valor
            });
        });

        await Promise.all(savePromises);

    } catch (error) {
        console.log("Erro ao salvar relatório: ", error);
    }

    const elemento = document.body;

    elemento.classList.add("pdf-mode");

    if (DOM.botoesGrupo) {
        DOM.botoesGrupo.style.display = "none";
    }

    const opcoes = {
        margin: 10,
        filename: 'relatorio_compras.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            width: 1400
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'landscape'
        }
    };

    html2pdf()
        .set(opcoes)
        .from(elemento)
        .save()
        .then(() => {
            elemento.classList.remove("pdf-mode");
            if (DOM.botoesGrupo) {
                DOM.botoesGrupo.style.display = "block";
            }
        });
}
