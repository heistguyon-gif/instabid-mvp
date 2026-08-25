'use client';

import { useState } from 'react';

export function ShareButton({ title, text, label }: { title: string; text: string; label: string }) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else await navigator.clipboard.writeText(url);
      setStatus('success');
      window.setTimeout(() => setStatus('idle'), 1_800);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setStatus('error');
      window.setTimeout(() => setStatus('idle'), 2_200);
    }
  }

  return <button aria-live="polite" onClick={() => void share()} type="button">
    {status === 'success' ? 'Link copiado ✓' : status === 'error' ? 'Não foi possível copiar' : label}
  </button>;
}
