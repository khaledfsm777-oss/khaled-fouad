import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { ProgressProvider } from './context/ProgressContext';
import { TopProgressBar } from './components/TopProgressBar';
import './index.css';

function mountApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountApp);
    } else {
      console.error('Fatal: #root element not found in DOM.');
    }
    return;
  }

  createRoot(rootElement).render(
    <StrictMode>
      <GlobalErrorBoundary>
        <ProgressProvider>
          <TopProgressBar />
          <App />
        </ProgressProvider>
      </GlobalErrorBoundary>
    </StrictMode>,
  );
}

mountApp();
