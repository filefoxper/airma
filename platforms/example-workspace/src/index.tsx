import React from 'react';
import { render } from 'react-dom';
import App, { fetchFactory } from '@/app';
import {
  GlobalConfig,
  GlobalProvider,
  GlobalSessionProvider,
  Strategy
} from '@airma/react-effect';

const root = document.getElementById('root');

const config: GlobalConfig = {
  strategy: s => [...s, Strategy.error(e => console.log('final...', e))]
};

const keys = {
  fetchFactory
};

render(
  <React.StrictMode>
    <GlobalSessionProvider config={config} value={keys}>
      <App />
    </GlobalSessionProvider>
  </React.StrictMode>,
  root
);

// render(
//   <GlobalRefreshProvider value={config}>
//     <App />
//   </GlobalRefreshProvider>,
//   root
// );
