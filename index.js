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
const pendingCodes = new Map(); // code -> { discordId, expiresAt }
const linkedAccounts = new Map(); // robloxId -> discordId

// --------------------
// HEALTH CHECK
// --------------------
app.get('/', (req, res) => {
  res.send('DKL bot is alive - Running & developed by hamood1O');
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

  // ---------------- SIMPLE COMMANDS ----------------
  if (msg === '!goo boi') return message.reply('baa boi');
  if (msg === '!DKL') return message.reply('Hello, I am the DKL bot! I work for the greatest organization!');
  if (msg === '!hamood') return message.reply('hamooding');
  if (msg === '!paowies') return message.reply('paowies is a chud');
  if (msg === '!money') return message.reply('Money is the great supreme leader of Death Korps Legion.');
  if (msg === '!self destruct') return message.reply('**SELF DESTRUCT** COMMENCING...');
  if (msg === '!delete server') return message.reply('No.');

  // ---------------- VERIFY COMMAND ----------------
  if (msg === '!verify') {
    const code = 'VERIFY-' + Math.floor(10000 + Math.random() * 90000);

    pendingCodes.set(code, {
      discordId: message.author.id,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    try {
      await message.author.send(
        `Your verification code is:\n**${code}**\n\nUse in Roblox:\n!verify <CODE>\n\nExpires in 5 minutes.`
      );

      await message.reply('📩 Check your DMs for your code.');
    } catch (err) {
      await message.reply("❌ I couldn't DM you. Enable DMs and try again.");
    }
  }

  // ---------------- VIEW VERIFIED USERS ----------------
  if (msg === '!verified') {
    const entries = [...linkedAccounts.entries()];

    if (entries.length === 0) {
      return message.reply('No users are currently verified.');
    }

    const list = entries
      .map(([robloxId, discordId]) =>
        `Roblox ID: **${robloxId}** → Discord: <@${discordId}>`
      )
      .join('\n');

    return message.reply('**Verified Users:**\n' + list);
  }
});

// --------------------
// ROBLOX VERIFY ENDPOINT
// --------------------
app.post('/verify', (req, res) => {
  console.log('=== VERIFY REQUEST ===');
  console.log(req.body);

  const { code, robloxUserId } = req.body;

  if (!code || !robloxUserId) {
    return res.status(400).json({
      success: false,
      message: 'Missing code or robloxUserId'
    });
  }

  const data = pendingCodes.get(code);

  if (!data) {
    console.log(`[FAIL] Invalid/expired code: ${code}`);

    return res.json({
      success: false,
      message: 'Invalid or expired code'
    });
  }

  linkedAccounts.set(String(robloxUserId), data.discordId);
  pendingCodes.delete(code);

  console.log(`[SUCCESS] Roblox ${robloxUserId} linked to Discord ${data.discordId}`);

  return res.json({ success: true });
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
// ERROR HANDLING
// --------------------
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

// --------------------
// READY EVENT
// --------------------
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('==============================');
  console.log('API running on port', PORT);
  console.log('Verification system online');
  console.log('==============================');
});

// --------------------
// LOGIN BOT
// --------------------
client.login(process.env.TOKEN);
