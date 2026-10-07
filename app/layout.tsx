import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Águas da Manhiça - Sistema de Abastecimento',
  description: 'Sistema de gestão de clientes, faturamento por metro cúbico e controlo de consumo mensal do posto de abastecimento de água na comunidade da Manhiça.',
  openGraph: {
    title: 'Águas da Manhiça - Sistema de Abastecimento',
    description: 'Sistema de gestão de clientes, faturamento por metro cúbico e controlo de consumo mensal do posto de abastecimento de água na comunidade da Manhiça.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Águas da Manhiça - Sistema de Abastecimento',
    description: 'Sistema de gestão de clientes, faturamento por metro cúbico e controlo de consumo mensal do posto de abastecimento de água na comunidade da Manhiça.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
