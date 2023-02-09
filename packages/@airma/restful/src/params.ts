import type { ParamsProcessor } from '../index';

const combineKey = (parentKey: string | undefined, key: string): string =>
  parentKey ? `${parentKey}[${key}]` : key;

const stringifyObject = (
  params: Record<string, any>,
  parentKey?: string
): Array<[string, string]> => {
  const keys = Object.keys(params);
  const result: Array<[string, string]> = [];
  keys.forEach(key => {
    const value = params[key];
    if (value === undefined || typeof value === 'function') {
      return;
    }
    const combinedKey = combineKey(parentKey, key);
    if (typeof value === 'object' && value !== null) {
      const subs = stringifyObject(value, combinedKey);
      result.push(...subs);
      return;
    }
    result.push([
      combinedKey,
      typeof value === 'string' ? value : JSON.stringify(value)
    ]);
  });
  return result;
};

const toUrl = (source: Array<[string, string]>) => {
  const target: Record<string, string> = {};
  source.forEach(([key, value]) => {
    target[key] = value;
  });
  return Object.keys(target)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(target[k])}`)
    .join('&');
};

const simpleParamsProcessor = (): ParamsProcessor => {
  return {
    stringify(params: Record<string | number, any>): string {
      const result = stringifyObject(params);
      return toUrl(result);
    },
    parse(queryString: string): Record<string, string> {
      const pairs = queryString.split('&');
      const resource = pairs
        .map(data => {
          const index = data.indexOf('=');
          return { index, data };
        })
        .filter(({ index }) => index > -1)
        .map(({ data, index }): [string, string] => {
          const key = data.slice(0, index);
          const value = data.slice(index + 1);
          return [key, decodeURIComponent(value)];
        });
      const result: Record<string, string> = {};
      resource.forEach(([k, v]) => {
        result[k] = v;
      });
      return result;
    }
  };
};

export { simpleParamsProcessor };
