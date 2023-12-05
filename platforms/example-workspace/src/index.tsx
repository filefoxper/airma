import React from 'react';
import { render, unstable_batchedUpdates } from 'react-dom';
import App from '@/app';
import { Strategy } from '@airma/react-effect';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, GlobalConfig } from '@airma/react-hooks';

const root = document.getElementById('root');

const config: GlobalConfig = {
  batchUpdate: unstable_batchedUpdates,
  useGlobalFetching: true,
  strategy: s => [...s, Strategy.error(e => console.log('final...', e))]
};

render(
  <ConfigProvider value={config}>
    <App />
  </ConfigProvider>,
  root
);

// render(
//   <GlobalSessionProvider config={config} keys={keys}>
//     <App />
//   </GlobalSessionProvider>,
//   root
// );
