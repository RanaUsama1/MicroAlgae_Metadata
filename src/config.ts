// Backend API Configuration
// Change this to your Render backend URL after deployment
export const BACKEND_API_URL = (import.meta as any).env?.VITE_BACKEND_URL || '';

// Use backend API or direct NCBI calls
// Default to FALSE (direct NCBI) if no backend URL is configured
export const USE_BACKEND = !!(import.meta as any).env?.VITE_BACKEND_URL && 
                          (import.meta as any).env?.VITE_USE_BACKEND !== 'false';
