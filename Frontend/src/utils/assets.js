export const getAssetUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  const trimmedPath = path.trim();
  if (trimmedPath.startsWith('http')) return trimmedPath;
  
  const configuredBaseUrl = import.meta.env.VITE_API_URL || '';
  const fallbackBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5003';
  const baseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/api$/, '').replace(/\/$/, '');
    
  // Normalize slashes and remove any leading slashes
  let cleanPath = trimmedPath.replace(/\\/g, '/').replace(/^\/+/, '');
  
  // If it's already an uploads/ or assets/ path, don't prefix it again
  if (!cleanPath.startsWith('uploads/') && !cleanPath.startsWith('assets/')) {
    cleanPath = `uploads/${cleanPath}`;
  }
  
  return `${baseUrl}/${cleanPath}`;
};
