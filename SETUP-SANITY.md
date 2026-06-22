# Setup do conteúdo (Sanity) — Iate Clube Brasileiro

O site puxa **Eventos** e **Notícias** do Sanity (um painel onde a secretaria/diretoria
edita sem mexer no código). Enquanto o Sanity **não** estiver configurado, o site mostra
conteúdo de exemplo (fallback) — nada quebra.

```
studio/        → painel de edição (Sanity Studio) + schemas
src/lib/       → camada que o site usa para buscar o conteúdo
```

## 1. Criar o projeto no Sanity (uma única vez)

```bash
cd studio
npm install
npx sanity login        # abre o navegador para login (Google/GitHub/e-mail)
npx sanity init         # escolha "Create new project", nome "Iate Clube Brasileiro",
                        # dataset "production" (público). NÃO deixe sobrescrever os schemas.
```

O `init` cria o projeto e mostra o **Project ID** (algo como `a1b2c3d4`). Anote.

## 2. Configurar as variáveis de ambiente

**No Studio** — copie `studio/.env.example` para `studio/.env`:

```
SANITY_STUDIO_PROJECT_ID=SEU_PROJECT_ID
SANITY_STUDIO_DATASET=production
```

**No site** — copie `.env.example` para `.env.local` (na raiz):

```
VITE_SANITY_PROJECT_ID=SEU_PROJECT_ID
VITE_SANITY_DATASET=production
```

## 3. Liberar o domínio (CORS)

Em **sanity.io/manage** → seu projeto → **API → CORS origins**, adicione:

- `http://localhost:5173` (desenvolvimento)
- `https://icb.org.br` e `https://www.icb.org.br` (produção)

Sem isso, o navegador bloqueia a leitura do conteúdo.

## 4. Rodar o painel e cadastrar conteúdo

```bash
cd studio
npm run dev             # abre http://localhost:3333
```

No painel você verá **Evento / Regata**, **Notícia** e **Galeria de fotos**. Cadastre
alguns itens. Dicas:

- **Evento**: marque "Card em destaque?" em **apenas um** (vira o card grande). O "Link
  do botão" das regatas deve apontar para `https://regatas.icb.org.br`.
- **Notícia**: a home mostra as **3 mais recentes**.

Rode o site (`npm run dev` na raiz) e o conteúdo real substitui os exemplos.

## 5. Publicar o painel (para a secretaria acessar online)

```bash
cd studio
npm run deploy          # escolha um endereço, ex.: icb.sanity.studio
```

Pronto — a secretaria edita em `https://icb.sanity.studio`, faz login, e o site atualiza
sozinho (sem precisar de você).

## 6. No Vercel (deploy do site)

Em **Project Settings → Environment Variables**, adicione:

- `VITE_SANITY_PROJECT_ID` = seu Project ID
- `VITE_SANITY_DATASET` = `production`

E refaça o deploy.
