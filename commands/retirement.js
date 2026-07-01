const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("retirement")
        .setDescription("Announce a retirement")
        .addUserOption(option =>
            option
                .setName("personnel")
                .setDescription("Who is retiring?")
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName("rank")
                .setDescription("Rank")
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Reason for retirement")
                .setRequired(true)),

    async execute(interaction) {

        const personnel = interaction.options.getUser("personnel");
        const rank = interaction.options.getString("rank");
        const reason = interaction.options.getString("reason");

        const embed = new EmbedBuilder()
            .setTitle("RETIREMENT")
            .setColor("#2B2D31")
            .setDescription(
`Unfortunately, one of our DKL personnel, ${personnel} is retiring 😭.

Thank you for your service and hard work you've showed towards DKL. Your dedication will never be forgotten.

Thank you and o7.`
            )

            .addFields(
                {
                    name: "Personnel",
                    value: `${personnel}`,
                    inline: false
                },
                {
                    name: "Rank",
                    value: rank,
                    inline: false
                },
                {
                    name: "Reason",
                    value: reason,
                    inline: false
                },
                {
                    name: "Issuer",
                    value: `${interaction.user}`,
                    inline: false
                }
            )

            .setImage("https://cdn.discordapp.com/attachments/1513019398552813669/1518620020719091782/content.png")
            .setFooter({
                text: `Format last updated | ${new Date().toLocaleString()}`
            });

        await interaction.reply({
            embeds: [embed]
        });
    }
};
