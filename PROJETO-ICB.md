# Projeto — Site Iate Clube Brasileiro (ICB)

Reconstrução do site do Iate Clube Brasileiro (icb.org.br), o primeiro clube de
iatismo do Brasil, fundado em 1906 em Niterói/RJ. Projeto separado do sistema OPME.

## Objetivo
- Modernizar a imagem (template moderno, padrão 2026).
- Permitir inscrições de eventos/regatas online (hoje feitas por WhatsApp).
- O responsável (Felipe) faz parte da diretoria/TI do clube — tem acesso a conteúdo e dados.

## Stack
- React 19 + Vite 8 + TypeScript
- `motion` (Framer Motion 12) — import via `motion/react`
- `lucide-react` — ícones
- Fontes: Fraunces (serif, títulos) + Inter (sans, corpo), via Google Fonts no index.html

## Identidade visual atual (estilo "náutico clássico premium")
- Navy escuro (#0a2742 / #06192e), creme (#f6f3ec), dourado/brass (#c4a55a)
- Tipografia editorial: títulos serifados grandes, tracking negativo
- Layout bento grid, botões em pill, listras náuticas no hero

## Estado atual (2026-06-19)
- Home única montada e funcional (`npm run dev` → localhost:5173).
- Seções: Header sticky (+menu hamburguer mobile), Hero, faixa de Stats (1906/119/5/ISAF),
  **O Clube** (seção editorial heritage, id `#clube`), Eventos (bento com inscrição/reserva),
  Modalidades, CTA "Faça parte da história", Footer com contatos reais.
- Refino UI (skill ui-ux-pro-max): hero com profundidade (gradiente radial + vinheta + stripes
  suaves), linha de credenciais e scroll cue; acessibilidade (skip-link, `:focus-visible`,
  `prefers-reduced-motion`, scroll-margin p/ header sticky); números tabulares; estados de
  active/hover nos botões.
- Bugs de layout corrigidos: padding lateral do `.container` era zerado por classes internas
  (`hero-inner`, `stats-grid`, `cta-inner`, `footer-inner`) → agora usam `padding-block`;
  `.nav-links` tinha `display:flex` inline que furava o breakpoint mobile → movido p/ CSS.
- Build de produção OK, TypeScript 0 erros, sem overflow horizontal (testado em 375px).
- Dados de eventos/datas ainda são FICTÍCIOS (placeholders) — falta conteúdo real.

## Arquivos principais
- `index.html` — meta tags PT-BR + fontes
- `src/index.css` — design system completo (cores, header, hero, bento, notícias, footer)
- `src/App.tsx` — todas as seções com animações Motion
- `src/lib/sanity.ts` — client Sanity + `urlForImage` (flag `sanityConfigured`)
- `src/lib/content.ts` — tipos, queries GROQ, busca com **fallback** e helpers de data
- `studio/` — Sanity Studio (painel de edição) + schemas (evento, noticia, galeria)
- `SETUP-SANITY.md` — passo a passo para criar o projeto Sanity e ir ao ar
- `src/App.css` — legado do template Vite, não usado (pode remover)

## CMS / Conteúdo (Sanity headless)
- Eventos e Notícias da home vêm do Sanity; sem config, usam fallback (placeholders).
- Variáveis: `VITE_SANITY_PROJECT_ID` / `VITE_SANITY_DATASET` (`.env.local`, ver `.env.example`).
- Inscrições de regata NÃO são feitas no site — botões linkam para `regatas.icb.org.br`
  (app de inscrições já existente, mantido por colaborador).
- Hospedagem planejada: site no Vercel (deploy via git); e-mail @icb.org.br fica na Kinghost
  (ou migra) — não cancelar Kinghost antes de resolver o e-mail.

## Skill instalada
- `ui-ux-pro-max` instalada globalmente em `~/.claude/skills/` (auditada e aprovada).
  Requer Python para os scripts de busca (search.py / data CSV).

## Dados reais do clube (rodapé)
- Endereço: Estrada Leopoldo Fróes, 400 — São Francisco, Niterói/RJ, 24360-005
- Tel: (21) 2714-8252 · E-mail: secretaria@icb.org.br
- @iateclubebrasileiro (Instagram/Facebook)
- Área do associado externa: icb.areadosocio.com.br
- Modalidades: vela/regatas, natação, canoagem, sinuca, biriba

## Próximos passos sugeridos
1. Criar o projeto Sanity e cadastrar eventos/notícias/fotos reais (ver `SETUP-SANITY.md`).
2. Subir no GitHub + deploy no Vercel; apontar DNS de icb.org.br; resolver e-mail (Kinghost).
3. Páginas internas: O Clube, História, Instalações, Náutica (+ página de Notícia individual).
4. (Opcional) Migrar para Next.js + Sanity para melhorar SEO (renderização no servidor).

## Concluído
- Refino de UI com ui-ux-pro-max (hero, acessibilidade, menu mobile, seção O Clube).
- Modelagem de conteúdo no Sanity (schemas) + Home puxando Eventos/Notícias com fallback.
- Inscrição de regata: resolvida via link para `regatas.icb.org.br` (app já existente).
