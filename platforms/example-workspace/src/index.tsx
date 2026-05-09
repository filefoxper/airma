import React from 'react';
// import { createRoot } from 'react-dom/client';
// eslint-disable-next-line react/no-deprecated
import { render, unstable_batchedUpdates } from 'react-dom';
import { Strategy } from '@airma/react-effect';
import { ConfigProvider } from '@airma/react-hooks';
import App from '@/app';
import type { GlobalConfig } from '@airma/react-hooks';

const root = document.getElementById('root');

const config: GlobalConfig = {
  batchUpdate: unstable_batchedUpdates,
  strategy: s => [Strategy.failure(e => console.log('final...', e)), ...s]
};

// createRoot(root!).render(<React.StrictMode>
//     <ConfigProvider value={config}>
//         <App />
//     </ConfigProvider>
// </React.StrictMode>);

// createRoot(root!).render(
//     <ConfigProvider value={config}>
//         <App />
//     </ConfigProvider>);

// render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   root
// );

render(
  <ConfigProvider value={config}>
    <App />
  </ConfigProvider>,
  root
);
