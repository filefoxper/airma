import React, { memo, Suspense, useEffect, useMemo, useState } from 'react';
import {
  createKey,
  useControlledModel,
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
import { ErrorSessionState, useLazyComponent } from '@airma/react-effect';

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
  rest('/api/user')
    .path('list')
    .setParams(validQuery)
    .get<User[]>()
    .then(
      d =>
        new Promise<User[]>(resolve => {
          setTimeout(() => {
            resolve(d);
          }, 2000);
        })
    );

export const fetchSessionKey = createSessionKey(userQuery);

const test = (state: number) => {
  return {
    state,
    add() {
      console.log('run', state + 1);
      return state + 1;
    }
  };
};

const testKey = createKey(test, 0);

const conditionModel = (query: Query) => {
  const handleQuery = () => {
    return { ...query, valid: { ...query.display } };
  };
  return {
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
};

const conditionKey = createKey(conditionModel, {
  valid: defaultCondition,
  display: defaultCondition,
  creating: true
});

const Info = memo(() => {
  const [{ isFetching, isError, error }] = useSession(fetchSessionKey);
  if (isFetching) {
    return <span>fetching...</span>;
  }
  return isError ? <span style={{ color: 'red' }}>{error}</span> : null;
});

const Creating = memo(
  ({ onClose, error }: { error?: ErrorSessionState; onClose: () => any }) => {
    const creating = useSelector(conditionKey, s => s.creating);
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

    useEffect(() => {
      console.log('updating...', creating);
      return () => {
        console.log('unmounting...', creating);
      };
    }, [creating]);

    const [{ variables }, query] = useSession(fetchSessionKey);

    const [q] = variables ?? [];

    console.log(q?.age);

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
  const { displayQuery, create, changeDisplay, query } = useModel(conditionKey);

  const session = useQuery(fetchSessionKey, {
    variables: [q],
    defaultData: [],
    strategy: Strategy.effect.success((a, s) =>
      console.log('effect strategy', a, s)
    )
  });

  const [state, conditionTrigger] = session;

  const [{ isFetching }, trigger] = useSession(fetchSessionKey, 'query');

  useResponse(s => {
    if (s.isError) {
      console.log('rsp', s.error);
      return;
    }
    console.log('rsp', s.data?.length);
  }, state);

  useResponse.success((d, s) => {
    const [{ name }] = s.variables;
    console.log(
      'rsp s',
      d.map(u => u.name)
    );
  }, state);

  useResponse.error(e => {
    console.log('rsp e', e);
  }, state);

  useIsFetching(state);

  const handleTrigger = () => {
    conditionTrigger();
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

export default provide({ conditionKey, fetchSessionKey, testKey })(
  function App() {
    const { validQuery, creating, cancel } = useSelector(conditionKey, s =>
      pick(s, 'validQuery', 'creating', 'cancel')
    );

    const querySession = useQuery(fetchSessionKey, {
      variables: [validQuery],
      defaultData: [],
      strategy: Strategy.success((a, s) => console.log(a, s))
    });

    const [{ data, variables }, t] = querySession;

    const [q] = variables ?? [];

    console.log(q?.name);

    const Creator = useLazyComponent(
      () => Promise.resolve(Creating) as Promise<typeof Creating>,
      querySession
    );

    useUpdate(
      ([d]) => {
        console.log('update...', d);
      },
      [data, 1]
    );

    return (
      <div style={{ padding: '12px 24px' }}>
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
  }
);
