import React from 'react';
import { render } from 'react-dom';
import App from '@/app';
import {
  ClientConfig,
  ClientConfigProvider,
  Strategy
} from '@airma/react-effect';

const root = document.getElementById('root');

const config: ClientConfig = {
  strategy: s => [...s, Strategy.error(e => console.log(e))]
};

render(
  <React.StrictMode>
    <ClientConfigProvider value={config}>
      <App />
    </ClientConfigProvider>
  </React.StrictMode>,
  root
);

// render(
//   <EffectConfigProvider value={config}>
//     <App />
//   </EffectConfigProvider>,
//   root
// );
