import { ImageResponse } from 'next/og';

export const alt = 'WorksLocal — Free open-source ngrok alternative';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background: '#060608',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: '60px',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 80,
          fontWeight: 800,
          color: '#e4e4ec',
          letterSpacing: '-0.04em',
          textTransform: 'uppercase' as const,
        }}
      >
        <span>It works on my&nbsp;</span>
        <span style={{ color: '#22d3ee' }}>local.</span>
      </div>

      <div
        style={{
          display: 'flex',
          fontSize: 24,
          color: '#6e6e7a',
          marginTop: 16,
          fontFamily: 'monospace',
          letterSpacing: '-0.02em',
        }}
      >
        The open-source tunnel built for developers.
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 48,
          background: '#0d0d11',
          border: '1px solid #1a1a22',
          padding: '16px 32px',
        }}
      >
        <span style={{ color: '#34d399', fontSize: 18, fontFamily: 'monospace' }}>$</span>
        <span style={{ color: '#e4e4ec', fontSize: 18, fontFamily: 'monospace' }}>
          npm i -g workslocal
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 24,
          marginTop: 40,
          fontSize: 14,
          fontFamily: 'monospace',
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: '#6e6e7a',
        }}
      >
        <span>MIT Licensed</span>
        <span style={{ color: '#1a1a22' }}>•</span>
        <span>Forever Free</span>
        <span style={{ color: '#1a1a22' }}>•</span>
        <span>Self-Hostable</span>
      </div>
    </div>,
    { ...size },
  );
}
