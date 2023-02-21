import React, { memo, useEffect, useState } from 'react';
import {
  factory,
  useModel,
  useControlledModel,
  useSelector,
  shallowEqual,
  ModelProvider,
  withModelProvider
} from '@airma/react-state';
import { client } from '@airma/restful';
import {
  asyncEffect,
  Strategy,
  useAsyncEffect,
  useMutation,
  useQuery,
  withEffectProvider
} from '@airma/react-effect';

const { rest } = client(c => ({
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

const fetchFactory = asyncEffect(userQuery);

const models = (userData: Omit<User, 'id'>) => {
  return {
    user: userData,
    changeUsername(username: string) {
      return { ...userData, username };
    },
    changeName(name: string) {
      return { ...userData, name };
    }
  };
};

const Info = memo(
  ({ isFetching, error }: { isFetching: boolean; error: any }) => {
    if (isFetching) {
      return <span>fetching...</span>;
    }
    return error ? <span style={{ color: 'red' }}>{error}</span> : null;
  }
);

const Creating = memo(
  ({ onSubmit, onCancel }: { onSubmit: () => any; onCancel: () => any }) => {
    const { user, changeUsername, changeName } = useModel(models, {
      name: '',
      username: '',
      age: 10
    });

    const [{ data }, launch] = useAsyncEffect(fetchFactory);

    const [r, save] = useMutation(
      (u: Omit<User, 'id'>) =>
        rest('/api/user')
          .setBody(u)
          .post<null>()
          .then(() => true),
      {
        variables: [user],
        strategy: [Strategy.debounce({ time: 300 }), Strategy.once()]
      }
    );

    useEffect(() => {
      if (!r.data) {
        return;
      }
      launch();
      // onSubmit();
    }, [r]);

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
          <button type="button" style={{ marginLeft: 8 }} onClick={onCancel}>
            cancel
          </button>
        </div>
      </div>
    );
  }
);

export default withEffectProvider(fetchFactory)(function App() {
  const {
    displayQuery,
    validQuery,
    creating,
    create,
    submit,
    cancel,
    changeDisplay,
    query
  } = useModel(
    (query: Query) => {
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
    },
    { valid: defaultCondition, display: defaultCondition, creating: false }
  );

  const [{ data = [], isFetching, error }, fetch] = useQuery(fetchFactory, [
    validQuery
  ]);

  return (
    <div style={{ padding: '12px 24px' }}>
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
        <button type="button" style={{ marginLeft: 8 }} onClick={create}>
          create
        </button>
      </div>
      <div style={{ marginTop: 8, marginBottom: 8, minHeight: 36 }}>
        {creating ? (
          <Creating onSubmit={cancel} onCancel={cancel} />
        ) : (
          <Info isFetching={isFetching} error={error} />
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
