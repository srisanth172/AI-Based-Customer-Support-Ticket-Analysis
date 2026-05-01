export const errorHandler = (error) => {
  const message =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong';

  return {
    message,
    status: error?.response?.status,
    data: error?.response?.data,
    original: error,
  };
};
