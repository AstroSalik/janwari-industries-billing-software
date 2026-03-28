const { app, BrowserWindow, utilityProcess, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow;
let backendProcess;

const getAssetPath = (...paths) => {
  return path.join(app.getAppPath(), ...paths);
};

const resolveEnvPath = () => {
  const candidates = [
    path.join(process.resourcesPath, '.env'),
    path.join(app.getAppPath(), '.env'),
    path.join(process.cwd(), '.env'),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
};

const getRuntimeConfigPath = () => path.join(app.getPath('userData'), 'config.json');
const getBundledConfigPath = () => path.join(app.getAppPath(), 'electron', 'config.default.json');

const readJsonFile = (filePath) => {
  if (!fs.existsSync(filePath)) return null;

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Failed to parse JSON at ${filePath}:`, error);
    return null;
  }
};

const writeJsonFile = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const generateSecret = () => crypto.randomBytes(32).toString('hex');

const deriveBackendErrorMessage = (logFile, runtimeConfigPath) => {
  const logText = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';

  if (logText.includes('ENOTFOUND')) {
    return [
      'The laptop could not resolve the cloud database hostname.',
      '',
      'This is usually a DNS or internet issue on that machine or network.',
      `You can verify runtime settings here: ${runtimeConfigPath}`,
      `You can review logs here: ${logFile}`,
    ].join('\n');
  }

  if (logText.includes('DATABASE_URL is missing')) {
    return [
      'DATABASE_URL is missing from runtime configuration.',
      '',
      `Open and fix: ${runtimeConfigPath}`,
    ].join('\n');
  }

  return `The server process exited unexpectedly.\nCheck logs at: ${logFile}`;
};

const ensureRuntimeConfig = () => {
  const runtimeConfigPath = getRuntimeConfigPath();
  const bundledConfigPath = getBundledConfigPath();
  const bundledConfig = readJsonFile(bundledConfigPath) || {};
  const existingConfig = readJsonFile(runtimeConfigPath) || {};

  const mergedConfig = {
    port: '3000',
    defaultAdminUsername: 'admin',
    defaultAdminPassword: 'janwari2024',
    ...bundledConfig,
    ...existingConfig,
  };

  if (!mergedConfig.jwtSecret) {
    mergedConfig.jwtSecret = generateSecret();
  }

  writeJsonFile(runtimeConfigPath, mergedConfig);

  return {
    runtimeConfigPath,
    bundledConfigPath,
    config: mergedConfig,
  };
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    title: "Janwari Industries Billing",
    backgroundColor: '#0F1117'
  });

  mainWindow.maximize();
  
  if (app.isPackaged) {
    // In production, load the built index.html from client/dist
    mainWindow.loadFile(getAssetPath('client', 'dist', 'index.html'));
  } else {
    // In dev, load Vite's local server
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      setTimeout(() => {
        if (mainWindow) mainWindow.loadURL('http://localhost:5173').catch(console.error);
      }, 3000);
    });
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  const appPath = app.getAppPath();
  const serverDir = path.join(appPath, 'server');
  
  if (app.isPackaged) {
    const userDataPath = app.getPath('userData');
    const { runtimeConfigPath, bundledConfigPath, config } = ensureRuntimeConfig();
    const useHostedApi = Boolean(config.preferHostedApi && config.apiBaseUrl);
    const runtimeMode = useHostedApi ? 'hosted-api' : 'embedded-backend';

    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(config.port || '3000'),
      DATABASE_URL: config.databaseUrl || process.env.DATABASE_URL || '',
      CLAUDE_API_KEY: config.claudeApiKey || process.env.CLAUDE_API_KEY || '',
      JWT_SECRET: config.jwtSecret,
      DEFAULT_ADMIN_USERNAME: config.defaultAdminUsername || 'admin',
      DEFAULT_ADMIN_PASSWORD: config.defaultAdminPassword || 'janwari2024',
      JANWARI_API_BASE_URL: config.apiBaseUrl || '',
      JANWARI_PREFER_HOSTED_API: String(Boolean(config.preferHostedApi)),
      JANWARI_RUNTIME_MODE: runtimeMode,
    };

    if (!useHostedApi && !env.DATABASE_URL) {
      dialog.showErrorBox(
        'Configuration Error',
        `DATABASE_URL is missing.\nOpen this file and add the cloud database settings:\n${runtimeConfigPath}`
      );
      app.quit();
      return;
    }

    if (!useHostedApi) {
      // 1. Launch Backend using utilityProcess (Production)
      try {
        let backendEntry = getAssetPath('server', 'dist', 'src', 'index.js');
        
        if (!fs.existsSync(backendEntry)) {
          backendEntry = getAssetPath('server', 'dist', 'index.js');
        }
        
        const logFile = path.join(userDataPath, 'backend.log');
        
        fs.writeFileSync(logFile, `Backend start at ${new Date().toISOString()}\n`);
        fs.appendFileSync(logFile, `App Path: ${app.getAppPath()}\n`);
        fs.appendFileSync(logFile, `Resources Path: ${process.resourcesPath}\n`);
        fs.appendFileSync(logFile, `Runtime config path: ${runtimeConfigPath}\n`);
        fs.appendFileSync(logFile, `Bundled config path: ${bundledConfigPath}\n`);
        fs.appendFileSync(logFile, `Runtime mode: ${runtimeMode}\n`);
        fs.appendFileSync(logFile, `DATABASE_URL present: ${env.DATABASE_URL ? 'yes' : 'no'}\n`);
        fs.appendFileSync(logFile, `CLAUDE_API_KEY present: ${env.CLAUDE_API_KEY ? 'yes' : 'no'}\n`);
        fs.appendFileSync(logFile, `Resolved backend entry: ${backendEntry}\n`);
        fs.appendFileSync(logFile, `Entry exists on disk: ${fs.existsSync(backendEntry)}\n`);

        backendProcess = utilityProcess.fork(backendEntry, [], {
          env,
          stdio: 'pipe'
        });

        backendProcess.stdout.on('data', (data) => {
          fs.appendFileSync(logFile, data);
        });

        backendProcess.stderr.on('data', (data) => {
          fs.appendFileSync(logFile, `ERROR: ${data}`);
        });

        backendProcess.on('exit', (code) => {
          console.log(`Backend process exited with code ${code}`);
          if (code !== 0 && code !== null) {
            dialog.showErrorBox('Backend Error', deriveBackendErrorMessage(logFile, runtimeConfigPath));
          }
        });

        backendProcess.on('error', (err) => {
          console.error('Backend process error:', err);
          dialog.showErrorBox('Backend Error', `Server failed to start: ${err.message}`);
        });
      } catch (err) {
        console.error('Failed to fork backend process:', err);
        dialog.showErrorBox('Startup Error', `Failed to start background server: ${err.message}`);
      }
    } else {
      const logFile = path.join(userDataPath, 'backend.log');
      fs.writeFileSync(logFile, `Hosted API mode at ${new Date().toISOString()}\n`);
      fs.appendFileSync(logFile, `API base URL: ${config.apiBaseUrl}\n`);
    }

  } else {
    // Development mode
    const envPath = resolveEnvPath();
    if (envPath) {
      require('dotenv').config({ path: envPath });
    }

    const { spawn } = require('child_process');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const clientDir = path.join(appPath, 'client');

    backendProcess = spawn(npmCmd, ['run', 'dev'], { cwd: serverDir, stdio: 'inherit' });
    
    const frontendProcess = spawn(npmCmd, ['run', 'dev'], { cwd: clientDir, stdio: 'inherit' });
    
    app.on('quit', () => {
      if (frontendProcess && !frontendProcess.killed) frontendProcess.kill();
    });
  }

  // Create the window
  setTimeout(() => {
    createWindow();
  }, 2500);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (backendProcess) {
    if (backendProcess.kill) backendProcess.kill();
    else if (backendProcess.terminate) backendProcess.terminate();
  }
  process.exit(0);
});
