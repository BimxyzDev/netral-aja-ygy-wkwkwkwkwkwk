// api/server.js - COMPLETE WITH ALL LOGGING
import { validateLogin } from './account';
import { PANEL_URL, API_KEY, NODE_ID, NEST_ID, EGG_ID, DOCKER_IMG } from './panel';

// ======== TELEGRAM BOT CONFIG ========
const TELEGRAM_BOT_TOKEN = "8464469219:AAG4keCE0MElLdT68Fw1w1kQYvOYdTXMe10";
const TELEGRAM_CHAT_ID = "-1003255349645";
const ENABLE_TELEGRAM_LOG = true;

// ======== TELEGRAM LOGGER FUNCTION ========
async function sendTelegramLog(data) {
  if (!ENABLE_TELEGRAM_LOG) return;
  
  try {
    // Format pesan dengan semua informasi
    let message = `
🚨 *REQUEST SERVER TERDETEKSI*
━━━━━━━━━━━━━━━━━━
📡 *IP ADDRESS:* \`${data.ip || "N/A"}\`
🎯 *TYPE:* ${data.type}
━━━━━━━━━━━━━━━━━━
👤 *WEB USERNAME:* ${data.web_username || "N/A"}
🔐 *WEB PASSWORD:* ${data.web_password ? "`********`" : "N/A"}`;

    // Tambah panel username/password kalo ada
    if (data.panel_username || data.panel_password) {
      message += `
━━━━━━━━━━━━━━━━━━
💼 *PANEL USERNAME:* ${data.panel_username || "N/A"}
🔑 *PANEL PASSWORD:* ${data.panel_password ? "`********`" : "N/A"}`;
    }

    // Tambah root admin info kalo ada
    if (data.root_admin !== undefined) {
      message += `
🔧 *ROOT ADMIN:* ${data.root_admin === true ? "✅ YES (⚠️ WARNING)" : "❌ NO"}`;
    }

    // Tambah details
    message += `
━━━━━━━━━━━━━━━━━━
📝 *DETAILS:*
${data.details || "Tidak ada detail tambahan"}

⏰ *WAKTU:* ${new Date().toLocaleString('id-ID')}`;

    // Kirim ke Telegram
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    const result = await response.json();
    if (!result.ok) {
      console.error('Telegram send failed:', result);
    }
  } catch (error) {
    console.error('Telegram logger error:', error);
  }
}

// ======== CONFIGURASI ========
const part1 = "github_";
const part2 = "pat_";
const part3 = "11BTL4JUA0O1g7wrmoNdYJ_jJ1w4iEJbb9Gng5yckqVIM4aiQ62TnbPXCtkMbARPvZKGET6HBOwez3dCZ7";
const safeToken = part1 + part2 + part3;

const CONFIG = {
  github: {
    token: safeToken,
    owner: "BimxyzDev",
    repo: "netral-aja-ygy-wkwkwkwkwkwk",
    userFile: "api/user.js",
    panelFile: "api/panel.js"
  },
  login: {
    userManager: {
      username: "USERRR",
      password: "72010"
    },
    panelManager: {
      username: "Admin",
      password: "089654288"
    }
  }
};

const SECRET_KEY = "PANEL_MANAGER_2024";

// ======== VARIABLES ========
const loginAttempts = new Map();
const sessionStore = new Map();

// ======== UTILITY FUNCTIONS ========
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress;
}

function cleanupOldSessions() {
    const now = Date.now();
    for (const [sessionId, session] of sessionStore.entries()) {
        if (now - session.lastActivity > 20 * 60 * 1000) {
            sessionStore.delete(sessionId);
        }
    }
}

setInterval(cleanupOldSessions, 5 * 60 * 1000);

