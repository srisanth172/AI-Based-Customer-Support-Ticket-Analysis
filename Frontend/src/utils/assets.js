export const getAssetUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  const trimmedPath = path.trim();
  if (trimmedPath.startsWith('http') || trimmedPath.startsWith('data:')) return trimmedPath;
  
  const configuredBaseUrl = import.meta.env.VITE_API_URL || '';
  const fallbackBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5003';
  const baseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/api$/, '').replace(/\/$/, '');

  return `${baseUrl}/${trimmedPath.replace(/\\/g, '/').replace(/^\/+/, '')}`;
};
