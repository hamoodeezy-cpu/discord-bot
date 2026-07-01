const {
    Client,
    GatewayIntentBits,
    ActivityType,
    Collection,
    REST,
    Routes
} = require('discord.js');
const express = require('express');

const app = express();
const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior
} = require('@discordjs/voice');


const fs = require('fs');
app.use(express.json());

// --------------------
// DISCORD BOT
// --------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// --------------------
// SLASH COMMAND LOADER
// --------------------
client.commands = new Collection();

const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

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
let connection;
let player;

let loopEnabled = false;
let currentResource = null;

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const msg = message.content;

    if (msg.startsWith('!brm5')) {
  if (!message.member) return;

  const args = msg.split(' ');
  const code = args.slice(1).join(' ');

  if (!code) {
    return message.reply('❌ Usage: !brm5 <server code>');
  }

  const brm5Message = `## *BRM5 Deployment*

Hello <@&1313620498768203827> , <@&1519889298785304687> , <@&1519889157927731270>

A BRM5 deployment is being hosted in 15 minutes, start joining now! Wait for further instructions in https://discordapp.com/channels/1302283181998997616/1512985724948054236

Server Code Is:
\`\`\`${code}\`\`\`

In-game: Red Squad

***React to this message if attending!!!***`;

  const sent = await message.channel.send(brm5Message);

  await sent.react('✅');

  return;
}

  // ❌ DELETE SERVER (admin only)
  if (msg === '!delete server') {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Only Administrators can use this command.");
    }
    return message.reply("**DELETING** SERVER . . .");
  }

  // ♻️ RESTORE SERVER (admin only)
  if (msg === '!restore server') {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Only Administrators can use this command.");
    }
    return message.reply("**RESTORING** SERVER . . .");
  }

  // 😄 FUN
  if (msg === '!hamood') {
    return message.reply('hamooding!');
  }

   if (msg === '<@1316492330039115849>') {
    return message.reply('DKL Automation at your service!');
  }

  // 💰 MONEY (admin only)
  if (msg === '!money') {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Only Administrators can use this command.");
    }
    return message.reply('<@927919176595697714>');
  }

if (msg === '!play') {
  const channel = message.member.voice.channel;

  if (!channel) {
    return message.reply(". . .");
  }

  // Join VC if needed
  if (!connection || connection.joinConfig.channelId !== channel.id) {
    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });
  }

  // Create player once
  if (!player) {
    player = createAudioPlayer();

    connection.subscribe(player);

  }

  // Always restart song safely
  const resource = createAudioResource('./music.mp3');
  player.play(resource);

  return message.reply(". . .");
}
 
  if (msg === '!loop on') {
  loopEnabled = true;
  return message.reply(". . .");
}

if (msg === '!loop off') {
  loopEnabled = false;
  return message.reply(". . .");
}

  // ⛔ STOP MUSIC
if (msg === '!stop') {
  loopEnabled = false; // Optional: disable looping

  if (player) {
    player.stop(true);
  }

  return message.reply(". . .");
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
// READY EVENT
// --------------------
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
    try {

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    const commands = [];

    client.commands.forEach(command => {
        commands.push(command.data.toJSON());
    });

    await rest.put(
        Routes.applicationCommands(client.user.id),
        {
            body: commands
        }
    );

    console.log("✅ Slash commands registered.");

} catch (err) {
    console.error(err);
}

client.user.setPresence({
  activities: [
    {
      name: "Death Korps Legion | Hamood",
      type: ActivityType.Watching,
    },
  ],
  status: "online",
});
  
  const guild = client.guilds.cache.get("1302283181998997616");
  if (!guild) return console.log("❌ Server not found.");

  const channel = guild.channels.cache.get("1520098207550406837");
  if (!channel) return console.log("❌ Voice channel not found.");

  try {
     connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });

     player = createAudioPlayer();

player.on('stateChange', (oldState, newState) => {
  if (newState.status === AudioPlayerStatus.Idle && loopEnabled) {
    player.stop();
player.play(createAudioResource('./music.mp3'));
  }
});

connection.subscribe(player);
 
    console.log("🎧 Joined VC on startup");
  } catch (err) {
    console.error("Failed to join VC:", err);
  }
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

client.on('voiceStateUpdate', (oldState, newState) => {
  if (
    oldState.member.id === client.user.id &&
    oldState.channelId &&
    !newState.channelId
  ) {
    console.log("Bot was disconnected. Rejoining in 2 seconds...");

    setTimeout(() => {
      connection = joinVoiceChannel({
        channelId: "1520098207550406837",
        guildId: "1302283181998997616",
        adapterCreator: oldState.guild.voiceAdapterCreator,
      });

      if (player) {
        connection.subscribe(player);
      }
    }, 2000);
  }
});

// --------------------
// SLASH COMMAND HANDLER
// --------------------
client.on("interactionCreate", async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {

        await command.execute(interaction);

    } catch (error) {

        console.error(error);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "❌ An error occurred while executing this command.",
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: "❌ An error occurred while executing this command.",
                ephemeral: true
            });
        }

    }

});

// --------------------
// LOGIN BOT
// --------------------
client.login(process.env.TOKEN);