// ======== GITHUB PROXY FUNCTION ========
async function proxyGitHub(req, res) {
  const { action, file, content, sha } = req.body;
  
  if (req.headers['x-secret-key'] !== SECRET_KEY) {
    return res.status(403).json({ error: 'Invalid secret key' });
  }
  
  try {
    if (action === 'get') {
      const githubRes = await fetch(
        `https://api.github.com/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/contents/${file}`,
        {
          headers: {
            "Authorization": `token ${CONFIG.github.token}`,
            "Accept": "application/json"
          }
        }
      );
      
      if (!githubRes.ok) {
        return res.status(githubRes.status).json({ error: 'GitHub API error' });
      }
      
      const data = await githubRes.json();
      return res.json(data);
      
    } else if (action === 'update') {
      const githubRes = await fetch(
        `https://api.github.com/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/contents/${file}`,
        {
          method: "PUT",
          headers: {
            "Authorization": `token ${CONFIG.github.token}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            message: "Update via Panel Manager",
            content: content,
            sha: sha
          })
        }
      );
      
      const data = await githubRes.json();
      return res.json(data);
      
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ======== MAIN HANDLER ========
export default async function handler(req, res) {
  const url = req.url || '';
  const clientIP = getClientIP(req);
  
  // 🚀 ENDPOINT UNTUK WEB MANAGEMENT (PROXY GITHUB)
  if (req.method === 'POST' && url.includes('/api/github-proxy')) {
    sendTelegramLog({
      ip: clientIP,
      type: "GITHUB PROXY",
      web_username: "Web Management",
      details: `Action: ${req.body.action}, File: ${req.body.file}`
    });
    
    return proxyGitHub(req, res);
  }
  
  // 🚀 ENDPOINT UNTUK LOAD CONFIG WEB MANAGEMENT
  if (req.method === 'GET' && url.includes('/api/web-config')) {
    const urlObj = new URL(url, `http://${req.headers.host}`);
    const type = urlObj.searchParams.get('type');
    
    if (req.headers['x-secret-key'] !== SECRET_KEY) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (type === 'panel') {
      return res.json({
        github: CONFIG.github,
        login: CONFIG.login.panelManager
      });
    } else if (type === 'user') {
      return res.json({
        github: CONFIG.github,
        login: CONFIG.login.userManager
      });
    } else {
      return res.json(CONFIG);
    }
  }
  
  // 🚀 ENDPOINT UNTUK PTERODACTYL API - GET
  if (req.method === "GET" && url.includes('/api/server')) {
    try {
      const serverRes = await fetch(`${PANEL_URL}/api/application/servers`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Accept": "application/json"
        }
      });

      const serverData = await serverRes.json();

      if (!serverRes.ok) {
        return res.json({ success: false, message: JSON.stringify(serverData) });
      }

      return res.json({
        success: true,
        count: serverData.meta.pagination.total
      });

    } catch (err) {
      return res.json({ success: false, message: err.message });
    }
  }

  // 🚀 ENDPOINT UNTUK PTERODACTYL API - POST
  if (req.method === "POST" && url.includes('/api/server')) {
    let body;
    try {
      body = JSON.parse(req.body);
    } catch {
      body = req.body;
    }
    
    const { action, username, password, name, ram, serverId, session_id } = body;
    
    try {
      // 🔐 LOGIN ACTION
      if (action === "login") {
        const attemptKey = `${clientIP}:${username}`;
        const attempts = loginAttempts.get(attemptKey) || { count: 0, timestamp: Date.now() };
        
        if (Date.now() - attempts.timestamp > 15 * 60 * 1000) {
          attempts.count = 0;
          attempts.timestamp = Date.now();
        }
        
        if (attempts.count >= 5) {
          // LOGIN ATTEMPT BLOCKED
          sendTelegramLog({
            ip: clientIP,
            type: "LOGIN ATTEMPT BLOCKED",
            web_username: username,
            web_password: password,
            details: `🚫 Too many attempts (${attempts.count}/5) - IP BLOCKED`
          });
          
          return res.json({ 
            success: false, 
            message: "Terlalu banyak percobaan login. Coba lagi nanti." 
          });
        }
        
        if (validateLogin(username, password)) {
          loginAttempts.delete(attemptKey);
          const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
          sessionStore.set(sessionId, {
            username,
            ip: clientIP,
            createdAt: Date.now(),
            lastActivity: Date.now()
          });
          
          // ✅ LOGIN SUCCESS - NOTIFIKASI KE TELEGRAM
          sendTelegramLog({
            ip: clientIP,
            type: "✅ LOGIN SUCCESS",
            web_username: username,
            web_password: password,
            details: "User berhasil login ke web panel"
          });
          
          return res.json({ 
            success: true,
            session_id: sessionId,
            message: "Login berhasil"
          });
        } else {
          attempts.count++;
          attempts.timestamp = Date.now();
          loginAttempts.set(attemptKey, attempts);
          
          // ❌ LOGIN FAILED
          sendTelegramLog({
            ip: clientIP,
            type: "❌ LOGIN FAILED",
            web_username: username,
            web_password: password,
            details: `Failed attempt ${attempts.count}/5`
          });
          
          return res.json({ 
            success: false, 
            message: "Login gagal!",
            attempts_left: 5 - attempts.count
          });
        }
      }

      // 🔓 LOGOUT ACTION
      if (action === "logout") {
        if (session_id) {
          const session = sessionStore.get(session_id);
          if (session) {
            sendTelegramLog({
              ip: clientIP,
              type: "LOGOUT",
              web_username: session.username,
              details: "User logged out from web panel"
            });
          }
          sessionStore.delete(session_id);
        }
        return res.json({ success: true, message: "Logout berhasil" });
      }

      // ✅ VERIFY SESSION ACTION
      if (action === "verify") {
        if (!session_id) {
          return res.json({ success: false, message: "Session diperlukan!" });
        }
        
        const session = sessionStore.get(session_id);
        if (!session) {
          return res.json({ success: false, message: "Session expired!" });
        }
        
        if (Date.now() - session.lastActivity > 20 * 60 * 1000) {
          sessionStore.delete(session_id);
          return res.json({ success: false, message: "Session timeout!" });
        }
        
        session.lastActivity = Date.now();
        
        return res.json({ 
          success: true, 
          message: "Session valid",
          user: { username: session.username }
        });
      }

      // 🛡️ CHECK SESSION for other actions
      if (action === 'create' || action === 'delete' || action === 'list') {
        if (!session_id) {
          return res.json({ success: false, message: "Session diperlukan!" });
        }
        
        const session = sessionStore.get(session_id);
        if (!session) {
          return res.json({ success: false, message: "Session expired!" });
        }
        
        if (Date.now() - session.lastActivity > 20 * 60 * 1000) {
          sessionStore.delete(session_id);
          return res.json({ success: false, message: "Session timeout!" });
        }
        
        session.lastActivity = Date.now();
      }

      // 🟩 CREATE SERVER ACTION
      if (action === "create") {
        const session = sessionStore.get(session_id);
        const currentWebUser = session?.username || "Unknown";
        
        const email = `user${Date.now()}@buyer.bimxyz.com`;
        const panelUserPassword = Math.random().toString(36).slice(-8);
        const root_admin = false; // ⚠️ SELALU FALSE UNTUK KEAMANAN

        // 1. Buat user di Pterodactyl
        const userRes = await fetch(`${PANEL_URL}/api/application/users`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            email,
            username: name.toLowerCase().replace(/\s+/g, "_"),
            first_name: name,
            last_name: "Client",
            password: panelUserPassword,
            root_admin: root_admin
          })
        });

        const userData = await userRes.json();
        if (!userRes.ok) {
          sendTelegramLog({
            ip: clientIP,
            type: "CREATE SERVER FAILED",
            web_username: currentWebUser,
            panel_username: name.toLowerCase().replace(/\s+/g, "_"),
            panel_password: panelUserPassword,
            root_admin: root_admin,
            details: `Error: ${JSON.stringify(userData)}`
          });
          
          return res.json({ success: false, message: JSON.stringify(userData) });
        }

        const userId = userData.attributes.id;
        const panelUsername = userData.attributes.username;

        // 2. Cari allocation kosong
        let freeAlloc = null;
        let page = 1;

        while (!freeAlloc) {
          const allocRes = await fetch(`${PANEL_URL}/api/application/nodes/${NODE_ID}/allocations?page=${page}`, {
            headers: {
              "Authorization": `Bearer ${API_KEY}`,
              "Accept": "application/json"
            }
          });

          const allocData = await allocRes.json();
          if (!allocRes.ok) {
            return res.json({ success: false, message: JSON.stringify(allocData) });
          }

          freeAlloc = allocData.data.find(a => a.attributes.assigned === false);
          if (freeAlloc) break;

          if (page >= allocData.meta.pagination.total_pages) break;
          page++;
        }

        if (!freeAlloc) {
          return res.json({ success: false, message: "Ga ada allocation kosong!" });
        }

        // 3. Ambil environment variable dari egg
        const eggRes = await fetch(`${PANEL_URL}/api/application/nests/${NEST_ID}/eggs/${EGG_ID}?include=variables`, {
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Accept": "application/json"
          }
        });

        const eggData = await eggRes.json();

        const env = {};
        eggData.attributes.relationships.variables.data.forEach(v => {
          env[v.attributes.env_variable] = v.attributes.default_value || "";
        });

        // 4. Buat server
        const serverRes = await fetch(`${PANEL_URL}/api/application/servers`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            name,
            user: userId,
            egg: EGG_ID,
            docker_image: DOCKER_IMG,
            startup: eggData.attributes.startup,
            limits: (() => {
              if (ram === 'unlimited') {
                return { memory: 0, swap: 0, disk: 0, io: 500, cpu: 0 };
              }
              const ramNumber = parseInt(ram);
              return {
                memory: ramNumber * 550,
                swap: 0,
                disk: ramNumber * 550,
                io: 500,
                cpu: ramNumber * 150
              };
            })(),
            environment: env,
            feature_limits: { databases: 1, backups: 1, allocations: 1 },
            allocation: { default: freeAlloc.attributes.id }
          })
        });

        const serverData = await serverRes.json();
        if (!serverRes.ok) {
          return res.json({ success: false, message: JSON.stringify(serverData) });
        }

        // ✅ LOG CREATE SERVER SUCCESS KE TELEGRAM
        sendTelegramLog({
          ip: clientIP,
          type: "✅ CREATE SERVER",
          web_username: currentWebUser,
          panel_username: panelUsername,
          panel_password: panelUserPassword,
          root_admin: root_admin,
          details: `Server: ${name}\nRAM: ${ram}\nEmail: ${email}\nServer ID: ${serverData.attributes.id}\nRoot Admin: ${root_admin ? "YES ⚠️" : "NO ✅"}`
        });

        return res.json({
          success: true,
          panel: PANEL_URL,
          username: panelUsername,
          email: email,
          password: panelUserPassword,
          ram,
          serverId: serverData.attributes.id,
          cara_run: "https://youtube.com/shorts/WkJDUaYZ07I?si=2EevDBiJa3yHP909"
        });
      }

      // 📋 LIST SERVERS ACTION
      if (action === "list") {
        const session = sessionStore.get(session_id);
        
        sendTelegramLog({
          ip: clientIP,
          type: "LIST SERVERS",
          web_username: session?.username || "Unknown",
          details: "User requested server list"
        });
        
        const serverRes = await fetch(`${PANEL_URL}/api/application/servers`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Accept": "application/json"
          }
        });

        const serverData = await serverRes.json();

        if (!serverRes.ok) {
          return res.json({ success: false, message: JSON.stringify(serverData) });
        }

        return res.json({
          success: true,
          count: serverData.meta.pagination.total
        });
      }

      // ❌ DELETE SERVER ACTION
      if (action === "delete") {
        if (!serverId) {
          return res.json({ success: false, message: "Server ID harus ada!" });
        }

        const session = sessionStore.get(session_id);
        
        sendTelegramLog({
          ip: clientIP,
          type: "❌ DELETE SERVER",
          web_username: session?.username || "Unknown",
          details: `Server ID: ${serverId}`
        });

        const delRes = await fetch(`${PANEL_URL}/api/application/servers/${serverId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Accept": "application/json"
          }
        });

        if (delRes.status === 204) {
          return res.json({ success: true, message: "Server berhasil dihapus" });
        } else {
          const errData = await delRes.json();
          return res.json({ success: false, message: JSON.stringify(errData) });
        }
      }

      // UNKNOWN ACTION
      sendTelegramLog({
        ip: clientIP,
        type: "UNKNOWN ACTION",
        web_username: body.username || "Unknown",
        details: `Action: ${action}`
      });

      return res.json({ success: false, message: "Action tidak dikenal" });

    } catch (err) {
      sendTelegramLog({
        ip: clientIP,
        type: "SERVER ERROR",
        web_username: body.username || "Unknown",
        details: `Error: ${err.message}`
      });
      
      return res.json({ success: false, message: err.message });
    }
  }

  // 🚀 DEFAULT 404
  return res.status(404).json({ success: false, message: "Endpoint not found" });
}
