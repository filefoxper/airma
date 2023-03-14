import React from 'react';
import { render } from 'react-dom';
import App from '@/app';
import { GlobalConfig, GlobalProvider, Strategy } from '@airma/react-effect';

const root = document.getElementById('root');

const config: GlobalConfig = {
  strategy: s => [...s, Strategy.error(e => console.log('final...',e))]
};

render(
  <React.StrictMode>
    <GlobalProvider value={config}>
      <App />
    </GlobalProvider>
  </React.StrictMode>,
  root
);

// render(
//   <GlobalRefreshProvider value={config}>
//     <App />
//   </GlobalRefreshProvider>,
//   root
// );
