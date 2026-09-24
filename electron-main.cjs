// التحقق الاستباقي: إذا تم تشغيل الملف بواسطة Node.js مباشرة في بيئة السيرفر أو الحاوية
const electron = require('electron');
if (!electron || typeof electron === 'string' || !electron.app) {
  console.log('Al-Bunyan Desktop Launcher: Running web server fallback...');
  try {
    require('./dist/server.cjs');
  } catch (e) {
    console.error('Server fallback error:', e);
  }
  return;
}

const { app, BrowserWindow, Menu } = electron;
const path = require('path');

// تعطيل تسريع العتاد لتفادي مشاكل كروت الشاشة القديمة في ويندوز 8
app.disableHardwareAcceleration();

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: "منظومة البنيان الرقمي للقرآن الكريم",
    backgroundColor: '#092b22',
    autoHideMenuBar: true,
    show: false, // لا تظهر النافذة حتى تجهز الصفحة لمنع الوميض الأبيض
    icon: path.join(__dirname, 'public/icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  // إخفاء القائمة العلوية التقليدية للشاشات الاحترافية
  Menu.setApplicationMenu(null);

  // تحميل ملف الواجهة من مجلد dist
  const indexPath = path.join(__dirname, 'dist/index.html');
  mainWindow.loadFile(indexPath);

  // إظهار النافذة عند اكتمال التحميل
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// تشغيل التطبيق عندما يكون جاهزاً
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// إغلاق التطبيق عند إغلاق جميع النوافذ
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
