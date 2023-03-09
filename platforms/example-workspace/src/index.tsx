import React from 'react';
import { render } from 'react-dom';
import App from '@/app';
import {
  GlobalQueryConfig,
  QueryConfigProvider,
  Strategy
} from '@airma/react-effect';

const root = document.getElementById('root');

const config: GlobalQueryConfig = {
  strategy: s => [...s, Strategy.error(e => console.log(e))]
};

render(
  <React.StrictMode>
    <QueryConfigProvider value={config}>
      <App />
    </QueryConfigProvider>
  </React.StrictMode>,
  root
);

// render(
//   <QueryConfigProvider value={config}>
//     <App />
//   </QueryConfigProvider>,
//   root
// );
