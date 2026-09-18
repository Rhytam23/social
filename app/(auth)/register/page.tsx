'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { InviteFlow } from '../../../components/auth/InviteFlow';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <InviteFlow
      onComplete={() => router.push('/')}
      onNavigateLogin={() => router.push('/login')}
    />
  );
}
