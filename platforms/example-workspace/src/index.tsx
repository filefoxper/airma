import React from 'react';
import { render } from 'react-dom';
import App from '@/app';
import {
  EffectConfig,
  EffectConfigProvider,
  Strategy
} from '@airma/react-effect';

const root = document.getElementById('root');

const config: EffectConfig = {
  strategy: s => [...s, Strategy.error(e => console.log(e))]
};

render(
  <EffectConfigProvider value={config}>
    <App />
  </EffectConfigProvider>,
  root
);
