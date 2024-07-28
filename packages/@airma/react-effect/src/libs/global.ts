import {
  createKey,
  Provider,
  ConfigProvider as CP,
  model
} from '@airma/react-state';
import { createContext, createElement, useContext, useMemo } from 'react';
import { globalController } from './model';
import type { ConfigProviderProps, GlobalConfig } from './type';

export const defaultIsFetchingState: any[] = [];

export const globalControllerStore = model(globalController)
  .createStore(defaultIsFetchingState)
  .static();

const GlobalConfigContext = createContext<GlobalConfig | null>(null);

export function ConfigProvider({ value, children }: ConfigProviderProps) {
  const stateConfig = useMemo(
    () => (value.batchUpdate ? { batchUpdate: value.batchUpdate } : {}),
    []
  );
  const child = createElement(
    GlobalConfigContext.Provider,
    { value },
    children
  );
  return createElement(CP, { value: stateConfig }, child);
}

export function useGlobalConfig(): GlobalConfig | null {
  return useContext(GlobalConfigContext);
}
