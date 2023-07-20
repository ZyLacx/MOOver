const { SlashCommandBuilder } = require('discord.js');
const help = require('../helpFunctions.js');

require('dotenv').config();


async function hug(interaction) {
    const searchKey = 'hug-anime';
    const gifAmount = 16;
    const gifs = `https://g.tenor.com/v1/search?q=${searchKey}&key=${process.env.TENOR}&limit=${gifAmount}`;

    return help.getGifWithMessage(interaction, gifs, gifAmount);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Hug all your friends!')
        .addMentionableOption(options =>
            options.setName('who')
            .setDescription('It\'s not me.. is it? :c')),
    async execute(interaction) {
        const embed = await hug(interaction);
        interaction.reply({ embeds: [embed] });
    },
};