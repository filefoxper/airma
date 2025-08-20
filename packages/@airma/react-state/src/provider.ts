import {
  ComponentType,
  createContext,
  createElement,
  FC,
  FunctionComponent,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  createStores,
  ModelKey,
  shallowEqual as shallowEq,
  StoreIndex,
  validations
} from 'as-model';
import { GlobalConfig, ModelStores } from './type';

export const ModelStoresContext = createContext<ModelStores | undefined>(
  undefined
);

export const ConfigContext = createContext<GlobalConfig | undefined>(undefined);

export const Provider: FC<{
  value?: Array<StoreIndex | ModelKey>;
  children?: ReactNode;
}> = function RequiredModelProvider({ value, children }) {
  const storeKeys = value;
  if (storeKeys == null) {
    throw new Error('You need to provide keys to `Provider`');
  }
  const parent = useContext(ModelStoresContext);
  const [stores, setStores] = useState((): ModelStores => {
    const collections = createStores(...storeKeys);
    return { collections, parent };
  });

  useEffect(() => {
    if (
      shallowEq(
        stores.collections.keys(),
        [...storeKeys].map(d => (validations.isModelKey(d) ? d : d.key))
      ) &&
      stores.parent === parent
    ) {
      return;
    }
    stores.collections.update(...storeKeys);
    setStores({ collections: stores.collections, parent });
  }, [stores, storeKeys, parent]);

  useEffect(() => {
    return () => {
      stores.collections.destroy();
      stores.parent = undefined;
    };
  }, []);

  return createElement(
    ModelStoresContext.Provider,
    { value: stores },
    children
  );
};

export function provide(...keys: (StoreIndex | ModelKey)[]) {
  const value = keys;
  const connect = function connect<
    P extends Record<string, any>,
    C extends ComponentType<P>
  >(Comp: C): ComponentType<P> {
    return function WithModelProviderComponent(props: P) {
      return createElement(
        Provider,
        { value },
        createElement<P>(Comp as FunctionComponent<P>, props)
      );
    };
  };
  connect.to = function to<
    P extends Record<string, any>,
    C extends ComponentType<P>
  >(Comp: C): ComponentType<P> {
    return function WithModelProviderComponent(props: P) {
      return createElement(
        Provider,
        { value },
        createElement<P>(Comp as FunctionComponent<P>, props)
      );
    };
  };
  return connect;
}

export const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}> = function ConfigProvider(props) {
  const { value, children } = props;
  return createElement(ConfigContext.Provider, { value }, children);
};

export function useStores() {
  return useContext(ModelStoresContext);
}

export function useConfiguration() {
  const optimizeConfig = useContext(ConfigContext);
  const { batchUpdate } = optimizeConfig || {};
  return useMemo(() => ({ batchUpdate }), [batchUpdate]);
}
