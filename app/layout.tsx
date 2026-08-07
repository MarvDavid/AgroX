import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import Toast from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'AgroX - Agricultural E-Commerce & Farm Produce Marketplace',
  description: 'Direct B2B and B2C agricultural marketplace connecting certified farmers, grain suppliers, and buyers.',
  keywords: ['agriculture', 'fresh produce', 'maize', 'fertilizer', 'farming machinery', 'farm to table', 'AgroX'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
          <Toast />
        </CartProvider>
      </body>
    </html>
  );
}
