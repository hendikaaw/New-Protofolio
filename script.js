const savedTheme = localStorage.getItem('hendika-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

function setTheme(themeName, silent = false) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('hendika-theme', themeName);
    if (!silent && document.getElementById('output')) print(`<span style="color:var(--accent);">System theme changed to '${themeName}'.</span>`);
}

// PERSISTENT VIRTUAL FILE SYSTEM
const defaultVfs = {
    name: "~", type: "dir",
    content: {
        "bio.txt": { type: "file", content: "Halo, saya Hendika Adhi Wibawanta.\nSysadmin, Network Administrator & Teknisi Komputer pecinta terminal dan infrastruktur jaringan." },
        "network": { type: "dir", content: { "config.sys": { type: "file", content: "NET_SYS_INTERFACE=eth0\nSTATUS=ONLINE\nIP=192.168.1.1/24" } } },
        ".secret": { type: "dir", content: { "vip_contact.txt": { type: "file", content: "👑 WELCOME TO THE ROOT CLUB 👑\n---------------------------------\nEmail: emailhendika@gmail.com\nGitHub: github.com/hendikaaw\nInstagram: instagram.com/hendikaaw" } } }
    }
};

let vfs = JSON.parse(localStorage.getItem('hendika-vfs'));
if (vfs) {
    document.getElementById('welcome-msg').innerText = "[SYS] Resuming previous session... Welcome back.";
    if (!vfs.content['.secret']) vfs.content['.secret'] = defaultVfs.content['.secret'];
} else { vfs = defaultVfs; }

function saveVfs() { localStorage.setItem('hendika-vfs', JSON.stringify(vfs)); }

let currentVfsPath = []; let currentVfsDir = vfs;
function getPromptPath() { return currentVfsPath.length === 0 ? "~" : "~/" + currentVfsPath.join("/"); }

function resolvePath(path) {
    if (!path || path === "/" || path === "~") return { dir: vfs, path: [] };
    let parts = path.split("/").filter(p => p.length > 0);
    let tempDir = path.startsWith("/") ? vfs : currentVfsDir;
    let tempPath = path.startsWith("/") ? [] : [...currentVfsPath];

    if (!path.startsWith("/")) parts = path.split("/");
    else { tempDir = vfs; tempPath = []; parts = path.substring(1).split("/"); }

    for (const part of parts) {
        if (part === ".") continue;
        if (part === "..") {
            if (tempPath.length > 0) { tempPath.pop(); tempDir = vfs; for (const p of tempPath) tempDir = tempDir.content[p]; }
            continue;
        }
        if (tempDir.content && tempDir.content[part] && tempDir.content[part].type === "dir") {
            tempDir = tempDir.content[part]; tempPath.push(part);
        } else { return null; }
    }
    return { dir: tempDir, path: tempPath };
}

// VIM EDITOR LOGIC
const termUI = document.getElementById('terminal-body');
const vimUI = document.getElementById('vim-ui');
const vimTextarea = document.getElementById('vim-textarea');
const vimModeDisplay = document.getElementById('vim-mode');
let isVim = false; let vimMode = 'NORMAL'; let vimFilename = '';

function startVim(filename) {
    if (filename === '.secret' && !isRoot) { print(`<span style="color:#ff5555">vi: ${filename}: Permission denied</span>`); return; }
    const file = currentVfsDir.content[filename];
    if (file && file.type === 'dir') { print(`<span style="color:var(--muted);">vi: ${filename}: Is a directory.</span>`); return; }

    isVim = true; vimFilename = filename; vimMode = 'NORMAL';
    vimTextarea.value = (file && file.type === 'file') ? file.content : '';
    vimTextarea.readOnly = true;

    termUI.style.display = 'none'; vimUI.style.display = 'flex';
    vimModeDisplay.innerText = `"${filename}" [NORMAL] - Press 'i' to insert`;
    setTimeout(() => vimTextarea.focus(), 50);
}

function quitVim() {
    isVim = false; vimUI.style.display = 'none'; termUI.style.display = 'flex';
    setTimeout(() => input.focus(), 50);
}

vimTextarea.addEventListener('keydown', (e) => {
    if (!isVim) return;
    if (vimMode === 'NORMAL') {
        e.preventDefault();
        if (e.key === 'i') { vimMode = 'INSERT'; vimTextarea.readOnly = false; vimModeDisplay.innerText = '-- INSERT --'; }
        else if (e.key === ':') {
            const cmd = prompt("Vim command:\nType 'wq' to save & quit.\nType 'q!' to force quit.", "");
            if (cmd === 'wq') {
                currentVfsDir.content[vimFilename] = { type: 'file', content: vimTextarea.value };
                saveVfs(); quitVim(); print(`"${vimFilename}" written and saved permanently.`);
            } else if (cmd === 'q!') { quitVim(); print(`"${vimFilename}" closed without saving.`); }
        }
    } else if (vimMode === 'INSERT') {
        if (e.key === 'Escape') { vimMode = 'NORMAL'; vimTextarea.readOnly = true; vimModeDisplay.innerText = `"${vimFilename}" [NORMAL]`; }
    }
});

