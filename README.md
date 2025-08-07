# 🚀 myhub – A Custom Git-like Version Control System

![version](https://img.shields.io/badge/version-1.0.0-blue)
![status](https://img.shields.io/badge/status-in-development-yellow)
![license](https://img.shields.io/badge/license-MIT-purple)

> ⚡️ myhub is a fully custom-built, Git-inspired version control CLI tool made using Node.js. Ideal for learners, personal projects, and full transparency over your data versioning.

---

## 🌟 Key Features

### ✅ Implemented

- 📁 `create <project>` – Initialize a new versioned project.
- ➕ `add <file>` – Stage files for commit.
- 📝 `commit -m "message"` – Commit staged files with a message.
- 🔍 `status` – Show project status (tracked, untracked, staged files).
- 📜 `log` – Show all previous commits with timestamps and messages.

---

### 🔧 Coming Soon (Planned)

- 🌍 `remote add <name> <url>` – Add remote project reference.
- 📤 `push <remote>` – Push commits to a remote server (GitHub-like).
- 📥 `pull <remote>` – Pull changes from remote (syncing).
- 🔄 `clone <url>` – Clone a remote myhub project.
- 📃 `.myhubignore` support – Exclude files like node_modules, logs, etc.
- 🔀 `branch <name>` – Create and switch branches.
- 🧪 `merge <branch>` – Merge branches intelligently.
- 🗑️ `reset <commit>` – Reset project to a previous state.
- 📂 `init` – Initialize version control in an existing folder.
- 🧠 Smart file diff & history comparison.
- 👤 Author/email tracking like real Git.
- 🔐 Commit signatures and verification.

---

## 📦 Installation

```bash
git clone https://github.com/Somanath-R/Git-Clone.git
cd Git-Clone
npm install
```

---

## 🛠️ CLI Usage

```bash
# Create new myhub project
node index.js create myproject

# Add a file
node index.js add hello.txt

# Commit your changes
node index.js commit -m "Added hello.txt"

# View current status
node index.js status

# See commit history
node index.js log
```

---

## 🧾 Example Output

```bash
$ node index.js log

🔖 Commit: 2025-08-07T15:24:10
📄 Message: Added initial readme and CLI logic

🔖 Commit: 2025-08-07T14:12:36
📄 Message: Initialized project structure
```

---

## 🧠 Architecture

```
project-root/
├── .myhub/
│   ├── staging/
│   ├── commits/
│   └── config.json
├── your-files.js
```

---

## 🤝 Contributing

Want to help improve `myhub`? Here's how:

- ⭐ Suggest or request a new feature
- 🐞 Report bugs or issues
- 📥 Submit a pull request

---

## 📄 License

MIT License © 2025 [Somanath R](https://github.com/Somanath-R)