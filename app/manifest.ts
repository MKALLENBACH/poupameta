// Next.js convention for dynamic manifest generation
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PoupaMeta',
    short_name: 'PoupaMeta',
    description: 'Aplicativo de planejamento financeiro pessoal focado em ajudar você a guardar dinheiro gradualmente.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0e17',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
