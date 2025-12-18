const callApi = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API call failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
};

export default callApi;