# CLAUDE.md — Iate Clube Brasileiro (ICB)

Contexto persistente do projeto. Leia antes de qualquer implementação.

## Stack

- **Frontend**: React 19 + Vite + TypeScript — SPA com roteamento por hash (`window.location.hash`)
- **CMS**: Sanity (`projectId: m7k49mce`, `dataset: production`, `useCdn: false`)
- **Animações**: `motion/react` — **não** `framer-motion`
- **Ícones**: Lucide React
- **Deploy**: Vercel (frontend) + Sanity Cloud (studio)
- **Studio**: submodule em `./studio/` — **não tem remote git**; deploy via `npx sanity deploy` dentro de `./studio/`

## Arquitetura de roteamento

Tudo é hash-based. Exemplo: `/#noticias`, `/#noticias/slug-da-noticia`, `/#eventos/slug`. Não usar React Router — o `useCurrentPage()` hook em `App.tsx` gerencia scroll + navegação.

## Sanity schemas (em `studio/schemaTypes/`)

| Schema | Descrição |
|---|---|
| `noticia` | Notícias. Campo `fixado: boolean` ordena fixadas primeiro. |
| `evento` | Eventos do clube. |
| `regata` | Regatas — link de inscrição via `regatas.icb.org.br` |
| `aviso` | Avisos da Secretaria Náutica (aparecem na seção Velelas/Regatas) |
| `comunicado` | Barra de comunicado no topo do site. Só 1 ativo por vez. |
| `documento` | PDFs para Documentos Oficiais. Campo `arquivo` (file, PDF only). |
| `instalacao` | Instalações do clube (Churrasqueiras, Salões, etc.) |
| `galeria` | Galeria de fotos |

## Queries GROQ importantes

```
Notícias com fixadas primeiro:
*[_type == "noticia"] | order(fixado desc, data desc)

Comunicado ativo:
*[_type == "comunicado" && ativo == true] | order(_updatedAt desc)[0]{ _id, texto, cor, ctaLabel, link }

Avisos:
*[_type == "aviso"] | order(data desc){ _id, texto, data }
```

## Convenções de código

- **Scroll restoration**: `scrollPositions = new Map<string, number>()` no nível do módulo. `restoreScroll()` usa loop `requestAnimationFrame` com budget de 1500ms, cancelado em wheel/touchstart/keydown.
- **Strip emoji**: `stripEmoji(s)` em `App.tsx` — remove emojis Unicode de títulos importados do WordPress.
- **Imagens sem crop**: usar `<img>` com `object-fit: contain` (não `background-size: cover`) para flyers/infográficos.
- **LocalStorage**: `icb-comunicado-dismissed` guarda o `_id` do último comunicado fechado pelo usuário.

## Departamentos (ordem correta — não reordenar)

1. Secretaria Social
2. Secretaria Náutica
3. Financeiro
4. Eventos — WhatsApp: **5521973703932**
5. Comodoria
6. Ouvidoria

## Avisos importantes

- **E-mail Kinghost**: NÃO cancelar até migração DNS concluída. O site usa `icb.org.br` na Kinghost para e-mail.
- **DNS**: ainda não migrado para Vercel. Após migrar, adicionar `https://icb.org.br` como CORS origin no Sanity.
- **Studio sem remote**: commits no `studio/` ficam só locais. Para publicar: `npx sanity deploy` dentro de `./studio/`.
- **Token Sanity**: se aparecer token `skRY86...` em qualquer lugar, deletar imediatamente em sanity.io → API → Tokens.

## Pendências conhecidas (atualizar conforme concluído)

- [ ] Migração DNS Kinghost → Vercel para `icb.org.br`
- [ ] Adicionar CORS `https://icb.org.br` no Sanity após DNS
- [ ] Publicar notícias importadas do WordPress no Studio (gerar slugs)
- [ ] Adicionar eventos reais no Sanity (só existe "Teste")
- [ ] Fotos das instalações (só Churrasqueiras tem fotos)
- [ ] Deletar conteúdo de teste do Sanity

## Como rodar localmente

```bash
# Frontend
npm run dev

# Studio (separado)
cd studio
npm run dev
# Deploy do studio:
npx sanity deploy
```
