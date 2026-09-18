'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { InviteFlow } from '../../../components/auth/InviteFlow';

export default function InvitePage() {
  const router = useRouter();

  return (
    <InviteFlow
      onComplete={() => router.push('/')}
      onNavigateLogin={() => router.push('/login')}
    />
  );
}
