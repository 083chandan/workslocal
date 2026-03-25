import type { Metadata } from 'next';
import Markdown, { type Components } from 'react-markdown';

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
}

export const metadata: Metadata = {
  title: 'Changelog',
  description:
    'WorksLocal release notes — new features, bug fixes, and improvements in every version.',
  alternates: { canonical: '/changelog' },
  openGraph: {
    title: 'Changelog | WorksLocal',
    description: 'WorksLocal release notes — new features, bug fixes, and improvements.',
    url: '/changelog',
  },
};

const GITHUB_RELEASES_URL =
  'https://api.github.com/repos/083chandan/workslocal/releases?per_page=3';

async function fetchReleases(): Promise<GitHubRelease[]> {
  try {
    const res = await fetch(GITHUB_RELEASES_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return (await res.json()) as GitHubRelease[];
  } catch {
    return [];
  }
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h3 className="mt-6 mb-2 font-headline text-lg font-bold text-on-surface">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-6 mb-2 font-headline text-lg font-bold text-on-surface">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-4 mb-2 font-headline text-base font-bold text-on-surface">{children}</h4>
  ),
  p: ({ children }) => <p className="mb-4 leading-relaxed text-on-surface-variant">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1 pl-5 text-on-surface-variant">{children}</ul>
  ),
  li: ({ children }) => <li className="text-on-surface-variant">{children}</li>,
  code: ({ children }) => (
    <code className="bg-surface-container px-1.5 py-0.5 font-mono text-sm text-primary">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto border border-outline bg-surface p-4 font-mono text-sm text-on-surface">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline transition-colors hover:text-primary-fixed-dim"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-bold text-on-surface">{children}</strong>,
};

export default async function ChangelogPage() {
  const releases = await fetchReleases();

  return (
    <main className="flex flex-1 flex-col items-center px-4 pt-20 pb-12 md:px-8 md:pt-24 md:pb-16">
      <div className="w-full max-w-3xl">
        <h1 className="font-headline text-4xl font-black text-on-surface">Changelog</h1>
        <p className="mt-2 font-mono text-sm tracking-wide text-muted">
          Latest releases synced from GitHub.
        </p>

        {releases.length > 0 ? (
          <div className="mt-12">
            {releases.map((release, i) => (
              <article
                key={release.tag_name}
                className={`relative border-l-2 border-outline pl-6 md:pl-8 ${
                  i < releases.length - 1 ? 'pb-12' : 'pb-0'
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute top-0 -left-1.25 h-2.5 w-2.5 bg-primary" />

                <span className="inline-block border border-primary px-3 py-1 font-mono text-xs tracking-widest text-primary uppercase">
                  {release.tag_name}
                </span>

                <h2 className="mt-3 font-headline text-2xl font-bold text-on-surface">
                  {release.name || release.tag_name}
                </h2>

                <time className="mt-1 block font-mono text-xs tracking-widest text-muted uppercase">
                  {formatDate(release.published_at)}
                </time>

                {release.body?.trim() ? (
                  <div className="mt-6">
                    <Markdown components={markdownComponents}>{release.body}</Markdown>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted">No release notes for this version.</p>
                )}

                <a
                  href={release.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 font-mono text-xs tracking-widest text-muted uppercase transition-colors hover:text-primary"
                >
                  View on GitHub
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <p className="text-on-surface-variant">Release notes are temporarily unavailable.</p>
            <a
              href="https://github.com/083chandan/workslocal/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 font-mono text-xs tracking-widest text-muted uppercase transition-colors hover:text-primary"
            >
              View releases on GitHub
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
