import React from 'react';
// import { createRoot } from 'react-dom/client';
import {render} from "react-dom";
import App from '@/app';
import { Strategy } from '@airma/react-effect';
import { ConfigProvider, GlobalConfig } from '@airma/react-hooks';

const root = document.getElementById('root');

const config: GlobalConfig = {
  strategy: s => [...s, Strategy.failure(e => console.log('final...', e))]
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

render(
  <ConfigProvider value={config}>
    <App />
  </ConfigProvider>,
  root
);

