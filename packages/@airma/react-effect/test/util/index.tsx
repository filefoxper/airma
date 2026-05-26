import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { ConfigProvider } from '@airma/react-effect';
import type { GlobalConfig } from '@airma/react-effect';
import type { ReactNode } from 'react';
import type { RenderHookResult } from '@testing-library/react-hooks/src/types';
import type { RenderHookOptions } from '@testing-library/react-hooks/src/types/react';

export function renderEffectHook<TProps, TResult>(
  callback: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps> & { config?: GlobalConfig },
): RenderHookResult<TProps, TResult> {
  const { wrapper: CustomWrapper, config } = options || {};
  const globalConfig = { ...config, test: { act } };
  const wrapper = (props: TProps & { children?: ReactNode }) => {
    const { children } = props;
    return (
      <ConfigProvider value={globalConfig}>{CustomWrapper ? <CustomWrapper {...props} /> : children}</ConfigProvider>
    );
  };
  return renderHook(callback, { wrapper });
}

export function delay(time: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, time);
  });
}
