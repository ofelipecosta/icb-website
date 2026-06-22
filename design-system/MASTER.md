# ICB — Design System MASTER
> Gerado via ui-ux-pro-max · 2026-06-19

## Estilo Base
**Padrão:** Classic Premium Nautical Heritage  
**Referência skill:** Storytelling-Driven (#27) + Swiss Modernism 2.0 (#50)  
**Tom:** Institucional, elegante, confiança, tradição — sem ser antiquado

## Paleta
| Token | Hex | Uso |
|---|---|---|
| `--navy-deep` | `#06192e` | Background escuro, footer, stats |
| `--navy` | `#0a2742` | Header bg (com blur), about-figure bg |
| `--navy-soft` | `#103a5e` | Destaques suaves |
| `--cream` | `#f6f3ec` | Background principal (seções claras) |
| `--brass` | `#b83a3a` | Acento primário (vermelho telha ICB) |
| `--brass-deep` | `#962e2e` | Hover / acento profundo |
| `--white` | `#ffffff` | Textos sobre navy, backgrounds puros |
| `--ink` | `#1a2b3c` | Corpo de texto sobre cream |
| `--muted` | `#4a6070` | Textos secundários |

## Tipografia
| Papel | Fonte | Peso | Tamanho |
|---|---|---|---|
| Títulos H1 | Fraunces (serif) | 700 | clamp(40px, 7vw, 78px) |
| Títulos H2 | Fraunces | 600 | clamp(28px, 4vw, 46px) |
| Corpo | Inter (sans) | 400 | 16–18px, line-height 1.75 |
| Labels/eyebrow | Inter | 500 | 11–13px, uppercase, letter-spacing 0.1em |
| Stats | Fraunces | 700 | 40px, tabular-nums |

## Layout
- Container: `max-width: 1200px`, padding horizontal `clamp(24px, 5vw, 80px)`
- Grid bento: 2/3 + 1/3 (evento destaque + cards laterais)
- Seção "O Clube": 2 colunas (copy + foto com overlay)
- News: `repeat(3, 1fr)`, gap 24px
- Breakpoints: 860px (nav mobile), 820px (about 1 col), 600px (spacing reduzido)

## Efeitos
- Header: `backdrop-filter: blur(12px)`, sticky top
- Hero: cross-fade 14s entre 2 fotos aéreas, overlay navy 0.48
- Animações: Framer Motion, `fadeUp` + stagger 0.12s, `once: true`
- `prefers-reduced-motion`: animações desativadas
- Botão primário: pill, bg `--brass`, cor branca, shadow vermelho 0.28
- Hover cards: `translateY(-4px)`

## Componentes principais
- `Header` — logo ICB + nav + nav-cta + menu hamburguer mobile (drawer fora do `<header>` — fix backdrop-filter)
- `Hero` — 2 bg divs crossfade, z-index 2 no conteúdo
- `Stats` — faixa navy-deep, 4 números em brass
- `OClube` — 2 cols, foto aérea real com overlay gradiente
- `Eventos` — bento (destaque + 2 cards), link para regatas.icb.org.br
- `Noticias` — grid 3 cols, dados do Sanity com fallback
- `Modalidades` — 5 cards
- `CTA` — faixa navy com listras, 2 botões
- `Footer` — 4 colunas, logo branco, endereço real

## Dados / CMS
- Sanity headless: schemas `evento`, `noticia`, `galeria`
- Fallback automático quando env vars ausentes
- Inscrições: link externo → `regatas.icb.org.br`
- Email: `secretaria@icb.org.br` (Kinghost — não cancelar sem migrar)

## Arquivos fonte
- `src/index.css` — design system completo
- `src/App.tsx` — todos os componentes
- `src/lib/sanity.ts` + `src/lib/content.ts` — CMS layer
- `studio/` — Sanity Studio + schemas
- `imagens/` — fotos aéreas (aereo01.png, aereo02.png, clube_aereo.png)
