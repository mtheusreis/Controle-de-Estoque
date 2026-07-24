# Controle-de-Estoque

## Visão Geral

O sistema simplifica o controle de insumos consumidos diariamente por funcionários, automatizando o cálculo de reabastecimento com base em ciclos fixos de suprimento (8 dias).

### Principais Funcionalidades:
* **Autenticação e Segurança:** Acesso restrito a funcionários autenticados via Firebase Auth.
* **Baixa Operacional em Tempo Real:** Interface ágil para incremento e decremento de pacotes no estoque diário.
* **Cálculo Preditivo de Compras:** Determina dinamicamente a quantidade de caixas a comprar para cobrir a demanda até a próxima data de entrega.
* **Geração de Relatórios em PDF:** Consolidação do pedido de compra com exportação direta para PDF e botão de confirmação de recebimento para atualização automática do estoque.


## Regras de Negócio & Algoritmos

### 1. Especificação de Embalagem e Precificação
Os produtos são comercializados pelo fornecedor em **caixas**, contendo uma quantidade fixa de **pacotes/unidades**. O custo final de cada caixa é derivado da **categoria/linha** do produto (valor do kg) e do **peso total da caixa**.

#### Preços da Linha (por kg):
| Linha | Custo por kg (R$) |
| :--- | :--- |
| **Tradicional** | R$ 8,20 |
| **Premium** | R$ 14,35 |
| **Extra** | R$ 11,45 |
| **Lançamento** | R$ 47,21 |

## Arquitetura e Tecnologias

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Firestore](https://img.shields.io/badge/Firestore-039BE5?style=flat-square&logo=Firebase&logoColor=white)

- **Front-end:** HTML5, CSS3, JavaScript (ES6+ Modules)
- **Backend-as-a-Service (BaaS):** Firebase (v10.12.0)
  - **Firebase Authentication:** Controle de acesso e persistência de sessão local (`browserLocalPersistence`).
  - **Cloud Firestore:** Banco de dados NoSQL em tempo real.
- **Bibliotecas:**
  - `html2pdf.js`: Conversão do relatório de compras renderizado na DOM para documento PDF.
  - `Ionicons`: Iconografia da interface.
 

## Fluxo de Funcionamento

```
[ Login de Funcionário ] ───────────────► [ Ajuste Rápido de Estoque ] (Retiradas do dia a dia)
           │                      
           ▼                          
          
[ Dashboard Principal ]          
           │
           ├───────────────► [ Cadastro / Edição de Produto ] (Média de consumo, linha e pesos)
           │
           ▼
[ Relatório de Compras ]
           │
           ├──► Gerar PDF (Envio ao Fornecedor)
           │
           └──► Dar Baixa no Recebimento ──► Atualiza estoque e recalcula compras automaticamente
```

## Visual do Sistema

### Dashboard e Visão Geral
<img src="https://github.com/user-attachments/assets/51cd7eca-501b-433e-9a99-ccda7a323cde" alt="Dashboard do Sistema" width="100%" />

### Adicionar/Editar Produtos
<img src="https://github.com/user-attachments/assets/5b1ef7fa-b883-4344-bd28-2e736d1ab54d" alt="Editar Produtos" width="80%" />

### Relatório e Pedido de Compras
<img src="https://github.com/user-attachments/assets/82c67093-f937-4e89-8a29-6d19b75e02c7" alt="Relatório de Compras" width="100%" />

### Controle Rápido de Estoque (Mobile App)
<img src="https://github.com/user-attachments/assets/ed1c9a9d-38ee-44df-8b13-b5ab15ccd148" alt="Controle Mobile" width="350px" />


## Instalação e Configuração

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/mtheusreis/Controle-de-Estoque.git
   cd Controle-de-Estoque
   ```

2. **Configuração do Firebase:**
   As credenciais de acesso ao serviço Firebase Firestore e Authentication estão localizadas no arquivo `script.js`. Certifique-se de configurar as regras de segurança no console do Firebase para que apenas usuários autenticados possam ler e escrever nas coleções.

3. **Execução:**
   Como o projeto utiliza módulos nativos do ES6 (`import`/`export`), sirva os arquivos através de um servidor HTTP local (como Live Server no VS Code, Nginx, ou Python `http.server`):
   ```bash
   python -m http.server 8000
   ```
   Acesse no navegador: `http://localhost:8000/login.html`.

