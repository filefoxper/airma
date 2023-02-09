import type { RestConfig } from './type';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest'
};

const defaultRestConfig: RestConfig = {
  headers: defaultHeaders
};

export { defaultHeaders, defaultRestConfig };
