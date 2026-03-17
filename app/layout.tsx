import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ConstructIQ — AI Construction Site Detection',
  description: 'Find under-construction properties in Indian cities using satellite AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
