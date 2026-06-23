import type { SanityImageSource } from '@sanity/image-url'
import { sanityClient, sanityConfigured } from './sanity'

/* ===========================================================================
 * Tipos de conteúdo (espelham os schemas em studio/schemaTypes)
 * ======================================================================== */

export interface Evento {
  _id: string
  titulo: string
  categoria: string
  destaque: boolean
  data?: string
  local?: string
  detalhe?: string
  ctaLabel?: string
  linkUrl?: string
  imagem?: SanityImageSource
  slug?: string
  descricao?: PortableTextBlock[]
}

export interface PortableTextBlock {
  _type: string
  _key?: string
  style?: string
  children?: Array<{ _type: string; _key?: string; text?: string; marks?: string[] }>
  markDefs?: Array<{ _key: string; _type: string; href?: string }>
  asset?: SanityImageSource
}

export interface Noticia {
  _id: string
  titulo: string
  /** ISO date */
  data?: string
  resumo?: string
  capa?: SanityImageSource
  slug?: string
  corpo?: PortableTextBlock[]
  fixado?: boolean
}

export interface Documento {
  _id: string
  titulo: string
  categoria: string
  dataPublicacao?: string
  ordem: number
  arquivoUrl?: string
}

export interface Comunicado {
  _id: string
  texto: string
  cor?: 'vermelho' | 'azul'
  ctaLabel?: string
  link?: string
}

/* ===========================================================================
 * Queries GROQ
 * ======================================================================== */

const COMUNICADO_QUERY = `*[_type == "comunicado" && ativo == true] | order(_updatedAt desc)[0]{
  _id, texto, cor, ctaLabel, link
}`

const DOCUMENTOS_QUERY = `*[_type == "documento"] | order(categoria asc, ordem asc){
  _id, titulo, categoria, dataPublicacao, ordem,
  "arquivoUrl": arquivo.asset->url
}`

const EVENTOS_QUERY = `*[_type == "evento"] | order(destaque desc, data asc){
  _id, titulo, categoria, destaque, data, local, detalhe, ctaLabel, linkUrl, imagem, "slug": slug.current
}`

const EVENTO_BY_SLUG_QUERY = `*[_type == "evento" && slug.current == $slug][0]{
  _id, titulo, categoria, destaque, data, local, detalhe, ctaLabel, linkUrl, imagem, "slug": slug.current, descricao
}`

const EVENTOS_NAV_QUERY = `*[_type == "evento" && defined(slug)] | order(data asc){
  "slug": slug.current, titulo
}`

const NOTICIAS_QUERY = `*[_type == "noticia" && defined(slug.current)] | order(fixado desc, data desc)[0...6]{
  _id, titulo, data, resumo, capa, "slug": slug.current, fixado
}`

const TODAS_NOTICIAS_QUERY = `*[_type == "noticia" && defined(slug.current)] | order(fixado desc, data desc){
  _id, titulo, data, resumo, capa, "slug": slug.current, fixado
}`

const NOTICIA_BY_SLUG_QUERY = `*[_type == "noticia" && slug.current == $slug][0]{
  _id, titulo, data, resumo, capa, "slug": slug.current, corpo
}`

const NOTICIAS_NAV_QUERY = `*[_type == "noticia"] | order(fixado desc, data desc){
  "slug": slug.current, titulo
}`

/* ===========================================================================
 * Fallback (usado enquanto o Sanity não está configurado ou se a busca falhar)
 * ======================================================================== */

export const EVENTOS_FALLBACK: Evento[] = [
  {
    _id: 'fb-1',
    titulo: 'Interclubes de Niterói',
    categoria: 'Regata',
    destaque: true,
    data: '2026-06-28T09:00:00-03:00',
    detalhe: 'Classes ILCA · Optimist · Snipe',
    ctaLabel: 'Inscrever-se online',
    linkUrl: 'https://regatas.icb.org.br',
  },
  {
    _id: 'fb-2',
    titulo: 'Festa Julina do Iate',
    categoria: 'Social',
    destaque: false,
    data: '2026-07-05T19:00:00-03:00',
    local: 'Salão de festas',
    ctaLabel: 'Reservar mesa',
    linkUrl: 'mailto:secretaria@icb.org.br',
  },
  {
    _id: 'fb-3',
    titulo: 'Travessia da Baía',
    categoria: 'Canoagem',
    destaque: false,
    data: '2026-07-12T08:00:00-03:00',
    local: 'Saída do trapiche',
    ctaLabel: 'Inscrever-se online',
    linkUrl: 'https://regatas.icb.org.br',
  },
]

