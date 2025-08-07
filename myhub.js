#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Utility to get the repo root
const getRepoRoot = () => {
  let currentDir = process.cwd();
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, '.myhub'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return null;
};

// 🟨 NEW: Read .myhubignore
function readIgnoreList(repoRoot) {
  const ignorePath = path.join(repoRoot, '.myhubignore');
  if (fs.existsSync(ignorePath)) {
    return fs.readFileSync(ignorePath, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  }
  return [];
}

// 🟨 NEW: Check if file is ignored
function isIgnored(file, ignoreList) {
  return ignoreList.some(pattern => {
    if (pattern.endsWith('/')) {
      return file.startsWith(pattern.slice(0, -1));
    }
    return file === pattern || file.includes(pattern);
  });
}

// ✅ Modified: Init repo
function initRepo() {
  const repoPath = path.join(process.cwd(), '.myhub');
  if (fs.existsSync(repoPath)) {
    console.log('Repository already initialized.');
    return;
  }

  fs.mkdirSync(repoPath);
  fs.mkdirSync(path.join(repoPath, 'commits'));
  fs.writeFileSync(path.join(repoPath, 'index.json'), JSON.stringify([]));

  // 🟨 ADDED: Create default .myhubignore
  fs.writeFileSync(path.join(process.cwd(), '.myhubignore'), 'node_modules/\n.env\n.DS_Store\n*.log\n');

  console.log('Initialized empty myhub repository.');
}

// ✅ Modified: Add file to staging
function addFile(filePath) {
  const repoRoot = getRepoRoot();
  if (!repoRoot) {
    console.log('Not inside a myhub repo.');
    return;
  }

  const fullPath = path.join(repoRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log('File does not exist.');
    return;
  }

  // 🟨 ADDED: Ignore check
  const ignoreList = readIgnoreList(repoRoot);
  if (isIgnored(filePath, ignoreList)) {
    console.log(`Skipping ignored file: ${filePath}`);
    return;
  }

  const indexPath = path.join(repoRoot, '.myhub', 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath));
  if (!index.includes(filePath)) {
    index.push(filePath);
    fs.writeFileSync(indexPath, JSON.stringify(index));
    console.log(`Staged ${filePath}`);
  } else {
    console.log(`${filePath} is already staged.`);
  }
}

// ✅ Existing: Commit changes
function commitChanges(message) {
  const repoRoot = getRepoRoot();
  if (!repoRoot) {
    console.log('Not inside a myhub repo.');
    return;
  }

  const indexPath = path.join(repoRoot, '.myhub', 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath));
  if (index.length === 0) {
    console.log('Nothing to commit.');
    return;
  }

  const commit = {
    timestamp: new Date().toISOString(),
    message,
    files: [...index],
  };

  const commitPath = path.join(repoRoot, '.myhub', 'commits', `${Date.now()}.json`);
  fs.writeFileSync(commitPath, JSON.stringify(commit, null, 2));
  fs.writeFileSync(indexPath, JSON.stringify([]));
  console.log('Committed:', message);
}

// ✅ Existing: Show commit log
function showLog() {
  const repoRoot = getRepoRoot();
  if (!repoRoot) {
    console.log('Not inside a myhub repo.');
    return;
  }

  const commitsDir = path.join(repoRoot, '.myhub', 'commits');
  const commits = fs.readdirSync(commitsDir)
    .map(file => JSON.parse(fs.readFileSync(path.join(commitsDir, file))))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  commits.forEach((commit, index) => {
    console.log(`\nCommit ${index + 1}:`);
    console.log(`Date: ${commit.timestamp}`);
    console.log(`Message: ${commit.message}`);
    console.log(`Files: ${commit.files.join(', ')}`);
  });
}

// ✅ CLI Entry Point
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'init':
    initRepo();
    break;
  case 'add':
    addFile(args[0]);
    break;
  case 'commit':
    if (args[0] === '-m') {
      commitChanges(args.slice(1).join(' '));
    } else {
      console.log('Use: myhub commit -m "message"');
    }
    break;
  case 'log':
    showLog();
    break;
  default:
    console.log('Commands: init | add <file> | commit -m "msg" | log');
}
