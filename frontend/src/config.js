// Environment configurations
const isProduction = process.env.NODE_ENV === 'production';

// Production backend URL (deployed backend URL)
// Replace with your actual Render.com URL
const PROD_API_URL = 'https://car-park-queue-api.onrender.com/api';
const PROD_SOCKET_URL = 'https://car-park-queue-api.onrender.com';

// Development backend URL (local)
const DEV_API_URL = 'http://localhost:5000/api';
const DEV_SOCKET_URL = 'http://localhost:5000';

// Export the appropriate URLs based on environment
export const API_URL = isProduction ? PROD_API_URL : DEV_API_URL;
export const SOCKET_URL = isProduction ? PROD_SOCKET_URL : DEV_SOCKET_URL;

// Other configuration settings
export const APP_CONFIG = {
  maxParkingSpaces: 10,
  defaultReservedTime: 10, // minutes
  refreshInterval: 1000 // milliseconds
};
