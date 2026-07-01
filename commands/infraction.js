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
        .setDescription("Infraction system")

        .addSubcommand(s =>
            s.setName("issue")
                .setDescription("Issue infraction")
                .addUserOption(o => o.setName("user").setRequired(true))
                .addStringOption(o => o.setName("type").setRequired(true))
                .addStringOption(o => o.setName("reason").setRequired(true))
                .addStringOption(o => o.setName("notes"))
                .addStringOption(o => o.setName("expiration"))
        )

        .addSubcommand(s =>
            s.setName("list")
                .setDescription("View user infractions")
                .addUserOption(o => o.setName("user").setRequired(true))
        )

        .addSubcommand(s =>
            s.setName("case")
                .setDescription("View case")
                .addIntegerOption(o => o.setName("id").setRequired(true))
        )

        .addSubcommand(s =>
            s.setName("remove")
                .setDescription("Remove case")
                .addIntegerOption(o => o.setName("id").setRequired(true))
        ),

    async execute(interaction) {
        if (!hasPerm(interaction.member)) {
            return interaction.reply({ content: "❌ No permission.", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();

        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL);

        // ISSUE
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
                .addFields(
                    { name: "User", value: `<@${user.id}>` },
                    { name: "Type", value: type },
                    { name: "Reason", value: reason },
                    { name: "Notes", value: notes },
                    { name: "Expires", value: expiration }
                )
                .setColor("Red");

            if (logChannel) logChannel.send({ embeds: [embed] });

            try {
                user.send({ embeds: [embed] });
            } catch {}

            return interaction.reply({ content: `✅ Case #${inf.caseId} created.`, ephemeral: true });
        }

        // LIST
        if (sub === "list") {
            const user = interaction.options.getUser("user");
            const list = getUserInfractions(user.id);

            if (!list.length) {
                return interaction.reply("No infractions.");
            }

            const text = list.map(i =>
                `#${i.caseId} | ${i.type} | ${i.reason}`
            ).join("\n");

            return interaction.reply({ content: "```" + text + "```", ephemeral: true });
        }

        // CASE
        if (sub === "case") {
            const id = interaction.options.getInteger("id");
            const c = getCase(id);

            if (!c) return interaction.reply("Not found.");

            return interaction.reply({
                content: `Case #${c.caseId}\nUser: <@${c.userId}>\nReason: ${c.reason}`
            });
        }

        // REMOVE
        if (sub === "remove") {
            const id = interaction.options.getInteger("id");
            removeCase(id);

            return interaction.reply(`Removed case #${id}`);
        }
    }
};
