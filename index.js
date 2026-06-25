const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// storage
const pendingCodes = new Map(); // code -> { discordId, expiresAt }
const linkedAccounts = new Map(); // robloxId -> discordId

// --------------------
// KEEP-ALIVE ROUTE
// --------------------
app.get('/', (req, res) => {
  res.send('DKL bot is alive - Running & developed by hamood1O');
});

// cleanup expired codes every 30s
setInterval(() => {
  const now = Date.now();

  for (const [code, data] of pendingCodes.entries()) {
    if (data.expiresAt <= now) {
      pendingCodes.delete(code);
    }
  }
}, 30000);

// --------------------
// BOT COMMANDS
// --------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // ping
  if (message.content === '!goo boi') {
    return message.reply('baa boi');
  }

  // ping
  if (message.content === '!DKL') {
    return message.reply('Hello, I am the DKL bot! I work for the greatest organization!');
  }

  // ping
  if (message.content === '!hamood') {
    return message.reply('hamooding');
  }

  // ping
  if (message.content === '!paowies') {
    return message.reply('paowies is a chud');
  }

  // ping
  if (message.content === '!money') {
    return message.reply('Money is the great supreme leader of Death Korps Legion.');
  }

  // verify
  if (message.content === '!verify') {
    const code = 'VERIFY-' + Math.floor(10000 + Math.random() * 90000);

    pendingCodes.set(code, {
      discordId: message.author.id,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    try {
      await message.author.send(
        `Your verification code is:\n**${code}**\n\nEnter **!verify <YOUR CODE>** in the Death Korp Legions Roblox game's chat to link your account.\nThis code expires in **5 minutes.**`
      );

      await message.reply('📩 I sent your verification code in DMs.');
    } catch (err) {
      await message.reply("❌ I couldn't DM you. Please enable DMs and try again.");
    }
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
    return res.json({ success: false, message: 'Invalid or expired code' });
  }

  linkedAccounts.set(String(robloxUserId), data.discordId);
  pendingCodes.delete(code);

  return res.json({ success: true });
});

// --------------------
// CHECK LINK
// --------------------
app.get('/check/:robloxId', (req, res) => {
  const discordId = linkedAccounts.get(String(req.params.robloxId));

  res.json({
    linked: !!discordId,
    discordId: discordId || null
  });
});

// --------------------
// ERROR LOGGING
// --------------------
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// --------------------
// START API
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`);
});

// --------------------
// START BOT
// --------------------
client.login(process.env.TOKEN);