// 👑 SNAKE GAME ENGINE
let isGaming = false;
let snakeInterval;
let snakeGame = { w: 30, h: 12, snake: [], food: { x: 0, y: 0 }, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, score: 0, boardElement: null };

function initSnake() {
    snakeGame.snake = [{ x: 15, y: 6 }, { x: 14, y: 6 }, { x: 13, y: 6 }];
    snakeGame.dir = { x: 1, y: 0 }; snakeGame.nextDir = { x: 1, y: 0 }; snakeGame.score = 0;

    snakeGame.food.x = Math.floor(Math.random() * snakeGame.w);
    snakeGame.food.y = Math.floor(Math.random() * snakeGame.h);

    isGaming = true; input.disabled = true;
    document.getElementById('term-input-container').style.display = 'none';

    print("<div id='snake-container' style='display:flex; flex-direction:column; align-items:center;'><pre id='snake-board' style='color:var(--accent); font-family:monospace; line-height:1; margin:10px 0;'></pre><div id='snake-score' style='color:var(--fg); font-weight:bold;'>Score: 0</div><div style='color:var(--muted); font-size:0.8rem; margin-bottom:10px;'>Use Arrow Keys to move. Press 'q' to quit</div></div>");
    snakeGame.boardElement = document.getElementById('snake-board');

    // SCROLL OTOMATIS KE TENGAH SNAKE GAME
    setTimeout(() => {
        const snakeContainer = document.getElementById('snake-container');
        if (snakeContainer) {
            snakeContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 50);

    snakeInterval = setInterval(gameLoop, 100);
}

function gameLoop() {
    snakeGame.dir = snakeGame.nextDir;
    let head = { x: snakeGame.snake[0].x + snakeGame.dir.x, y: snakeGame.snake[0].y + snakeGame.dir.y };

    if (head.x < 0 || head.x >= snakeGame.w || head.y < 0 || head.y >= snakeGame.h) { endSnake("Game Over! Hit a wall."); return; }
    for (let i = 0; i < snakeGame.snake.length; i++) {
        if (head.x === snakeGame.snake[i].x && head.y === snakeGame.snake[i].y) { endSnake("Game Over! Bit yourself."); return; }
    }

    snakeGame.snake.unshift(head);

    if (head.x === snakeGame.food.x && head.y === snakeGame.food.y) {
        snakeGame.score += 10;
        document.getElementById('snake-score').innerText = "Score: " + snakeGame.score;
        snakeGame.food.x = Math.floor(Math.random() * snakeGame.w);
        snakeGame.food.y = Math.floor(Math.random() * snakeGame.h);
    } else { snakeGame.snake.pop(); }

    renderSnake();
}

function renderSnake() {
    let board = "";
    for (let y = 0; y < snakeGame.h; y++) {
        for (let x = 0; x < snakeGame.w; x++) {
            if (x === snakeGame.food.x && y === snakeGame.food.y) board += "★";
            else {
                let isSnake = false; let isHead = false;
                for (let i = 0; i < snakeGame.snake.length; i++) {
                    if (snakeGame.snake[i].x === x && snakeGame.snake[i].y === y) { isSnake = true; if (i === 0) isHead = true; break; }
                }
                if (isHead) board += "▓"; else if (isSnake) board += "█"; else board += "·";
            }
        }
        board += "\n";
    }
    snakeGame.boardElement.innerText = board;
}

function endSnake(reason) {
    clearInterval(snakeInterval); isGaming = false; input.disabled = false;
    document.getElementById('term-input-container').style.display = 'flex';
    print(`<span style="color:#ff5555">${reason} Final Score: ${snakeGame.score}</span>`);
    setTimeout(() => input.focus(), 50);
}

document.addEventListener('keydown', (e) => {
    if (!isGaming) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    if (e.key === 'ArrowUp' && snakeGame.dir.y !== 1) snakeGame.nextDir = { x: 0, y: -1 };
    else if (e.key === 'ArrowDown' && snakeGame.dir.y !== -1) snakeGame.nextDir = { x: 0, y: 1 };
    else if (e.key === 'ArrowLeft' && snakeGame.dir.x !== 1) snakeGame.nextDir = { x: -1, y: 0 };
    else if (e.key === 'ArrowRight' && snakeGame.dir.x !== -1) snakeGame.nextDir = { x: 1, y: 0 };
    else if (e.key.toLowerCase() === 'q') endSnake("Game aborted.");
});

// 👑 FULL LINUX COMMANDS
let isRoot = false; let isAwaitingSudo = false; const SUDO_PASS = "h3nd1k4";

function updatePrompt() {
    const prefix = isRoot ? "root@hendika-os" : "guest@hendika-os"; const symbol = isRoot ? "#" : "$";
    document.getElementById('term-prompt').innerText = `${prefix}:${getPromptPath()} ${symbol}`;
    document.getElementById('term-prompt').style.color = isRoot ? "#ff5555" : "var(--accent)";
}

// MEMORY STATE AI ASSISTANT
let aiHistory = [];

const shellCommands = {
    'help': {
        desc: 'Show available commands', run: () => {
            let out = '<div style="margin: 10px 0; color: var(--muted); display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">';
            for (const cmd in shellCommands) { out += `<div><span style="color: var(--accent); width:80px; display:inline-block;">${cmd}</span> ${shellCommands[cmd].desc}</div>`; }
            out += '</div>'; print(out);
        }
    },
    'vi': { desc: 'Text Editor (Vim)', run: (args) => { if (args.length === 0) print("<span style='color:var(--muted);'>Usage: vi [filename]</span>"); else startVim(args[0]); } },
    'play': {
        desc: 'Play terminal game', run: (args) => {
            if (args[0] === 'snake') initSnake(); else print("Usage: play snake");
        }
    },
    'sudo': {
        desc: 'Execute as root', run: (args) => {
            if (args[0] === 'su') {
                isAwaitingSudo = true; input.type = "password";
                document.getElementById('term-prompt').innerText = "[sudo] password for guest: "; document.getElementById('term-prompt').style.color = "var(--fg)";
            } else print("Usage: sudo su");
        }
    },
    'theme': {
        desc: 'Change theme', run: (args) => {
            const available = ['dark', 'maroon', 'cyberpunk', 'light'];
            if (args.length === 0) { print("<span style='color:var(--muted);'>Usage: theme [name]. Available: dark, maroon, cyberpunk, light</span>"); return; }
            const t = args[0].toLowerCase();
            if (available.includes(t)) setTheme(t); else print(`<span style="color: #ff5555;">Theme '${t}' not found.</span>`);
        }
    },
    'ls': {
        desc: 'List files/folders', run: () => {
            if (!currentVfsDir.content) return;
            const items = Object.keys(currentVfsDir.content).sort();
            if (items.length === 0) { print("<span style='color:var(--muted);'>(empty)</span>"); return; }
            let out = "<div style='display:flex; gap: 15px; margin-top:5px; flex-wrap:wrap;'>";
            for (const name of items) {
                if (name === '.secret' && !isRoot) continue;
                if (currentVfsDir.content[name].type === 'dir') out += `<span class="vfs-dir">${name}/</span>`;
                else out += `<span class="vfs-file">${name}</span>`;
            }
            out += "</div>"; print(out);
        }
    },
    'cd': {
        desc: 'Change directory', run: (args) => {
            if (args.length === 0) { currentVfsDir = vfs; currentVfsPath = []; updatePrompt(); return; }
            if (args[0] === '.secret' && !isRoot) { print(`<span style="color: #ff5555;">cd: .secret: Permission denied</span>`); return; }
            const resolved = resolvePath(args[0]);
            if (resolved) { currentVfsDir = resolved.dir; currentVfsPath = resolved.path; updatePrompt(); }
            else print(`<span style="color: #ff5555;">cd: ${args[0]}: No such directory.</span>`);
        }
    },
    'pwd': { desc: 'Print working directory', run: () => print((isRoot ? "/root" : "/home/guest") + getPromptPath().replace('~', '')) },
    'cat': {
        desc: 'Read file content', run: (args) => {
            if (args.length === 0) { print("<span style='color:var(--muted);'>cat: missing file operand</span>"); return; }
            const file = currentVfsDir.content ? currentVfsDir.content[args[0]] : null;
            if (file && file.type === 'file') print(`<pre style="color:var(--fg); margin-top:5px; white-space: pre-wrap; font-family:inherit;">${file.content}</pre>`);
            else if (file && file.type === 'dir') print(`<span style="color:var(--muted);">cat: ${args[0]}: Is a directory.</span>`);
            else print(`<span style="color: #ff5555;">cat: ${args[0]}: No such file.</span>`);
        }
    },
    'mkdir': {
        desc: 'Make directory', run: (args) => {
            if (!args[0]) { print("<span style='color: #ff5555;'>mkdir: missing operand</span>"); return; }
            if (currentVfsDir.content[args[0]]) { print(`<span style='color: #ff5555;'>mkdir: cannot create directory '${args[0]}': File exists</span>`); return; }
            currentVfsDir.content[args[0]] = { type: 'dir', content: {} }; saveVfs();
        }
    },
    'touch': {
        desc: 'Create empty file', run: (args) => {
            if (!args[0]) { print("<span style='color: #ff5555;'>touch: missing file operand</span>"); return; }
            if (!currentVfsDir.content[args[0]]) currentVfsDir.content[args[0]] = { type: 'file', content: '' }; saveVfs();
        }
    },
    'rm': {
        desc: 'Remove file/folder', run: (args) => {
            const fullArgs = args.join(" ");
            if (fullArgs === '-rf /' || fullArgs === '-rf /*') {
                print("<span style='color: #ff5555; font-weight:bold; animation: blink 1s infinite;'>[CRITICAL WARNING] Overriding safety protocols. Initiating system wipe...</span>");
                input.disabled = true;
                setTimeout(() => {
                    let elements = document.querySelectorAll('div, p, span, h1, h2, h3, a'); let i = 0;
                    let crashInterval = setInterval(() => {
                        if (i < 60) { const randomEl = elements[Math.floor(Math.random() * elements.length)]; if (randomEl) randomEl.style.visibility = 'hidden'; i++; }
                        else { clearInterval(crashInterval); document.body.innerHTML = `<div style="background:#0000aa; color:#fff; height:100vh; width:100vw; display:flex; flex-direction:column; padding:30px; font-family:'JetBrains Mono', monospace; font-size:1.1rem; z-index:999999; position:fixed; top:0; left:0;"><span style="background:#fff; color:#0000aa; display:inline-block; padding:2px 10px; margin-bottom:20px; font-weight:bold;">KERNEL PANIC</span><p>Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)</p><p>Hardware name: HendikaOS Virtual Machine</p><p>System halted. Press F5 to reboot.</p></div>`; }
                    }, 40);
                }, 1500);
            } else if (args.length > 0) {
                const target = args[args.length - 1];
                if (target === '.secret' && !isRoot) { print("rm: Permission denied"); return; }
                if (currentVfsDir.content[target]) { delete currentVfsDir.content[target]; saveVfs(); }
                else print(`rm: cannot remove '${target}': No such file or directory`);
            } else { print("rm: missing operand"); }
        }
    },
    'echo': { desc: 'Print text', run: (args) => print(args.join(" ")) },
    'date': { desc: 'Print system date', run: () => print(new Date().toString()) },
    'uname': { desc: 'Print OS info', run: (args) => { if (args.includes('-a')) print("Linux HendikaOS 5.15.0-generic #1 SMP x86_64 GNU/Linux"); else print("Linux"); } },
    'whoami': { desc: 'Print active user', run: () => print(isRoot ? "root" : "guest") },
    'history': { desc: 'Show command history', run: () => { let out = ""; cmdHistory.forEach((c, i) => out += `  ${i + 1}  ${c}<br>`); print(out); } },
    'reboot': { desc: 'Reboot system', run: () => { print("Rebooting system..."); setTimeout(() => location.reload(), 1000); } },
    'ping': {
        desc: 'Send ICMP packet', run: (args) => {
            if (args.length === 0) { print("<span style='color: #ff5555;'>ping: usage error: Destination address required</span>"); return; }
            const target = args[0]; const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
            print(`PING ${target} (${ip}) 56(84) bytes of data.`);
            let count = 1; input.disabled = true;
            const interval = setInterval(() => {
                print(`64 bytes from ${ip}: icmp_seq=${count} ttl=115 time=${(Math.random() * 20 + 5).toFixed(1)} ms`);
                count++; if (count > 4) { clearInterval(interval); input.disabled = false; input.focus(); }
            }, 800);
        }
    },
    'ai': { desc: 'Chat dengan AI Assistant', run: async (args) => {
        if (args.length === 0) { print("<span style='color:var(--muted);'>Usage: ai [pesan] or ai --clear</span>"); return; }
        
        if (args[0] === '--clear') {
            aiHistory = [];
            print("<span style='color:var(--gemini);'>[System]: Memori dibersihkan. AI lupa obrolan sebelumnya.</span>");
            return;
        }

        const msg = args.join(" ");
        aiHistory.push({ role: "user", parts: [{ text: msg }] });

        print(`<span style="color:var(--gemini); font-style:italic;" id="ai-loading">AI sedang berpikir...</span>`);
        input.disabled = true;

        try {
            const response = await fetch('https://ai-backend-zeta-five.vercel.app/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: aiHistory })
            });

            const data = await response.json();

            if (data.error || data.status === false) {
                throw new Error(data.message || (data.error ? data.error.message : "Error server"));
            }

            let reply = "";
            if (data.response) {
                reply = data.response;
            } else if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                reply = data.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Format balasan dari server tidak valid.");
            }

            aiHistory.push({ role: "model", parts: [{ text: reply }] });

            if (document.getElementById('ai-loading')) document.getElementById('ai-loading').remove();
            
            const replyId = 'ai-reply-' + Date.now();
            print(`<br><span style="color:var(--gemini); font-weight:bold;">[AI]:</span> <span id="${replyId}" style="color:var(--fg);"></span><br>`);
            
            let formattedReply = reply
                .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:var(--accent); text-decoration:underline;">$1</a>')
                .replace(/\n/g, '<br>');

            await printTypewriter(formattedReply, replyId, 10);

        } catch (error) {
            console.error("AI Error:", error);
            if (document.getElementById('ai-loading')) document.getElementById('ai-loading').remove();
            print(`<span style="color:#ff5555">[Error]: ${error.message}</span>`);
            aiHistory.pop();
        }

        input.disabled = false;
        input.focus();
    }},
    'reviews': {
        desc: 'Buka halaman ulasan & penilaian',
        run: () => {
            print("<span style='color:var(--muted);'>Membuka halaman ulasan...</span>");
            navigate('reviews');
        }
    },
    'matrix': {
        desc: 'Efek hujan kode Digital Matrix',
        run: () => {
            print("<span style='color:#50fa7b;'>Wake up, Neo... Initiating Matrix stream.</span>");
            const canvas = document.createElement('canvas');
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.zIndex = '99999';
            canvas.style.pointerEvents = 'none';
            document.body.appendChild(canvas);
            
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*';
            const fontSize = 14;
            const columns = canvas.width / fontSize;
            const drops = Array(Math.floor(columns)).fill(1);
            
            let frames = 0;
            const matrixInterval = setInterval(() => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#0f0';
                ctx.font = fontSize + 'px monospace';
                
                for (let i = 0; i < drops.length; i++) {
                    const text = chars[Math.floor(Math.random() * chars.length)];
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                    drops[i]++;
                }
                
                frames++;
                if (frames > 300) {
                    clearInterval(matrixInterval);
                    canvas.remove();
                }
            }, 33);
        }
    },
    'neofetch': {
        desc: 'System info', run: () => {
            const ascii = `
<div class="neofetch-container">
<pre class="neofetch-logo">
    __  __
   / / / /
  / /_/ / 
 / __  /  
/_/ /_/   
          
</pre>
<div class="neofetch-info">
  <div><span style="color:var(--accent); font-weight:bold;">${isRoot ? "root" : "guest"}</span>@<span style="color:var(--accent); font-weight:bold;">hendika-os</span></div>
  <div style="color:var(--muted);">-------------------</div>
  <div><span style="color:var(--accent); font-weight:bold;">OS</span>: HendikaOS Web Linux x86_64</div>
  <div><span style="color:var(--accent); font-weight:bold;">Host</span>: Network & Sysadmin Node</div>
  <div><span style="color:var(--accent); font-weight:bold;">Kernel</span>: 5.15.0-generic</div>
  <div><span style="color:var(--accent); font-weight:bold;">Uptime</span>: up 24 mins</div>
  <div><span style="color:var(--accent); font-weight:bold;">Packages</span>: 43 (npm)</div>
  <div><span style="color:var(--accent); font-weight:bold;">Shell</span>: bash 5.1.16</div>
  <div><span style="color:var(--accent); font-weight:bold;">Terminal</span>: WebTerm</div>
  <div class="color-blocks">
    <div class="cb" style="background:#000;"></div>
    <div class="cb" style="background:#ff5555;"></div>
    <div class="cb" style="background:#50fa7b;"></div>
    <div class="cb" style="background:#f1fa8c;"></div>
    <div class="cb" style="background:#bd93f9;"></div>
    <div class="cb" style="background:#ff79c6;"></div>
    <div class="cb" style="background:#8be9fd;"></div>
    <div class="cb" style="background:#f8f8f2;"></div>
  </div>
</div>
</div>`;
            print(ascii);
        }
    },
    'clear': { desc: 'Clear screen', run: () => output.innerHTML = '' }
};

