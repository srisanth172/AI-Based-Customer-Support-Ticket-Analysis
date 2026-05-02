export const getAssetUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('http')) return path;
  
  const configuredBaseUrl = import.meta.env.VITE_API_URL || '';
  const fallbackBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5003';
  const baseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/api$/, '').replace(/\/$/, '');
    
  // Normalize slashes and remove any leading slashes
  let cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  
  // Ensure the path includes the 'uploads/' prefix if it's a relative path to an uploaded file
  if (!cleanPath.startsWith('uploads/') && !cleanPath.startsWith('assets/')) {
    cleanPath = `uploads/${cleanPath}`;
  }
  
  return `${baseUrl}/${cleanPath}`;
};
