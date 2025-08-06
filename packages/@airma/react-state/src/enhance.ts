import { usePersistFn } from '@airma/react-hooks-core';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Action, Dispatch } from 'as-model';

export function useRenderProtectDispatch(dispatch: Dispatch) {
  const renderingRef = useRef<Action[] | null>([]);
  renderingRef.current = [];
  const unmountedRef = useRef(false);
  const dispatcher = usePersistFn((action: Action) => {
    if (unmountedRef.current) {
      return;
    }
    if (renderingRef.current) {
      renderingRef.current.push(action);
      return;
    }
    dispatch(action);
  });
  useLayoutEffect(() => {
    const renderingPhaseActions = renderingRef.current;
    renderingRef.current = null;
    if (!renderingPhaseActions?.length) {
      return;
    }
    renderingPhaseActions.forEach(action => {
      dispatcher(action);
    });
  });
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);
  return dispatcher;
}
