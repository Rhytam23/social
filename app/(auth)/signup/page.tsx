'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '../../../components/auth/LoginForm';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <LoginForm
      initialTab="signup"
      initialInviteToken={searchParams.get('token') || ''}
      onLoginSuccess={() => router.push('/')}
    />
  );
}
