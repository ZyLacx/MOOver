require('dotenv').config();
const client = require('./main');
const { bModel, eModel } = require('./database/schemas');
const gifs = require('./gifs');

module.exports = pingEvent;

async function pingEvent() {
    const guildIds = [];
    const sysChannelIds = [];

    const todayBirthdays = await bModel.find().exec();
    const globalEventList = await eModel.find({ guild: 'global' }).exec();

    client.channels.cache.get('770748282191740943').send(`It's **${globalEventList[3].name}** today!\n` + globalEventList[3].specialMessage);    

    const embed = await gifs.getGifEmbed(`https://g.tenor.com/v1/search?q=anime-hug&key=${process.env.TENOR}&limit=${5}`, 5);
    embed.setDescription(`Happy Birthday <@${todayBirthdays[0].id}> !!!`);
    client.channels.cache.get('770748282191740943').send({ embeds: [embed] });
}