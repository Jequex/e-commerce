const callApi = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let msg = errorData.message || (typeof errorData.error === 'string' ? errorData.error : errorData.error?.message);
      if (!msg && errorData.error?.details) {
        msg = Array.isArray(errorData.error.details)
          ? errorData.error.details.map((d: any) => d.message || d.path?.join('.')).join(', ')
          : JSON.stringify(errorData.error.details);
      }
      throw new Error(msg || 'API call failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
};

export default callApi;