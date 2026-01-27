'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Redirect /markets/quote/[symbol] to /companies/[symbol]
 * This maintains backwards compatibility with the old URL structure
 */
export default function QuoteRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;

  useEffect(() => {
    if (symbol) {
      router.replace(`/companies/${symbol}`);
    }
  }, [symbol, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Redirecting to company page...</p>
      </div>
    </div>
  );
}
