import { Strategy, useIsFetching, useMutation, useQuery } from '@airma/react-effect';
import { waitFor } from '@testing-library/react';
import { useState } from 'react';
import { act } from '@testing-library/react-hooks';
import { delay, renderEffectHook } from '@/util';

describe('useQuery 的基本用法', () => {
  const queryCallback = (data: string) => {
    return Promise.resolve(`query:${data}`);
  };

  test('当 useQuery 拥有预设参数时，默认在组件加载后立即运行', async () => {
    const testFn = jest.fn(queryCallback);
    renderEffectHook(() => {
      const [sessionState] = useQuery(testFn, ['test']);
      return { sessionState };
    });
    await waitFor(() => {
      expect(testFn).toBeCalledTimes(1);
    });
  });

  test('当 useQuery 的预设参数变更后，默认再次运行', async () => {
    const testFn = jest.fn(queryCallback);
    const { result } = renderEffectHook(() => {
      const [param, setParam] = useState('test');
      const [sessionState] = useQuery(testFn, [param]);
      return { sessionState, update: setParam };
    });
    await waitFor(() => result.current.sessionState.round === 1);
    act(() => {
      result.current.update('data');
    });
    await waitFor(() => expect(testFn).toBeCalledTimes(2));
  });

  test('当 useQuery 的预设参数变更后，默认以变更后的预设参数再次运行', async () => {
    const testFn = jest.fn(queryCallback);
    const { result } = renderEffectHook(() => {
      const [param, setParam] = useState('test');
      const [sessionState] = useQuery(testFn, [param]);
      return { sessionState, update: setParam };
    });
    await waitFor(() => result.current.sessionState.round === 1);
    act(() => {
      result.current.update('data');
    });
    await waitFor(() => expect(testFn).toBeCalledWith('data'));
  });

  test('当 useQuery 的触发器被调用时，默认再次运行', async () => {
    const testFn = jest.fn(queryCallback);
    const { result } = renderEffectHook(() => {
      const [sessionState, trigger] = useQuery(testFn, ['test']);
      return { sessionState, trigger };
    });
    await waitFor(() => result.current.sessionState.round === 1);
    act(() => {
      result.current.trigger();
    });
    await waitFor(() => expect(testFn).toBeCalledTimes(2));
  });

  test('当 useQuery 的执行器被调用时，默认再次运行', async () => {
    const testFn = jest.fn(queryCallback);
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useQuery(testFn, ['test']);
      return { sessionState, execute };
    });
    await waitFor(() => result.current.sessionState.round === 1);
    act(() => {
      result.current.execute('data');
    });
    await waitFor(() => expect(testFn).toBeCalledTimes(2));
  });

  test('当 useQuery 的执行器被调用时，默认以执行器传入的参数再次运行', async () => {
    const testFn = jest.fn(queryCallback);
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useQuery(testFn, ['test']);
      return { sessionState, execute };
    });
    await waitFor(() => result.current.sessionState.round === 1);
    act(() => {
      result.current.execute('data');
    });
    await waitFor(() => expect(testFn).toBeCalledWith('data'));
  });

  test('当 useQuery 成功执行后，可通过 sessionState 获取最新执行成功的结果', async () => {
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useQuery(queryCallback, ['test']);
      return { sessionState, execute };
    });
    await waitFor(() => result.current.sessionState.round === 1);
    act(() => {
      result.current.execute('data');
    });
    await waitFor(() => expect(result.current.sessionState.data).toBe('query:data'));
  });

  test('当 useQuery 成功执行后，可通过 sessionState 获取最新执行成功时使用的参数', async () => {
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useQuery(queryCallback, ['test']);
      return { sessionState, execute };
    });
    await waitFor(() => result.current.sessionState.round === 1);
    act(() => {
      result.current.execute('data');
    });
    await waitFor(() => expect(result.current.sessionState.lastSuccessfulRoundVariables).toEqual(['data']));
  });

  test('useQuery 总是采用最新一次执行产生的结果', async () => {
    const testFn = (times: number) =>
      new Promise((resolve) => {
        setTimeout(
          () => {
            resolve(times);
          },
          times === 0 ? 300 : 0,
        );
      });
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useQuery(testFn, [0]);
      return { sessionState, execute };
    });
    act(() => {
      result.current.execute(1);
    });
    await delay(400);
    expect(result.current.sessionState.data).toBe(1);
  });

  test('当 useQuery 执行后，可通过 sessionState 获取当前会话的执行回合数', async () => {
    const testFn = (times: number) =>
      new Promise((resolve, reject) => {
        if (times === 1) {
          reject(new Error('mock error'));
          return;
        }
        resolve(times);
      });
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useQuery(testFn, [0]);
      return { sessionState, execute };
    });
    await waitFor(() => result.current.sessionState.round === 1);
    act(() => {
      result.current.execute(1);
    });
    await waitFor(() => expect(result.current.sessionState.round).toBe(2));
  });

  test('当 useQuery 执行失败后，可通过 sessionState 检查当前会话是否执行异常', async () => {
    const testFn = (times: number) =>
      new Promise((resolve, reject) => {
        if (times === 1) {
          reject(new Error('mock error'));
          return;
        }
        resolve(times);
      });
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useQuery(testFn, [0]);
      return { sessionState, execute };
    });
    await waitFor(() => result.current.sessionState.round === 1);
    act(() => {
      result.current.execute(1);
    });
    await waitFor(() => expect(result.current.sessionState.isError).toBe(true));
  });

  test('当 useQuery 执行失败后，可通过 sessionState 获取当前会话的异常信息', async () => {
    const testFn = (times: number) =>
      new Promise((resolve, reject) => {
        if (times === 1) {
          reject(new Error('mock error'));
          return;
        }
        resolve(times);
      });
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useQuery(testFn, [0]);
      return { sessionState, execute };
    });
    await waitFor(() => result.current.sessionState.round === 1);
    act(() => {
      result.current.execute(1);
    });
    await waitFor(() => expect(result.current.sessionState.error.message).toBe('mock error'));
  });

  test('通过使用 strategy 可以改变 useQuery 的运行特性', async () => {
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useQuery(queryCallback, {
        variables: ['test'],
        strategy: Strategy.debounce(200),
      });
      return { sessionState, execute };
    });
    act(() => {
      result.current.execute('data');
    });
    await delay(300);
    expect(result.current.sessionState.round).toBe(1);
  });

  test('当 useQuery 执行成功后，必然更新 sessionState.data 为最新成功返回的结果值', async () => {
    const { result } = renderEffectHook(() => {
      const [sessionState] = useQuery(queryCallback, ['test']);
      return { sessionState };
    });
    await waitFor(() => expect(result.current.sessionState.data).toBe('query:test'));
  });
});

