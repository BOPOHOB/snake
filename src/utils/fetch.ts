import { conditionally } from './conditionally';

export const apiUrl = process.env.REACT_APP_API_URL;
export const apiVersion = process.env.REACT_APP_API_VERSION;

const bearer : { current: null | string } = { current: null };

export const setBearerToken = (token: string) => {
  bearer.current = token;
};

export const fetchAPI = async (url: string, method: 'POST' | 'GET' | 'DELETE' | 'PATCH' = 'GET', body?: any, headers?: any) => {
  const response = await fetch(`${apiUrl}/${apiVersion}/${url}`, {
    method,
    body: body instanceof FormData ? body : JSON.stringify(body),
    headers: {
      ...conditionally('Authorization', bearer.current !== null, `Bearer ${bearer.current}`),
      ...conditionally('Content-Type', !!body && !(body instanceof FormData), 'application/json'),
      ...headers
    }
  });
  return await response.json();
};
