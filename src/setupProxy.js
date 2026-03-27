const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const target = 'http://localhost:8080';
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
  // Запросы к загруженным файлам (картинки услуг) проксируем на бэкенд
  app.use(
    '/uploads',
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
  // Некоторые инсталляции отдают статику по /upload (без s)
  app.use(
    '/upload',
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
};