describe('useMutation 的基本用法', () => {
  const queryCallback = (data: string) => {
    return Promise.resolve(`mutate:${data}`);
  };

  test('默认情况下 useMutation 需要手工调用触发会话运行', async () => {
    const testFn = jest.fn(queryCallback);
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useMutation(testFn, ['test']);
      return { sessionState, execute };
    });
    act(() => {
      result.current.execute('data');
    });
    await waitFor(() => {
      expect(testFn).toBeCalledTimes(1);
    });
  });

  test('当 useMutation 拥有默认参数时，可通过触发器，手工调用触发会话运行', async () => {
    const testFn = jest.fn(queryCallback);
    const { result } = renderEffectHook(() => {
      const [sessionState, trigger] = useMutation(testFn, ['test']);
      return { sessionState, trigger };
    });
    act(() => {
      result.current.trigger();
    });
    await waitFor(() => {
      expect(testFn).toBeCalledTimes(1);
    });
  });

  test('当 useMutation 拥有默认参数并通过触发器手工调用时，会话运行参数为默认参数', async () => {
    const testFn = jest.fn(queryCallback);
    const { result } = renderEffectHook(() => {
      const [sessionState, trigger] = useMutation(testFn, ['test']);
      return { sessionState, trigger };
    });
    act(() => {
      result.current.trigger();
    });
    await waitFor(() => {
      expect(testFn).toBeCalledWith('test');
    });
  });

  test('当 useMutation 成功执行后，可通过 sessionState 获取最新执行成功的结果', async () => {
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useMutation(queryCallback, ['test']);
      return { sessionState, execute };
    });
    act(() => {
      result.current.execute('data');
    });
    await waitFor(() => expect(result.current.sessionState.data).toBe('mutate:data'));
  });

  test('当 useMutation 成功执行后，可通过 sessionState 获取最新执行成功时使用的参数', async () => {
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useMutation(queryCallback, ['test']);
      return { sessionState, execute };
    });
    act(() => {
      result.current.execute('data');
    });
    await waitFor(() => expect(result.current.sessionState.lastSuccessfulRoundVariables).toEqual(['data']));
  });

  test('当 useMutation 执行后，可通过 sessionState 获取当前会话的执行回合数', async () => {
    const testFn = (times: number) =>
      new Promise((resolve, reject) => {
        if (times === 1) {
          reject(new Error('mock error'));
          return;
        }
        resolve(times);
      });
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useMutation(testFn, [0]);
      return { sessionState, execute };
    });
    act(() => {
      result.current.execute(1);
    });
    await waitFor(() => expect(result.current.sessionState.round).toBe(1));
  });

  test('当 useMutation 执行失败后，可通过 sessionState 检查当前会话是否执行异常', async () => {
    const testFn = (times: number) =>
      new Promise((resolve, reject) => {
        if (times === 1) {
          reject(new Error('mock error'));
          return;
        }
        resolve(times);
      });
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useMutation(testFn, [0]);
      return { sessionState, execute };
    });
    act(() => {
      result.current.execute(1);
    });
    await waitFor(() => expect(result.current.sessionState.isError).toBe(true));
  });

  test('当 useMutation 执行失败后，可通过 sessionState 获取当前会话的异常信息', async () => {
    const testFn = (times: number) =>
      new Promise((resolve, reject) => {
        if (times === 1) {
          reject(new Error('mock error'));
          return;
        }
        resolve(times);
      });
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useMutation(testFn, [0]);
      return { sessionState, execute };
    });
    act(() => {
      result.current.execute(1);
    });
    await waitFor(() => expect(result.current.sessionState.error.message).toBe('mock error'));
  });

  test('在手工出发的情况下，在 useMutation 的会话运行期，不能启动新的会话', async () => {
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useMutation(queryCallback, ['test']);
      return { sessionState, execute };
    });
    act(() => {
      result.current.execute('data');
      result.current.execute('data1');
    });
    await waitFor(() => expect(result.current.sessionState.round).toBe(1));
  });

  test('通过使用 strategy 可以改变 useMutation 的运行特性', async () => {
    const testFn = jest.fn(queryCallback);
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useMutation(testFn, {
        variables: ['test'],
        strategy: Strategy.once(),
      });
      return { sessionState, execute };
    });
    act(() => {
      result.current.execute('data');
    });
    await waitFor(() => result.current.sessionState.round === 1);
    act(() => {
      result.current.execute('data1');
    });
    await delay(200);
    expect(testFn).toBeCalledTimes(1);
  });
});

describe('useIsFetching 的基本用法', () => {
  const mutateCallback = (data: string) => {
    return Promise.resolve(`mutate:${data}`);
  };

  test('useIsFetching 可以获知系统中是否有会话正在工作', async () => {
    const { result } = renderEffectHook(() => {
      const [sessionState, , execute] = useMutation(mutateCallback, ['test']);
      return { sessionState, execute };
    });
    const { result: result1 } = renderEffectHook(() => {
      const isFetching = useIsFetching();
      return { isFetching };
    });
    act(() => {
      result.current.execute('data');
    });
    await waitFor(() => expect(result1.current.isFetching).toBe(true));
  });

  test('useIsFetching 可以获知指定会话中，是否有会话正在工作', async () => {
    const { result } = renderEffectHook(() => {
      const [mutateSessionState, , execute] = useMutation(mutateCallback, ['test']);
      const [querySessionState] = useQuery(() => delay(300), []);
      const isFetching = useIsFetching(mutateSessionState, querySessionState);
      return { mutateSessionState, execute, isFetching };
    });
    act(() => {
      result.current.execute('data');
    });
    await delay(200);
    expect([result.current.mutateSessionState.isFetching, result.current.isFetching]).toEqual([false, true]);
  });
});
