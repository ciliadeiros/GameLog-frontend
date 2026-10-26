# Testes unitários do GameLog (frontend Next.js)

Estes testes foram acrescentados **somente ao `gamelog-app/`**, que é a aplicação Next.js integrada à API FastAPI. A pasta `src/` na raiz do ZIP é um protótipo separado e não faz parte da suíte.

## 1. Requisitos

- Node.js **22 LTS ou superior** recomendado para evitar incompatibilidades de versões do ecossistema Vitest/Vite.
- npm e acesso à internet **na primeira instalação**.
- **Não é necessário** iniciar o backend FastAPI, banco MySQL nem usar token válido: as chamadas de rede são simuladas (*mocks*).

## 2. Instalação (uma vez)

Abra o terminal dentro de `GameLog-frontend/gamelog-app/`:

```bash
npm install
npm install --save-dev vitest@4 @vitejs/plugin-react@5 jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom
```

O comando acima pode ser usado no **PowerShell**, no **Prompt de Comando** e em terminais Linux/macOS.

**Importante:** a instalação acima deve atualizar `package.json` e `package-lock.json`, registrando as novas dependências. O pacote entregue preserva o lockfile original porque não foi possível acessar o registro do npm neste ambiente. **Após instalar as dependências de teste com `npm install --save-dev ...`, inclua as mudanças de `package-lock.json` no seu commit**. Até fazer isso, o comando `npm run test:run` não funcionará.

## 3. Executar

```bash
npm run test:run          # todos os testes, uma execução
npm test                  # modo observação (watch)
npm run test:ui           # equivalente ao modo watch
```

> Não há obrigação de iniciar `npm run dev` para os testes. Em caso de falha de instalação, confira a versão do Node (`node --version`) e repita a instalação das dependências.

## 4. O que está coberto

| Arquivo | O que verifica |
|---|---|
| `__tests__/classificacaoIndicativa.test.js` | Faixas ESRB → Brasil; descritores; deduplicação e limite de três |
| `__tests__/generos.test.js` | Tradução de gêneros RAWG e comportamento em valores desconhecidos |
| `__tests__/api.test.js` | Login OAuth2, cadastro, Bearer token, filtros/paginação, biblioteca e erros da API |
| `__tests__/Modal.test.jsx` | Renderização, clique no botão, Escape e clique no fundo |
| `__tests__/FiltroSidebar.test.jsx` | Acordeão, limpar filtros, checkbox e hook de seleção múltipla |
| `__tests__/ReviewsJogo.test.jsx` | Estados de carregamento, erro, lista vazia e reviews dos usuários |
| `__tests__/EntradaBibliotecaForm.test.jsx` | Status, edição de nota/review/horas, remoção e falhas da API |
| `__tests__/LoginPage.test.jsx` | Formulário, envio de login e tratamento de erro |
| `__tests__/CadastroPage.test.jsx` | Campos do cadastro, submissão e tratamento de erro |

## 5. Conceitos e apresentação

- **Teste unitário:** checa uma função isoladamente. Ex.: `classindDoEsrb({name: 'Teen'})` precisa resultar na classificação `14`.
- **Teste de componente:** renderiza um componente React isolado e simula interação. Ex.: apertar `Escape` em `Modal` precisa chamar `onFechar`.
- **Mock:** substitui temporariamente dependências como `fetch`, `useAuth` e funções do cliente API. Assim o teste não acessa dados reais.
- **`describe`/`it`/`expect`:** agrupamento, descrição do cenário e verificação da expectativa.
- **`fireEvent` e `screen`:** simulação de ações do usuário e consulta aos elementos renderizados.

A suíte evita refatorar o código de produção: as únicas alterações na aplicação são a configuração de testes, scripts no `package.json`, esta documentação e os arquivos em `__tests__/`.

## 6. Sobre a validação

**A suíte não foi executada neste ambiente**, pois o registro `registry.npmjs.org` não estava acessível no momento da preparação. Não trate estes testes como aprovados antes de rodar `npm run test:run` na sua máquina. Se houver falhas, envie a saída do terminal para diagnóstico.

Referência de configuração: https://nextjs.org/docs/app/guides/testing/vitest
