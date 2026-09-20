'use client';

import { notFound } from 'next/navigation';
import { LoginForm } from '../../../components/auth/LoginForm';

/** The real sign-in screen, viewable without a Supabase project. Development only: production builds return 404. */
export default function AuthPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <LoginForm initialTab="signup" onLoginSuccess={() => {}} />;
}
