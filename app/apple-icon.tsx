import { ImageResponse } from 'next/og';
import { MARK_BUBBLE, MARK_KEYHOLE_HEAD, MARK_KEYHOLE_SLOT } from '../components/brand/Logo';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** The home-screen icon: the Nook mark on the app's dark surface. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111316' }}>
        <svg width="120" height="120" viewBox="0 0 32 32" fill="#7cc3e8">
          <path fillRule="evenodd" d={`${MARK_BUBBLE}${MARK_KEYHOLE_HEAD}${MARK_KEYHOLE_SLOT}`} />
        </svg>
      </div>
    ),
    size
  );
}
