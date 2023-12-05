import {
  ModelKeys,
  StoreProvider,
  createKey,
  useIsModelMatchedInStore
} from '@airma/react-state';
import {
  createContext,
  createElement,
  ReactNode,
  useContext,
  useMemo
} from 'react';
import { globalController } from './model';
import type {
  ConfigProviderProps,
  GlobalConfig,
  GlobalSessionProviderProps
} from './type';

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
  return createElement(
    GlobalConfigContext.Provider,
    { value },
    globalFetchingKey
      ? createElement(StoreProvider, { value: globalFetchingKey }, children)
      : children
  );
}

export function useGlobalConfig(): GlobalConfig | null {
  return useContext(GlobalConfigContext);
}
