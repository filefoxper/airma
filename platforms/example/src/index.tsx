import React from 'react';
import { render, unstable_batchedUpdates } from 'react-dom';
import App from '@/app';
import { Strategy } from '@airma/react-effect';
import { ConfigProvider, GlobalConfig } from '@airma/react-hooks';

const root = document.getElementById('root');

const config: GlobalConfig = {
  batchUpdate: unstable_batchedUpdates,
  strategy: s => [...s, Strategy.failure(e => console.log('final...', e))]
};

render(
  <React.StrictMode>
    <ConfigProvider value={config}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
  root
);

// render(
//   <ConfigProvider value={config}>
//     <App />
//   </ConfigProvider>,
//   root
// );
