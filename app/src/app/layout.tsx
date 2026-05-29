import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { PortalProvider } from '@/components/PortalProvider';

export const metadata: Metadata = {
  title: 'PortalEscrow | Portaldot milestone escrow',
  description: 'Portaldot-native milestone escrow for freelancers and clients.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><PortalProvider><div className="min-h-screen"><header className="sticky top-0 z-20 border-b border-portal-line bg-portal-bg/90 backdrop-blur"><nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/" className="text-lg font-black tracking-tight">Portal<span className="text-portal-pot">Escrow</span></Link><div className="flex gap-4 text-sm text-slate-300"><Link href="/app">App</Link><Link href="/architecture">Architecture</Link><a href="/docs/demo-script.md">Demo Flow</a><a href="/docs/architecture.md">View Contracts</a></div></nav></header>{children}</div></PortalProvider></body></html>;
}
