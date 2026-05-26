import { Strategy, useMutation, useQuery } from '@airma/react-effect';
import { waitFor } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import { useEffect, useState } from 'react';
import { delay, renderEffectHook } from '@test/util';

describe('会话配置用法', () => {
  const sessionCallback = (data: string) => {
    return Promise.resolve(`session:${data}`);
  };

  describe('variables 配置项的基本用法', () => {
    test('当会话以加载或依赖变更形式执行时，以 variables 作为会话参数', async () => {
      const { result } = renderEffectHook(() => {
        const [sessionState] = useQuery(sessionCallback, {
          variables: ['test'],
        });
        return { sessionState };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      expect(result.current.sessionState.variables).toEqual(['test']);
    });

    test('当会话以触发器触发形式执行时，以 variables 作为会话参数', async () => {
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(sessionCallback, {
          variables: ['test'],
          manual: true,
        });
        return { sessionState, trigger };
      });
      act(() => {
        result.current.trigger();
      });
      await waitFor(() => result.current.sessionState.round === 1);
      expect(result.current.sessionState.variables).toEqual(['test']);
    });

    test('当整个配置项为数组类型时，配置项即会话参数', async () => {
      const { result } = renderEffectHook(() => {
        const [sessionState] = useQuery(sessionCallback, ['test']);
        return { sessionState };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      expect(result.current.sessionState.variables).toEqual(['test']);
    });
  });

  describe('triggerOn 配置项基本用法', () => {
    test('useQuery 默认支持的 triggerOn 配置项为 [mount,update,manual]，通过配置 triggerOn，可改变这一状况', async () => {
      const { result } = renderEffectHook(() => {
        const [sessionState] = useQuery(sessionCallback, {
          variables: ['test'],
          triggerOn: ['manual'],
        });
        return { sessionState };
      });
      await delay(300);
      expect(result.current.sessionState.loaded).toBe(false);
    });

    test('useMutation 默认支持的 triggerOn 配置项为 [manual]，通过配置 triggerOn，可改变这一状况', async () => {
      const { result } = renderEffectHook(() => {
        const [sessionState] = useQuery(sessionCallback, {
          variables: ['test'],
          triggerOn: ['mount'],
        });
        return { sessionState };
      });
      await waitFor(() => expect(result.current.sessionState.round).toBe(1));
    });
  });

  describe('deps 配置项基本用法', () => {
    test('当会话的 triggerOn 配置项支持 update 时，默认以会话参数作为变更依赖项来执行会话，但 deps 配置可以获取执行依赖的控制权', async () => {
      const { result } = renderEffectHook(() => {
        const [dep, setDep] = useState(0);
        const [sessionState] = useQuery(sessionCallback, {
          variables: ['test'],
          deps: [dep],
        });
        return { sessionState, setDep };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      act(() => {
        result.current.setDep(1);
      });
      await waitFor(() => expect(result.current.sessionState.round).toBe(2));
    });
  });

  describe('defaultData 配置项基本用法', () => {
    test('在会话成功完成一次执行前， defaultData 配置项可以给会话状态提供一个默认数据', async () => {
      const { result } = renderEffectHook(() => {
        const [sessionState] = useQuery(sessionCallback, {
          variables: ['test'],
          defaultData: 'session:default',
        });
        return { sessionState };
      });
      expect(result.current.sessionState.data).toBe('session:default');
    });

    test('在会话成功完成一次执行后，无论结果是否为 undefined, 会话状态都以执行结果为数据', async () => {
      const { result } = renderEffectHook(() => {
        const [sessionState] = useQuery((param: string): Promise<string | undefined> => Promise.resolve(undefined), {
          variables: ['test'],
          defaultData: 'session:default',
        });
        return { sessionState };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      expect(result.current.sessionState.data).toBe(undefined);
    });
  });

  describe('ignoreStrategyWrapper 配置项基本用法', () => {
    test('ignoreStrategyWrapper 配置项可忽略 ConfigProvider 的 strategies 配置', async () => {
      const mockSuccessFn = jest.fn();
      const { result } = renderEffectHook(
        () => {
          const [sessionState] = useQuery(sessionCallback, {
            variables: ['test'],
            ignoreStrategyWrapper: true,
          });
          return { sessionState };
        },
        {
          config: {
            strategy(s) {
              return [Strategy.success(mockSuccessFn), ...s];
            },
          },
        },
      );
      await waitFor(() => result.current.sessionState.round === 1);
      expect(mockSuccessFn).not.toBeCalled();
    });
  });

  describe('payload 配置项基本用法', () => {
    test('payload 配置项可以为每次执行带上一个负载值，以便在执行后通过负载值判断本次执行的特殊性', async () => {
      const { result } = renderEffectHook(() => {
        const [val, setVal] = useState('test');
        const [resetVersion, setResetVersion] = useState(0);
        const [sessionState] = useQuery(sessionCallback, {
          variables: [val],
          payload: resetVersion,
        });

        useEffect(() => {
          if (!sessionState.loaded) {
            return;
          }
          act(() => {
            setVal('test');
          });
        }, [resetVersion]);

        return { sessionState, setVariable: setVal, reset: () => setResetVersion((v) => v + 1) };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      act(() => {
        result.current.setVariable('data');
      });
      await waitFor(() => result.current.sessionState.round === 2);
      const staleResetVersion = result.current.sessionState.payload;
      act(() => {
        result.current.reset();
      });
      await waitFor(() => result.current.sessionState.round === 3);
      expect([staleResetVersion, result.current.sessionState.payload]).toEqual([0, 1]);
    });
  });

  describe('strategy 配置项基本用法', () => {
    test('strategy 配置项可级联多个策略，改变会话运行特性', async () => {
      const mockExecution = jest.fn(sessionCallback);
      const mockSuccessFn = jest.fn();
      const { result } = renderEffectHook(
        () => {
          const [sessionState, , execute] = useQuery(mockExecution, {
            variables: ['test'],
            strategy: [
              Strategy.atomic({ throttle: false }),
              Strategy.debounce(100),
              Strategy.validate(([v]) => v !== 'test'),
            ],
          });
          return { sessionState, execute };
        },
        {
          config: {
            strategy(s) {
              return [Strategy.success(mockSuccessFn), ...s];
            },
          },
        },
      );
      act(() => {
        result.current.execute('data1');
        result.current.execute('data2');
      });
      await delay(220);
      expect(mockExecution).toBeCalledTimes(2);
    });

    test('strategy 配置项可使用对象配置', async () => {
      const mockSuccessFn = jest.fn();
      const { result } = renderEffectHook(
        () => {
          const [sessionState, trigger] = useMutation(sessionCallback, {
            variables: ['test'],
            strategy: {
              list: [Strategy.memo()],
              withoutWrapper: true,
              withoutDefault: true,
            },
          });
          return { sessionState, trigger };
        },
        {
          config: {
            strategy(s) {
              return [Strategy.success(mockSuccessFn), ...s];
            },
          },
        },
      );
      act(() => {
        result.current.trigger();
        result.current.trigger();
      });
      await waitFor(() => expect(result.current.sessionState.round).toBe(2));
      expect(mockSuccessFn).not.toBeCalled();
    });
  });
});