// COMMAND PALETTE, ANIMATION & NAV LOGIC
const cmdOverlay = document.getElementById('cmd-palette-overlay'); const cmdSearch = document.getElementById('cmd-search'); const cmdList = document.getElementById('cmd-list'); const items = Array.from(cmdList.querySelectorAll('li')); let selectedIndex = 0;
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); cmdOverlay.classList.toggle('active'); if (cmdOverlay.classList.contains('active')) { cmdSearch.value = ''; cmdSearch.focus(); filterItems(''); } }
    if (e.key === 'Escape' && cmdOverlay.classList.contains('active')) cmdOverlay.classList.remove('active');
});
cmdOverlay.addEventListener('click', (e) => { if (e.target === cmdOverlay) cmdOverlay.classList.remove('active'); });
cmdSearch.addEventListener('input', (e) => filterItems(e.target.value));
cmdSearch.addEventListener('keydown', (e) => {
    const visibleItems = items.filter(i => i.style.display !== 'none'); if (visibleItems.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = (selectedIndex + 1) % visibleItems.length; updateSelection(visibleItems); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = (selectedIndex - 1 + visibleItems.length) % visibleItems.length; updateSelection(visibleItems); }
    else if (e.key === 'Enter') { e.preventDefault(); if (visibleItems[selectedIndex]) visibleItems[selectedIndex].click(); }
});
function filterItems(query) {
    let hasVisible = false;
    items.forEach(item => { if (item.innerText.toLowerCase().includes(query.toLowerCase())) { item.style.display = 'flex'; if (!hasVisible) { selectedIndex = items.indexOf(item); hasVisible = true; } } else item.style.display = 'none'; });
    const visibleItems = items.filter(i => i.style.display !== 'none'); selectedIndex = 0; updateSelection(visibleItems);
}
function updateSelection(visibleItems) { items.forEach(item => item.classList.remove('selected')); if (visibleItems.length > 0 && visibleItems[selectedIndex]) visibleItems[selectedIndex].classList.add('selected'); }
items.forEach(item => {
    item.addEventListener('click', () => { cmdOverlay.classList.remove('active'); const target = item.getAttribute('data-target'); const action = item.getAttribute('data-action'); if (target) navigate(target); else if (action === 'download') window.open('LINK_DRIVE_CV_KAMU', '_blank'); });
});

