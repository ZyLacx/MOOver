const { SlashCommandBuilder } = require('discord.js');
const gifEmbed = require('../gifs.js');
const gifAmount = 50;
require('dotenv').config();


async function getGifEmbed(options) {
    let rating = 'low';
    try {
        if (options.getBoolean('r-rated')) {
            rating = 'off';
        }
    }
    catch {
        rating = 'low';
    }

    let search;
    try {
        search = options.getString('what').trim();
    }
    catch {
        const gifs = `https://g.tenor.com/v1/random?key=${process.env.TENOR}&limit=${gifAmount}&contentfilter=${rating}`;
        return gifEmbed.getGifEmbed(gifs, gifAmount);
    }

    const searchSplits = search.split(/[ ]+/);
    const searchKey = searchSplits.join('-');

    const gifs = `https://g.tenor.com/v1/search?q=${searchKey}&key=${process.env.TENOR}&limit=${gifAmount}&contentfilter=${rating}`;
    return gifEmbed.getGifEmbed(gifs, gifAmount);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gif')
        .setDescription('Sends gif')
        .addStringOption(option =>
            option.setName('what')
            .setDescription('What should I search for? (If this is empty I will give you something random!)'))
        .addBooleanOption(option => option.setName('r-rated').setDescription('Should the gif be R-rated')),
    async execute(interaction) {
        const embed = await getGifEmbed(interaction.options);
        await interaction.reply({ embeds: [embed] });
    },
};