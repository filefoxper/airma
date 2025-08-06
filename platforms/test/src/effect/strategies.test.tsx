import { Strategy, useQuery } from '@airma/react-effect';
import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { delay, renderEffectHook } from '@/util';

describe('Strategy 的基本用法', () => {
  const sessionCallback = (data: string) => {
    return Promise.resolve(`session:${data}`);
  };

  describe('Strategy.debounce 的基本用法', () => {
    test('Strategy.debounce 可以让会话以 debounce 模式执行，在一定时间内每次触发均不执行，并向后延迟执行时间', async () => {
      const testFn = jest.fn(sessionCallback);
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(testFn, { variables: ['test'], strategy: Strategy.debounce(200) });
        return { sessionState, trigger };
      });
      act(() => {
        result.current.trigger();
        result.current.trigger();
      });
      await delay(300);
      expect(testFn).toBeCalledTimes(1);
    });

    test('Strategy.debounce 可以让会话以 debounce lead 模式执行，第一次立即执行，在一定时间内，后续触发均不执行，并向后延续禁止执行时间', async () => {
      const testFn = jest.fn(sessionCallback);
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.debounce({ duration: 200, lead: true }),
        });
        return { sessionState, trigger };
      });
      act(() => {
        result.current.trigger();
        result.current.trigger();
        result.current.trigger();
      });
      await delay(220);
      act(() => {
        result.current.trigger();
      });
      await delay(220);
      expect(testFn).toBeCalledTimes(2);
    });
  });

  describe('Strategy.once 的基本用法', () => {
    test('Strategy.once 限制当前会话只能成功执行一次', async () => {
      const testFn = jest.fn(sessionCallback);
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(testFn, { variables: ['test'], strategy: Strategy.once() });
        return { sessionState, trigger };
      });
      act(() => {
        result.current.trigger();
        result.current.trigger();
      });
      await waitFor(() => result.current.sessionState.loaded);
      expect(testFn).toBeCalledTimes(1);
    });

    test('Strategy.once 限制下，若当前会话执行失败，可重新执行，直到成功为止', async () => {
      const testFn = jest.fn((data: string) => {
        if (data === 'test') {
          return Promise.reject(new Error('mock error'));
        }
        return Promise.resolve(`session:${data}`);
      });
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger, execute] = useQuery(testFn, { variables: ['test'], strategy: Strategy.once() });
        return { sessionState, trigger, execute };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      act(() => {
        result.current.trigger();
      });
      await waitFor(() => result.current.sessionState.round === 2);
      act(() => {
        result.current.execute('data');
      });
      await waitFor(() => result.current.sessionState.round === 3);
      act(() => {
        result.current.execute('data');
      });
      await delay(200);
      expect(testFn).toBeCalledTimes(3);
    });
  });

  describe('Strategy.memo 的基本用法', () => {
    test('Strategy.memo 会迫使前后两次等价的结果等值', async () => {
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(() => Promise.resolve([{ data: 'test' }]), {
          variables: [],
          strategy: Strategy.memo(),
        });
        return { sessionState, trigger };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      const previousData = result.current.sessionState.data;
      act(() => {
        result.current.trigger();
      });
      await waitFor(() => result.current.sessionState.round === 2);
      const currentData = result.current.sessionState.data;
      expect(currentData).toBe(previousData);
    });

    test('若会话前后两次执行结果不等价， Strategy.memo 不会强迫两次执行结果等值', async () => {
      const { result } = renderEffectHook(() => {
        const [sessionState, , execute] = useQuery((d: number) => Promise.resolve([{ data: `test:${d}` }]), {
          variables: [0],
          strategy: Strategy.memo(),
        });
        return { sessionState, execute };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      const previousData = result.current.sessionState.data;
      act(() => {
        result.current.execute(1);
      });
      await waitFor(() => result.current.sessionState.round === 2);
      const currentData = result.current.sessionState.data;
      expect(currentData).not.toBe(previousData);
    });
  });

  describe('Strategy.validate 的基本用法', () => {
    test('当 Strategy.validate 的回调函数返回 boolean 值时，若值为 false 则禁止执行', async () => {
      const testFn = jest.fn(sessionCallback);
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.validate(() => false),
        });
        return { sessionState, trigger };
      });
      expect(testFn).not.toBeCalled();
    });

    test('当 Strategy.validate 的回调函数返回 boolean 值时，若值为 true 则允许执行', async () => {
      const testFn = jest.fn(sessionCallback);
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.validate(() => true),
        });
        return { sessionState, trigger };
      });
      expect(testFn).toBeCalledTimes(1);
    });

    test('当 Strategy.validate 的回调函数返回 Promise<boolean> 值时，若结果值为 true 则允许执行', async () => {
      const testFn = jest.fn(sessionCallback);
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.validate(() => Promise.resolve(true)),
        });
        return { sessionState, trigger };
      });
      await waitFor(() => result.current.sessionState.isFetching);
      await waitFor(() => !result.current.sessionState.isFetching);
      expect(testFn).toBeCalledTimes(1);
    });

    test('当 Strategy.validate 的回调函数返回 Promise<boolean> 值时，若结果值为 false 则禁止执行', async () => {
      const testFn = jest.fn(sessionCallback);
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.validate(() => Promise.resolve(false)),
        });
        return { sessionState, trigger };
      });
      await waitFor(() => result.current.sessionState.isFetching);
      await waitFor(() => !result.current.sessionState.isFetching);
      expect(testFn).not.toBeCalled();
    });
  });

  describe('Strategy.success 的基本用法', () => {
    test('当会话执行成功时，会立即运行 Strategy.success 中的回调函数', async () => {
      const responseFn = jest.fn();
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(sessionCallback, {
          variables: ['test'],
          strategy: Strategy.success(responseFn),
        });
        return { sessionState, trigger };
      });
      await waitFor(() => result.current.sessionState.loaded);
      expect(responseFn).toBeCalledTimes(1);
    });

    test('当会话执行成功时，会立即运行 Strategy.success 中的回调函数，哪怕组件已经提前被卸载', async () => {
      const responseFn = jest.fn();
      const { result, unmount } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(
          (d: string) =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve(d);
              }, 300);
            }),
          {
            variables: ['test'],
            strategy: Strategy.success(responseFn),
          },
        );
        return { sessionState, trigger };
      });
      await waitFor(() => result.current.sessionState.isFetching);
      unmount();
      await delay(300);
      expect(responseFn).toBeCalledTimes(1);
    });
  });

  describe('Strategy.failure 的基本用法', () => {
    test('当会话执行异常时，会立即运行 Strategy.failure 中的回调函数', async () => {
      const responseFn = jest.fn();
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery((d: string) => Promise.reject(new Error('mock error')), {
          variables: ['test'],
          strategy: Strategy.failure(responseFn),
        });
        return { sessionState, trigger };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      expect(responseFn).toBeCalledTimes(1);
    });

    test('当会话执行异常时，会立即运行 Strategy.failure 中的回调函数，哪怕组件已经提前被卸载', async () => {
      const responseFn = jest.fn();
      const { result, unmount } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(
          (d: string) =>
            new Promise((resolve, reject) => {
              setTimeout(() => {
                reject(new Error('mock error'));
              }, 300);
            }),
          {
            variables: ['test'],
            strategy: Strategy.failure(responseFn),
          },
        );
        return { sessionState, trigger };
      });
      await waitFor(() => result.current.sessionState.isFetching);
      unmount();
      await delay(300);
      expect(responseFn).toBeCalledTimes(1);
    });
  });

  describe('Strategy.atomic 的基本用法', () => {
    test('Strategy.atomic 可以保持会话原子运行，当会话正在执行时，新会话任务会加入任务队列，并在当前会话执行完后，继续执行任务队列中的任务', async () => {
      const testFn = jest.fn(
        (d: string) =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(d);
            }, 200);
          }),
      );
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.atomic({ throttle: false }),
        });
        return { sessionState, trigger };
      });
      await waitFor(() => result.current.sessionState.isFetching);
      act(() => {
        result.current.trigger();
        result.current.trigger();
      });
      await delay(630);
      expect(testFn).toBeCalledTimes(3);
    });

    test('Strategy.atomic 可以保持会话原子运行，当设置 throttle 选项为 true 或不设置该选项时，任务队列中只保留最新一次任务', async () => {
      const testFn = jest.fn(
        (d: string) =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(d);
            }, 200);
          }),
      );
      const { result } = renderEffectHook(() => {
        const [sessionState, trigger] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.atomic(),
        });
        return { sessionState, trigger };
      });
      await waitFor(() => result.current.sessionState.isFetching);
      act(() => {
        result.current.trigger();
        result.current.trigger();
      });
      await delay(630);
      expect(testFn).toBeCalledTimes(2);
    });

    test('Strategy.atomic 默认在遇见异常任务时停止运行', async () => {
      const testFn = jest.fn(
        (d: string) =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              if (d === 'error') {
                reject(new Error('mock error'));
                return;
              }
              resolve(d);
            }, 200);
          }),
      );
      const { result } = renderEffectHook(() => {
        const [sessionState, , execute] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.atomic({ throttle: false }),
        });
        return { sessionState, execute };
      });
      await waitFor(() => result.current.sessionState.isFetching);
      act(() => {
        result.current.execute('error');
        result.current.execute('data');
      });
      await delay(630);
      expect(testFn).toBeCalledTimes(2);
    });

    test('Strategy.atomic 默认在遇见异常任务时停止运行，设置 stopWhenError 选项为 false，可以让策略在异常任务结束后继续执行后续任务', async () => {
      const testFn = jest.fn(
        (d: string) =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              if (d === 'error') {
                reject(new Error('mock error'));
                return;
              }
              resolve(d);
            }, 200);
          }),
      );
      const { result } = renderEffectHook(() => {
        const [sessionState, , execute] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.atomic({ throttle: false, stopWhenError: false }),
        });
        return { sessionState, execute };
      });
      await waitFor(() => result.current.sessionState.isFetching);
      act(() => {
        result.current.execute('error');
        result.current.execute('data');
      });
      await delay(630);
      expect(testFn).toBeCalledTimes(3);
    });
  });

  describe('Strategy.cache 的基本用法', () => {
    test('Strategy.cache 可缓存会话执行结果，当会话参数与缓存参数等价时，直接返回缓存结果', async () => {
      const testFn = jest.fn(sessionCallback);
      const { result } = renderEffectHook(() => {
        const [sessionState, , execute] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.cache({ capacity: 5 }),
        });
        return { sessionState, execute };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      act(() => {
        result.current.execute('data');
      });
      const staleResult = result.current.sessionState.data;
      await waitFor(() => result.current.sessionState.round === 2);
      const staleResolveResult = result.current.sessionState.data;
      act(() => {
        result.current.execute('test');
      });
      const cacheResult = result.current.sessionState.data;
      expect([staleResult, staleResolveResult, cacheResult]).toEqual(['session:test', 'session:data', 'session:test']);
    });

    test('Strategy.cache 可缓存会话执行结果，当会话参数与缓存参数等价时，直接返回缓存结果，并继续执行会话', async () => {
      const testFn = jest.fn(sessionCallback);
      const { result } = renderEffectHook(() => {
        const [sessionState, , execute] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.cache({ capacity: 5 }),
        });
        return { sessionState, execute };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      act(() => {
        result.current.execute('data');
      });
      await waitFor(() => result.current.sessionState.round === 2);
      act(() => {
        result.current.execute('test');
      });
      await waitFor(() => result.current.sessionState.round === 3);
      expect(testFn).toBeCalledTimes(3);
    });

    test('Strategy.cache 可缓存会话执行结果，当设置 staleTime 选项时，在产生缓存记录的 staleTime 时间内，策略直接返回结果', async () => {
      const testFn = jest.fn(sessionCallback);
      const { result } = renderEffectHook(() => {
        const [sessionState, , execute] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.cache({ capacity: 5, staleTime: 60000 }),
        });
        return { sessionState, execute };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      act(() => {
        result.current.execute('data');
      });
      const staleResult = result.current.sessionState.data;
      await waitFor(() => result.current.sessionState.round === 2);
      const staleResolveResult = result.current.sessionState.data;
      act(() => {
        result.current.execute('test');
      });
      await waitFor(() => result.current.sessionState.isFetching);
      const cacheResult = result.current.sessionState.data;
      expect([staleResult, staleResolveResult, cacheResult]).toEqual(['session:test', 'session:data', 'session:test']);
    });

    test('Strategy.cache 可缓存会话执行结果，当设置 staleTime 选项时，在产生缓存记录的 staleTime 时间内，策略直接返回结果，并不再执行本次会话任务', async () => {
      const testFn = jest.fn(sessionCallback);
      const { result } = renderEffectHook(() => {
        const [sessionState, , execute] = useQuery(testFn, {
          variables: ['test'],
          strategy: Strategy.cache({ capacity: 5, staleTime: 60000 }),
        });
        return { sessionState, execute };
      });
      await waitFor(() => result.current.sessionState.round === 1);
      act(() => {
        result.current.execute('data');
      });
      await waitFor(() => result.current.sessionState.round === 2);
      act(() => {
        result.current.execute('test');
      });
      await waitFor(() => result.current.sessionState.round === 3);
      expect(testFn).toBeCalledTimes(2);
    });
  });
});
