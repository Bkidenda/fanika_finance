import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { handleSupabaseAuthCallback } from './integrations/supabase/auth';

async function bootstrap() {
  if (window.location.pathname === '/auth/callback') {
    const { error } = await handleSupabaseAuthCallback();

    if (!error) {
      window.history.replaceState({}, '', '/dashboard');
    }
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();