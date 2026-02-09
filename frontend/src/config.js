
// Centralized API Configuration
// Logic:
// 1. Use VITE_API_URL if set (highest priority)
// 2. In Development: Default to '' to allow Vite proxy to handle requests to localhost
// 3. In Production: Default to the known Render Backend URL if env var is missing

export const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://kitneka-backend.onrender.com');

console.log(`API Configuration loaded. Environment: ${import.meta.env.MODE}, API_BASE: ${API_BASE || '(relative/proxy)'}`);
