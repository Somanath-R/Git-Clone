const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const archiver = require('archiver');

const DB_FILE = path.join(__dirname, 'myhub.json');
const PROJECTS_DIR = path.join(__dirname, 'projects');
const REMOTE_DIR = path.join(__dirname, 'remote');

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return { projects: [] };
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function getTimeStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function getProjectPath(name) {
  return path.join(PROJECTS_DIR, name);
}

function createProject(name) {
  const db = loadDB();
  if (db.projects.find(p => p.name === name)) {
    return console.log('❌ Project already exists.');
  }

  const projectPath = getProjectPath(name);
  fs.ensureDirSync(projectPath);
  fs.writeFileSync(path.join(projectPath, 'README.md'), `# ${name}\n`);
  db.projects.push({ name, createdAt: new Date().toISOString() });
  saveDB(db);
  console.log(`✅ Created project "${name}" at ${projectPath}`);
}

function listProjects() {
  const db = loadDB();
  if (db.projects.length === 0) {
    return console.log('📂 No projects found.');
  }
  db.projects.forEach(p => {
    console.log(`📁 ${p.name} (created ${p.createdAt})`);
  });
}

function saveVersion(name, msg = '') {
  const db = loadDB();
  const project = db.projects.find(p => p.name === name);
  if (!project) return console.log('❌ Project not found.');

  const projectPath = getProjectPath(name);
  const versionsPath = path.join(projectPath, '.versions');
  fs.ensureDirSync(versionsPath);

  const timestamp = getTimeStamp();
  const versionPath = path.join(versionsPath, timestamp);
  fs.copySync(projectPath, versionPath, {
    filter: (src) => !src.includes('.versions')
  });

  const logPath = path.join(versionsPath, 'log.txt');
  const logEntry = `${timestamp} - ${msg}\n`;
  fs.appendFileSync(logPath, logEntry);

  console.log(`📦 Saved version at ${versionPath}`);
}

function showHistory(name) {
  const projectPath = getProjectPath(name);
  const logPath = path.join(projectPath, '.versions', 'log.txt');
  if (!fs.existsSync(logPath)) return console.log('❌ No version history.');

  const log = fs.readFileSync(logPath, 'utf8');
  console.log(`📜 Version history for ${name}:\n${log}`);
}

function restoreVersion(name, timestamp) {
  const projectPath = getProjectPath(name);
  const versionPath = path.join(projectPath, '.versions', timestamp);
  if (!fs.existsSync(versionPath)) return console.log('❌ Version not found.');

  fs.copySync(versionPath, projectPath, {
    filter: src => !src.includes('.versions')
  });

  console.log(`🔄 Restored version from ${timestamp}`);
}

function pushProject(name) {
  const db = loadDB();
  const project = db.projects.find(p => p.name === name);
  if (!project) return console.log('❌ Project not found.');

  const projectPath = getProjectPath(name);
  const remotePath = path.join(REMOTE_DIR, name);
  fs.ensureDirSync(REMOTE_DIR);

  const zipFile = path.join(remotePath + '-' + getTimeStamp() + '.zip');
  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', { zlib: { level: 9 } });

  // ✅ NEW: Load ignore patterns from .myhubignore if exists
  const ignorePath = path.join(projectPath, '.myhubignore');
  let ignorePatterns = [];

  if (fs.existsSync(ignorePath)) {
    ignorePatterns = fs.readFileSync(ignorePath, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  }

  // ✅ NEW: Helper to check if file should be ignored
  const shouldIgnore = (filePath) => {
    return ignorePatterns.some(pattern =>
      filePath.includes(pattern.replace(/\/$/, '')) // handle "dir/" vs "dir"
    );
  };

  output.on('close', () => {
    console.log(`📤 Pushed to remote: ${zipFile} (${archive.pointer()} bytes)`);
  });

  archive.on('error', err => {
    throw err;
  });

  archive.pipe(output);

  // ✅ NEW: Recursively add files except ignored ones
  const walkAndAdd = (base, rel = '') => {
    const fullPath = path.join(base, rel);
    const items = fs.readdirSync(fullPath);

    for (const item of items) {
      const itemRelPath = path.join(rel, item);
      const itemFullPath = path.join(base, itemRelPath);

      if (shouldIgnore(itemRelPath)) continue;

      const stats = fs.statSync(itemFullPath);
      if (stats.isDirectory()) {
        walkAndAdd(base, itemRelPath);
      } else {
        archive.file(itemFullPath, { name: itemRelPath });
      }
    }
  };

  walkAndAdd(projectPath);
  archive.finalize();
}

// 📦 CLI usage
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'create': createProject(args[0]); break;
  case 'list': listProjects(); break;
  case 'save': saveVersion(args[0], args.slice(1).join(' ')); break;
  case 'history': showHistory(args[0]); break;
  case 'restore': restoreVersion(args[0], args[1]); break;
  case 'push': pushProject(args[0]); break;
  default:
    console.log(`📘 Usage:
    node myhub.js create <name>
    node myhub.js list
    node myhub.js save <name> <message>
    node myhub.js history <name>
    node myhub.js restore <name> <timestamp>
    node myhub.js push <name>`);
}
