import React, { useEffect, useRef, useState } from 'react'
import comodoroeVice from '../imagens/comodoro_e_vice.png'
import logoICB from '../imagens/Logo/Timão ICB PRETO.png'
import logoICBBranco from '../imagens/Logo/Timão ICB BRANCO.png'
// import timao from '../imagens/Logo/timão.png'
import aereo1 from '../imagens/tela principal/aero_nova_01.png'
import aereo2 from '../imagens/tela principal/aero_nova_02.png'
import aereo3 from '../imagens/tela principal/aero_nova_03.png'
import historiaFoto1 from '../imagens/historia/foto01.jpg'
import historiaFoto2 from '../imagens/historia/foto02.jpg'
import fotoVela from '../imagens/Vela/Vela.png'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import {
  Sailboat,
  Anchor,
  ArrowRight,
  Menu,
  X,
  MapPin,
  ChevronDown,
  Newspaper,
  CalendarPlus,
  Leaf,
  Heart,
  Share2,
  Check,
  Pin,
  Info,
  AlertTriangle,
} from 'lucide-react'
import {
  getEventos,
  getEvento,
  getEventosNav,
  type EventoNav,
  getNoticias,
  getNoticia,
  getNoticiasNav,
  type NoticiaNav,
  getTodasNoticias,
  getDocumentos,
  type Documento,
  getInstalacoes,
  getRegatas,
  getAvisos,
  getComunicado,
  formatDataCurta,
  formatDataLonga,
  formatMesAno,
  type Evento,
  type Noticia,
  type Instalacao,
  type Regata,
  type Aviso,
  type Comunicado,
  EVENTOS_FALLBACK,
  NOTICIAS_FALLBACK,
  INSTALACOES_FALLBACK,
  REGATAS_FALLBACK,
  AVISOS_FALLBACK,
} from './lib/content'
import { PortableText } from '@portabletext/react'
import { urlForImage } from './lib/sanity'

function toCalDate(iso?: string) {
  if (!iso) return ''
  return iso.replace(/-/g, '')
}

function googleCalUrl(ev: Evento) {
  const start = toCalDate(ev.data)
  const end = start
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.titulo,
    dates: `${start}/${end}`,
    ...(ev.local ? { location: ev.local } : {}),
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

function downloadIcs(ev: Evento) {
  const date = toCalDate(ev.data)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `SUMMARY:${ev.titulo}`,
    `DTSTART;VALUE=DATE:${date}`,
    `DTEND;VALUE=DATE:${date}`,
    ev.local ? `LOCATION:${ev.local}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${ev.titulo.replace(/\s+/g, '_')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const fullUrl = `${window.location.origin}${window.location.pathname}${url}`
    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl })
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button className="share-btn" onClick={handleShare} aria-label={copied ? 'Link copiado!' : 'Compartilhar'} title={copied ? 'Link copiado!' : 'Compartilhar'}>
      {copied ? <Check size={15} /> : <Share2 size={15} />}
    </button>
  )
}

function AddToCalendar({ ev, iconOnly }: { ev: Evento; iconOnly?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="cal-wrap" ref={ref}>
      <button
        className={iconOnly ? 'share-btn' : 'cal-btn'}
        onClick={() => setOpen((o) => !o)}
        aria-label="Adicionar à agenda"
        title="Adicionar à agenda"
      >
        <CalendarPlus size={15} />
        {!iconOnly && ' Adicionar à agenda'}
      </button>
      {open && (
        <div className="cal-dropdown">
          <a className="cal-option" href={googleCalUrl(ev)} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            <img src="https://www.gstatic.com/images/branding/product/1x/calendar_16dp.png" width={14} height={14} alt="" />
            Google Calendar
          </a>
          <button className="cal-option" onClick={() => { downloadIcs(ev); setOpen(false) }}>
            <CalendarPlus size={14} />
            Apple / Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  )
}

/** Props de link que tratam URLs externas (http/https) vs internas/mailto. */
function stripEmoji(s: string): string {
  return s.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|\u{200D}/gu, '').replace(/\s+/g, ' ').trim()
}

function linkProps(url?: string) {
  const href = url || '#'
  const external = /^https?:\/\//i.test(href)
  return external ? { href, target: '_blank', rel: 'noreferrer' } : { href }
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      variants={fadeUp}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

const navLinks = [
  { href: '#', label: 'Início' },
  {
    href: '#clube', label: 'O Clube',
    submenu: [
      { href: '#historia', label: 'Nossa História' },
      { href: '#identidade', label: 'Identidade e Filosofia' },
      { href: '#instalacoes', label: 'Instalações' },
      { href: '#administracao', label: 'Administração' },
      { href: '#documentos', label: 'Documentos Oficiais' },
    ],
  },
  {
    href: '#nautica', label: 'Náutica',
    submenu: [
      { href: '#regatas', label: 'Velas e Regatas' },
      { href: '#secretaria-nautica', label: 'Secretaria Náutica' },
    ],
  },
  { href: '#eventos', label: 'Eventos' },
  { href: '#noticias', label: 'Notícias' },
  { href: '#contato', label: 'Contato' },
]


function Header({ currentPage }: { currentPage?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(() => {
    const active = navLinks.find(l => l.submenu?.some(s => s.href === currentPage))
    return active?.href ?? null
  })

  useEffect(() => {
    const active = navLinks.find(l => l.submenu?.some(s => s.href === currentPage))
    setOpenSubmenu(active?.href ?? null)
  }, [currentPage])

  const isActive = (l: typeof navLinks[0]) => {
    if (l.submenu) return l.submenu.some(s => s.href === currentPage)
    if (l.href === '#') return !currentPage || currentPage === '#' || currentPage === ''
    return currentPage === l.href
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
    <header className="header">
      <div className="container header-inner">
        <a className="brand" href="#">
          <img src={logoICB} alt="Iate Clube Brasileiro" className="brand-logo" />
        </a>
        <nav className="nav">
          <span className="nav-links">
            {navLinks.map((l) => (
              l.submenu ? (
                <span key={l.href} className={`nav-dropdown-wrap${isActive(l) ? ' nav-active' : ''}`}>
                  <a href={l.href} className={`nav-dropdown-trigger${isActive(l) ? ' active' : ''}`}>
                    {l.label} <ChevronDown size={13} />
                  </a>
                  <div className="nav-dropdown">
                    <div className="nav-dropdown-inner">
                      {l.submenu.map((s) => (
                        <a key={s.href} {...linkProps(s.href)} className={`nav-dropdown-item${currentPage === s.href ? ' active' : ''}`}>{s.label}</a>
                      ))}
                    </div>
                  </div>
                </span>
              ) : (
                <a key={l.href} href={l.href} className={isActive(l) ? 'active' : ''}>{l.label}</a>
              )
            ))}
          </span>
          <a className="btn btn-primary nav-cta" href="https://icb.areadosocio.com.br" target="_blank" rel="noreferrer">
            Área do associado
          </a>
          <a className="btn btn-primary nav-cta-mobile" href="https://icb.areadosocio.com.br" target="_blank" rel="noreferrer">
            Área do associado
          </a>
          <button
            className="nav-toggle"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} />
          </button>
        </nav>
      </div>
    </header>

      <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-scrim" onClick={() => setMenuOpen(false)} />
        <div className="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <div className="mobile-menu-head">
            <span className="brand-name" style={{ color: 'var(--navy)' }}>Iate Clube Brasileiro</span>
            <button className="mobile-menu-close" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="mobile-menu-links">
            {navLinks.map((l) => (
              <div key={l.href}>
                {l.submenu ? (
                  <a
                    href={l.href}
                    className={isActive(l) ? 'active' : ''}
                    onClick={(e) => { e.preventDefault(); setOpenSubmenu(openSubmenu === l.href ? null : l.href) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {l.label} <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: openSubmenu === l.href ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </a>
                ) : (
                  <a href={l.href} className={isActive(l) ? 'active' : ''} onClick={() => setMenuOpen(false)}>{l.label}</a>
                )}
                {l.submenu && openSubmenu === l.href && (
                  <div className="mobile-submenu">
                    {l.submenu.map((s) => (
                      <a key={s.href} {...linkProps(s.href)} className={`mobile-submenu-item${currentPage === s.href ? ' active' : ''}`} onClick={() => { setMenuOpen(false); setOpenSubmenu(null) }}>{s.label}</a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <a
              className="btn btn-primary mobile-menu-cta"
              href="https://icb.areadosocio.com.br"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
            >
              Área do associado <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

const heroSlides = [aereo1, aereo2, aereo3]

function Hero() {
  const reduce = useReducedMotion()
  const [current, setCurrent] = useState(0)
  const dragStart = useRef<number | null>(null)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => {
      setCurrent(c => (c + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(id)
  }, [reduce])

  const handleDragStart = (x: number) => { dragStart.current = x }
  const handleDragEnd = (x: number) => {
    if (dragStart.current === null) return
    const diff = dragStart.current - x
    if (Math.abs(diff) > 40) {
      setCurrent(c => diff > 0
        ? (c + 1) % heroSlides.length
        : (c - 1 + heroSlides.length) % heroSlides.length)
    }
    dragStart.current = null
  }

  return (
    <section
      className="hero"
      onMouseDown={e => handleDragStart(e.clientX)}
      onMouseUp={e => handleDragEnd(e.clientX)}
      onTouchStart={e => handleDragStart(e.touches[0].clientX)}
      onTouchEnd={e => handleDragEnd(e.changedTouches[0].clientX)}
    >
      {heroSlides.map((src, i) => (
        <div
          key={i}
          className="hero-bg"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === current ? 1 : 0,
            transition: reduce ? 'none' : 'opacity 1.8s ease-in-out',
            zIndex: i === current ? 1 : 0,
          }}
        />
      ))}
      <div className="container hero-inner">
        <motion.div
          variants={stagger}
          initial={reduce ? false : 'hidden'}
          animate="show"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.7 }} className="hero-vline">
            <div className="hero-vline-bar" />
            <div>
              <h1>O primeiro clube de <em>iatismo</em> do Brasil.</h1>
              <p className="hero-lead">120 anos de tradição náutica, regatas e vida em família à beira da Baía de Guanabara.</p>
              <div className="hero-actions">
                <a className="btn btn-ghost" href="#instalacoes">Conheça o clube</a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      <div className="hero-dots">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            className={`hero-dot${i === current ? ' hero-dot--active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Foto ${i + 1}`}
          />
        ))}
      </div>
      <a className="hero-scrollcue" href="#clube" aria-label="Rolar para conhecer o clube">
        Explorar
        <motion.span
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ display: 'inline-flex' }}
        >
          <ChevronDown size={18} />
        </motion.span>
      </a>
    </section>
  )
}

