import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '../lib/site';

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** The link preview card: the name and what the product is, on the app's own dark surface. Generated at build time. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: '#0a0b0d',
          color: '#e9ebef',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7cc3e8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 600 }}>{SITE_NAME}</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 76, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>Conversations that stay yours.</div>
        <div style={{ marginTop: 28, fontSize: 30, color: '#9aa1ad' }}>{`${SITE_TAGLINE} for people and communities`}</div>
      </div>
    ),
    size
  );
}
