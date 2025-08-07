#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const myhubDir = path.join(process.cwd(), ".myhub");
const stagingDir = path.join(myhubDir, "staging");
const commitsDir = path.join(myhubDir, "commits");
const logFile = path.join(myhubDir, "log.json");
const ignoreFile = path.join(process.cwd(), ".myhubignore");
const remotesFile = path.join(myhubDir, "remotes.json"); // ✅ NEW for remote URLs

// ✅ Utility to check if a file is ignored
function isIgnored(filePath) {
  if (!fs.existsSync(ignoreFile)) return false;
  const ignorePatterns = fs.readFileSync(ignoreFile, "utf-8").split("\n").map(x => x.trim()).filter(Boolean);
  return ignorePatterns.some(pattern => filePath.includes(pattern));
}

// ✅ Init repo
function initRepo() {
  if (fs.existsSync(myhubDir)) {
    console.log("Repository already initialized.");
    return;
  }
  fs.mkdirSync(myhubDir);
  fs.mkdirSync(stagingDir);
  fs.mkdirSync(commitsDir);
  fs.writeFileSync(logFile, JSON.stringify([]));
  fs.writeFileSync(remotesFile, JSON.stringify({})); // ✅ create empty remotes
  console.log("Initialized empty MyHub repository.");
}

// ✅ Stage file
function stageFile(fileName) {
  const srcPath = path.join(process.cwd(), fileName);
  const destPath = path.join(stagingDir, fileName);

  if (!fs.existsSync(srcPath)) return console.error(`❌ File "${fileName}" does not exist.`);
  if (isIgnored(fileName)) return console.log(`⚠️  Skipped (ignored): ${fileName}`);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  console.log(`✅ Staged: ${fileName}`);
}

// ✅ Commit staged files
function commitChanges(message) {
  if (!fs.existsSync(stagingDir)) return console.log("Nothing staged to commit.");

  const commitId = Date.now().toString();
  const commitPath = path.join(commitsDir, commitId);
  fs.mkdirSync(commitPath);

  copyDir(stagingDir, commitPath);
  fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir);

  const log = JSON.parse(fs.readFileSync(logFile));
  log.push({ id: commitId, message, timestamp: new Date().toISOString() });
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2));

  console.log(`✅ Commit successful: ${commitId}`);
}

// ✅ Copy dir recursively
function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ✅ View log
function showLog() {
  if (!fs.existsSync(logFile)) return console.log("No commits found.");
  const log = JSON.parse(fs.readFileSync(logFile));
  log.forEach(entry => {
    console.log(`\n📝 Commit: ${entry.id}`);
    console.log(`📅 Date: ${entry.timestamp}`);
    console.log(`💬 Message: ${entry.message}`);
  });
}

// ✅ Handle `myhub remote add <name> <url>`
function handleRemote(args) {
  if (args[0] === "add" && args[1] && args[2]) {
    const [_, name, url] = args;
    const remotes = fs.existsSync(remotesFile)
      ? JSON.parse(fs.readFileSync(remotesFile))
      : {};

    remotes[name] = url;
    fs.writeFileSync(remotesFile, JSON.stringify(remotes, null, 2));
    console.log(`✅ Remote "${name}" added: ${url}`);
  } else {
    console.log("❌ Usage: myhub remote add <name> <url>");
  }
}

// ✅ Main CLI handler
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "init":
      initRepo();
      break;
    case "add":
      stageFile(args[1]);
      break;
    case "commit":
      if (args[1] === "-m" && args[2]) {
        commitChanges(args.slice(2).join(" "));
      } else {
        console.log("❌ Usage: myhub commit -m \"message\"");
      }
      break;
    case "log":
      showLog();
      break;
    case "remote":
      handleRemote(args.slice(1)); // ✅ handle remote command
      break;
    default:
      console.log(`Unknown command: ${command}`);
      break;
  }
}

main();
