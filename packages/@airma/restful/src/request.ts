import { ErrorResponse, RequestConfig, ResponseData } from './type';
import { defaultHeaders } from './constant';
import { simpleParamsProcessor } from './params';

function request<T>(
  input: string,
  config: RequestConfig
): Promise<ResponseData<T>> {
  function parseConfig(c: RequestConfig) {
    const { body, headers = defaultHeaders, method = 'GET' } = c;
    const {
      params,
      defaultParams,
      paramsProcessor,
      responseInterceptor,
      ...d
    } = c;
    const fetchHeaders = headers;
    if (method === 'GET' || body == null) {
      return { ...d, headers: fetchHeaders, body: null };
    }
    return { ...d, headers: fetchHeaders, body: JSON.stringify(body) };
  }

  function getResponseData(c: RequestConfig) {
    const { responseType } = c;

    function autoProcessResponse(response: Response) {
      const cloned = response.clone();
      return response.json().then(
        d => d,
        () => cloned.text()
      );
    }

    return function processResponse(response: Response): Promise<ResponseData> {
      const { ok, status, headers } = response;
      const dataPromise: Promise<any> = responseType
        ? response[responseType]()
        : autoProcessResponse(response);
      if (ok) {
        return dataPromise.then(data => ({
          data,
          status,
          headers,
          isError: false
        }));
      }
      return dataPromise.then(data => ({
        error: data,
        data,
        headers,
        status,
        networkError: false,
        isError: true
      }));
    };
  }

  const { paramsProcessor } = config;
  const { parse, stringify } =
    typeof paramsProcessor === 'function'
      ? paramsProcessor()
      : simpleParamsProcessor();
  const queryFix = input.indexOf('?');
  const pathname = queryFix > -1 ? input.slice(0, queryFix) : input;
  const urlParamString = queryFix > -1 ? input.slice(queryFix + 1) : '';
  const urlParams = parse(urlParamString);
  const { params = {}, defaultParams = {} } = config;
  const queryParams = { ...defaultParams, ...urlParams, ...params };
  const search = stringify(queryParams);
  return fetch(
    search.trim() ? `${pathname}?${search.trim()}` : pathname,
    parseConfig(config)
  ).then(
    response => {
      return getResponseData(config)(response);
    },
    error => {
      return {
        status: null,
        data: error,
        error,
        networkError: true,
        isError: true
      } as ErrorResponse;
    }
  );
}

export { request };
