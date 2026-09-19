'use client';

import { notFound } from 'next/navigation';
import { LandingPage } from '../../../components/landing/LandingPage';

/** The real landing page, viewable without a Supabase project. Development only: production builds return 404. */
export default function LandingPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const still = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('still');
  return <LandingPage onOpenAuth={() => {}} forceStill={still} />;
}
