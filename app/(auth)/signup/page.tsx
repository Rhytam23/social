'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '../../../components/auth/LoginForm';

export default function SignupPage() {
  const router = useRouter();

  return <LoginForm initialTab="signup" onLoginSuccess={() => router.push('/')} />;
}
