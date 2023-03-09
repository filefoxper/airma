import React from 'react';
import { render } from 'react-dom';
import App from '@/app';
import {
  GlobalConfig,
  GlobalConfigProvider,
  Strategy
} from '@airma/react-effect';

const root = document.getElementById('root');

const config: GlobalConfig = {
  strategy: s => [...s, Strategy.error(e => console.log(e))]
};

render(
  <React.StrictMode>
    <GlobalConfigProvider value={config}>
      <App />
    </GlobalConfigProvider>
  </React.StrictMode>,
  root
);

// render(
//   <GlobalConfigProvider value={config}>
//     <App />
//   </GlobalConfigProvider>,
//   root
// );
