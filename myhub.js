#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const simpleGit = require("simple-git");
const archiver = require("archiver");

// helper to get .myhub path
function getMyHubDir() {
  return path.join(process.cwd(), ".myhub");
}

// Init command
function handleInit() {
  const myhubPath = getMyHubDir();
  if (fs.existsSync(myhubPath)) {
    console.log("✅ Already initialized.");
    return;
  }
  fs.mkdirSync(myhubPath);
  fs.writeJsonSync(path.join(myhubPath, "index.json"), []);
  fs.writeJsonSync(path.join(myhubPath, "log.json"), []);
  fs.writeJsonSync(path.join(myhubPath, "remotes.json"), {});
  console.log("✅ Initialized myhub repository.");
}

// Add command
function handleAdd(file) {
  const indexPath = path.join(getMyHubDir(), "index.json");
  let index = fs.readJsonSync(indexPath);
  if (!index.includes(file)) {
    index.push(file);
    fs.writeJsonSync(indexPath, index);
    console.log(`✅ Staged: ${file}`);
  } else {
    console.log(`ℹ️ Already staged: ${file}`);
  }
}

// Commit command
function handleCommit(message) {
  const indexPath = path.join(getMyHubDir(), "index.json");
  const logPath = path.join(getMyHubDir(), "log.json");

  if (!fs.existsSync(indexPath)) {
    console.log("❌ Run 'myhub init' first.");
    return;
  }

  const files = fs.readJsonSync(indexPath);
  if (files.length === 0) {
    console.log("Nothing staged to commit.");
    return;
  }

  const timestamp = Date.now();
  const commitFileName = `${timestamp}.zip`;
  const commitPath = path.join(getMyHubDir(), commitFileName);

  const output = fs.createWriteStream(commitPath);
  const archive = archiver("zip");

  output.on("close", () => {
    let log = fs.readJsonSync(logPath);
    log.push({ message, timestamp, files });
    fs.writeJsonSync(logPath, log);
    fs.writeJsonSync(indexPath, []);
    console.log(`✅ Commit successful: ${timestamp}`);
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(output);
  files.forEach((file) => {
    if (fs.existsSync(file)) {
      archive.file(file, { name: file });
    }
  });

  archive.finalize();
}

// Log command
function handleLog() {
  const logPath = path.join(getMyHubDir(), "log.json");
  if (!fs.existsSync(logPath)) {
    console.log("❌ No commits found. Run 'myhub init' and commit first.");
    return;
  }

  const logs = fs.readJsonSync(logPath);
  logs.forEach((entry, index) => {
    console.log(`\nCommit #${index + 1}`);
    console.log(`📝 Message: ${entry.message}`);
    console.log(`🕒 Timestamp: ${entry.timestamp}`);
    console.log(`📄 Files: ${entry.files.join(", ")}`);
  });
}

// Remote add command
function handleRemote(name, url) {
  const remotesPath = path.join(getMyHubDir(), "remotes.json");
  const remotes = fs.readJsonSync(remotesPath);
  remotes[name] = url;
  fs.writeJsonSync(remotesPath, remotes);
  console.log(`✅ Remote '${name}' added: ${url}`);
}

// Push command (NEW ✅)
async function handlePush(name, branch) {
  const remotesPath = path.join(getMyHubDir(), "remotes.json");

  if (!fs.existsSync(remotesPath)) {
    console.log("❌ No remotes found. Use 'myhub remote add <name> <url>'");
    return;
  }

  const remotes = fs.readJsonSync(remotesPath);
  const url = remotes[name];

  if (!url) {
    console.log(`❌ Remote '${name}' not found.`);
    return;
  }

  const git = simpleGit();

  try {
    // Init Git if not already
    if (!fs.existsSync(".git")) {
      await git.init();
      console.log("✅ Git initialized.");
    }

    await git.addRemote(name, url).catch(() => {});
    await git.add(".");
    await git.commit(`myhub push commit`);
    await git.push(name, branch);
    console.log(`✅ Pushed to ${name}/${branch}`);
  } catch (err) {
    console.error("❌ Push failed:", err.message);
  }
}

// Main dispatcher
function main() {
  const [cmd, ...args] = process.argv.slice(2);

  switch (cmd) {
    case "init":
      handleInit();
      break;
    case "add":
      handleAdd(args[0]);
      break;
    case "commit":
      if (args[0] === "-m" && args[1]) {
        handleCommit(args.slice(1).join(" "));
      } else {
        console.log("❌ Usage: myhub commit -m \"message\"");
      }
      break;
    case "log":
      handleLog();
      break;
    case "remote":
      if (args[0] === "add" && args[1] && args[2]) {
        handleRemote(args[1], args[2]);
      } else {
        console.log("❌ Usage: myhub remote add <name> <url>");
      }
      break;
    case "push":
      if (args[0] && args[1]) {
        handlePush(args[0], args[1]);
      } else {
        console.log("❌ Usage: myhub push <remote-name> <branch>");
      }
      break;
    default:
      console.log(`❌ Unknown command: ${cmd}`);
  }
}

main();
