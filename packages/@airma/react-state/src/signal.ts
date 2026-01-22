import { createSignal, shallowEqual } from 'as-model';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useInitialize, useModelInitialize } from './initialize';
import { useRenderProtectDispatch } from './enhance';
import type { SignalGenerator } from './type';
import type {
  Action,
  Model,
  ModelKey,
  Store,
  ModelUsage,
  Instance,
  PickState
} from 'as-model';

function useSignalSubscribeConnection<
  M extends Model,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(
  signal: SignalGenerator<M, R>,
  subscription: (ins: Instance<M>, act: Action | null) => void | (() => void)
) {
  const actionsCollectionRef = useRef<
    null | ((i: Instance<M>) => ((...args: any[]) => any)[])
  >(null);
  const changesCollectionRef = useRef<{
    collections: any[] | null;
    collector: null | ((i: Instance<M>) => any[]);
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
    onActions(collector: (i: Instance<M>) => ((...args: any[]) => any)[]) {
      actionsCollectionRef.current = collector;
    },
    onChanges(collector: (i: Instance<M>) => any[]) {
      changesCollectionRef.current.collector = collector;
    }
  };
  return {
    onActions(collector: (i: Instance<M>) => ((...args: any[]) => any)[]) {
      res.onActions(collector);
      return {
        onChanges: res.onChanges
      };
    },
    onChanges(collector: (i: Instance<M>) => any[]) {
      res.onChanges(collector);
      return {
        onActions: res.onActions
      };
    }
  };
}

function getSignalSubscribe<
  M extends Model,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(signal: SignalGenerator<M, R>) {
  const useWatch = function useWatch(
    subscription: (ins: Instance<M>, act: Action | null) => void | (() => void)
  ) {
    return useSignalSubscribeConnection(signal, (ins, act) => {
      if (act?.method == null) {
        return undefined;
      }
      return subscription(ins, act);
    });
  };
  const useEffective = function useEffective(
    subscription: (ins: Instance<M>, act: Action | null) => void | (() => void)
  ) {
    const [wrap, setWrap] = useState<{
      action: Action | null;
      instance: Instance<M>;
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
  M extends Model,
  D extends PickState<M>,
  R extends undefined | ((instance: () => Instance<M>) => any) = undefined
>(modelLike: M | ModelKey<M, R> | Store<M, R> | ModelUsage<M, R>, state?: D) {
  const hasDefaultState = arguments.length > 1;
  const store = useModelInitialize<M, D, R>(modelLike, {
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