export const NOTICIAS_FALLBACK: Noticia[] = [
  {
    _id: 'fb-n1',
    titulo: 'Equipe do ICB conquista pódio no circuito estadual',
    data: '2026-06-10',
    resumo: 'Velejadores do clube subiram ao pódio na etapa de inverno, reforçando a tradição competitiva da casa.',
  },
  {
    _id: 'fb-n2',
    titulo: 'Inscrições abertas para a escola de vela 2026',
    data: '2026-05-28',
    resumo: 'Novas turmas para crianças e adultos começam em julho. Vagas limitadas pela secretaria náutica.',
  },
  {
    _id: 'fb-n3',
    titulo: 'Obras de revitalização do trapiche são concluídas',
    data: '2026-05-15',
    resumo: 'A estrutura recebeu reforço e novo deck, ampliando a segurança no acesso às embarcações.',
  },
]

/* ===========================================================================
 * Funções de busca (com fallback resiliente)
 * ======================================================================== */

export async function getEvento(slug: string): Promise<Evento | null> {
  if (!sanityConfigured || !sanityClient) return null
  try {
    return await sanityClient.fetch<Evento | null>(EVENTO_BY_SLUG_QUERY, { slug })
  } catch (err) {
    console.warn('[Sanity] Falha ao buscar evento.', err)
    return null
  }
}

export interface EventoNav { slug: string; titulo: string }

export async function getEventosNav(): Promise<EventoNav[]> {
  if (!sanityConfigured || !sanityClient) return []
  try {
    return await sanityClient.fetch<EventoNav[]>(EVENTOS_NAV_QUERY)
  } catch {
    return []
  }
}

export async function getEventos(): Promise<Evento[]> {
  if (!sanityConfigured || !sanityClient) return EVENTOS_FALLBACK
  try {
    const data = await sanityClient.fetch<Evento[]>(EVENTOS_QUERY)
    return data.length ? data : EVENTOS_FALLBACK
  } catch (err) {
    console.warn('[Sanity] Falha ao buscar eventos, usando fallback.', err)
    return EVENTOS_FALLBACK
  }
}

export async function getNoticia(slug: string): Promise<Noticia | null> {
  if (!sanityConfigured || !sanityClient) return null
  try {
    return await sanityClient.fetch<Noticia | null>(NOTICIA_BY_SLUG_QUERY, { slug })
  } catch (err) {
    console.warn('[Sanity] Falha ao buscar notícia.', err)
    return null
  }
}

export interface NoticiaNav { slug: string; titulo: string }

export async function getNoticiasNav(): Promise<NoticiaNav[]> {
  if (!sanityConfigured || !sanityClient) return []
  try {
    return await sanityClient.fetch<NoticiaNav[]>(NOTICIAS_NAV_QUERY)
  } catch {
    return []
  }
}

export async function getTodasNoticias(): Promise<Noticia[]> {
  if (!sanityConfigured || !sanityClient) return NOTICIAS_FALLBACK
  try {
    const data = await sanityClient.fetch<Noticia[]>(TODAS_NOTICIAS_QUERY)
    return data.length ? data : NOTICIAS_FALLBACK
  } catch (err) {
    console.warn('[Sanity] Falha ao buscar notícias.', err)
    return NOTICIAS_FALLBACK
  }
}

export async function getNoticias(): Promise<Noticia[]> {
  if (!sanityConfigured || !sanityClient) return NOTICIAS_FALLBACK
  try {
    const data = await sanityClient.fetch<Noticia[]>(NOTICIAS_QUERY)
    return data.length ? data : NOTICIAS_FALLBACK
  } catch (err) {
    console.warn('[Sanity] Falha ao buscar notícias, usando fallback.', err)
    return NOTICIAS_FALLBACK
  }
}

export async function getDocumentos(): Promise<Documento[]> {
  if (!sanityConfigured || !sanityClient) return []
  try {
    return await sanityClient.fetch<Documento[]>(DOCUMENTOS_QUERY)
  } catch (err) {
    console.warn('[Sanity] Falha ao buscar documentos.', err)
    return []
  }
}

export async function getComunicado(): Promise<Comunicado | null> {
  if (!sanityConfigured || !sanityClient) return null
  try {
    return await sanityClient.fetch<Comunicado | null>(COMUNICADO_QUERY)
  } catch (err) {
    console.warn('[Sanity] Falha ao buscar comunicado.', err)
    return null
  }
}

/* ===========================================================================
 * Helpers de formatação
 * ======================================================================== */

/**
 * Converte string em Date sem deslocamento de fuso. Datas "só-dia"
 * (YYYY-MM-DD, tipo `date` do Sanity) são interpretadas no fuso local
 * para não voltar um dia; datetimes completos usam o parse normal.
 */
function parseData(value: string): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.exec(value)
  if (dateOnly) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

