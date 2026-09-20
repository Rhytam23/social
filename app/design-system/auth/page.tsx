'use client';

import { LoginForm } from '../../../components/auth/LoginForm';

/** The real sign-in screen, viewable without a Supabase project. Development only: production builds return 404. */
export default function AuthPreviewPage() {
  return <LoginForm initialTab="signup" onLoginSuccess={() => {}} />;
}