function OClube() {
  return (
    <section className="about" id="clube">
      <div className="container about-grid">
        <Reveal>
          <div className="about-copy">
            <div className="eyebrow">O Clube</div>
            <h2>Tradição náutica à beira da Baía de Guanabara.</h2>
            <p>
              Fundado em 1906, o Iate Clube Brasileiro é o decano do iatismo nacional.
              Mais de um século formando velejadores, recebendo regatas oficiais e
              acolhendo famílias em uma das vistas mais bonitas de Niterói.
            </p>
            <p>
              Da escola de vela às modalidades sociais, o clube une esporte, história
              e convívio em um mesmo lugar — onde cada geração deixa sua marca no mar.
            </p>
            <a className="btn btn-outline" href="#historia">Conheça nossa história <ArrowRight size={16} /></a>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div
            className="about-figure"
            role="img"
            aria-label="Vista aérea do Iate Clube Brasileiro na Baía de Guanabara"
            style={{ backgroundImage: `url(${aereo3})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }}
          />
        </Reveal>
      </div>
    </section>
  )
}



function EventosCards() {
  const [eventos, setEventos] = useState<Evento[]>(EVENTOS_FALLBACK)

  useEffect(() => {
    let active = true
    getEventos().then((e) => active && setEventos(e))
    return () => { active = false }
  }, [])

  const cards = eventos.slice(0, 3)

  return (
    <section className="ev-cards-section">
      <div className="container">
        <Reveal>
          <div className="section-head" style={{ marginBottom: 32 }}>
            <div>
              <div className="eyebrow">Agenda do clube</div>
              <h2>Próximos Eventos</h2>
            </div>
            <a className="section-link" href="#eventos">
              Ver calendário completo <ArrowRight size={15} />
            </a>
          </div>
        </Reveal>
        <motion.div
          className="ev-cards-grid"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {cards.map((ev) => {
            const img = urlForImage(ev.imagem)
            const eventoHref = ev.slug ? `#evento/${ev.slug}` : undefined
            return (
              <motion.div
                key={ev._id}
                className={`ev-card-b${eventoHref ? ' ev-card-b--link' : ''}`}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                onClick={eventoHref ? () => { window.location.hash = eventoHref.slice(1) } : undefined}
                role={eventoHref ? 'button' : undefined}
                tabIndex={eventoHref ? 0 : undefined}
                onKeyDown={eventoHref ? (e) => e.key === 'Enter' && (window.location.hash = eventoHref.slice(1)) : undefined}
              >
                {img && (
                  <div className="ev-card-b-photo" style={{ backgroundImage: `url(${img})` }} />
                )}
                <div className="ev-card-b-body">
                  <div className="ev-card-b-header">
                    {ev.categoria && <span className="ev-card-b-tag">{ev.categoria}</span>}
                    <div className="ev-card-b-icons">
                      {ev.data && <AddToCalendar ev={ev} iconOnly />}
                      <ShareButton title={ev.titulo} url={eventoHref ?? '#eventos'} />
                    </div>
                  </div>
                  <h3 className="ev-card-b-title">{ev.titulo}</h3>
                  <p className="ev-card-b-meta">
                    {[ev.local, formatDataCurta(ev.data)].filter(Boolean).join(' · ')}
                  </p>
                  {ev.linkUrl && (
                    <a className="ev-card-b-cta" {...linkProps(ev.linkUrl)} onClick={e => e.stopPropagation()}>
                      {ev.ctaLabel || 'Saiba mais'} <ArrowRight size={14} />
                    </a>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

function NewsCard3({ n }: { n: Noticia }) {
  const capa = urlForImage(n.capa)
  const href = n.slug ? `#noticia/${n.slug}` : undefined
  const go = () => href && (window.location.hash = href.slice(1))
  return (
    <article
      className={`news-card3${href ? ' news-card--link' : ''}`}
      onClick={href ? go : undefined}
      role={href ? 'button' : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={href ? (e) => e.key === 'Enter' && go() : undefined}
    >
      <div className="news-card3-img" style={capa ? { backgroundImage: `url(${capa})` } : undefined}>
        {!capa && <Newspaper size={22} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.4)' }} />}
      </div>
      <div className="news-card3-body">
        <span className="news-date-row">
          {n.fixado && <span className="news-pin news-pin--light"><Pin size={11} /> Fixado</span>}
          {n.data && <span className="news-date">{formatDataLonga(n.data)}</span>}
        </span>
        <h3>{stripEmoji(n.titulo)}</h3>
        {href && <span className="news-read-more">Ler mais <ArrowRight size={13} /></span>}
      </div>
    </article>
  )
}

function NewsCard2H({ n }: { n: Noticia }) {
  const capa = urlForImage(n.capa)
  const href = n.slug ? `#noticia/${n.slug}` : undefined
  const go = () => href && (window.location.hash = href.slice(1))
  return (
    <article
      className={`news-card2h${href ? ' news-card--link' : ''}`}
      onClick={href ? go : undefined}
      role={href ? 'button' : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={href ? (e) => e.key === 'Enter' && go() : undefined}
    >
      <div className="news-card2h-img" style={capa ? { backgroundImage: `url(${capa})` } : undefined}>
        {!capa && <Newspaper size={18} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.4)' }} />}
      </div>
      <div className="news-card2h-body">
        <span className="news-date-row">
          {n.fixado && <span className="news-pin news-pin--light"><Pin size={11} /> Fixado</span>}
          {n.data && <span className="news-date">{formatDataLonga(n.data)}</span>}
        </span>
        <h3>{stripEmoji(n.titulo)}</h3>
      </div>
    </article>
  )
}

function Noticias() {
  const [noticias, setNoticias] = useState<Noticia[]>(NOTICIAS_FALLBACK)

  useEffect(() => {
    let active = true
    getNoticias().then((n) => active && setNoticias(n))
    return () => { active = false }
  }, [])

  if (!noticias.length) return null

  const hero = noticias[0]
  const heroImg = urlForImage(hero.capa)
  const heroHref = hero.slug ? `#noticia/${hero.slug}` : undefined
  const middle = noticias.slice(1, 4)

  return (
    <section className="section section-alt" id="noticias">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <div>
              <div className="eyebrow">Fique por dentro</div>
              <h2>Últimas notícias</h2>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <article
            className={`news-hero${heroHref ? ' news-card--link' : ''}`}
            onClick={heroHref ? () => { window.location.hash = heroHref.slice(1) } : undefined}
            role={heroHref ? 'button' : undefined}
            tabIndex={heroHref ? 0 : undefined}
            onKeyDown={heroHref ? (e) => e.key === 'Enter' && (window.location.hash = heroHref!.slice(1)) : undefined}
          >
            <div className="news-hero-bg" style={heroImg ? { backgroundImage: `url(${heroImg})` } : undefined} />
            <div className="news-hero-overlay" />
            <div className="news-hero-content">
              {hero.fixado && <span className="news-pin"><Pin size={12} /> Fixado</span>}
              {hero.data && <span className="news-date" style={{ color: 'rgba(255,255,255,0.65)' }}>{formatDataLonga(hero.data)}</span>}
              <h3>{stripEmoji(hero.titulo)}</h3>
              {hero.resumo && <p>{hero.resumo}</p>}
              {heroHref && <span className="news-read-more" style={{ color: '#fff', opacity: 0.85 }}>Ler notícia completa <ArrowRight size={13} /></span>}
            </div>
          </article>
        </Reveal>

        {middle.length > 0 && (
          <div className="news-grid3">
            {middle.map((n, i) => (
              <Reveal key={n._id} delay={i * 0.08}><NewsCard3 n={n} /></Reveal>
            ))}
          </div>
        )}

        <Reveal>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <a className="section-link" href="#noticias">
              Ver todas as notícias <ArrowRight size={15} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}


function TodasNoticias() {
  const [noticias, setNoticias] = useState<Noticia[]>(NOTICIAS_FALLBACK)

  useEffect(() => {
    let active = true
    getTodasNoticias().then((n) => active && setNoticias(n))
    return () => { active = false }
  }, [])

  return (
    <main id="conteudo">
      <div className="historia-hero">
        <div className="historia-hero-overlay" />
        <div className="container historia-hero-inner">
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Notícias</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px, 5.5vw, 58px)', color: '#fff', margin: '0 0 16px', lineHeight: 1.1 }}>Fique por <em style={{ fontStyle: 'italic', color: '#e8605a' }}>dentro</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, maxWidth: '52ch', lineHeight: 1.75, margin: 0 }}>Novidades, comunicados e eventos do Iate Clube Brasileiro.</p>
        </div>
      </div>

      <div className="section section-alt">
        <div className="container">
          <div className="news-grid news-grid--full">
            {noticias.map((n, i) => {
              const capa = urlForImage(n.capa)
              const href = n.slug ? `#noticia/${n.slug}` : undefined
              return (
                <Reveal key={n._id} delay={(i % 3) * 0.08}>
                  <article
                    className={`news-card${href ? ' news-card--link' : ''}`}
                    onClick={href ? () => { window.location.hash = href.slice(1) } : undefined}
                    role={href ? 'button' : undefined}
                    tabIndex={href ? 0 : undefined}
                    onKeyDown={href ? (e) => e.key === 'Enter' && (window.location.hash = href.slice(1)) : undefined}
                  >
                    <div className="news-media" style={capa ? { backgroundImage: `url(${capa})` } : undefined}>
                      {!capa && <Newspaper size={28} strokeWidth={1.5} />}
                    </div>
                    <div className="news-body">
                      <span className="news-date-row">
                        {n.fixado && <span className="news-pin news-pin--light"><Pin size={11} /> Fixado</span>}
                        {n.data && <span className="news-date">{formatDataLonga(n.data)}</span>}
                      </span>
                      <h3>{stripEmoji(n.titulo)}</h3>
                      {n.resumo && <p>{stripEmoji(n.resumo)}</p>}
                      {href && <span className="news-read-more">Ler notícia completa <ArrowRight size={14} /></span>}
                    </div>
                  </article>
                </Reveal>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}

function EventoDetalhe({ slug }: { slug: string }) {
  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)
  const [nav, setNav] = useState<EventoNav[]>([])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([getEvento(slug), getEventosNav()])
      .then(([e, navList]) => { if (active) { setEvento(e); setNav(navList); setLoading(false) } })
      .catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  const capa = urlForImage(evento?.imagem)
  const idx = nav.findIndex(n => n.slug === slug)
  const prev = idx > 0 ? nav[idx - 1] : null
  const next = idx >= 0 && idx < nav.length - 1 ? nav[idx + 1] : null
  const goTo = (s: string) => { window.location.hash = `evento/${s}` }

  return (
    <main id="conteudo" className="noticia-detalhe">
      <div className="container">
        <div className="noticia-topbar">
          <button className="noticia-back" onClick={() => history.back()} aria-label="Voltar">
            <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Voltar
          </button>
          {evento && <ShareButton title={evento.titulo} url={`#evento/${slug}`} />}
        </div>

        {loading && <div className="noticia-loading">Carregando…</div>}
        {!loading && !evento && <div className="noticia-loading">Evento não encontrado.</div>}

        {!loading && evento && (
          <article>
            {capa && <img className="noticia-capa" src={capa} alt={evento.titulo} />}
            <div className="noticia-content">
              {evento.categoria && <span className="ev-card-b-tag" style={{ marginBottom: 12, display: 'inline-block' }}>{evento.categoria}</span>}
              <h1>{evento.titulo}</h1>
              {(evento.data || evento.local) && (
                <p className="noticia-resumo">
                  {[formatDataLonga(evento.data), evento.local].filter(Boolean).join(' · ')}
                </p>
              )}
              {evento.detalhe && <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{evento.detalhe}</p>}
              {evento.descricao && evento.descricao.length > 0 && (
                <div className="noticia-corpo">
                  <PortableText
                    value={evento.descricao}
                    components={{
                      types: {
                        image: ({ value }) => {
                          const url = urlForImage(value)
                          return url ? <img src={url} alt="" className="noticia-corpo-img" /> : null
                        },
                      },
                    }}
                  />
                </div>
              )}
              {evento.linkUrl && (
                <a className="btn btn-primary" {...linkProps(evento.linkUrl)} style={{ marginTop: 24, display: 'inline-flex' }}>
                  {evento.ctaLabel || 'Saiba mais'} <ArrowRight size={15} style={{ marginLeft: 6 }} />
                </a>
              )}
            </div>
          </article>
        )}

        {!loading && nav.length > 0 && (
          <nav className="noticia-nav">
            <div className="noticia-nav-item noticia-nav-prev">
              {prev && (
                <button onClick={() => goTo(prev.slug)} aria-label="Evento anterior">
                  <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
                  <span>
                    <small>Anterior</small>
                    <strong>{prev.titulo}</strong>
                  </span>
                </button>
              )}
            </div>
            <div className="noticia-nav-item noticia-nav-next">
              {next && (
                <button onClick={() => goTo(next.slug)} aria-label="Próximo evento">
                  <span>
                    <small>Próximo</small>
                    <strong>{next.titulo}</strong>
                  </span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </main>
  )
}

function NoticiaDetalhe({ slug }: { slug: string }) {
  const [noticia, setNoticia] = useState<Noticia | null>(null)
  const [loading, setLoading] = useState(true)
  const [nav, setNav] = useState<NoticiaNav[]>([])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([getNoticia(slug), getNoticiasNav()])
      .then(([n, navList]) => {
        if (active) { setNoticia(n); setNav(navList); setLoading(false) }
      })
      .catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  const capa = urlForImage(noticia?.capa)
  const idx = nav.findIndex(n => n.slug === slug)
  const prev = idx > 0 ? nav[idx - 1] : null
  const next = idx >= 0 && idx < nav.length - 1 ? nav[idx + 1] : null

  const goTo = (s: string) => { window.location.hash = `noticia/${s}` }

  return (
    <main id="conteudo" className="noticia-detalhe">
      <div className="container">
        <div className="noticia-topbar">
          <button className="noticia-back" onClick={() => history.back()} aria-label="Voltar">
            <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Voltar
          </button>
          {noticia && <ShareButton title={noticia.titulo} url={`#noticia/${slug}`} />}
        </div>

        {loading && <div className="noticia-loading">Carregando…</div>}

        {!loading && !noticia && (
          <div className="noticia-loading">Notícia não encontrada.</div>
        )}

        {!loading && noticia && (
          <article>
            {capa && (
              <img className="noticia-capa" src={capa} alt={noticia.titulo} />
            )}
            <div className="noticia-content">
              {noticia.data && (
                <span className="news-date">{formatDataLonga(noticia.data)}</span>
              )}
              <h1>{noticia.titulo}</h1>
              {noticia.resumo && <p className="noticia-resumo">{noticia.resumo}</p>}
              {noticia.corpo && noticia.corpo.length > 0 && (
                <div className="noticia-corpo">
                  <PortableText
                    value={noticia.corpo}
                    components={{
                      types: {
                        image: ({ value }) => {
                          const url = urlForImage(value)
                          return url ? <img src={url} alt="" className="noticia-corpo-img" /> : null
                        },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </article>
        )}

        {!loading && nav.length > 0 && (
          <nav className="noticia-nav">
            <div className="noticia-nav-item noticia-nav-prev">
              {prev && (
                <button onClick={() => goTo(prev.slug)} aria-label="Notícia anterior">
                  <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
                  <span>
                    <small>Anterior</small>
                    <strong>{prev.titulo}</strong>
                  </span>
                </button>
              )}
            </div>
            <div className="noticia-nav-item noticia-nav-next">
              {next && (
                <button onClick={() => goTo(next.slug)} aria-label="Próxima notícia">
                  <span>
                    <small>Próxima</small>
                    <strong>{next.titulo}</strong>
                  </span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </main>
  )
}

function AnnouncementBar() {
  const [com, setCom] = useState<Comunicado | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let active = true
    getComunicado().then((c) => {
      if (!active || !c) return
      setCom(c)
      // Mostra de novo sempre que um novo comunicado for publicado (id diferente)
      const lastDismissed = localStorage.getItem('icb-comunicado-dismissed')
      setDismissed(lastDismissed === c._id)
    })
    return () => { active = false }
  }, [])

  if (!com || dismissed) return null

  const close = () => {
    localStorage.setItem('icb-comunicado-dismissed', com._id)
    setDismissed(true)
  }

  const isUrgente = com.cor !== 'azul'
  const Icon = isUrgente ? AlertTriangle : Info

  return (
    <div className={`ann-bar ${isUrgente ? 'ann-bar--red' : 'ann-bar--navy'}`} role="region" aria-label="Comunicado">
      <Icon size={17} className="ann-bar-ico" />
      <p className="ann-bar-txt">{com.texto}</p>
      {com.link && (
        <a className="ann-bar-cta" {...linkProps(com.link)}>
          {com.ctaLabel || 'Saiba mais'} →
        </a>
      )}
      <button className="ann-bar-x" onClick={close} aria-label="Fechar comunicado">
        <X size={16} />
      </button>
    </div>
  )
}

const WA_CONTACTS = [
  { label: 'Secretaria Social', number: '5521985564487' },
  { label: 'Secretaria Náutica', number: '5521985564489' },
  { label: 'Financeiro',         number: '5521985564485' },
  { label: 'Eventos',            number: '5521973703932' },
]

function WhatsAppFloat() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="wa-float" ref={ref}>
      {open && (
        <div className="wa-menu">
          <div className="wa-menu-title">Fale conosco</div>
          {WA_CONTACTS.map((c) => (
            <a
              key={c.number}
              className="wa-menu-item"
              href={`https://wa.me/${c.number}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              {c.label}
            </a>
          ))}
        </div>
      )}
      <button
        className="wa-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="WhatsApp"
      >
        {open ? (
          <X size={24} />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
        )}
      </button>
    </div>
  )
}

function Footer() {
  return (
    <footer className="footer" id="contato">
      <div className="container footer-inner">
        <div className="footer-brand">
          <img src={logoICBBranco} alt="Iate Clube Brasileiro" className="brand-logo brand-logo-footer" style={{ marginBottom: 16, display: 'block', marginLeft: -18 }} />
          <p style={{ fontSize: 14, lineHeight: 1.7 }}>
            Estrada Leopoldo Fróes, 400<br />
            São Francisco, Niterói — RJ<br />
            CEP 24360-005
          </p>
        </div>
        <div>
          <h4>Clube</h4>
          <a href="#historia">História</a>
          <a href="#instalacoes">Instalações</a>
          <a href="#administracao">Administração</a>
          <a href="#documentos">Documentos</a>
        </div>
        <div>
          <h4>Náutica</h4>
          <a href="#regatas">Velas e regatas</a>
          <a href="#secretaria-nautica">Secretaria náutica</a>
          <a href="#eventos">Eventos</a>
        </div>
        <div>
          <h4>Contato</h4>
          <a href="tel:+552127148252">(21) 2714-8252</a>
          <a href="mailto:secretaria@icb.org.br">secretaria@icb.org.br</a>
          <div className="footer-social">
            <a href="https://instagram.com/iateclubebrasileiro" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href="https://facebook.com/iateclubebrasileiro" target="_blank" rel="noreferrer" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://wa.me/5521985564487" target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            </a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Iate Clube Brasileiro. Todos os direitos reservados.</span>
      </div>
    </footer>
  )
}

function Administracao() {
  return (
    <main id="conteudo" className="section" style={{ paddingTop: 120 }}>
      <div className="container" style={{ maxWidth: 860 }}>
        <Reveal>
          <div className="eyebrow">O Clube</div>
          <h2 style={{ marginBottom: 48 }}>Administração</h2>
        </Reveal>

        <Reveal>
          <div className="adm-mensagem">
            <div className="adm-mensagem-texto">
              <p>
                Nós, da Comodoria eleita para o próximo triênio, vimos por meio desta, agradecer a confiança que nos foi depositada. Como objetivos principais para o nosso mandato, temos como não poderia deixar de ser, o aumento da frequência dos sócios ao Clube e a conciliação entre todas as vertentes de pensamento e interesses existentes no Clube.
              </p>
              <p><strong>Como linhas de ação teremos os seguintes destaques:</strong></p>
              <ul className="adm-lista">
                <li>Recuperar, através de manutenção corretiva, a infraestrutura física do Clube com obras de reparo e pintura geral;</li>
                <li>Readequação do quadro de funcionários, de forma a prestar um serviço de boa qualidade e condizentes com as nossas expectativas;</li>
                <li>Revisar e reorganizar os regulamentos internos e normas, de forma a estabelecer acesso e tratamento mais igualitário a todas as instalações e serviços do Clube;</li>
                <li>Incentivar a prática dos esportes e atividades compatíveis com a nossa natureza náutica e estrutura física, além das atividades de lazer;</li>
                <li>Reorganizar os serviços de bar e restaurante, para que possamos usufruir toda a infraestrutura e potencial social de que dispomos;</li>
                <li>Na medida em que avançarmos nos itens acima, criar opções de lazer com o objetivo de cativar cada vez mais o associado.</li>
              </ul>
              <p>
                Sabemos que esse caminho é longo e com restrições orçamentárias, porém, trabalharemos todos os dias para que possamos percorrê-lo da forma mais suave e rápida possível. Nossa Comodoria reitera seu compromisso em respeitar integralmente o Estatuto, Regulamento Interno e normas vigentes. As diretrizes estabelecidas são fundamentais para a preservação da integridade e valores da instituição, e serão aplicadas de maneira rigorosa e sem exceções. Contamos com a colaboração de todos vocês para mantermos um ambiente harmonioso de respeito e alinhado aos princípios que regem nosso ICB.
              </p>
            </div>
            <div className="adm-mensagem-foto">
              <img src={comodoroeVice} alt="Comodoro e Vice-Comodoro do Iate Clube Brasileiro" />
              <div className="adm-mensagem-foto-leg">
                <span>Comodoro e Vice-Comodoro</span>
                <span>Iate Clube Brasileiro</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="adm-block">
            <h3 className="adm-group-title">Diretoria Executiva</h3>
            <div className="adm-grid">
              {[
                { cargo: 'Comodoro', nome: 'Eduardo Augusto Granato de Carvalho' },
                { cargo: 'Vice-Comodoro', nome: 'Marcelo Cardoso Coelho' },
                { cargo: 'Diretor Administrativo', nome: 'Luiz Antonio Alves' },
                { cargo: 'Diretor Financeiro', nome: 'Eduardo Augusto Granato de Carvalho' },
                { cargo: 'Diretor Médico', nome: 'Henrique Tostes Padilha Neto' },
                { cargo: 'Diretor Social e de Eventos', nome: 'Marcelo Cardoso Coelho' },
                { cargo: 'Diretor de Esporte', nome: 'Marcelo Cardoso Coelho' },
                { cargo: 'Diretor Náutico e de Manutenção', nome: 'Rafael Rocha Ramos' },
              ].map((d) => (
                <div key={d.cargo} className="adm-card">
                  <span className="adm-cargo">{d.cargo}</span>
                  <span className="adm-nome">{d.nome}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="adm-block">
            <h3 className="adm-group-title">Conselho Deliberativo</h3>
            <div className="adm-grid">
              {[
                { cargo: 'Presidente', nome: 'Aline Rabello Rocha' },
                { cargo: 'Vice-Presidente', nome: 'Carlos Almir Magliano Gardel' },
                { cargo: 'Secretário', nome: 'Eduardo Henrique Kopschitz de Barros' },
              ].map((d) => (
                <div key={d.cargo} className="adm-card">
                  <span className="adm-cargo">{d.cargo}</span>
                  <span className="adm-nome">{d.nome}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="adm-block">
            <h3 className="adm-group-title">Conselho Fiscal</h3>
            <div className="adm-grid">
              {[
                { cargo: 'Presidente', nome: 'Olympio Passos da Motta Neto' },
                { cargo: 'Membro Efetivo', nome: 'Alridio Jorge Maria Gomes de Carvalho' },
              ].map((d) => (
                <div key={d.cargo} className="adm-card">
                  <span className="adm-cargo">{d.cargo}</span>
                  <span className="adm-nome">{d.nome}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  )
}

const CATEGORIA_LABELS: Record<string, string> = {
  oficiais: 'Documentos Oficiais',
  atas: 'Atas',
  editais: 'Editais',
  regulamentos: 'Regulamentos',
  outros: 'Outros',
}

function NossaHistoria() {
  return (
    <main id="conteudo" style={{ paddingTop: 0 }}>
      {/* Hero banner */}
      <div className="historia-hero">
        <div className="historia-hero-overlay" />
        <div className="container historia-hero-inner">
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>O Clube</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(36px, 6vw, 64px)', color: '#fff', margin: '0 0 16px', maxWidth: '16ch', lineHeight: 1.1 }}>Nossa<br /><em style={{ fontStyle: 'italic', color: '#e8605a' }}>História</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17, maxWidth: '50ch', lineHeight: 1.7, margin: 0 }}>Fundado em 10 de setembro de 1906 — o primeiro clube de iatismo do Brasil.</p>
        </div>
      </div>

      {/* Citação de abertura */}
      <div style={{ background: 'var(--navy)', padding: 'clamp(40px, 6vw, 72px) 0' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <Reveal>
            <blockquote className="historia-quote">
              "Está cheia de altos e baixos, mas de uma coisa estamos certos, tudo mudou: homens, barcos, aspectos do clube. Contudo, o grande amor pela vida marítima permanece inalterável. Na história do primeiro clube de vela no Brasil, notaremos sempre que o mar está em primeiro plano, o que dá aos iatistas satisfação e a vontade que, ali, nada se transforme. Que o Iate Clube Brasileiro se mantenha assim por muitos anos!"
            </blockquote>
          </Reveal>
        </div>
      </div>

      {/* Narrativa histórica */}
      <div className="section" style={{ background: 'var(--cream)' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="historia-timeline">
            {[
              { ano: '1906', titulo: 'A ideia nasce no mar', texto: <p className="historia-item-texto">Estamos em 1906. Um belo dia de sol aquece os velejadores que passeiam nas águas da Baía de Guanabara. Entre as poucas velas que panejam, somente uma delas interessa à nossa história: é a do cúter <em>"Marajó"</em>. A bordo estão o jornalista Eduardo Motta e o proprietário Armando Leite. Conversa puxa conversa e surge a ideia de se fundar um clube de vela.</p> },
              { ano: <>10 set.<br/>1906</>, titulo: 'A reunião fundadora', texto: <p className="historia-item-texto">O idealizador Armando Leite, coadjuvado por Eduardo Motta, realizam a primeira reunião de fundação no dia 10 de setembro de 1906, na sede da então Federação das Sociedades de Remo, antigamente situada à Rua do Rosário nº 135. Presidida pelo Cel. Ferreira Aguiar e secretariada por Ernesto Curvello e Eduardo Motta, compareceram cerca de 30 pessoas. Ao final da reunião inaugural, apenas quatro sócios pagaram a primeira mensalidade então instituída.</p> },
              { ano: '1906', titulo: 'Primeiros sócios e a primeira sede', texto: <><p className="historia-item-texto">À fundação, seguiu-se uma campanha nos jornais para angariar novos sócios, que eram poucos devido ao pequeno número de praticantes da vela no Rio de Janeiro de então. Os amantes da vela Armando Leite e Eduardo Motta foram procurados pelo Sr. Saldanha da Gama, como representante do Sr. Simensen, para saber se eram aceitos sócios estrangeiros. Em virtude da resposta afirmativa, foram procurados no dia seguinte pelo próprio Simensen, que representava 25 estrangeiros — alguns proprietários de barcos — que proporcionaram um impulso significativo ao clube, inclusive através de doações em dinheiro, sendo uma feita pela Companhia Cantareira.</p><p className="historia-item-texto" style={{ marginTop: 12 }}>O local da primeira sede era na Praia das Saudades nº 24 – Botafogo. Fundou-se desta maneira o <strong>"Yacht Club Brasileiro"</strong>, o primeiro núcleo da vela na Guanabara e no Brasil.</p></> },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="historia-item">
                  <div className="historia-item-ano">{item.ano}</div>
                  <div className="historia-item-line"><div className="historia-item-dot" /></div>
                  <div className="historia-item-body">
                    <h3 className="historia-item-titulo">{item.titulo}</h3>
                    {item.texto}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* Fotos históricas */}
      <div className="section" style={{ background: '#fff', paddingBottom: 0 }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <Reveal>
            <p className="eyebrow" style={{ color: 'var(--brass)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Registros históricos</p>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(22px, 3vw, 32px)', color: 'var(--navy)', marginBottom: 32 }}>O clube nos primeiros anos</h2>
          </Reveal>
          <div className="historia-fotos-grid">
            <Reveal delay={0.05}>
              <figure className="historia-foto-item">
                <img src={historiaFoto1} alt="Primeira sede do Iate Clube Brasileiro" loading="lazy" />
                <figcaption>Primeira sede do clube · início do século XX</figcaption>
              </figure>
            </Reveal>
            <Reveal delay={0.12}>
              <figure className="historia-foto-item">
                <img src={historiaFoto2} alt="Sede histórica do Iate Clube Brasileiro" loading="lazy" />
                <figcaption>Sede histórica do ICB · acervo do clube</figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Fundadores */}
      <div className="section" style={{ background: '#fff' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <Reveal>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(24px, 4vw, 36px)', color: 'var(--navy)', marginBottom: 32 }}>Os Fundadores</h2>
          </Reveal>
          <div className="historia-fundadores">
            {[
              { nome: 'Armando Leite', papel: 'Idealizador' },
              { nome: 'Eduardo Motta', papel: 'Jornalista · Co-fundador' },
              { nome: 'Cel. Ferreira Aguiar', papel: 'Presidente da reunião inaugural' },
              { nome: 'Ernesto Curvello', papel: 'Secretário' },
              { nome: 'Sr. Saldanha da Gama', papel: 'Membro fundador' },
              { nome: 'Sr. Simensen', papel: 'Representante de 25 sócios estrangeiros' },
            ].map((f, i) => (
              <Reveal key={f.nome} delay={i * 0.07}>
                <div className="historia-fundador-card">
                  <div className="historia-fundador-initial">{f.nome.charAt(0)}</div>
                  <div>
                    <div className="historia-fundador-nome">{f.nome}</div>
                    <div className="historia-fundador-papel">{f.papel}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

const regrasDeOuro = [
  'Aderir aos valores do Iate Clube Brasileiro e respeitar a paixão pelo mar.',
  'Promover os valores do Iate Clube em todas as ocasiões.',
  'Participar ativamente na vida social do ICB.',
  'Apresentar-se a outros iate clubes sempre com a bandeira do ICB e do Brasil.',
  'Indicar sua filiação no ICB durante as regatas e mostrar um número nosso na vela principal (disponível na mesa de Serviços para os Membros).',
  'Respeitar outros iate clubes em todas as circunstâncias.',
  'Patrocinar e apoiar jovens membros do Clube e sua Seção de Esportes.',
  'Convidar outros membros para compartilharem sua paixão pelo Iate Clube.',
]

const valoresICB = [
  { Icone: Anchor, titulo: 'Tradição Náutica', desc: 'Mais de 120 anos cultivando os melhores hábitos marinheiros na Baía de Guanabara.' },
  { Icone: Leaf, titulo: 'Preservação Ambiental', desc: 'Compromisso com o meio ambiente marinho e a sustentabilidade das águas.' },
  { Icone: Heart, titulo: 'Solidariedade', desc: 'Espírito de união entre membros e amantes do mar, dentro e fora d\'água.' },
  { Icone: Sailboat, titulo: 'Arte de Viver no Mar', desc: 'Uma filosofia de vida que integra o mar ao cotidiano de cada associado.' },
]

function IdentidadeFilosofia() {
  return (
    <main id="conteudo" style={{ paddingTop: 0 }}>
      {/* Hero */}
      <div className="historia-hero">
        <div className="historia-hero-overlay" />
        <div className="container historia-hero-inner">
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>O Clube</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px, 5.5vw, 58px)', color: '#fff', margin: '0 0 16px', maxWidth: '20ch', lineHeight: 1.1 }}>Identidade e <em style={{ fontStyle: 'italic', color: '#e8605a' }}>Filosofia</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, maxWidth: '52ch', lineHeight: 1.7, margin: 0 }}>O que nos une vai além do esporte — é uma forma de viver o mar.</p>
        </div>
      </div>

      {/* Texto principal + quote */}
      <div className="section" style={{ background: 'var(--cream)' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <Reveal>
            <p className="idfi-paragrafo">Coerente com a tradição de ser o primeiro clube de iatismo do Brasil, o Iate Clube Brasileiro sempre conferiu atenção especial às atividades náuticas, preconizando, desde seu primeiro estatuto, o pleno uso dos melhores hábitos marinheiros. Além disso, o Clube tem por objetivo o congraçamento e aprimoramento físico, esportivo, artístico, recreativo, cultural e cívico do seu quadro associativo.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <blockquote className="idfi-quote">
              "Ser um membro do Iate Clube Brasileiro é acima de tudo um compromisso. É desejar preservar a ética, tanto na terra como na água."
            </blockquote>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="idfi-paragrafo">A filosofia do Iate Clube Brasileiro baseia-se não só na necessidade de perpetuar, mas também de transmitir o patrimônio com mais de cem anos de história e garantir que o Iate Clube continue a ser um lugar tanto para a família quanto para os amantes de esportes náuticos.</p>
            <p className="idfi-paragrafo" style={{ marginTop: 24 }}>Para se tornar um membro é preciso abraçar o <em>"espírito do clube"</em> — baseado na lealdade às regras e princípios, na solidariedade entre velejadores e na defesa permanente da vela como esporte e estilo de vida. Estes são os objetivos dos membros do ICB, que cultivam uma certa <em>"Arte de Viver no Mar"</em> em seu cotidiano.</p>
          </Reveal>
        </div>
      </div>

      {/* Valores */}
      <div className="section" style={{ background: '#fff' }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p className="eyebrow" style={{ color: 'var(--brass)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>O que nos guia</p>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(26px, 3.5vw, 38px)', color: 'var(--navy)', margin: 0 }}>Nossos Valores</h2>
            </div>
          </Reveal>
          <div className="idfi-valores">
            {valoresICB.map(({ Icone, titulo, desc }, i) => (
              <Reveal key={titulo} delay={i * 0.08}>
                <div className="idfi-valor-card">
                  <div className="idfi-valor-icone">
                    <Icone size={26} strokeWidth={1.5} />
                  </div>
                  <h3 className="idfi-valor-titulo">{titulo}</h3>
                  <p className="idfi-valor-desc">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* Regras de Ouro */}
      <div className="section" style={{ background: 'var(--navy-deep)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <Reveal>
            <div style={{ marginBottom: 48 }}>
              <p className="eyebrow" style={{ color: 'var(--brass)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Comprometimento</p>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(26px, 4vw, 42px)', color: '#fff', margin: 0 }}>Regras de Ouro</h2>
            </div>
          </Reveal>
          <div className="idfi-regras">
            {regrasDeOuro.map((r, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="idfi-regra-item">
                  <span className="idfi-regra-num">{String(i + 1).padStart(2, '0')}</span>
                  <p className="idfi-regra-texto">{r}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

function DocumentosOficiais() {
  const [docs, setDocs] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getDocumentos()
      .then((d) => { if (active) { setDocs(d); setLoading(false) } })
      .catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const categorias = Array.from(new Set(docs.map(d => d.categoria)))

  const DocIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )

  return (
    <main id="conteudo" className="section" style={{ paddingTop: 120 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <Reveal>
          <p className="eyebrow" style={{ color: 'var(--brass)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>O Clube</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(28px, 5vw, 44px)', color: 'var(--navy)', marginBottom: 16 }}>Documentos Oficiais</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 56, maxWidth: '60ch' }}>Acesse os documentos que regem o funcionamento do Iate Clube Brasileiro.</p>
        </Reveal>

        {loading && <div className="noticia-loading">Carregando…</div>}

        {!loading && docs.length === 0 && (
          <div className="noticia-loading">Nenhum documento disponível no momento.</div>
        )}

        {!loading && categorias.map(cat => (
          <div key={cat} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
              {CATEGORIA_LABELS[cat] ?? cat}
            </h2>
            <div className="docs-list">
              {docs.filter(d => d.categoria === cat).map((doc, i) => (
                <Reveal key={doc._id} delay={i * 0.06}>
                  <div className="docs-item">
                    <div className="docs-item-icon"><DocIcon /></div>
                    <div className="docs-item-body">
                      <h3 className="docs-item-title">{doc.titulo}</h3>
                      {doc.dataPublicacao && (
                        <p className="docs-item-desc">{formatDataLonga(doc.dataPublicacao)}</p>
                      )}
                    </div>
                    <div className="docs-item-action">
                      {doc.arquivoUrl ? (
                        <a href={doc.arquivoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: 14, padding: '10px 20px' }}>
                          Acessar agora
                        </a>
                      ) : (
                        <span className="docs-btn-soon">Em breve</span>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

function InstFotos({ fotos, titulo }: { fotos?: Instalacao['fotos']; titulo: string }) {
  const [idx, setIdx] = useState(0)
  const urls = (fotos ?? []).map(f => urlForImage(f)).filter(Boolean)
  const dragStart = useRef<number | null>(null)

  const prev = () => setIdx(i => (i - 1 + urls.length) % urls.length)
  const next = () => setIdx(i => (i + 1) % urls.length)

  const onPointerDown = (e: React.PointerEvent) => { dragStart.current = e.clientX }
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current === null) return
    const diff = dragStart.current - e.clientX
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
    dragStart.current = null
  }

  if (!urls.length) {
    return (
      <div className="inst-foto-wrap">
        <div className="inst-foto-placeholder">
          <div className="inst-foto-label">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>Foto em breve</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="inst-foto-wrap">
      <div
        className="inst-carousel"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ touchAction: 'pan-y', userSelect: 'none' }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={idx}
            src={urls[idx]}
            alt={titulo}
            className="inst-foto-img"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            draggable={false}
          />
        </AnimatePresence>
        {urls.length > 1 && (
          <>
            <button className="inst-car-btn inst-car-prev" onClick={prev} aria-label="Foto anterior">‹</button>
            <button className="inst-car-btn inst-car-next" onClick={next} aria-label="Próxima foto">›</button>
          </>
        )}
      </div>
      {urls.length > 1 && (
        <div className="inst-thumbs">
          {urls.map((url, i) => (
            <button key={i} className={`inst-thumb${i === idx ? ' inst-thumb--active' : ''}`} onClick={() => setIdx(i)} aria-label={`Foto ${i + 1}`}>
              <img src={url} alt={`${titulo} ${i + 1}`} draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Instalacoes() {
  const [instalacoes, setInstalacoes] = useState<Instalacao[]>(INSTALACOES_FALLBACK)

  useEffect(() => {
    let active = true
    getInstalacoes().then((d) => active && setInstalacoes(d))
    return () => { active = false }
  }, [])

  return (
    <main id="conteudo" style={{ paddingTop: 0 }}>
      <div className="historia-hero">
        <div className="historia-hero-overlay" />
        <div className="container historia-hero-inner">
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>O Clube</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px, 5.5vw, 58px)', color: '#fff', margin: '0 0 16px', maxWidth: '22ch', lineHeight: 1.1 }}>As instalações do<br /><em style={{ fontStyle: 'italic', color: '#e8605a' }}>Iate Clube Brasileiro</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, maxWidth: '56ch', lineHeight: 1.75, margin: 0 }}>Fundado em 1906, o ICB está numa localização privilegiada, em uma charmosa enseada de São Francisco, Niterói.</p>
        </div>
      </div>

      <div style={{ background: 'var(--cream)' }}>
        {instalacoes.map((inst, i) => {
          return (
            <Reveal key={inst._id}>
              <div className={`inst-item ${i % 2 === 1 ? 'inst-item-alt' : ''}`}>
                <div className="container inst-inner">
                  <InstFotos fotos={inst.fotos} titulo={inst.titulo} />
                  <div className="inst-body">
                    <h2 className="inst-titulo">{inst.titulo}</h2>
                    {inst.texto && <p className="inst-texto">{inst.texto}</p>}
                    {inst.ctaLabel && inst.ctaUrl && (
                      <a href={inst.ctaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: 8, display: 'inline-flex', fontSize: 14 }}>
                        {inst.ctaLabel} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </main>
  )
}

function VelasRegatas() {
  const [regatas, setRegatas] = useState<Regata[]>(REGATAS_FALLBACK)
  const [avisos, setAvisos] = useState<Aviso[]>(AVISOS_FALLBACK)

  useEffect(() => {
    let active = true
    getRegatas().then((d) => active && setRegatas(d))
    getAvisos().then((d) => active && setAvisos(d))
    return () => { active = false }
  }, [])

  return (
    <main id="conteudo" style={{ paddingTop: 0 }}>
      {/* Hero */}
      <div className="historia-hero">
        <div className="historia-hero-overlay" />
        <div className="container historia-hero-inner">
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Náutica</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px, 5.5vw, 58px)', color: '#fff', margin: '0 0 16px', maxWidth: '20ch', lineHeight: 1.1 }}>Velas e <em style={{ fontStyle: 'italic', color: '#e8605a' }}>Regatas</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, maxWidth: '54ch', lineHeight: 1.75, margin: 0 }}>Após o sucesso das edições anteriores, o quadro de competições do Iate Clube Brasileiro está de volta para animar as águas da enseada da Baía de Guanabara.</p>
        </div>
      </div>

      {/* Sobre o departamento */}
      <div className="section" style={{ background: 'var(--cream)' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <Reveal>
            <div>
              <p className="eyebrow" style={{ color: 'var(--brass)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>O Departamento</p>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(24px, 3.5vw, 36px)', color: 'var(--navy)', marginBottom: 20 }}>Tradição de vela na Baía de Guanabara</h2>
              <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>O Departamento de Velas e Regatas do ICB organiza competições para equipes experientes e amadoras, oferecendo a chance de se prepararem ao mais alto nível para as grandes reuniões da temporada.</p>
              <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8 }}>Em 2016, o clube foi palco de treinamento das melhores equipes olímpicas do mundo, consolidando nossa reputação como um dos principais centros náuticos do Brasil.</p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Calendário de regatas */}
      <div className="section" style={{ background: '#fff' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
              <div>
                <p className="eyebrow" style={{ color: 'var(--brass)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Temporada 2026</p>
                <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(24px, 3.5vw, 36px)', color: 'var(--navy)', margin: 0 }}>Calendário de Regatas</h2>
              </div>
              <a href="https://regatas.icb.org.br" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: 14 }}>Inscrever-se →</a>
            </div>
          </Reveal>
          <div className="naut-regatas">
            {regatas.map((r, i) => (
              <Reveal key={r._id} delay={i * 0.08}>
                <div className="naut-regata-item">
                  <div className="naut-regata-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="naut-regata-body">
                    <div className="naut-regata-titulo">{r.titulo}</div>
                    <div className="naut-regata-meta">
                      <span>{formatDataLonga(r.data)}</span>
                      {r.classes && <><span className="naut-dot">·</span><span>{r.classes}</span></>}
                    </div>
                  </div>
                  <a href={r.inscricoes} target="_blank" rel="noopener noreferrer" className="naut-regata-cta">Inscrever-se →</a>
                </div>
              </Reveal>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 24, fontStyle: 'italic' }}>* Datas sujeitas a alteração. Acompanhe os comunicados da Secretaria Náutica.</p>
        </div>
      </div>

      {/* Avisos */}
      {avisos.length > 0 && (
        <div style={{ background: 'var(--navy)', padding: 'clamp(40px,5vw,64px) 0' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(22px, 3vw, 32px)', color: '#fff', margin: 0 }}>Avisos da Secretaria</h2>
              </div>
              <div className="naut-avisos">
                {avisos.map((a) => (
                  <div key={a._id} className="naut-aviso">
                    <div className="naut-aviso-data">{formatMesAno(a.data)}</div>
                    <div className="naut-aviso-texto">{a.texto}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      )}
    </main>
  )
}

const servicosNautica = [
  { titulo: 'Vagas Náuticas', desc: 'Locação e venda de vagas para embarcações de variadas capacidades.', icone: 'anchor' },
  { titulo: 'Descida e Subida', desc: 'Serviço de descida e subida de embarcações de segunda a sexta, das 08h às 17h.', icone: 'ship' },
  { titulo: 'Estacionamento Seco', desc: 'Área de estacionamento seco e galpão para guarda de embarcações.', icone: 'warehouse' },
  { titulo: 'Vagas Cobertas', desc: 'Vagas cobertas especialmente para lanchas, com segurança e proteção.', icone: 'cover' },
  { titulo: 'Guarda de Wind Surf', desc: 'Espaço dedicado para guarda de pranchas e equipamentos de wind surf.', icone: 'wind' },
  { titulo: 'Oficina de Reparos', desc: 'Oficina especializada para reparos e manutenção de embarcações.', icone: 'tools' },
  { titulo: 'Boxes de Apoio', desc: 'Boxes de apoio e armários individuais para os associados.', icone: 'box' },
  { titulo: 'Rampa e Guindastes', desc: 'Acesso a rampas e guindastes para movimentação de embarcações.', icone: 'crane' },
]

const iconNaut = (id: string) => {
  const map: Record<string, React.ReactNode> = {
    anchor: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>,
    ship: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.2.7 4.3 1.62 6"/><path d="M12 10V2"/><path d="M12 2 8 6"/><path d="M12 2l4 4"/></svg>,
    warehouse: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect width="8" height="8" x="8" y="14"/></svg>,
    cover: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    wind: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>,
    tools: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    box: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
    crane: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V8"/><path d="m4 12 8-8 8 8"/><path d="M20 22H4"/><path d="M18 22v-4"/><path d="M6 22v-4"/></svg>,
  }
  return map[id] || map['anchor']
}

function SecretariaNautica() {
  return (
    <main id="conteudo" style={{ paddingTop: 0 }}>
      {/* Hero */}
      <div className="historia-hero">
        <div className="historia-hero-overlay" />
        <div className="container historia-hero-inner">
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Náutica</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px, 5.5vw, 58px)', color: '#fff', margin: '0 0 16px', maxWidth: '20ch', lineHeight: 1.1 }}>Secretaria <em style={{ fontStyle: 'italic', color: '#e8605a' }}>Náutica</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, maxWidth: '54ch', lineHeight: 1.75, margin: 0 }}>Infraestrutura completa para guarda, manutenção e movimentação de embarcações na Baía de Guanabara.</p>
        </div>
      </div>

      {/* Texto + Foto */}
      <div className="section" style={{ background: 'var(--cream)' }}>
        <div className="container" style={{ maxWidth: 1060 }}>
          <Reveal>
          <div className="naut-sec-intro">
            <div className="naut-sec-texto">
              <p style={{ color: 'var(--ink)', fontSize: 16, lineHeight: 1.85, marginBottom: 20 }}>O setor de Náutica do Iate Clube Brasileiro oferece aos associados a possibilidade de locação e venda de vagas náuticas, assim como o serviço de descida e subida das embarcações de 08h às 17h. A área náutica do Clube conta com Estacionamento Seco, Galpão, vagas cobertas para lancha e guarderia de Wind Surf. Nesses espaços é possível a guarda de embarcações das mais variadas capacidades. Para conforto dos associados náuticos, o Clube proporciona espaços com oficinas de reparos, boxes de apoio e armários.</p>
              <p style={{ color: 'var(--ink)', fontSize: 16, lineHeight: 1.85, marginBottom: 0 }}>Para a utilização da rampa e dos guindastes, os associados devem respeitar os nossos termos e condições de uso. Os serviços da secretaria náutica contam com uma equipe técnica especializada para o seu auxílio. Recentemente implantamos o Plano de Emergência Individual Simplificado – PEI do Iate Clube Brasileiro, de acordo com a Resolução CONAMA Nº 398, de 11 de junho de 2008, que dispõe sobre os procedimentos para incidentes de poluição por óleos e maneiras de conter e combater eventuais derramamentos acidentais.</p>
            </div>
            <div className="naut-sec-foto">
              <img src={fotoVela} alt="Marina do Iate Clube Brasileiro" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
            </div>
          </div>
          </Reveal>
        </div>
      </div>

      {/* Serviços */}
      <div className="section" style={{ background: '#fff' }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <Reveal>
            <p className="eyebrow" style={{ color: 'var(--brass)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Infraestrutura</p>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(24px, 3.5vw, 36px)', color: 'var(--navy)', marginBottom: 40 }}>Nossos Serviços</h2>
          </Reveal>
          <div className="naut-servicos">
            {servicosNautica.map((s, i) => (
              <Reveal key={s.titulo} delay={i * 0.06}>
                <div className="naut-servico-card">
                  <div className="naut-servico-icone">{iconNaut(s.icone)}</div>
                  <h3 className="naut-servico-titulo">{s.titulo}</h3>
                  <p className="naut-servico-desc">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* Compromisso ambiental */}
      <div className="section" style={{ background: '#fff' }}>
        <div className="container" style={{ maxWidth: 780 }}>
          <Reveal>
            <div className="naut-ambiental">
              <div className="naut-ambiental-icon"><Leaf size={28} color="var(--navy)" /></div>
              <div>
                <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(22px, 3vw, 30px)', color: 'var(--navy)', marginBottom: 16 }}>Compromisso Ambiental</h2>
                <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 12 }}>O ICB implementou o Plano de Emergência Individual Simplificado (PEI) conforme a Resolução CONAMA nº 398/2008, com procedimentos rigorosos contra derramamentos acidentais de óleo.</p>
                <ul className="naut-ambiental-lista">
                  <li>Melhorar a gestão dos resíduos gerados pelas atividades náuticas</li>
                  <li>Prevenção e controle de riscos de poluição na Baía de Guanabara</li>
                  <li>Preservação dos recursos naturais com redução de consumo de líquidos</li>
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Contato */}
      <div style={{ background: 'var(--navy-deep)', padding: 'clamp(40px,5vw,64px) 0' }}>
        <div className="container" style={{ maxWidth: 780 }}>
          <Reveal>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(22px, 3vw, 32px)', color: '#fff', marginBottom: 8 }}>Fale com a Secretaria Náutica</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, marginBottom: 32 }}>Para vagas, serviços e informações sobre sua embarcação.</p>
          <div className="naut-contatos">
            <a href="https://wa.me/5521985564489" className="inst-contato-btn inst-contato-email" target="_blank" rel="noopener noreferrer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              (21) 98556-4489
            </a>
            <a href="mailto:vela@icb.org.br" className="inst-contato-btn" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              vela@icb.org.br
            </a>
          </div>
          </Reveal>
        </div>
      </div>
    </main>
  )
}


const categoryCores: Record<string, string> = {
  Vela: '#0a2742', Natação: '#1a6b8a', Canoagem: '#2d7a5f', Social: '#7a4f2d', default: '#4a4a4a',
}

function EventoCard(ev: Evento) {
  const cor = categoryCores[ev.categoria] ?? categoryCores.default
  const href = ev.slug ? `#evento/${ev.slug}` : undefined
  return (
    <div
      className={`evcal-card${href ? ' evcal-card--link' : ''}`}
      onClick={href ? () => { window.location.hash = href.slice(1) } : undefined}
      role={href ? 'button' : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={href ? (e) => e.key === 'Enter' && (window.location.hash = href.slice(1)) : undefined}
    >
      <div className="evcal-card-header" style={{ background: cor }}>
        <span className="evcal-cat">{ev.categoria}</span>
        {ev.data && <div className="evcal-data">{formatDataCurta(ev.data)}</div>}
      </div>
      <div className="evcal-card-body">
        <h3 className="evcal-titulo">{ev.titulo}</h3>
        {ev.local && (
          <div className="evcal-local">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            {ev.local}
          </div>
        )}
        {ev.detalhe && <div className="evcal-classes">{ev.detalhe}</div>}
        {ev.linkUrl && (
          <a href={ev.linkUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: 13, padding: '8px 16px', marginTop: 12, display: 'inline-flex' }} onClick={e => e.stopPropagation()}>
            {ev.ctaLabel || 'Inscrever-se'} →
          </a>
        )}
      </div>
    </div>
  )
}

function Eventos() {
  const [filtro, setFiltro] = useState<'todos' | 'nautico' | 'social'>('todos')
  const [eventos, setEventos] = useState<Evento[]>(EVENTOS_FALLBACK)

  useEffect(() => {
    let active = true
    getEventos().then((e) => active && setEventos(e))
    return () => { active = false }
  }, [])

  const nauticos = ['Regata', 'Canoagem', 'Natação']
  const visiveis = filtro === 'todos' ? eventos
    : filtro === 'nautico' ? eventos.filter(e => nauticos.includes(e.categoria))
    : eventos.filter(e => !nauticos.includes(e.categoria))

  return (
    <main id="conteudo" style={{ paddingTop: 0 }}>
      <div className="historia-hero">
        <div className="historia-hero-overlay" />
        <div className="container historia-hero-inner">
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Eventos</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px, 5.5vw, 58px)', color: '#fff', margin: '0 0 16px', lineHeight: 1.1 }}>Calendário de <em style={{ fontStyle: 'italic', color: '#e8605a' }}>Eventos</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, maxWidth: '52ch', lineHeight: 1.75, margin: 0 }}>Eventos náuticos e sociais do clube em um só lugar. Atualizado pelas secretarias.</p>
        </div>
      </div>
      <div className="section" style={{ background: 'var(--cream)' }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <Reveal>
            <div className="evcal-filtros">
              {(['todos', 'nautico', 'social'] as const).map(f => (
                <button key={f} className={`evcal-filtro-btn${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>
                  {f === 'todos' ? 'Todos' : f === 'nautico' ? 'Náuticos' : 'Sociais'}
                </button>
              ))}
            </div>
            <div className="evcal-aviso">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              Programação gerenciada pelas secretarias. Sujeito a alterações.
            </div>
          </Reveal>
          {visiveis.length > 0 ? (
            <div className="evcal-grid">
              {visiveis.map((e, i) => (
                <Reveal key={e._id} delay={i * 0.08}>
                  <EventoCard {...e} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>Nenhum evento encontrado nesta categoria.</div>
          )}
        </div>
      </div>
    </main>
  )
}

const WaIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
const MailIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
const TelIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.89a16 16 0 0 0 6.16 6.16l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>

const departamentos = [
  {
    nome: 'Secretaria Social',
    desc: 'Atendimento geral, associação e informações sobre o clube.',
    cor: 'var(--navy)',
    contatos: [
      { tipo: 'tel' as const, label: '(21) 2714-8252', href: 'tel:+552127148252' },
      { tipo: 'whatsapp' as const, label: '(21) 98556-4487', href: 'https://wa.me/5521985564487' },
      { tipo: 'email' as const, label: 'secretaria@icb.org.br', href: 'mailto:secretaria@icb.org.br' },
    ],
  },
  {
    nome: 'Secretaria Náutica',
    desc: 'Vagas, serviços náuticos, velas e regatas.',
    cor: '#1a5c8a',
    contatos: [
      { tipo: 'whatsapp' as const, label: '(21) 98556-4489', href: 'https://wa.me/5521985564489' },
      { tipo: 'email' as const, label: 'vela@icb.org.br', href: 'mailto:vela@icb.org.br' },
    ],
  },
  {
    nome: 'Financeiro',
    desc: 'Mensalidades, cobranças e assuntos financeiros.',
    cor: '#5c3a1a',
    contatos: [
      { tipo: 'whatsapp' as const, label: '(21) 98556-4485', href: 'https://wa.me/5521985564485' },
      { tipo: 'email' as const, label: 'financeiro@icb.org.br', href: 'mailto:financeiro@icb.org.br' },
    ],
  },
  {
    nome: 'Eventos',
    desc: 'Salão de festas, eventos sociais e reservas.',
    cor: '#2d5c4a',
    contatos: [
      { tipo: 'whatsapp' as const, label: '(21) 97370-3932', href: 'https://wa.me/5521973703932' },
      { tipo: 'email' as const, label: 'salaodefestas@icb.org.br', href: 'mailto:salaodefestas@icb.org.br' },
    ],
  },
  {
    nome: 'Comodoria',
    desc: 'Contato direto com a Comodoria do clube.',
    cor: '#1a3f6b',
    contatos: [
      { tipo: 'email' as const, label: 'comodoria@icb.org.br', href: 'mailto:comodoria@icb.org.br' },
    ],
  },
  {
    nome: 'Ouvidoria',
    desc: 'Canal oficial para sugestões, elogios, reclamações e denúncias.',
    cor: '#3a2a4a',
    contatos: [
      { tipo: 'email' as const, label: 'ouvidoria@icb.org.br', href: 'mailto:ouvidoria@icb.org.br' },
    ],
  },
]

function ContatoPage() {
  return (
    <main id="conteudo" style={{ paddingTop: 0 }}>
      {/* Hero */}
      <div className="historia-hero">
        <div className="historia-hero-overlay" />
        <div className="container historia-hero-inner">
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Contato</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px, 5.5vw, 58px)', color: '#fff', margin: '0 0 16px', lineHeight: 1.1 }}>Entre em <em style={{ fontStyle: 'italic', color: '#e8605a' }}>Contato</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, maxWidth: '52ch', lineHeight: 1.75, margin: 0 }}>Encontre o departamento certo e fale diretamente com quem pode ajudar.</p>
        </div>
      </div>

      {/* Departamentos */}
      <div className="section" style={{ background: 'var(--cream)' }}>
        <div className="container" style={{ maxWidth: 1060 }}>
          <Reveal>
            <p className="eyebrow" style={{ color: 'var(--brass)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Departamentos</p>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(24px, 3.5vw, 38px)', color: 'var(--navy)', marginBottom: 40 }}>Fale com o departamento certo</h2>
          </Reveal>
          <div className="contato-dept-grid">
            {departamentos.map((d, i) => (
              <Reveal key={d.nome} delay={i * 0.07}>
                <div className="contato-dept-card" style={{ borderLeft: `4px solid ${d.cor}` }}>
                  <div className="contato-dept-card-top">
                    <span className="contato-dept-dot" style={{ background: d.cor }} />
                    <div>
                      <h3 className="contato-dept-nome">{d.nome}</h3>
                      <p className="contato-dept-desc">{d.desc}</p>
                    </div>
                  </div>
                  <div className="contato-dept-body">
                    {d.contatos.map(c => (
                      <a key={c.href} href={c.href} target={c.tipo === 'whatsapp' ? '_blank' : undefined} rel="noopener noreferrer" className={`contato-dept-link contato-dept-${c.tipo}`}>
                        {c.tipo === 'whatsapp' ? <WaIcon /> : c.tipo === 'email' ? <MailIcon /> : <TelIcon />}
                        <span>{c.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Endereço + Mapa */}
          <Reveal delay={0.3}>
            <div className="contato-mapa-wrap">
              <div className="contato-mapa-info">
                <div className="contato-info-item" style={{ padding: 0, marginBottom: 20 }}>
                  <MapPin size={18} color="var(--brass)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Endereço</strong>
                    <span>Estrada Leopoldo Fróes, 400 — São Francisco, Niterói — RJ · CEP 24360-005</span>
                  </div>
                </div>
                <div className="contato-info-item" style={{ padding: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div>
                    <strong>Horário de atendimento</strong>
                    <span>Terça a domingo, das 08h às 20h · Segunda fechado</span>
                  </div>
                </div>
              </div>
              <div className="contato-mapa-frame">
                <iframe
                  title="Localização ICB"
                  src="https://maps.google.com/maps?q=Iate+Clube+Brasileiro,+Niterói,+RJ&output=embed&hl=pt-BR"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>

    </main>
  )
}

// Páginas que trocam o conteúdo inteiro (não são âncoras da home)
const SUB_PAGES = new Set([
  '#administracao', '#ouvidoria', '#documentos', '#historia',
  '#identidade', '#instalacoes', '#regatas', '#secretaria-nautica', '#eventos', '#contato', '#noticias',
])

function isNoticiaPage(hash: string) {
  return hash.startsWith('#noticia/')
}

function isEventoPage(hash: string) {
  return hash.startsWith('#evento/')
}

// Guarda a posição de scroll de cada página para restaurar ao voltar
const scrollPositions = new Map<string, number>()

// Restaura o scroll aguardando o conteúdo (carregado de forma assíncrona) crescer.
// Cancela imediatamente se o usuário interagir, para nunca brigar com o scroll dele.
function restoreScroll(target: number) {
  let cancelled = false
  const cancel = () => { cancelled = true; cleanup() }
  const cleanup = () => {
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchstart', cancel)
    window.removeEventListener('keydown', cancel)
  }
  window.addEventListener('wheel', cancel, { passive: true })
  window.addEventListener('touchstart', cancel, { passive: true })
  window.addEventListener('keydown', cancel)

  const start = performance.now()
  const attempt = () => {
    if (cancelled) return
    window.scrollTo({ top: target, behavior: 'auto' })
    if (Math.abs(window.scrollY - target) > 2 && performance.now() - start < 1500) {
      requestAnimationFrame(attempt)
    } else {
      cleanup()
    }
  }
  requestAnimationFrame(attempt)
}

function useCurrentPage() {
  const [page, setPage] = useState(() => window.location.hash)
  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash
      // Salva a posição da página que estamos deixando (DOM ainda é o antigo)
      scrollPositions.set(page, window.scrollY)

      const saved = scrollPositions.get(hash)
      const isSub = (h: string) => SUB_PAGES.has(h) || isNoticiaPage(h) || isEventoPage(h)

      setPage(hash)

      if (saved != null && saved > 0) {
        // Voltando para uma página já visitada — restaura onde o usuário parou
        restoreScroll(saved)
      } else if (isSub(hash) || isSub(page)) {
        // Entrando numa subpágina/detalhe pela primeira vez — vai ao topo
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [page])
  return page
}

// Componente de transição de página
function PageTransition({ children, pageKey }: { children: React.ReactNode; pageKey: string }) {
  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function App() {
  const page = useCurrentPage()
  const isAdm = page === '#administracao'
  const isOuv = page === '#ouvidoria'
  const isContato = page === '#contato'
  const isDocs = page === '#documentos'
  const isHist = page === '#historia'
  const isIdfi = page === '#identidade'
  const isInst = page === '#instalacoes'
  const isRegatas = page === '#regatas'
  const isSecNaut = page === '#secretaria-nautica'
  const isEventos = page === '#eventos'
  const isNoticias = page === '#noticias'

  const noticiaSlug = isNoticiaPage(page) ? page.replace('#noticia/', '') : null
  const eventoSlug = isEventoPage(page) ? page.replace('#evento/', '') : null

  const subPage = noticiaSlug ? <NoticiaDetalhe slug={noticiaSlug} /> :
    eventoSlug ? <EventoDetalhe slug={eventoSlug} /> :
    isAdm ? <Administracao /> : isOuv ? <ContatoPage /> : isDocs ? <DocumentosOficiais /> : isContato ? <ContatoPage /> :
    isHist ? <NossaHistoria /> : isIdfi ? <IdentidadeFilosofia /> : isInst ? <Instalacoes /> :
    isRegatas ? <VelasRegatas /> : isSecNaut ? <SecretariaNautica /> : isEventos ? <Eventos /> :
    isNoticias ? <TodasNoticias /> : null

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <AnnouncementBar />
      <Header currentPage={page} />
      {subPage ? (
        <PageTransition pageKey={page}>{subPage}</PageTransition>
      ) : (
        <PageTransition pageKey="home">
          <main id="conteudo">
            <Hero />
            <EventosCards />
            <Noticias />
            <OClube />
          </main>
        </PageTransition>
      )}
      <Footer />
      <WhatsAppFloat />
    </>
  )
}

export default App
