export const getAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  const configuredBaseUrl = import.meta.env.VITE_API_URL || '';
  const fallbackBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5003';
  const baseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/api$/, '').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  return `${baseUrl}/${cleanPath}`;
};
