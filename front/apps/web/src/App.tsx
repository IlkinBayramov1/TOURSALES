import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './shared/context/ThemeContext';
import { CurrencyProvider } from './shared/context/CurrencyContext';
import { AuthProvider } from './shared/context/AuthContext';
import { FavoritesProvider } from './shared/context/FavoritesContext';
import { SocketProvider } from './shared/context/SocketContext';
import { ToastProvider, ToastContainer } from './shared/context/ToastContext';
import { Navbar } from './shared/components/Navbar/Navbar';
import { Footer } from './shared/components/Footer/Footer';
import { FloatingWhatsAppButton } from './shared/components/FloatingWhatsApp/FloatingWhatsAppButton';
import { FloatingChatWidget } from './modules/chat/components/FloatingChatWidget/FloatingChatWidget';
import { FloatingAiConciergeButton } from './modules/ai-concierge/components/FloatingAiConciergeButton/FloatingAiConciergeButton';
import { AppRoutes } from './app/router';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <CurrencyProvider>
            <AuthProvider>
              <FavoritesProvider>
                <SocketProvider>
                  <div className="web-app-root">
                    <Navbar />
                    <main className="web-main-content">
                      <AppRoutes />
                    </main>
                    <Footer />
                    <FloatingWhatsAppButton />
                    <FloatingChatWidget />
                    <FloatingAiConciergeButton />
                    <ToastContainer />
                  </div>
                </SocketProvider>
              </FavoritesProvider>
            </AuthProvider>
          </CurrencyProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
