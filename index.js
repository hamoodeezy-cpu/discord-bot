const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

// --------------------
// DISCORD CLIENT
// --------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// --------------------
// FILE STORAGE
// --------------------
const FILE = './data.json';

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(FILE));
  } catch {
    return { linked: {}, certs: {} };
  }
}

function saveDB(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

let db = loadDB();

// --------------------
// VERIFY CODES
// --------------------
const pendingCodes = new Map();

// --------------------
// ROLE IDS → CERT MAP (IMPORTANT FIX)
// --------------------
const ROLE_CERT_MAP = {
  "1519470704112832604": "JET",
  "1519470833008119910": "TANK",
  "1519472942537248889": "HELICOPTER",
  "1519473317168418958": "HUMVEE"
};

// --------------------
// CHECK USER ROLES → UPDATE CERTS
// --------------------
async function syncUserCerts(guild, member) {
  const certs = [];

  member.roles.cache.forEach(role => {
    const cert = ROLE_CERT_MAP[role.id];
    if (cert) certs.push(cert);
  });

  db.certs[member.id] = certs;
  saveDB(db);
}

// --------------------
// VERIFY ROLE SYNC ON JOIN / UPDATE
// --------------------
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  await syncUserCerts(newMember.guild, newMember);
});

client.on('guildMemberAdd', async (member) => {
  await syncUserCerts(member.guild, member);
});

// --------------------
// COMMANDS
// --------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const msg = message.content;

  // --------------------
  // !verify
  // --------------------
  if (msg === '!verify') {
    const code = 'VERIFY-' + Math.floor(10000 + Math.random() * 90000);

    pendingCodes.set(code, {
      discordId: message.author.id,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    try {
      await message.author.send(`Your code: **${code}**`);
      return message.reply("📩 Check DMs.");
    } catch {
      return message.reply("❌ Enable DMs.");
    }
  }

  // --------------------
  // !verified (ADMIN ONLY)
  // --------------------
  if (msg === '!verified') {

    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Admin only.");
    }

    const entries = Object.entries(db.linked);

    if (entries.length === 0) {
      return message.reply("❌ No verified users found.");
    }

    let output = "📋 **Verified Users:**\n\n";

    for (const [robloxId, discordId] of entries) {

      let name = discordId;

      try {
        const user = await client.users.fetch(discordId);
        name = user.username;
      } catch {}

      const certs = db.certs[discordId] || [];

      output += `Roblox ID: ${robloxId} → @${name} (${certs.join(", ") || "No Certs"})\n`;
    }

    return message.reply(output.slice(0, 1900));
  }
});

// --------------------
// ROBLOX VERIFY ENDPOINT
// --------------------
app.post('/verify', (req, res) => {
  const { code, robloxUserId } = req.body;

  const data = pendingCodes.get(code);
  if (!data) {
    return res.json({ success: false });
  }

  db.linked[String(robloxUserId)] = data.discordId;
  saveDB(db);

  pendingCodes.delete(code);

  console.log("LINKED:", robloxUserId, "→", data.discordId);

  return res.json({
    success: true,
    discordId: data.discordId
  });
});

// --------------------
// ROLES ENDPOINT (ROBLOX)
// --------------------
app.get('/roles/:discordId', (req, res) => {
  const discordId = String(req.params.discordId);

  const roles = [];

  if (Object.values(db.linked).includes(discordId)) {
    roles.push("verified");
  }

  const certs = db.certs[discordId] || [];
  roles.push(...certs);

  res.json(roles);
});

// --------------------
// START SERVER
// --------------------
app.listen(3000, () => {
  console.log("Server running (ROLE ID CERT SYSTEM ACTIVE)");
});

client.login(process.env.TOKEN);
