export const PRECOS_LINHA = {
    'Tradicional': 8.20,
    'Premium': 14.35,
    'Lançamento': 47.21,
    'Extra': 11.45
};

export function calculaValor(linha, quantidade, pesoValor) {
    const preco = PRECOS_LINHA[linha] || 0;
    return preco * (quantidade * pesoValor);
}

export function formatCurrency(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function homePage() {
    window.location.href = 'index.html';
}

const today = new Date();
export const DATA = {
    dia: today.getDate().toString().padStart(2, '0'),
    mes: (today.getMonth() + 1).toString().padStart(2, '0'),
    ano: today.getFullYear().toString(),
}
