const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('janwariDesktop', {
  apiBaseUrl: process.env.JANWARI_API_BASE_URL || '',
  preferHostedApi: process.env.JANWARI_PREFER_HOSTED_API === 'true',
  runtimeMode: process.env.JANWARI_RUNTIME_MODE || 'embedded-backend',
});
