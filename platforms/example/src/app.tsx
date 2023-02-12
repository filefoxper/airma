import React, { memo, useEffect, useState } from 'react';
import {
  factory,
  useModel,
  useControlledModel,
  useSelector,
  shallowEqual,
  ModelProvider
} from '@airma/react-state';
import { client } from '@airma/restful';
import {
  ResponseType,
  useMutation,
  useQuery,
  useSideEffect
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
      const { user, changeUsername, changeName } = useModel(
          (userData: Omit<User, 'id'>) => {
            return {
              user: userData,
              changeUsername(username: string) {
                return { ...userData, username };
              },
              changeName(name: string) {
                return { ...userData, name };
              }
            };
          },
          { name: '', username: '', age: 10 }
      );

      const [r, save] = useMutation(
          (u: Omit<User, 'id'>) => rest('/api/user').setBody(u).post<null>(),
          {
            repeatable: false,
            after: onSubmit
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
              <button
                  type="button"
                  style={{ marginLeft: 12 }}
                  onClick={() => save(user)}
              >
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

export default function App() {
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

  const [{ data = [], isFetching, error }, fetch] = useQuery(
      () => rest('/api/user').path('list').setParams(validQuery).get<User[]>(),
      { deps: [validQuery] }
  );

  const [second, execute] = useSideEffect(response => {
    const id = window.setInterval(() => {
      response(s => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, 0);

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
              <Creating onSubmit={submit} onCancel={cancel} />
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
        <div style={{ marginTop: 24 }}>used time: {second || 0}</div>
      </div>
  );
}
