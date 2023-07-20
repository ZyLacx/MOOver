const axios = require('axios').default;
const { EmbedBuilder } = require('discord.js');
const help = require('./helpFunctions');

module.exports = ({
    getGifs: getGifs,
    getGifEmbed: getGifEmbed,
    getGifWithMessage: getGifWithMessage,
});


async function getGifs(gifs) {
    return new Promise((resolve) => {
        resolve(axios.get(gifs));
    });
}

async function getGifEmbed(gifQuery, gifAmount) {
    const response = await getGifs(gifQuery);
    const gif = response.data.results[help.RNG(gifAmount)].media[0].gif.url;
    const gifEmbed = new EmbedBuilder()
        .setImage(gif)
        .setColor(help.randomColor());
    return gifEmbed;
}

async function getGifWithMessage(interaction, gifQuery, gifAmount) {
    const gifEmbed = await getGifEmbed(gifQuery, gifAmount);

    const who = interaction.options.getMentionable('who');
    if (who == null) {
        return gifEmbed;
    }
    gifEmbed.setDescription(interaction.user.username
        + ` ${interaction.commandName}s ` + `${who}`);
    return gifEmbed;
}
