import type { Metadata, Viewport } from 'next';
import './globals.css';
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'VB Assessoria - Controle de Acesso',
  description: 'Sistema profissional de check-in para eventos - Vanessa Bidinotti Assessoria e Cerimonial',
  icons: {
    icon: '/Logo-03.jpg',
    apple: '/Logo-03.jpg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Check-in VB',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/Logo-03.jpg" />
        <link rel="apple-touch-icon" href="/Logo-03.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