// DRAGGABLE TERMINAL
const termWindow = document.getElementById('terminal-window'); const termHeader = document.getElementById('term-header');
let isDragging = false; let dragStartX, dragStartY; let termStartX = 0, termStartY = 0;
if (window.innerWidth > 768) {
    termHeader.style.cursor = 'grab';
    termHeader.addEventListener('mousedown', (e) => { if (isRoot) return; isDragging = true; termHeader.style.cursor = 'grabbing'; dragStartX = e.clientX; dragStartY = e.clientY; e.preventDefault(); });
    document.addEventListener('mousemove', (e) => { if (!isDragging || isRoot) return; const dx = e.clientX - dragStartX; const dy = e.clientY - dragStartY; termWindow.style.transform = `translate(${termStartX + dx}px, ${termStartY + dy}px)`; });
    document.addEventListener('mouseup', (e) => { if (isDragging && !isRoot) { isDragging = false; termHeader.style.cursor = 'grab'; termStartX += e.clientX - dragStartX; termStartY += e.clientY - dragStartY; } });
}

function updateTime() {
    const now = new Date(); const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = days[now.getDay()]; const date = now.getDate(); const month = months[now.getMonth()]; const year = now.getFullYear();
    const h = String(now.getHours()).padStart(2, '0'); const m = String(now.getMinutes()).padStart(2, '0'); const s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('status-time').innerHTML = `<span class="hide-mobile">${day}, ${date} ${month} ${year} | </span>${h}:${m}:${s}`;
}
setInterval(updateTime, 1000); updateTime();

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*";
function scrambleText(element) {
    if (!element) return; let iteration = 0; const finalString = element.dataset.value; if (!finalString) return; clearInterval(element.scrambleInterval);
    element.scrambleInterval = setInterval(() => { element.innerText = finalString.split("").map((letter, index) => { if (index < iteration) return finalString[index]; return letters[Math.floor(Math.random() * 63)]; }).join(""); if (iteration >= finalString.length) clearInterval(element.scrambleInterval); iteration += 1 / 3; }, 30);
}

