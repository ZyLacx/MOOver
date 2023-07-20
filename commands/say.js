const { SlashCommandBuilder } = require('discord.js');

function say(interaction) {
    const message = interaction.options.getString('what');
    message.trim();
    interaction.channel.send(message);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Make me say something!')
        .addStringOption(options =>
            options.setName('what')
            .setDescription('What will you make me say this time? 🙃')
            .setRequired(true)),
	async execute(interaction) {
        await say(interaction);
        await interaction.reply({ content: 'Said and done', ephemeral: true });
    },
};