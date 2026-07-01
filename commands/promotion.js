const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    addPromotion,
    getPromotions,
    removePromotion
} = require("../utils/promotions");

const STAFF_ROLE = "1355938863222362144";
const LOG_CHANNEL = "1508903873291751484";

function hasPerm(member) {
    return (
        member.permissions.has("Administrator") ||
        member.roles.cache.has(STAFF_ROLE)
    );
}

module.exports = {

data: new SlashCommandBuilder()

.setName("promotion")
.setDescription("Promotion system")

.addSubcommand(sub =>
sub
.setName("issue")
.setDescription("Promote a member")

.addUserOption(o =>
o.setName("user")
.setDescription("Member")
.setRequired(true)
)

.addStringOption(o =>
o.setName("oldrank")
.setDescription("Previous rank")
.setRequired(true)
)

.addStringOption(o =>
o.setName("newrank")
.setDescription("New rank")
.setRequired(true)
)

.addStringOption(o =>
o.setName("reason")
.setDescription("Reason")
.setRequired(true)
)
)

.addSubcommand(sub =>
sub
.setName("list")
.setDescription("View promotions")
.addUserOption(o =>
o.setName("user")
.setDescription("Member")
.setRequired(true)
)
)

.addSubcommand(sub =>
sub
.setName("remove")
.setDescription("Delete promotions")
.addUserOption(o =>
o.setName("user")
.setDescription("Member")
.setRequired(true)
)
),

async execute(interaction){

if(!hasPerm(interaction.member))
return interaction.reply({
content:"❌ No permission.",
ephemeral:true
});

const sub=interaction.options.getSubcommand();

if(sub==="issue"){

const user=interaction.options.getUser("user");
const oldRank=interaction.options.getString("oldrank");
const newRank=interaction.options.getString("newrank");
const reason=interaction.options.getString("reason");

addPromotion({
userId:user.id,
moderatorId:interaction.user.id,
oldRank,
newRank,
reason
});

const embed = new EmbedBuilder()
.setColor("#2B2D31")
.setTitle("PROMOTION!")
.setDescription(
`The HR team has seen your relentless dedication and hard work towards DKL. They have decided to grant you a promotion for your hard work, do not let this go to waste. We hope to see you climb the ranks in the future.

Congrats!`
)
.addFields(
{
name: "\u200B",
value:
`>>> User: ${user}
Previous Rank: ${oldRank}
Promoted Rank: ${newRank}
Reason: ${reason}`
},
{
name: "\u200B",
value:
`>>> Signed: ${interaction.user}`
}
)
.setImage("https://cdn.discordapp.com/attachments/1513019398552813669/1515180378879426584/content.png")
.setFooter({
text: `<:mask:1508232966877483049> Last updated on | ${new Date().toLocaleString()}`
})
.setTimestamp();

const log=interaction.guild.channels.cache.get(LOG_CHANNEL);

if(log) log.send({embeds:[embed]});

try{
await user.send({embeds:[embed]});
}catch{}

return interaction.reply({
content:"✅ Promotion logged.",
ephemeral:true
});

}

if(sub==="list"){

const user=interaction.options.getUser("user");

const list=getPromotions(user.id);

if(!list.length)
return interaction.reply({
content:"No promotions found.",
ephemeral:true
});

const embed=new EmbedBuilder()
.setTitle(`${user.username}'s Promotions`)
.setColor("Blue");

list.forEach(p=>{

embed.addFields({
name:`${p.oldRank} ➜ ${p.newRank}`,
value:`Reason: ${p.reason}`
});

});

return interaction.reply({
embeds:[embed],
ephemeral:true
});

}

if(sub==="remove"){

const user=interaction.options.getUser("user");

removePromotion(user.id);

return interaction.reply({
content:"✅ Promotion history removed.",
ephemeral:true
});

}

}

};
