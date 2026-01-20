import callApi from './callApi';
import urls from './urls.json';

export const verifyEmail = async (token: string) => {
  const response = await callApi(
    `http://${urls.auth.verifyEmail}`,
    {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
};
