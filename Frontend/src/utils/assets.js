export const getAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5003').replace(/\/api$/, '').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
};
