import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import MasterRoutes from './pages/master/MasterRoutes';
import './index.css';

/**
 * Two fully separate route trees:
 *  - /master-login and /master/*  → Master Panel (platform owner, IP-gated)
 *  - everything else              → tenant app (App)
 * The master tree must NOT share the tenant AuthContext, QueryClient, or AppShell.
 */
const isMasterRoute = () => {
  const path = window.location.pathname;
  return path === '/master-login' || path.startsWith('/master');
};

// Dedicated QueryClient for the Master tree — isolated from the tenant cache.
const masterQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {isMasterRoute() ? (
        <QueryClientProvider client={masterQueryClient}>
          <MasterRoutes />
        </QueryClientProvider>
      ) : (
        <App />
      )}
    </BrowserRouter>
  </React.StrictMode>,
);
