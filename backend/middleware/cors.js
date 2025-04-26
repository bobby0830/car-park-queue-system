// CORS 配置中间件
const allowedOrigins = [
  // Vercel 域名 - 添加所有可能的 Vercel 预览域名
  'https://car-park-queue-system-i9iyaumj6-bobby0830s-projects.vercel.app',
  'https://car-park-queue-system-8l8w8df97-bobby0830s-projects.vercel.app',
  'https://car-park-queue-system.vercel.app',
  // 开发环境
  'http://localhost:3000',
  // 本地测试用
  'http://localhost:5000',
  // 通配符 (允许所有域名 - 仅在开发/测试环境使用)
  'https://*.vercel.app',
  '*'
];

const corsOptions = {
  origin: function (origin, callback) {
    // 允许没有 origin 的请求（如移动应用或 Postman）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf('*') !== -1 || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS 策略阻止了该请求'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

module.exports = {
  corsOptions,
  allowedOrigins
};
