import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BinBuddy - Smart Waste Sorting Assistant',
  description: 'Point your phone at an item and BinBuddy tells you which bin it goes in, and why.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-wash text-ink antialiased">{children}</body>
    </html>
  );
}
