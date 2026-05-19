import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg, #ffffff)',
            color: 'var(--toast-color, #1f2937)',
            borderRadius: '12px',
            border: '1px solid var(--toast-border, #e5e7eb)'
          }
        }}
      />
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
