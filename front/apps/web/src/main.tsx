import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Design tokens and typography
import '../../../packages/ui/src/theme/tokens.css';
import '../../../packages/ui/src/theme/typography.css';
import '../../../packages/ui/src/theme/darkmode.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
