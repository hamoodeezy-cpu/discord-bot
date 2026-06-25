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

// cleanup expired codes every 30s
setInterval(() => {
  const now = Date.now();

  for (const [code, data] of pendingCodes.entries()) {
    if (data.expiresAt <= now) {
      pendingCodes.delete(code);
    }
  }
}, 30000);

// BOT COMMANDS
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // ping
  if (message.content === '!ping') {
    return message.reply('Pong 🏓');
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
        `Your verification code is:\n**${code}**\n\nEnter this in Roblox to link your account.\nThis code expires in 5 minutes.`
      );

      await message.reply("📩 I sent your verification code in DMs.");
    } catch (err) {
      await message.reply("❌ I couldn't DM you. Please enable DMs and try again.");
    }
  }
});

// ROBLOX VERIFY ENDPOINT
app.post('/verify', (req, res) => {
  const { code, robloxUserId } = req.body;

  const data = pendingCodes.get(code);

  if (!data) {
    return res.json({ success: false, message: 'Invalid or expired code' });
  }

  linkedAccounts.set(robloxUserId, data.discordId);

  pendingCodes.delete(code);

  return res.json({ success: true });
});

// CHECK LINK
app.get('/check/:robloxId', (req, res) => {
  const discordId = linkedAccounts.get(req.params.robloxId);

  res.json({
    linked: !!discordId,
    discordId: discordId || null
  });
});

// start API
app.listen(3000, () => {
  console.log('API running on port 3000');
});

// start bot
client.login(process.env.TOKEN);
