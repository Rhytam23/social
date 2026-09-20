import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Private Chat',
  description: 'Your conversations.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