const hamburgerBtn = document.getElementById('hamburger-btn'); const navbar = document.getElementById('navbar');
hamburgerBtn.addEventListener('click', () => { hamburgerBtn.classList.toggle('active'); navbar.classList.toggle('show'); });

let isAnimating = false;
function navigate(targetPage) {
    if (isAnimating) return; isAnimating = true; const wipeTransition = document.getElementById('wipe-transition'); wipeTransition.classList.remove('reset'); wipeTransition.classList.add('in');
    
    // Auto-scroll ke atas saat ganti page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const targetEl = document.getElementById(targetPage + '-page'); 
        if (targetEl) {
            targetEl.classList.add('active'); 
            const scrambleEl = targetEl.querySelector('.scramble-text');
            if (scrambleEl) scrambleText(scrambleEl);
        }
        document.querySelectorAll('nav a').forEach(link => link.classList.remove('active'));
        const navId = document.getElementById('nav-' + targetPage); if (navId) navId.classList.add('active');
        const statusPath = document.getElementById('status-path'); if (statusPath) statusPath.innerHTML = '<i class="fa-regular fa-folder-open"></i> ~/portfolio/' + targetPage;
        if (window.innerWidth <= 768) { hamburgerBtn.classList.remove('active'); navbar.classList.remove('show'); }
        if (targetPage === 'terminal' && !isVim && !isGaming) document.getElementById('cmd-input').focus();
        
        if (targetPage === 'reviews') loadReviews();

        wipeTransition.classList.remove('in'); wipeTransition.classList.add('out');
        setTimeout(() => { wipeTransition.classList.remove('out'); wipeTransition.classList.add('reset'); isAnimating = false; }, 600);
    }, 500);
}

