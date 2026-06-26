const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

// --------------------
// DISCORD BOT SETUP
// --------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// --------------------
// MEMORY STORAGE (TEMP)
// --------------------
const pendingCodes = new Map();     // code -> { discordId, expiresAt }
const linkedAccounts = new Map();   // robloxId -> discordId

// --------------------
// LOGGING MIDDLEWARE
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
// CLEANUP EXPIRED CODES
// --------------------
setInterval(() => {
  const now = Date.now();

  for (const [code, data] of pendingCodes.entries()) {
    if (data.expiresAt <= now) {
      pendingCodes.delete(code);
      console.log(`[CLEANUP] Removed expired code: ${code}`);
    }
  }
}, 30000);

// --------------------
// DISCORD COMMANDS
// --------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const msg = message.content;

  // fun commands
  if (msg === '!goo boi') return message.reply('baa boi');
  if (msg === '!DKL') return message.reply('DKL bot online.');
  if (msg === '!hamood') return message.reply('hamooding');
  if (msg === '!money') return message.reply('Money is supreme.');
  if (msg === '!delete server') return message.reply('No.');

  // --------------------
  // VERIFY COMMAND
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

      await message.reply('📩 Check your DMs for your code.');
    } catch {
      await message.reply("❌ Enable DMs to receive your code.");
    }
  }
});

// --------------------
// VERIFY ENDPOINT (ROBLOX)
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

  console.log(`[VERIFY] Roblox ${robloxUserId} linked to Discord ${data.discordId}`);

  return res.json({
    success: true,
    discordId: data.discordId
  });
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
// ROLES SYSTEM (NEW)
// --------------------
app.get('/roles/:discordId', (req, res) => {
  const discordId = String(req.params.discordId);

  const roles = [];

  // find linked roblox account
  for (const [robloxId, dId] of linkedAccounts.entries()) {
    if (dId === discordId) {
      roles.push("verified");
      break;
    }
  }

  // OPTIONAL ADMIN ROLE (edit this)
  const ADMIN_IDS = [
    "YOUR_DISCORD_ID_HERE"
  ];

  if (ADMIN_IDS.includes(discordId)) {
    roles.push("admin");
  }

  res.json(roles);
});

// --------------------
// ERROR HANDLING
// --------------------
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

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
  console.log('Verification system online');
  console.log('================================');
});

// --------------------
// LOGIN BOT
// --------------------
client.login(process.env.TOKEN);
