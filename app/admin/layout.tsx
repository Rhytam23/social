import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administration',
  description: 'Nook administration.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
