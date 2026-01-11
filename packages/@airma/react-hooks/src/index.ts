import { provide, Provider as ModelProvider } from '@airma/react-state';
import { ConfigProvider as EffectConfigProvider } from '@airma/react-effect';
import { createElement } from 'react';
import type { FC, ReactNode } from 'react';
import type { GlobalConfig } from './type';

export * from '@airma/react-hooks-core';

export {
  createKey,
  createStore,
  useModel,
  useSignal,
  useControlledModel,
  useSelector,
  model
} from '@airma/react-state';

export {
  createSessionKey,
  createSessionStore,
  Strategy,
  useQuery,
  useMutation,
  useSession,
  useLoadedSession,
  useResponse,
  useIsFetching,
  useLazyComponent,
  session
} from '@airma/react-effect';

export { provide, ModelProvider as Provider };

export const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}> = function ConfigProvider({ value, children }) {
  return createElement(EffectConfigProvider, { value }, children);
};
