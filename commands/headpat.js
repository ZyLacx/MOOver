const { SlashCommandBuilder } = require('discord.js');
const help = require('../helpFunctions.js');

require('dotenv').config();

async function headpat(interaction) {
    const searchKey = 'headpat-anime';
    const gifAmount = 16;
    const gifs = `https://g.tenor.com/v1/search?q=${searchKey}&key=${process.env.TENOR}&limit=${gifAmount}`;

    return help.getGifWithMessage(interaction, gifs, gifAmount);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('headpat')
        .setDescription('Headpat someone!')
        .addMentionableOption(options =>
            options.setName('who')
            .setDescription('Is for me? c:')),
    async execute(interaction) {
        const embed = await headpat(interaction);
        interaction.reply({ embeds: [embed] });
    },
};