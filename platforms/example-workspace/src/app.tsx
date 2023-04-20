import React, { memo, useEffect, useState } from 'react';
import {
  createKey,
  useControlledModel,
  useModel,
  useRefreshModel,
  useSelector
} from '@airma/react-state';
import { client as cli } from '@airma/restful';
import {
  createSessionKey,
  provide,
  Strategy,
  useMutation,
  useQuery,
  useSession
} from '@airma/react-effect';
import { pick } from 'lodash';

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

const Info = memo(() => {
  const [{ isFetching, isError, error }] = useSession(fetchSessionKey);
  if (isFetching) {
    return <span>fetching...</span>;
  }
  return isError ? <span style={{ color: 'red' }}>{error}</span> : null;
});

const Creating = memo(({ onClose }: { onClose: () => any }) => {
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

  const [, query] = useSession(fetchSessionKey);

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
});

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
  creating: false
});

const Condition = memo(() => {
  const q = { ...defaultCondition, name: 'Mr' };
  const { displayQuery, create, changeDisplay, query } = useModel(
    conditionKey,
    {
      valid: q,
      display: q,
      creating: false
    }
  );

  const [{ isFetching }] = useSession(fetchSessionKey, 'query');

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

function Child() {
  const add = useSelector(testKey, s => s.add);
  useEffect(() => {
    add();
  }, []);
  return <button onClick={add}>test</button>;
}

function Child1({ reset }: { reset: () => number }) {
  useEffect(() => {
    reset();
  }, []);
  return <button onClick={reset}>test</button>;
}

export default provide({ conditionKey, fetchSessionKey, testKey })(
  function App() {
    const { validQuery, creating, cancel } = useSelector(conditionKey, s =>
      pick(s, 'validQuery', 'creating', 'cancel')
    );

    const [{ data }] = useQuery(fetchSessionKey, {
      variables: [validQuery],
      defaultData: [],
      strategy: Strategy.success((a, s) => console.log(a, s))
    });

    const [s, setState] = useState(3);

    const { state, reset } = useRefreshModel(
      testKey.pipe((d: number) => ({
        state: d,
        reset() {
          return 0;
        }
      })),
      s
    );

    return (
      <div style={{ padding: '12px 24px' }}>
        <Condition />
        <div style={{ marginTop: 8, marginBottom: 8, minHeight: 36 }}>
          {creating ? <Creating onClose={cancel} /> : <Info />}
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
        <div>{state}</div>
        <button onClick={() => setState(s => s + 1)}>controll</button>
        <Child />
        <Child1 reset={reset} />
      </div>
    );
  }
);
