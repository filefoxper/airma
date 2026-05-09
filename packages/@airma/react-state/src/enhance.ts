import { usePersistFn } from '@airma/react-hooks-core';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useConfiguration } from './provider';
import type { Action, Dispatch } from 'as-model';

export function useRenderProtectDispatch(dispatch: Dispatch) {
  const configuration = useConfiguration();
  const { supports } = configuration ?? {};
  const { renderAction } = supports ?? {};
  const renderingRef = useRef<Action[] | null>(renderAction ? [] : null);
  renderingRef.current = renderAction ? [] : null;
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
      dispatch(action);
    });
  });
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);
  return dispatcher;
}
