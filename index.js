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

// --------------------
// STORAGE
// --------------------
const pendingCodes = new Map();     // code -> discordId
const linkedAccounts = new Map();   // robloxId -> discordId

// CERT DATABASE (Discord ID -> certs)
const userCerts = new Map();

/*
Example:
userCerts.set("discordId", ["JET", "HELICOPTER"])
*/

// --------------------
// YOUR CERT IDS (REFERENCE ONLY)
// --------------------
const CERT_IDS = {
  JET: "1519470704112832604",
  TANK: "TANK_CERT_ID",
  HELICOPTER: "HELI_CERT_ID",
  HUMVEE: "HUMVEE_CERT_ID"
};

// --------------------
// VERIFY SYSTEM
// --------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const msg = message.content;

  if (msg === '!verify') {
    const code = 'VERIFY-' + Math.floor(10000 + Math.random() * 90000);

    pendingCodes.set(code, {
      discordId: message.author.id,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    await message.author.send(`Your code: **${code}**`);
    return message.reply("Check DMs.");
  }

  // GIVE TEST CERTS (TEMP COMMAND FOR YOU)
  if (msg === '!givejet') {
    const certs = userCerts.get(message.author.id) || [];
    certs.push("JET");
    userCerts.set(message.author.id, certs);
    return message.reply("JET CERT GRANTED");
  }
});

// --------------------
// ROBLOX VERIFY
// --------------------
app.post('/verify', (req, res) => {
  const { code, robloxUserId } = req.body;

  const data = pendingCodes.get(code);
  if (!data) {
    return res.json({ success: false });
  }

  linkedAccounts.set(String(robloxUserId), data.discordId);
  pendingCodes.delete(code);

  res.json({
    success: true,
    discordId: data.discordId
  });
});

// --------------------
// ROLES / CERTS ENDPOINT
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

  // CERTS CHECK
  const certs = userCerts.get(discordId) || [];

  for (const cert of certs) {
    roles.push(cert);
  }

  res.json(roles);
});

// --------------------
// CHECK
// --------------------
app.get('/check/:robloxId', (req, res) => {
  const discordId = linkedAccounts.get(String(req.params.robloxId));

  res.json({
    linked: !!discordId,
    discordId: discordId || null
  });
});

// --------------------
// START
// --------------------
app.listen(3000, () => {
  console.log("Server running");
});

client.login(process.env.TOKEN);
