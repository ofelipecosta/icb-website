import { createClient } from '@sanity/client'
import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined
const dataset = (import.meta.env.VITE_SANITY_DATASET as string | undefined) ?? 'production'

/**
 * True quando o projeto Sanity está configurado (variáveis de ambiente presentes).
 * Enquanto for false, a Home usa os dados de fallback (placeholders) — o site
 * nunca quebra por falta de configuração.
 */
export const sanityConfigured = Boolean(projectId)

export const sanityClient = sanityConfigured
  ? createClient({
      projectId: projectId!,
      dataset,
      apiVersion: '2024-01-01',
      useCdn: false,
    })
  : null

const builder = sanityClient ? createImageUrlBuilder(sanityClient) : null

/** Gera URL de imagem do Sanity (com CDN/resize). Retorna '' se não configurado. */
export function urlForImage(source: SanityImageSource | undefined): string {
  if (!builder || !source) return ''
  return builder.image(source).auto('format').fit('max').url()
}
