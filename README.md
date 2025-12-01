# GreenLog - Frontend

O projeto foi criado com o ituito de atender o tema do PI (Projeto integrador) da faculdade SENAI FATESG usando [Angular CLI](https://github.com/angular/angular-cli) versão 20.0.1.

## Alunos:

- Daniel Douglas
- José Carlos
- Lucas Reis

Esta aplicação é a camada de apresentação e interação, responsável por:
1. Gerenciar o CRUD de todas as entidades do sistema (Caminhões, Bairros, Ruas, Pontos de Coleta).
2. Fornecer o Planejador de Itinerários com visualização por data.
3. Exibir o Mapa de Bairros e Ruas (Grafo) no Dashboard.
4. Implementar a autenticação de usuários.

## 🚀 Tecnologias Utilizadas

* **Framework:** Angular (Standalone Components)
* **Linguagem:** TypeScript
* **Estilização:** SCSS (com modularização e variáveis CSS)
* **Gráfico de Rede:** `vis-network` (para renderizar o mapa de bairros/ruas)

## 📦 Estrutura do Projeto

O projeto segue a arquitetura modularizada por funcionalidade:

-   `src/app/components/`: Componentes visuais organizados por funcionalidade (e.g., `trucks`, `bairros`, `routes`).
-   `src/app/services/`: Camada de acesso à API REST (comunicação HTTP).
-   `src/app/core/models/`: Interfaces de dados para comunicação com o Backend.
-   `src/app/core/guards/`: `auth.guard.ts` para proteção de rotas.
-   `src/app/core/interceptors/`: `jwt.interceptor.ts` para anexar o token de autenticação.

## 🛠️ Configuração e Execução

### Pré-requisitos

-   Node.js e npm (ou Yarn)
-   Angular CLI
-   O **GreenLog Backend**

### Instalação

```bash
# 1. Instale as dependências
npm install

# 2. Defina a URL da API (Verifique src/environments/environment.development.ts)
# Ex: apiUrl: 'http://localhost:8080/api' 

# 3. Inicie o Servidor de Desenvolvimento
ng serve
