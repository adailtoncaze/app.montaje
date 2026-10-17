import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ProvedorTema } from './app/ProvedorTema';
import { Toaster } from './components/ui/toaster';
import { aplicarTema, useTemaStore } from './lib/tema';
import './styles/index.css';

// Aplica o tema persistido antes do primeiro paint (evita "flash" de tema).
aplicarTema(useTemaStore.getState().tema);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Elemento #root nao encontrado');

ReactDOM.createRoot(raiz).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ProvedorTema>
          <App />
          <Toaster />
        </ProvedorTema>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
