// Environment configurations
// 强制使用生产环境 URL（在 Vercel 部署时）
const isVercel = process.env.VERCEL === '1' || window.location.hostname.includes('vercel.app');
const isProduction = process.env.NODE_ENV === 'production' || isVercel;

// 输出环境检测信息，帮助调试
console.log('Environment detection:', { 
  isProduction, 
  isVercel, 
  hostname: window.location.hostname,
  NODE_ENV: process.env.NODE_ENV
});

// Production backend URL (deployed backend URL)
// 确保使用正确的 Render.com URL
const PROD_API_URL = 'https://car-park-queue-system.onrender.com/api';
const PROD_SOCKET_URL = 'https://car-park-queue-system.onrender.com';

// Development backend URL (local)
const DEV_API_URL = 'http://localhost:5000/api';
const DEV_SOCKET_URL = 'http://localhost:5000';

// Export the appropriate URLs based on environment
// 如果运行在 Vercel 上，始终使用生产环境 URL
export const API_URL = isProduction ? PROD_API_URL : DEV_API_URL;
export const SOCKET_URL = isProduction ? PROD_SOCKET_URL : DEV_SOCKET_URL;

// Other configuration settings
export const APP_CONFIG = {
  maxParkingSpaces: 10,
  defaultReservedTime: 10, // minutes
  refreshInterval: 1000 // milliseconds
};
