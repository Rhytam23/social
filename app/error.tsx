'use client';

export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (props.error) {
    // Error boundary shell
  }
  return null;
}