// CORE INPUT LOGIC
const input = document.getElementById('cmd-input'); const output = document.getElementById('output'); const terminalBody = document.getElementById('terminal-body');
const fakeNavCommands = ['about', 'experience', 'certificates', 'projects', 'reviews', 'contact'];
let cmdHistory = []; let historyIndex = -1;

function print(text) { const div = document.createElement('div'); div.style.marginBottom = '2px'; div.innerHTML = text; output.appendChild(div); if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight; }

function printTypewriter(htmlContent, containerId, speed = 15) {
    return new Promise((resolve) => {
        const container = document.getElementById(containerId);
        if (!container) { resolve(); return; }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        let i = 0;
        const nodes = Array.from(tempDiv.childNodes);
        
        function typeNode() {
            if (i < nodes.length) {
                const node = nodes[i];
                if (node.nodeType === Node.TEXT_NODE) {
                    let charIndex = 0;
                    const text = node.textContent;
                    const textNode = document.createTextNode('');
                    container.appendChild(textNode);
                    
                    function typeChar() {
                        if (charIndex < text.length) {
                            textNode.textContent += text.charAt(charIndex);
                            charIndex++;
                            if (terminalBody) terminalBody.scrollTo({ top: terminalBody.scrollHeight, behavior: 'smooth' });
                            setTimeout(typeChar, speed);
                        } else {
                            i++;
                            typeNode();
                        }
                    }
                    typeChar();
                } else {
                    container.appendChild(node.cloneNode(true));
                    i++;
                    if (terminalBody) terminalBody.scrollTo({ top: terminalBody.scrollHeight, behavior: 'smooth' });
                    setTimeout(typeNode, speed);
                }
            } else {
                resolve();
            }
        }
        
        typeNode();
    });
}

