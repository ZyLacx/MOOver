const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('sheeeee')
		.addMentionableOption(option => option.setName('aaaa').setDescription('aaaaaaa')),
		// .addBooleanOption(option => option.setName('naco').setDescription('Select a boolean')),
	async execute(interaction) {
		const embed = new MessageEmbed()
			.addField('Battle', 'Field');
		interaction.reply({ embeds: [embed] });
	},
};