const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

// --------------------
// DISCORD BOT
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
  res.send('DKL bot is alive - verification system running');
});

// --------------------
// CLEAN EXPIRED CODES
// --------------------
setInterval(() => {
  const now = Date.now();

  for (const [code, data] of pendingCodes.entries()) {
    if (data.expiresAt <= now) {
      pendingCodes.delete(code);
      console.log(`[CLEANUP] Expired code removed: ${code}`);
    }
  }
}, 30000);

// --------------------
// DISCORD COMMANDS
// --------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const msg = message.content;

  if (msg === '!delete server') {

  if (!message.member.permissions.has("Administrator")) {
    return message.reply("❌ Only Administrators can use this command.");
  }

  return message.reply('**DELETING** SERVER . . .');
}

if (msg === '!restore server') {

  if (!message.member.permissions.has("Administrator")) {
    return message.reply("❌ Only Administrators can use this command.");
  }

  return message.reply('**RESTORING** SERVER . . .');
}

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
        `Your verification code:\n**${code}**\n\nUse in Roblox:\n!verify <CODE>\nExpires in 5 minutes.`
      );

      return message.reply('📩 Check your DMs for your code.');
    } catch {
      return message.reply("❌ I couldn't DM you. Enable DMs and try again.");
    }
  }

  // --------------------
  // !verified (ADMIN ONLY)
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

      let userTag;

      try {
        const user = await client.users.fetch(discordId);
        userTag = `@${user.username}`;
      } catch {
        userTag = `@Unknown`;
      }

      output += `Roblox ID: ${robloxId} → Discord: ${userTag}\n`;
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
    return res.status(400).json({
      success: false,
      message: 'Missing code or robloxUserId'
    });
  }

  const data = pendingCodes.get(code);

  if (!data) {
    return res.json({
      success: false,
      message: 'Invalid or expired code'
    });
  }

  linkedAccounts.set(String(robloxUserId), data.discordId);
  pendingCodes.delete(code);

  console.log(`[VERIFY] Roblox ${robloxUserId} → Discord ${data.discordId}`);

  return res.json({
    success: true,
    discordId: data.discordId
  });
});

// --------------------
// CHECK STATUS
// --------------------
app.get('/check/:robloxId', (req, res) => {
  const discordId = linkedAccounts.get(String(req.params.robloxId));

  res.json({
    linked: !!discordId,
    discordId: discordId || null
  });
});

// --------------------
// ROLES SYSTEM
// --------------------
app.get('/roles/:discordId', (req, res) => {
  const discordId = String(req.params.discordId);

  const roles = [];

  for (const [, dId] of linkedAccounts.entries()) {
    if (dId === discordId) {
      roles.push("verified");
      break;
    }
  }

  const ADMIN_IDS = ["YOUR_DISCORD_ID_HERE"];

  if (ADMIN_IDS.includes(discordId)) {
    roles.push("admin");
  }

  res.json(roles);
});

// --------------------
// BOT READY
// --------------------
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('================================');
  console.log(`API running on port ${PORT}`);
  console.log('Verification system ready');
  console.log('================================');
});

// --------------------
// LOGIN BOT
// --------------------
client.login(process.env.TOKEN);