input.addEventListener('keydown', function (e) {
    if (isVim || isGaming) { e.preventDefault(); return; }

    if (isAwaitingSudo) {
        if (e.key === 'Enter') {
            const pass = this.value.trim();
            print(`<span class="prompt">[sudo] password for guest:</span>`);
            if (pass === SUDO_PASS) {
                isRoot = true; currentVfsDir = vfs; currentVfsPath = [];
                print(`<br><span style="color:var(--accent); font-weight:bold;">Access granted. Root privileges enabled.</span><br>`);
                setTheme('maroon', true); termWindow.classList.add('root-mode'); termWindow.style.transform = 'none';
            } else { print(`<span style="color:#ff5555">Sorry, try again.</span>`); }
            isAwaitingSudo = false; this.type = "text"; this.value = ''; updatePrompt();
        } else if (e.ctrlKey && e.key === 'c') {
            e.preventDefault(); print(`<span class="prompt">[sudo] password for guest:</span> <span style="color:var(--muted)">^C</span>`);
            isAwaitingSudo = false; this.type = "text"; this.value = ''; updatePrompt();
        }
        return;
    }

    if (e.ctrlKey && e.key === 'c') { e.preventDefault(); const p = isRoot ? "root@hendika-os:~#" : "guest@hendika-os:~ $"; print(`<span class="prompt">${p}</span> ${this.value}<span style="color:var(--muted)">^C</span>`); this.value = ''; historyIndex = -1; return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (cmdHistory.length > 0 && historyIndex < cmdHistory.length - 1) { historyIndex++; this.value = cmdHistory[cmdHistory.length - 1 - historyIndex]; } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (historyIndex > 0) { historyIndex--; this.value = cmdHistory[cmdHistory.length - 1 - historyIndex]; } else if (historyIndex === 0) { historyIndex = -1; this.value = ''; } }
    else if (e.key === 'Enter') {
        const fullInput = this.value.trim();
        const prefix = isRoot ? "root@hendika-os" : "guest@hendika-os"; const symbol = isRoot ? "#" : "$";
        print(`<span class="prompt">${prefix}:${getPromptPath()} ${symbol}</span> ${fullInput}`);

        if (fullInput !== '') {
            cmdHistory.push(fullInput); historyIndex = -1;
            const parts = fullInput.split(" ").filter(p => p.length > 0); const cmd = parts[0].toLowerCase(); const args = parts.slice(1);
            if (shellCommands[cmd]) shellCommands[cmd].run(args);
            else if (fakeNavCommands.includes(cmd)) { print(`<span style="color: var(--muted);">Navigating to /${cmd}...</span>`); navigate(cmd); }
            else if (cmd === 'download') window.open('LINK_DRIVE_CV_KAMU', '_blank');
            else print(`<span style="color: var(--muted); opacity:0.7;">bash: ${cmd}: command not found. Type 'help'.</span>`);
        }
        this.value = '';
    }
    else if (e.key === 'Tab') {
        e.preventDefault(); const fullInput = this.value.trim(); if (!fullInput) return;
        const parts = fullInput.split(" "); const cmd = parts[0].toLowerCase();
        if (['cd', 'cat', 'rm', 'mkdir', 'touch', 'theme', 'vi'].includes(cmd)) {
            if (cmd === 'theme') {
                const available = ['dark', 'maroon', 'cyberpunk', 'light']; const query = parts.length > 1 ? parts[1].toLowerCase() : ""; const matches = available.filter(t => t.startsWith(query));
                if (matches.length === 1) this.value = `${cmd} ${matches[0]}`; else if (matches.length > 1) { print(`<span class="prompt">${getPromptPath()} $</span> ${fullInput}`); print("<div style='color:var(--muted); margin: 2px 0 5px 0;'>" + matches.join(" &nbsp; ") + "</div>"); } return;
            }
            if (!currentVfsDir.content) return;
            const query = parts.length > 1 ? parts[1].toLowerCase() : ""; const items = Object.keys(currentVfsDir.content).sort();
            let matches = cmd === 'cd' ? items.filter(name => name.toLowerCase().startsWith(query) && currentVfsDir.content[name].type === 'dir') : items.filter(name => name.toLowerCase().startsWith(query));
            if (matches.length === 1) this.value = `${cmd} ${matches[0]}`; else if (matches.length > 1) { print(`<span class="prompt">${getPromptPath()} $</span> ${fullInput}`); print("<div style='color:var(--muted); margin: 2px 0 5px 0;'>" + matches.join(" &nbsp; ") + "</div>"); }
        } else if (parts.length === 1) {
            const query = cmd; const allCmds = [...Object.keys(shellCommands), ...fakeNavCommands, 'download'].sort();
            const matches = allCmds.filter(c => c.startsWith(query));
            if (matches.length === 1) this.value = matches[0];
        }
    }
});

