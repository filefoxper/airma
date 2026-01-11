import { createSignal, shallowEqual } from 'as-model';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useInitialize, useModelInitialize } from './initialize';
import { useRenderProtectDispatch } from './enhance';
import type { SignalGenerator } from './type';
import type {
  Action,
  Model,
  ModelInstance,
  ModelKey,
  Store,
  ModelUsage
} from 'as-model';

function useSignalSubscribeConnection<
  S,
  T extends ModelInstance,
  R extends undefined | ((instance: () => T) => any) = undefined
>(
  signal: SignalGenerator<S, T, R>,
  subscription: (ins: T, act: Action | null) => void | (() => void)
) {
  const actionsCollectionRef = useRef<
    null | ((i: T) => ((...args: any[]) => any)[])
  >(null);
  const changesCollectionRef = useRef<{
    collections: any[] | null;
    collector: null | ((i: T) => any[]);
  }>({ collector: null, collections: null });
  const destroyRef = useRef<(() => void) | null>(null);
  const protectedDispatch = useRenderProtectDispatch(action => {
    const actionsCollector = actionsCollectionRef.current;
    const { collector: changesCollector, collections: changesCollections } =
      changesCollectionRef.current;
    const { method } = action;
    const instance = signal.store.getStoreInstance();
    const isActionMethodMatched = (function matchMethod() {
      if (!actionsCollector) {
        return true;
      }
      const methods = actionsCollector(instance);
      return (
        Array.isArray(methods) &&
        methods.some(m => typeof m === 'function' && m === method)
      );
    })();
    const isChangesMatched = (function matchChanges() {
      if (changesCollector == null) {
        return true;
      }
      const currentChanges = changesCollector(instance);
      changesCollectionRef.current.collections = currentChanges;
      return shallowEqual(changesCollections, currentChanges);
    })();
    if (method != null && (!isActionMethodMatched || !isChangesMatched)) {
      return;
    }
    const prevDestroy = destroyRef.current;
    if (prevDestroy) {
      prevDestroy();
    }
    const destroy = subscription(instance, action);
    destroyRef.current = destroy ?? null;
  });
  useEffect(() => {
    const unsubscribe = signal.subscribe(protectedDispatch);
    return () => {
      unsubscribe();
      const destroy = destroyRef.current;
      if (destroy) {
        destroy();
      }
    };
  }, []);
  const res = {
    onActions(collector: (i: T) => ((...args: any[]) => any)[]) {
      actionsCollectionRef.current = collector;
    },
    onChanges(collector: (i: T) => any[]) {
      changesCollectionRef.current.collector = collector;
    }
  };
  return {
    onActions(collector: (i: T) => ((...args: any[]) => any)[]) {
      res.onActions(collector);
      return {
        onChanges: res.onChanges
      };
    },
    onChanges(collector: (i: T) => any[]) {
      res.onChanges(collector);
      return {
        onActions: res.onActions
      };
    }
  };
}

function getSignalSubscribe<
  S,
  T extends ModelInstance,
  R extends undefined | ((instance: () => T) => any) = undefined
>(signal: SignalGenerator<S, T, R>) {
  const useWatch = function useWatch(
    subscription: (ins: T, act: Action | null) => void | (() => void)
  ) {
    return useSignalSubscribeConnection(signal, (ins, act) => {
      if (act?.method == null) {
        return undefined;
      }
      return subscription(ins, act);
    });
  };
  const useEffective = function useEffective(
    subscription: (ins: T, act: Action | null) => void | (() => void)
  ) {
    const [wrap, setWrap] = useState<{
      action: Action | null;
      instance: T;
    }>({ action: null, instance: signal.store.getStoreInstance() });
    const filter = useSignalSubscribeConnection(signal, (ins, act) => {
      if (act?.method == null) {
        return undefined;
      }
      setWrap({ action: act, instance: ins });
    });
    useEffect(() => {
      return subscription(wrap.instance, wrap.action);
    }, [wrap]);
    return filter;
  };

  return {
    useWatch,
    useEffect: useEffective
  };
}

export function useSignal<
  S,
  T extends ModelInstance,
  D extends S,
  R extends undefined | ((instance: () => T) => any) = undefined
>(
  modelLike:
    | Model<S, T>
    | ModelKey<S, T>
    | Store<S, T, R>
    | ModelUsage<Model<S, T>, R>,
  state?: D
) {
  const hasDefaultState = arguments.length > 1;
  const store = useModelInitialize<S, T, D, R>(modelLike, {
    hasDefaultState,
    state
  });
  const signalStore = useInitialize(() => {
    return createSignal(store);
  });
  const [token, setToken] = useState(signalStore.getToken());
  const signal = signalStore.getSignal();
  signal.startStatistics();
  useLayoutEffect(() => {
    signal.stopStatistics();
  });
  const subscription = useRenderProtectDispatch(() => {
    const currentToken = signalStore.getToken();
    if (!token.isDifferent(currentToken)) {
      return;
    }
    setToken(currentToken);
  });
  useEffect(() => {
    return signalStore.subscribe(subscription);
  }, []);

  return useMemo(() => {
    const handler = getSignalSubscribe(signal);
    const signalCallback = function signalCallback(opts?: {
      cutOff?: boolean;
    }) {
      return signal(opts);
    };
    signalCallback.useWatch = handler.useWatch;
    signalCallback.useEffect = handler.useEffect;
    signalCallback.store = signal.store;
    return signalCallback;
  }, [token]);
}
