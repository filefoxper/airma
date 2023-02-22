import React from 'react';
import { render } from 'react-dom';
import App from '@/app';
import { PrimaryStrategyProvider, Strategy } from '@airma/react-effect';

const root = document.getElementById('root');

const primary = Strategy.error(e => console.log(e));

render(
  <PrimaryStrategyProvider value={primary}>
    <App />
  </PrimaryStrategyProvider>,
  root
);
