import {
  provide,
  Provider as ModelProvider,
  ConfigProvider as StateConfigProvider
} from '@airma/react-state';
import { ConfigProvider as EffectConfigProvider } from '@airma/react-effect';
import { createElement, FC, ReactNode, useMemo } from 'react';
import { GlobalConfig } from './type';

export * from '@airma/react-hooks-core';

export {
  createKey,
  useModel,
  useControlledModel,
  useRealtimeInstance,
  useSelector,
  model
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
  const [stateConfig, effectConfig] = useMemo(() => {
    const { batchUpdate, ...rest } = value;
    return [{ batchUpdate }, rest];
  }, []);
  return createElement(
    StateConfigProvider,
    { value: stateConfig },
    createElement(EffectConfigProvider, { value: effectConfig }, children)
  );
};