// HACK LOGIN EASTER EGG
const hackLoginOverlay = document.getElementById('hackLoginOverlay');
const hackLoginPanel = document.getElementById('hackLoginPanel');
const hackLoginClose = document.getElementById('hackLoginClose');
const hackLoginForm = document.getElementById('hackLoginForm');
const hackLoginMsg = document.getElementById('hackLoginMsg');
const hackFinalOverlay = document.getElementById('hackFinalOverlay');

function openHackLogin() {
    hackLoginOverlay.classList.add('active');
    const userField = document.getElementById('hackLoginUser');
    if (userField) setTimeout(() => userField.focus(), 300);
}
function closeHackLogin() {
    hackLoginOverlay.classList.remove('active');
    if (hackLoginMsg) hackLoginMsg.textContent = '';
    hackLoginForm.reset();
}

if (hackLoginClose) hackLoginClose.addEventListener('click', closeHackLogin);
if (hackLoginOverlay) hackLoginOverlay.addEventListener('click', (e) => { if (e.target === hackLoginOverlay) closeHackLogin(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && hackLoginOverlay.classList.contains('active')) closeHackLogin(); });

const sqlInjectionPatterns = [
    /'\s*or\s*'?\s*1\s*=\s*1/i, /"\s*or\s*"?\s*1\s*=\s*1/i, /or\s+1\s*=\s*1/i, /'\s*=\s*'/, /--/, /#/, /\/\*/, /;\s*drop\s+table/i, /union\s+select/i, /admin'\s*--/i, /'\s*or\s*true/i
];
function looksLikeSqlInjection(value) {
    if (!value) return false;
    return sqlInjectionPatterns.some((pattern) => pattern.test(value));
}

if (hackLoginForm) {
    hackLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('hackLoginUser').value;
        const pass = document.getElementById('hackLoginPass').value;

        if (looksLikeSqlInjection(user) || looksLikeSqlInjection(pass)) {
            closeHackLogin();
            hackFinalOverlay.classList.add('active');
            return;
        }
        if (hackLoginMsg) hackLoginMsg.textContent = 'Access denied. Invalid credentials.';
    });
}

// SOUND EFFECTS (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playKeySound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
}

document.getElementById('cmd-input').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== 'Backspace') playKeySound();
});

// GOOGLE SHEETS REVIEW LOGIC
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYYEn-jVaXq2qGxRf9MkSsDnhKrSijZzr5uP3YufPtI2avHcrT5Zi1Qfp0OmvTNcAQ/exec";

async function loadReviews() {
    const listEl = document.getElementById('reviewsList');
    if (!listEl) return;
    
    listEl.innerHTML = '<span style="color:var(--muted);">Memuat ulasan...</span>';

    try {
        const res = await fetch(SCRIPT_URL, {
            method: 'GET',
            redirect: 'follow'
        });
        
        const data = await res.json();
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            listEl.innerHTML = '<span style="color:var(--muted);">Belum ada ulasan. Jadilah yang pertama!</span>';
            return;
        }
        
        listEl.innerHTML = data.reverse().map(item => `
            <div style="background: var(--hover); border: 1px solid var(--border); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <strong style="color: var(--accent); font-size: 1.05rem;">${item.nama || 'Anonim'}</strong>
                    <span style="font-size:0.8rem; color:var(--muted);">${item.tanggal || ''}</span>
                </div>
                <div style="font-size: 0.9rem; margin-bottom: 6px;">Rating: ${'⭐'.repeat(item.rating || 5)}</div>
                <p style="font-size: 0.95rem; color: var(--fg); margin: 0; line-height: 1.5;">"${item.pesan || ''}"</p>
            </div>
        `).join('');
    } catch (e) {
        console.error("Fetch Review Error:", e);
        listEl.innerHTML = '<span style="color:#ff5555;">Gagal memuat ulasan. Pastikan Google Script di-deploy ke "Anyone".</span>';
    }
}

// Form Submit Event Handler
const revForm = document.getElementById('reviewForm');
if (revForm) {
    revForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSubmitReview');
        const status = document.getElementById('reviewStatus');
        
        const payload = {
            nama: document.getElementById('revNama').value,
            rating: document.getElementById('revRating').value,
            pesan: document.getElementById('revPesan').value
        };
        
        btn.disabled = true;
        btn.innerText = "Mengirim...";
        status.innerHTML = `<span style="color:var(--muted);">Sedang menyimpan ke database...</span>`;
        
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            status.innerHTML = `<span style="color:#50fa7b;">Terima kasih! Ulasan kamu berhasil disimpan.</span>`;
            revForm.reset();
            
            setTimeout(() => {
                loadReviews();
            }, 1500);
        } catch (err) {
            console.error("Submit Review Error:", err);
            status.innerHTML = `<span style="color:#ff5555;">Gagal mengirim ulasan. Coba lagi.</span>`;
        }
        
        btn.disabled = false;
        btn.innerText = "Kirim Penilaian";
    });
}

window.onload = () => { scrambleText(document.querySelector('#about-page .scramble-text')); updatePrompt(); };
document.getElementById('terminal-window').addEventListener('click', (e) => { if (!e.target.closest('.term-header') && !isVim && !isGaming) input.focus(); });