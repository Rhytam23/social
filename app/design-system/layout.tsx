import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Design system',
  description: 'Development preview of the interface components.',
  robots: { index: false, follow: false },
};

/** Development preview only: production builds answer 404 for every page under /design-system. */
export default function Layout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return children;
}
