import React from 'react';
import { render } from 'react-dom';
import App from '@/app';
import {
  GlobalConfig,
  GlobalSessionProvider,
  Strategy
} from '@airma/react-effect';
import { createRoot } from 'react-dom/client';

const root = document.getElementById('root');

const config: GlobalConfig = {
  strategy: s => [...s, Strategy.error(e => console.log('final...', e))]
};

createRoot(root!).render(
  <React.StrictMode>
    <GlobalSessionProvider config={config}>
      <App />
    </GlobalSessionProvider>
  </React.StrictMode>
);

// render(
//   <GlobalSessionProvider config={config} keys={keys}>
//     <App />
//   </GlobalSessionProvider>,
//   root
// );
