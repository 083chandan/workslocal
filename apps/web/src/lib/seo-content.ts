import type { Metadata } from 'next';

// ———————————————————————————————————————————————————————————
// SITE METADATA
// ———————————————————————————————————————————————————————————

export const siteMetadata: Metadata = {
  metadataBase: new URL('https://workslocal.dev'),
  title: {
    default: 'WorksLocal — Free open-source ngrok alternative',
    template: '%s | WorksLocal',
  },
  description:
    'Expose localhost to the internet in 30 seconds. Free, open-source tunneling with a built-in web inspector, catch mode for webhooks, and AI integration. No account required.',
  keywords: [
    'ngrok alternative',
    'ngrok open source',
    'free ngrok',
    'localhost tunnel',
    'expose localhost',
    'https tunnel',
    'webhook testing',
    'test webhooks locally',
    'stripe webhook testing',
    'localhost to internet',
    'developer tools',
    'open source tunnel',
    'self-hosted tunnel',
    'cloudflare tunnel alternative',
    'localtunnel alternative',
    'webhook inspector',
    'request inspector',
    'catch webhooks',
    'localhost sharing',
    'share localhost',
    'workslocal',
    'MCP server tunnel',
    'AI developer tools',
  ],
  authors: [{ name: 'WorksLocal', url: 'https://workslocal.dev' }],
  creator: 'WorksLocal',
  publisher: 'WorksLocal',
  category: 'Developer Tools',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://workslocal.dev',
    siteName: 'WorksLocal',
    title: 'WorksLocal — Free open-source ngrok alternative',
    description:
      'Expose localhost to the internet in 30 seconds. Built-in webhook inspector, catch mode, and AI integration. MIT licensed, forever free.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WorksLocal — It works on my local',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WorksLocal — Free open-source ngrok alternative',
    description:
      'Expose localhost in 30 seconds. Web inspector, catch mode, AI integration. MIT licensed.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://workslocal.dev',
  },
};

// ———————————————————————————————————————————————————————————
// JSON-LD STRUCTURED DATA
// ———————————————————————————————————————————————————————————

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WorksLocal',
  url: 'https://workslocal.dev',
  logo: 'https://workslocal.dev/ws_logo.png',
  sameAs: ['https://github.com/083chandan/workslocal', 'https://www.npmjs.com/package/workslocal'],
  description:
    'Free, open-source localhost tunneling tool. Expose local development servers to the internet via secure HTTPS tunnels.',
};

export const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'WorksLocal',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Windows, macOS, Linux',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  url: 'https://workslocal.dev',
  downloadUrl: 'https://www.npmjs.com/package/workslocal',
  softwareVersion: '0.1.1',
  author: {
    '@type': 'Organization',
    name: 'WorksLocal',
  },
  license: 'https://opensource.org/licenses/MIT',
  description:
    'Free ngrok alternative with built-in webhook inspector, catch mode, and AI integration. MIT licensed.',
  featureList: [
    'HTTPS tunneling from localhost',
    'Custom persistent subdomains',
    'Built-in web request inspector with replay',
    'Catch mode — capture webhooks without a running server',
    'Copy request as cURL',
    'No account required for first use',
    'WebSocket passthrough',
    'Dumb-pipe privacy — relay stores nothing',
    'JSON output mode for AI automation',
    'Self-hostable on Cloudflare Workers (free tier)',
    'AI integration via MCP server and TypeScript SDK',
    'Built on Cloudflare Workers edge network',
  ],
};

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is WorksLocal really free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. WorksLocal is 100% free and open source under the MIT license. Custom subdomains, web inspector, catch mode, and the CLI are all free forever. No trial period. The entire codebase is open source and self-hostable.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is WorksLocal different from ngrok?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "WorksLocal is fully open source (MIT), gives you free persistent subdomains that survive restarts, has no interstitial page, no mandatory account, no bandwidth cap, includes a built-in webhook inspector, and has a unique catch mode that captures payloads without a running local server. ngrok's free tier gives you rotating random URLs, an interstitial page on every request, 1 GB bandwidth cap, and requires signup.",
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to create an account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "No. Run 'npm install -g workslocal && workslocal http 3000' and get a working public HTTPS URL instantly. No signup, no login, no credit card. Create a free account only when you want persistent custom subdomains.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is catch mode?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Catch mode creates a public HTTPS URL that captures incoming HTTP requests without forwarding them to a local server. Run 'workslocal catch --port 8080' and requests are held in a queue until your server comes online. It's like webhook.site built into your tunnel tool. No competitor offers this.",
      },
    },
    {
      '@type': 'Question',
      name: 'Does WorksLocal store or inspect my traffic?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. WorksLocal follows the dumb-pipe principle. The relay server is a pure packet forwarder — request and response bodies never touch server disk. All inspection, storage, and replay happens client-side on your machine. Your data never leaves your local environment.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I self-host WorksLocal?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The entire stack is open source under MIT. The relay runs on Cloudflare Workers (free tier) or any Node.js server. Deploy your own infrastructure with zero cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does WorksLocal support WebSockets?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Full WebSocket passthrough. Socket.io, native WebSockets, and WebRTC signaling all relay transparently through the tunnel with no configuration.',
      },
    },
    {
      '@type': 'Question',
      name: 'What infrastructure does WorksLocal run on?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "WorksLocal's relay runs on Cloudflare Workers with Durable Objects at the edge. Each tunnel gets its own Durable Object, minimizing latency by routing through the nearest Cloudflare data center to your machine. Total infrastructure cost: $0.",
      },
    },
  ],
};
