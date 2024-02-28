import { createKey, Provider, ConfigProvider as CP } from '@airma/react-state';
import { createContext, createElement, useContext, useMemo } from 'react';
import { globalController } from './model';
import type { ConfigProviderProps, GlobalConfig } from './type';

export const defaultIsFetchingState: any[] = [];

export const globalControllerKey = createKey(
  globalController,
  defaultIsFetchingState
);

const GlobalConfigContext = createContext<GlobalConfig | null>(null);

export function ConfigProvider({ value, children }: ConfigProviderProps) {
  const globalFetchingKey = useMemo(() => {
    return value.useGlobalFetching ? globalControllerKey : undefined;
  }, []);
  const stateConfig = useMemo(
    () => (value.batchUpdate ? { batchUpdate: value.batchUpdate } : {}),
    []
  );
  const child = createElement(
    GlobalConfigContext.Provider,
    { value },
    globalFetchingKey
      ? createElement(Provider, { value: globalFetchingKey }, children)
      : children
  );
  return createElement(CP, { value: stateConfig }, child);
}

export function useGlobalConfig(): GlobalConfig | null {
  return useContext(GlobalConfigContext);
}
