const moove = require('./moove');
const help = require('./helpFunctions');

var ignore_messages = false;

function gotMessage(message) {
    if (message.author.bot) {
        return;
    }

    
    if (message.content == "!vypnisa") {
        ignore_messages = true;
        message.react('🐮');
    }

    if (message.content == "!zapnisa") {
        ignore_messages = false;
        message.react('🐮');
    }

    if (ignore_messages) {
        return;
    }

    /**
     * reference can't be null => must be a reply to message
     * must contain only one argument
     * that argument mentions channel
     */

    if (message.reference != null) {
        moove(message);
    }

    const msg = message.content.toLowerCase();

    const chance = help.RNG(50000);
    if (chance == 420) {
        whoAsked(message);
    }

    if (msg.includes('henlo')) {
        henlo(message);
    }
    else if (msg.includes('how ye')) {
        mood(message);
    }
    else if (msg.includes('tylko jedno')) {
        message.reply('Koksu pięć gram odlecieć sam');
    }

    if (process.env.DEBUG == 'ON') {
        // smth
    }
}

function henlo(message) {
    const emojis = ['🥰', '🐄', '🐮', '❤️', '👋', '🤠', '😊'];
    const randomNum = help.RNG(emojis.length);
    message.reply('Henlooo ' + message.author.username + '   ' + emojis[randomNum]);
}

function mood(message) {
    const responses = ['Not bad, how yee?', 'MOOdy', 'A bit sad 😢', 'Good, how yee?', 'I\'m fine, how yee?'];
    const randomNum = help.RNG(responses.length);
    message.reply(responses[randomNum]);
}

async function whoAsked(message) {
    if (message.embeds.length == 0 && message.attachments.size == 0 && message.content != '') {
        const searchKey = 'who-asked';
        const gifAmount = 20;
        const gifs = `https://g.tenor.com/v1/search?q=${searchKey}&key=${process.env.TENOR}&limit=${gifAmount}`;

        message.reply({ embeds: [await help.getGifEmbed(gifs, gifAmount)] });
    }
}

module.exports = gotMessage;