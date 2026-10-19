# GameLog — Front-end

Interface web do **GameLog**, uma plataforma para organizar, avaliar e
acompanhar a sua biblioteca de jogos. Aqui o usuário cria uma conta, explora um
catálogo de jogos, pesquisa por nome e filtros, vê os detalhes de cada jogo e
monta a própria biblioteca (com status, nota, review e horas jogadas).

Este repositório tem **só o front-end**. Os dados vêm do back-end do projeto
(`GameLog-Backend`), que por sua vez consulta a [RAWG](https://rawg.io/apidocs).

## Tecnologias

- [Next.js 16](https://nextjs.org/) (App Router) e [React 19](https://react.dev/)
- CSS Modules (um arquivo de estilo por página/componente)
- ESLint e Prettier para qualidade e formatação do código

## O que você precisa ter instalado

- [Node.js](https://nodejs.org/) 20.9 ou mais novo (já vem com o `npm`)
- O back-end do GameLog rodando (veja o passo 2 abaixo)

## Como rodar

### 1. Instalar as dependências

Dentro da pasta do front-end:

```bash
npm install
```

### 2. Subir o back-end

O front-end não funciona sozinho: login, catálogo e biblioteca dependem da API.
No projeto `GameLog-Backend`, siga o README dele (banco MySQL `db_Gamelog`,
migrations do Alembic e o arquivo `.env` com `SECRET_KEY` e `RAWG_API_KEY`) e,
na raiz dele, rode:

```bash
uvicorn app.main:app --reload
```

A API fica em `http://localhost:8000`. O back-end já libera o endereço
`http://localhost:3000` no CORS, então não precisa mexer em nada para o front
conseguir conversar com ele.

> Atenção: o comando é `app.main:app` (e não `app.main:main`).

### 3. Configurar o endereço da API

Copie o arquivo de exemplo para `.env.local`:

```bash
# Linux / macOS
cp .env.local.example .env.local

# Windows (Prompt de Comando)
copy .env.local.example .env.local
```

| Variável              | O que é                    | Padrão                  |
| --------------------- | -------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Endereço do back-end (API) | `http://localhost:8000` |

Se o back-end estiver rodando em outro endereço, é só trocar o valor.

### 4. Rodar o front-end

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador. Para testar,
crie uma conta em **Cadastre-se**: depois do cadastro o login é feito
automaticamente.

## Scripts disponíveis

| Comando                | O que faz                                        |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Roda o app em modo de desenvolvimento            |
| `npm run build`        | Gera a versão de produção                        |
| `npm start`            | Roda a versão de produção (rode o `build` antes) |
| `npm run lint`         | Procura problemas no código com o ESLint         |
| `npm run format`       | Formata todos os arquivos com o Prettier         |
| `npm run format:check` | Só confere se está tudo formatado, sem alterar   |

## Páginas

| Rota          | Página                                                 | Precisa de login? |
| ------------- | ------------------------------------------------------ | ----------------- |
| `/`           | Página inicial                                         | Não               |
| `/login`      | Login                                                  | Não               |
| `/cadastro`   | Cadastro de usuário                                    | Não               |
| `/catalogo`   | Catálogo: destaques, categorias e jogos populares      | Sim               |
| `/pesquisa`   | Pesquisa por nome, com filtros                         | Sim               |
| `/jogo/[id]`  | Detalhes do jogo (`id` é o id do jogo na RAWG)         | Sim               |
| `/biblioteca` | Biblioteca pessoal, com filtros, status, nota e review | Sim               |

Quem acessa uma página protegida sem estar logado é enviado para `/login`. O
token da sessão fica no `localStorage` (chave `gamelog_token`).

## Estrutura do projeto

```text
app/          Páginas (cada pasta é uma rota, com page.jsx e page.module.css)
  styles/     CSS base do site e estilos compartilhados entre páginas
components/   Componentes reutilizáveis (Header, Modal, filtros, reviews...)
context/      Contextos do React: autenticação e transições de página
lib/          Cliente da API (api.js) e funções auxiliares de dados
public/       Imagens e arquivos estáticos
```

## Padrões do código

- **Formatação:** Prettier (`npm run format`). O arquivo `.prettierrc.json` guarda
  a configuração.
- **Componentes puros:** todo componente é uma função que, com as mesmas props e o
  mesmo estado, devolve sempre o mesmo resultado. Nada de alterar props ou
  variáveis de fora durante a renderização; efeitos (requisições, `localStorage`,
  redirecionamentos) ficam em `useEffect` ou em funções de evento.
- **Documentação:** módulos, componentes, funções e constantes importantes têm
  comentários no formato JSDoc, em português. Ao criar algo novo, siga o mesmo
  estilo.

## Licença

Distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).
