import type { Metadata } from "next";
import { Inter, Merriweather, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CarrinhoProvider } from "./context/CarrinhoContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import CartProvider from "./context/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import NotificacaoCarrinho from './components/NotificacaoCarrinho';
import FloatingCartButton from './components/FloatingCartButton';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-merriweather',
});

const playfairDisplay = Playfair_Display({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-playfair-display',
});

export const metadata: Metadata = {
  title: "Livraria Adriana do Nascimento | Sua Jornada Literária Começa Aqui",
  description: "Descubra uma seleção cuidadosa dos melhores livros nacionais e internacionais, com curadoria para todos os gostos literários.",
  keywords: "livraria, livros, literatura, leitura, comprar livros, ebooks, livros online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${merriweather.variable} ${playfairDisplay.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="bg-background text-primary-900 min-h-screen flex flex-col relative selection:bg-primary-200 selection:text-primary-900 overflow-x-hidden">
        <AuthProvider>
          <CartProvider>
            <CarrinhoProvider>
              <ToastProvider>
                {/* Efeito decorativo */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-400 z-50"></div>
                
                <Navbar />
                <NotificacaoCarrinho />
                <main className="pt-20 flex-grow">
                  {children}
                </main>
                <Footer />
                <FloatingCartButton />
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#fff',
                      color: '#334155',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                    },
                    success: {
                      style: {
                        borderLeft: '4px solid #10b981',
                      },
                    },
                    error: {
                      style: {
                        borderLeft: '4px solid #ef4444',
                      },
                    },
                  }}
                />
              </ToastProvider>
            </CarrinhoProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}