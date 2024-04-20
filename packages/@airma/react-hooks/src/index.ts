import { provide, Provider as ModelProvider } from '@airma/react-state';
import { ConfigProvider as EffectConfigProvider } from '@airma/react-effect';
import { createElement, FC, ReactNode } from 'react';
import { GlobalConfig } from './type';

export * from '@airma/react-hooks-core';

export {
  createKey,
  useModel,
  useSignal,
  useStaticModel,
  useControlledModel,
  useSelector,
  model,
  useRealtimeInstance
} from '@airma/react-state';

export {
  createSessionKey,
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
