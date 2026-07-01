const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brm5')
    .setDescription('Create a BRM5 deployment announcement')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('Server code')
        .setRequired(true)
    ),

  async execute(interaction) {
    const code = interaction.options.getString('code');

    const message = `## *BRM5 Deployment*

Hello <@&1313620498768203827> , <@&1519889298785304687> , <@&1519889157927731270>

A BRM5 deployment is being hosted in 15 minutes, start joining now! Wait for further instructions in https://discordapp.com/channels/1302283181998997616/1512985724948054236

Server Code Is:
\`\`\`${code}\`\`\`

In-game: Red Squad

***React to this message if attending!!!***`;

    const msg = await interaction.channel.send({
      content: message
    });

    await msg.react('✅');

    await interaction.reply({
      content: 'BRM5 deployment posted.',
      ephemeral: true
    });
  }
};
