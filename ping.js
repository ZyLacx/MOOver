require('dotenv').config();
const client = require('./main');
const { bModel, eModel } = require('./database/schemas');
const { getGifEmbed } = require('./gifs');

module.exports = pingEvent;

async function pingEvent() {
    const currentDay = new Date().getDate();
    const currentMonth = new Date().getMonth() + 1;

    const guildIds = [];
    const sysChannelIds = [];
    client.guilds.cache.forEach(element => {
        sysChannelIds.push(element.channels.guild.systemChannelId);
        guildIds.push(element.id);
    });

    const todayBirthdays = await bModel.find({ day: currentDay, month: currentMonth }).exec();
    const globalEventList = await eModel.find({ guild: 'global', day: currentDay, month: currentMonth }).exec();
    for (let i = 0; i < guildIds.length; i++) {
        const guildEvents = await eModel.find({ guild: guildIds[i], day: currentDay, month: currentMonth }).exec();

        const guild = client.guilds.cache.find((g) => g.id == guildIds[i]);
        for (let j = 0; j < todayBirthdays.length; j++) {
            const userId = todayBirthdays[j].id;
            if ((await guild.members.fetch()).find(user => user.id == userId) != undefined) {
                const gifAmount = 12;
                const embed = await getGifEmbed(`https://g.tenor.com/v1/search?q=anime-hug&key=${process.env.TENOR}&limit=${gifAmount}`, gifAmount);
                embed.setDescription(`Happy Birthday <@${userId}> !!!`);
                client.channels.cache.get(sysChannelIds[i])
                    .send({ embeds: [embed] });
            }
        }

        for (let j = 0; j < globalEventList.length; j++) {
            client.channels.cache.get(sysChannelIds[i])
                .send(`It's **${globalEventList[j].name}** today!\n` + globalEventList[j].specialMessage);
        }

        for (let j = 0; j < guildEvents.length; j++) {
            client.channels.cache.get(sysChannelIds[i])
                .send(`It's **${guildEvents[j].name}** today!\n` + guildEvents[j].specialMessage);
        }
    }
}