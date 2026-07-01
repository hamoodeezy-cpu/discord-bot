const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    createInfraction,
    getUserInfractions,
    getCase,
    removeCase
} = require("../utils/infractions");

const LOG_CHANNEL = "1508903920800497735";
const STAFF_ROLE = "1355938863222362144";

function hasPerm(member) {
    return (
        member.permissions.has("Administrator") ||
        member.roles.cache.has(STAFF_ROLE)
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("infraction")
        .setDescription("Manage user infractions")

        .addSubcommand(sub =>
            sub
                .setName("issue")
                .setDescription("Issue an infraction to a user")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("User to issue the infraction to")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("type")
                        .setDescription("Type of punishment (Strike, Warning, Suspension, etc.)")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("reason")
                        .setDescription("Reason for the infraction")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("notes")
                        .setDescription("Additional notes")
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName("expiration")
                        .setDescription("Expiration date or Never")
                        .setRequired(false)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName("list")
                .setDescription("View all infractions for a user")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("User to view")
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName("case")
                .setDescription("View a case")
                .addIntegerOption(option =>
                    option
                        .setName("id")
                        .setDescription("Case ID")
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName("remove")
                .setDescription("Remove a case")
                .addIntegerOption(option =>
                    option
                        .setName("id")
                        .setDescription("Case ID")
                        .setRequired(true)
                )
        ),

    async execute(interaction) {

        if (!hasPerm(interaction.member)) {
            return interaction.reply({
                content: "❌ You do not have permission to use this command.",
                ephemeral: true
            });
        }

        const sub = interaction.options.getSubcommand();
        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL);

        if (sub === "issue") {

            const user = interaction.options.getUser("user");
            const type = interaction.options.getString("type");
            const reason = interaction.options.getString("reason");
            const notes = interaction.options.getString("notes") || "None";
            const expiration = interaction.options.getString("expiration") || "Never";

            const inf = createInfraction({
                userId: user.id,
                moderatorId: interaction.user.id,
                type,
                reason,
                notes,
                expiration
            });

            const embed = new EmbedBuilder()
                .setTitle(`Infraction #${inf.caseId}`)
                .setColor("Red")
                .addFields(
                    { name: "User", value: `<@${user.id}>`, inline: true },
                    { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "Punishment", value: type, inline: true },
                    { name: "Reason", value: reason },
                    { name: "Notes", value: notes },
                    { name: "Expires", value: expiration }
                )
                .setTimestamp();

            if (logChannel) {
                logChannel.send({ embeds: [embed] });
            }

            try {
                await user.send({ embeds: [embed] });
            } catch {}

            return interaction.reply({
                content: `✅ Successfully created Case #${inf.caseId}.`,
                ephemeral: true
            });
        }

        if (sub === "list") {

            const user = interaction.options.getUser("user");
            const list = getUserInfractions(user.id);

            if (!list.length) {
                return interaction.reply({
                    content: "No infractions found.",
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`${user.username}'s Infractions`)
                .setColor("Blue");

            list.forEach(i => {
                embed.addFields({
                    name: `Case #${i.caseId}`,
                    value: `${i.type} • ${i.reason}`
                });
            });

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        if (sub === "case") {

            const id = interaction.options.getInteger("id");
            const c = getCase(id);

            if (!c) {
                return interaction.reply({
                    content: "❌ Case not found.",
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`Case #${c.caseId}`)
                .setColor("Orange")
                .addFields(
                    { name: "User", value: `<@${c.userId}>` },
                    { name: "Moderator", value: `<@${c.moderatorId}>` },
                    { name: "Punishment", value: c.type },
                    { name: "Reason", value: c.reason },
                    { name: "Notes", value: c.notes },
                    { name: "Expires", value: c.expiration }
                )
                .setTimestamp(new Date(c.date));

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        if (sub === "remove") {

            const id = interaction.options.getInteger("id");

            removeCase(id);

            return interaction.reply({
                content: `✅ Removed Case #${id}.`,
                ephemeral: true
            });
        }

    }
};
