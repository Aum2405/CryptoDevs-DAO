'use client';

import dynamic from 'next/dynamic';
import * as React from 'react';
import { useEffect } from 'react';

// Dynamically import the actual Providers component
const Providers = dynamic(
  () => import('./providers').then(mod => mod.Providers),
  { ssr: false } // Disable SSR for this wrapper
);

export default function ClientProviders({ children }) {
  useEffect(() => {
    // Force a re-render on client side to ensure CSS modules are properly loaded
    const style = document.createElement('style');
    style.textContent = '';
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Render the dynamically imported Providers component on the client side
  return <Providers>{children}</Providers>;
} 