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

// temporary storage (for now)
const pendingCodes = {};
const linkedAccounts = {};

// PING
client.on('messageCreate', message => {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    message.reply('Pong 🏓');
  }

  // VERIFY COMMAND
  if (message.content === '!verify') {
    const code = 'VERIFY-' + Math.floor(Math.random() * 90000 + 10000);

    pendingCodes[code] = message.author.id;

    message.reply(`Your verification code is: **${code}**\nEnter this in Roblox to link your account.`);
  }
});

// ROBLOX CALLS THIS
app.post('/verify', (req, res) => {
  const { code, robloxUserId } = req.body;

  const discordUserId = pendingCodes[code];

  if (!discordUserId) {
    return res.json({ success: false, message: 'Invalid code' });
  }

  linkedAccounts[robloxUserId] = discordUserId;

  delete pendingCodes[code];

  return res.json({ success: true });
});

app.get('/check/:robloxId', (req, res) => {
  const discordId = linkedAccounts[req.params.robloxId];

  res.json({
    linked: !!discordId,
    discordId: discordId || null
  });
});

app.listen(3000, () => {
  console.log('API running');
});

client.login(process.env.TOKEN);
