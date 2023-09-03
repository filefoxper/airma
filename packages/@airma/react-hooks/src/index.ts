import {
  provide,
  StoreProvider,
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
  useSelector
} from '@airma/react-state';

export {
  createSessionKey,
  Strategy,
  useQuery,
  useMutation,
  useSession,
  useLoadedSession,
  useResponse,
  useIsFetching
} from '@airma/react-effect';

export { provide, StoreProvider as Provider };

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