export function formatDataCurta(iso?: string): string {
  if (!iso) return ''
  return parseData(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function formatMesAno(iso?: string): string {
  if (!iso) return ''
  const d = parseData(iso)
  return `${MESES_ABREV[d.getMonth()]} ${d.getFullYear()}`
}

/* ===========================================================================
 * Instalações
 * ======================================================================== */

export interface Instalacao {
  _id: string
  titulo: string
  ordem?: number
  texto?: string
  fotos?: SanityImageSource[]
  ctaLabel?: string
  ctaUrl?: string
}

const INSTALACOES_QUERY = `*[_type == "instalacao"] | order(ordem asc){
  _id, titulo, ordem, texto, fotos, ctaLabel, ctaUrl
}`

export const INSTALACOES_FALLBACK: Instalacao[] = [
  { _id: 'fi-1', titulo: 'Piscina', texto: 'É um lugar especial para o associado que queira nadar, participar de uma hidroginástica, estar no convívio de amigos e familiares.' },
  { _id: 'fi-2', titulo: 'Recanto do Almirante', texto: 'Com uma vista fantástica, este aconchegante espaço torna-se uma parada obrigatória. O lounge deck possui wi-fi.' },
  { _id: 'fi-3', titulo: 'Salão de Jogos', texto: 'Contém 2 mesas de sinuca e diversas opções de jogos como baralho, dominó e xadrez.' },
  { _id: 'fi-4', titulo: 'Churrasqueiras', texto: 'As churrasqueiras são duas, localizadas em espaços interessantes.', ctaLabel: 'Agendar churrasqueira', ctaUrl: 'https://icb.areadosocio.com.br' },
  { _id: 'fi-5', titulo: 'Salão de Festas', texto: 'O Clube dispõe de dois salões com capacidade para 400 e 250 pessoas, respectivamente.' },
]

export async function getInstalacoes(): Promise<Instalacao[]> {
  if (!sanityConfigured || !sanityClient) return INSTALACOES_FALLBACK
  try {
    const data = await sanityClient.fetch<Instalacao[]>(INSTALACOES_QUERY)
    return data.length ? data : INSTALACOES_FALLBACK
  } catch (err) {
    console.warn('[Sanity] Falha ao buscar instalações.', err)
    return INSTALACOES_FALLBACK
  }
}

/* ===========================================================================
 * Regatas
 * ======================================================================== */

export interface Regata {
  _id: string
  titulo: string
  categoria?: string
  classes?: string
  data: string
  local?: string
  inscricoes?: string
}

const REGATAS_QUERY = `*[_type == "regata"] | order(data asc){
  _id, titulo, categoria, classes, data, local, inscricoes
}`

export const REGATAS_FALLBACK: Regata[] = [
  { _id: 'fr-1', titulo: 'Interclubes de Niterói', categoria: 'Vela', classes: 'ILCA 4 · ILCA 6 · Optimist', data: '2026-06-28', inscricoes: 'https://regatas.icb.org.br' },
  { _id: 'fr-2', titulo: '3.º Campeonato Interclube — Vela', categoria: 'Vela', classes: 'Snipe · Laser · Optimist', data: '2026-08-15', inscricoes: 'https://regatas.icb.org.br' },
  { _id: 'fr-3', titulo: 'Regata da Primavera', categoria: 'Vela', classes: 'Todas as classes', data: '2026-09-21', inscricoes: 'https://regatas.icb.org.br' },
  { _id: 'fr-4', titulo: 'Copa ICB de Fim de Ano', categoria: 'Vela', classes: 'ILCA · Snipe · ORC', data: '2026-11-29', inscricoes: 'https://regatas.icb.org.br' },
]

export async function getRegatas(): Promise<Regata[]> {
  if (!sanityConfigured || !sanityClient) return REGATAS_FALLBACK
  try {
    const data = await sanityClient.fetch<Regata[]>(REGATAS_QUERY)
    return data.length ? data : REGATAS_FALLBACK
  } catch (err) {
    console.warn('[Sanity] Falha ao buscar regatas.', err)
    return REGATAS_FALLBACK
  }
}

/* ===========================================================================
 * Avisos da Secretaria Náutica
 * ======================================================================== */

export interface Aviso {
  _id: string
  texto: string
  data: string
}

const AVISOS_QUERY = `*[_type == "aviso"] | order(data desc){
  _id, texto, data
}`

export const AVISOS_FALLBACK: Aviso[] = [
  { _id: 'fa-1', data: '2026-06-01', texto: 'A Secretaria Náutica informa que o serviço de descida e subida de embarcações opera de segunda a sexta, das 08h às 17h. Finais de semana e feriados sob consulta.' },
  { _id: 'fa-2', data: '2026-05-01', texto: 'Vagas náuticas disponíveis para locação. Entre em contato com a Secretaria para informações sobre valores e disponibilidade.' },
]

export async function getAvisos(): Promise<Aviso[]> {
  if (!sanityConfigured || !sanityClient) return AVISOS_FALLBACK
  try {
    const data = await sanityClient.fetch<Aviso[]>(AVISOS_QUERY)
    return data.length ? data : AVISOS_FALLBACK
  } catch (err) {
    console.warn('[Sanity] Falha ao buscar avisos.', err)
    return AVISOS_FALLBACK
  }
}

export function formatDataLonga(iso?: string): string {
  if (!iso) return ''
  return parseData(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}
