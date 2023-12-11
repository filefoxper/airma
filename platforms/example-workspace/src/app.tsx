import React, { memo, Suspense, useEffect, useMemo, useState } from 'react';
import {
  createKey,
  useModel,
  useSelector,
  createSessionKey,
  provide,
  Strategy,
  useIsFetching,
  useMutation,
  useQuery,
  useSession,
  useUpdate,
  useResponse
} from '@airma/react-hooks';
import { client as cli } from '@airma/restful';
import { pick } from 'lodash';
import {
  ErrorSessionState,
  session,
  useLazyComponent
} from '@airma/react-effect';
import { model, ModelContext } from '@airma/react-state';

const { rest } = cli(c => ({
  ...c,
  headers: { ...c.headers, yige: 'yige' }
}));

type User = {
  id: string;
  name: string;
  username: string;
  age: number;
};

type Condition = {
  name: string;
  username: string;
  age?: string;
};

type Query = {
  display: Condition;
  valid: Condition;
  creating: boolean;
};

const defaultCondition: Condition = {
  name: '',
  username: '',
  age: undefined
};

const userQuery = (validQuery: Condition) =>
  rest('/api/user').path('list').setParams(validQuery).get<User[]>();

export const fetchSession = session(userQuery, 'query').store();

const test = model((state: number) => {
  return {
    state,
    add() {
      return state + 1;
    }
  };
}).store(0);

const store = model((query: Query, c) => {
  const handleQuery = () => {
    return { ...query, valid: { ...query.display } };
  };
  const queryData = c.memo(() => {
    return { ...query.valid };
  }, [query.valid]);
  return {
    queryData,
    displayQuery: query.display,
    validQuery: query.valid,
    creating: query.creating,
    create() {
      return { ...query, creating: true };
    },
    submit() {
      return { ...query, ...handleQuery(), creating: false };
    },
    cancel() {
      return { ...query, creating: false };
    },
    changeDisplay(display: Partial<Condition>) {
      return { ...query, display: { ...query.display, ...display } };
    },
    query: handleQuery
  };
}).store({
  valid: defaultCondition,
  display: defaultCondition,
  creating: false
});

const Info = memo(() => {
  const [{ isFetching, isError, error }] = fetchSession.useSession();
  if (isFetching) {
    return <span>fetching...</span>;
  }
  return isError ? <span style={{ color: 'red' }}>{error}</span> : null;
});

const Creating = memo(
  ({ onClose, error }: { error?: ErrorSessionState; onClose: () => any }) => {
    const creating = store.useSelector(s => s.creating);
    const { user, changeUsername, changeName } = useModel(
      (userData: Omit<User, 'id'>) => {
        return {
          user: userData,
          changeUsername(username: string) {
            return { ...userData, username };
          },
          changeName(name: string) {
            return { ...userData, name };
          },
          update() {
            return { ...userData };
          }
        };
      },
      {
        name: '',
        username: '',
        age: 10
      }
    );

    const [{ variables }, query] = fetchSession.useSession();

    const [q] = variables ?? [];

    const [, save] = useMutation(
      (u: Omit<User, 'id'>) =>
        rest('/api/user')
          .setBody(u)
          .post<null>()
          .then(() => true),
      {
        variables: [user],
        strategy: [
          Strategy.once(),
          Strategy.success(() => {
            query();
            onClose();
          })
        ]
      }
    );

    return (
      <div>
        <div>
          <input
            type="text"
            value={user.name}
            placeholder="input name"
            onChange={e => changeName(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <input
            type="text"
            value={user.username}
            placeholder="input username"
            onChange={e => changeUsername(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="button" style={{ marginLeft: 12 }} onClick={save}>
            submit
          </button>
          <button type="button" style={{ marginLeft: 8 }} onClick={onClose}>
            cancel
          </button>
        </div>
      </div>
    );
  }
);

const Condition = memo(({ parentTrigger }: { parentTrigger: () => void }) => {
  const q = useMemo(() => ({ ...defaultCondition, name: 'Mr' }), []);
  const { displayQuery, create, changeDisplay, query } = store.useModel();

  const [{ isFetching }, trigger] = fetchSession.useSession();

  const handleTrigger = () => {
    parentTrigger();
  };

  return (
    <div>
      <span>name:</span>
      <input
        type="text"
        value={displayQuery.name}
        onChange={e => changeDisplay({ name: e.target.value })}
      />
      <span style={{ marginLeft: 12 }}>username:</span>
      <input
        type="text"
        value={displayQuery.username}
        onChange={e => changeDisplay({ username: e.target.value })}
      />
      <span style={{ marginLeft: 12 }}>age:</span>
      <input
        type="text"
        value={displayQuery.age}
        onChange={e => changeDisplay({ age: e.target.value })}
      />
      <button type="button" style={{ marginLeft: 12 }} onClick={query}>
        query
      </button>
      <button type="button" style={{ marginLeft: 12 }} onClick={trigger}>
        trigger
      </button>
      <button type="button" style={{ marginLeft: 12 }} onClick={handleTrigger}>
        manual
      </button>
      <button
        type="button"
        disabled={isFetching}
        style={{ marginLeft: 8 }}
        onClick={create}
      >
        create
      </button>
    </div>
  );
});

export default fetchSession
  .with(store)
  .with(test)
  .provideTo(function App() {
    const { queryData, creating, cancel } = store.useSelector(s =>
      pick(s, 'queryData', 'creating', 'cancel')
    );

    const test = useMemo(() => {
      console.log('change...', queryData);
      return queryData;
    }, [queryData]);

    const querySession = fetchSession.useQuery({
      variables: [queryData],
      defaultData: [],
      strategy: [
        Strategy.debounce({ duration: 500 }),
        Strategy.response.success((a, s) => {
          const [v] = s.variables;
          console.log('name', v.name);
        })
      ]
    });

    const [{ data, variables }, t] = querySession;

    const [q] = variables ?? [];

    const Creator = useLazyComponent(
      () => Promise.resolve(Creating) as Promise<typeof Creating>,
      querySession
    );

    return (
      <div style={{ padding: '12px 24px', overflowY: 'auto', height: '100vh' }}>
        <Condition parentTrigger={t} />
        <div style={{ marginTop: 8, marginBottom: 8, minHeight: 36 }}>
          {creating ? (
            <Suspense>
              <Creator onClose={cancel} />
            </Suspense>
          ) : (
            <Info />
          )}
        </div>
        <div>
          {data.map(user => (
            <div key={user.id} style={{ padding: '4px 0' }}>
              <span style={{ marginRight: 12 }}>name: {user.name}</span>
              <span style={{ marginRight: 12 }}>username: {user.username}</span>
              <span style={{ marginRight: 12 }}>age: {user.age}</span>
            </div>
          ))}
        </div>
      </div>
    );
  });
