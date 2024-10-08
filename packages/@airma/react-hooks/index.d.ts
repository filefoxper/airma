import { FC, FunctionComponent, NamedExoticComponent, ReactNode } from 'react';
import {
  GlobalConfig as StateGlobalConfig,
  ModelKeys
} from '@airma/react-state';
import { GlobalConfig as EffectGlobalConfig } from '@airma/react-effect';

export declare type GlobalConfig = StateGlobalConfig & EffectGlobalConfig;

export * from '@airma/react-hooks-core';

export {
  createKey,
  useModel,
  useSignal,
  useControlledModel,
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

export declare function provide(
  keys: ModelKeys
): <P extends Record<string, any>>(
  component: FunctionComponent<P> | NamedExoticComponent<P>
) => typeof component;

export declare const Provider: FC<{
  value: ModelKeys;
  children?: ReactNode;
}>;

export declare const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}>;
