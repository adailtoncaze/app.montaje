import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { ProvedorMontaje } from '@montaje/ui';
import { App } from './App';
import { solicitarArmazenamentoPersistente } from './db/armazenamento';
import './styles/index.css';

// Atualizacao automatica do service worker (PWA)
registerSW({ immediate: true });

// APP-27: pede armazenamento persistente para reduzir o risco de o navegador
// descartar o checklist e as fotos que ainda nao subiram para o servidor.
void solicitarArmazenamentoPersistente();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Elemento #root nao encontrado');

ReactDOM.createRoot(raiz).render(
  <React.StrictMode>
    <ProvedorMontaje>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ProvedorMontaje>
  </React.StrictMode>,
);
