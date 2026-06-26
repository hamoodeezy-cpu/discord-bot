const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

// --------------------
// DISCORD CLIENT
// --------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// --------------------
// STORAGE
// --------------------
const pendingCodes = new Map();     // code -> { discordId, expiresAt }
const linkedAccounts = new Map();   // robloxId -> discordId
const userCerts = new Map();        // discordId -> ["JET", "HELICOPTER"]

// --------------------
// CERT IDS (REFERENCE ONLY)
// --------------------
const CERT_IDS = {
  JET: "1519470704112832604",
  TANK: "1519470833008119910",
  HELICOPTER: "1519472942537248889",
  HUMVEE: "1519473317168418958"
};

// --------------------
// LOGGING
// --------------------
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// --------------------
// HEALTH CHECK
// --------------------
app.get('/', (req, res) => {
  res.send('DKL bot running - cert system active');
});

// --------------------
// CLEAN EXPIRED CODES
// --------------------
setInterval(() => {
  const now = Date.now();

  for (const [code, data] of pendingCodes.entries()) {
    if (data.expiresAt <= now) {
      pendingCodes.delete(code);
    }
  }
}, 30000);

// --------------------
// DISCORD COMMANDS
// --------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const msg = message.content;

  // --------------------
  // !verify (EVERYONE)
  // --------------------
  if (msg === '!verify') {
    const code = 'VERIFY-' + Math.floor(10000 + Math.random() * 90000);

    pendingCodes.set(code, {
      discordId: message.author.id,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    try {
      await message.author.send(
        `Your verification code:\n**${code}**\n\nUse in Roblox:\n!verify <CODE>`
      );
      return message.reply("📩 Check your DMs.");
    } catch {
      return message.reply("❌ Enable DMs to receive your code.");
    }
  }

  // --------------------
  // !verified (ADMIN ONLY LIST)
  // --------------------
  if (msg === '!verified') {

    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Only Discord administrators can use this command.");
    }

    if (linkedAccounts.size === 0) {
      return message.reply("❌ No verified users found.");
    }

    let output = "📋 **Verified Users:**\n\n";

    for (const [robloxId, discordId] of linkedAccounts.entries()) {

      let username = discordId;

      try {
        const user = await client.users.fetch(discordId);
        username = user.username;
      } catch {}

      const certs = userCerts.get(discordId) || [];

      output += `Roblox ID: ${robloxId} → Discord: @${username} (${certs.join(", ") || "No Certs"})\n`;
    }

    if (output.length > 1900) {
      output = output.slice(0, 1900) + "\n... (truncated)";
    }

    return message.reply(output);
  }
});

// --------------------
// ROBLOX VERIFY ENDPOINT
// --------------------
app.post('/verify', (req, res) => {
  const { code, robloxUserId } = req.body;

  if (!code || !robloxUserId) {
    return res.json({ success: false });
  }

  const data = pendingCodes.get(code);
  if (!data) {
    return res.json({ success: false });
  }

  linkedAccounts.set(String(robloxUserId), data.discordId);
  pendingCodes.delete(code);

  return res.json({
    success: true,
    discordId: data.discordId
  });
});

// --------------------
// ROLES / CERTS (ROBLOX USES THIS)
// --------------------
app.get('/roles/:discordId', (req, res) => {
  const discordId = String(req.params.discordId);

  const roles = [];

  // VERIFIED CHECK
  let linked = false;
  for (const [, dId] of linkedAccounts.entries()) {
    if (dId === discordId) {
      linked = true;
      break;
    }
  }

  if (linked) roles.push("verified");

  // CERTS
  const certs = userCerts.get(discordId) || [];
  for (const cert of certs) {
    roles.push(cert);
  }

  res.json(roles);
});

// --------------------
// CHECK LINK STATUS
// --------------------
app.get('/check/:robloxId', (req, res) => {
  const discordId = linkedAccounts.get(String(req.params.robloxId));

  res.json({
    linked: !!discordId,
    discordId: discordId || null
  });
});

// --------------------
// START SERVER
// --------------------
app.listen(3000, () => {
  console.log("API running on port 3000");
});

// --------------------
// LOGIN DISCORD BOT
// --------------------
client.login(process.env.TOKEN);
