const { EmbedBuilder } = require('discord.js');
const help = require('./helpFunctions');
const client = require('./main');

function moove(message) {
    const content = message.content.trim();

    if (content.search(/<#[0-9]*>$/g) != 0) {
        return;
    }

    const originalChannel = message.channel;
    const msgToMooveId = message.reference.messageId;

    const mentionedChannel = client.channels.cache.get(content.substring(2, content.length - 1));
    if (mentionedChannel == undefined) {
        return;
    }

    message.react('🐮');
    originalChannel.messages.fetch(msgToMooveId).then(msg => {
        const sentBy = `Sent by ${msg.author}\nmooved ${message.author}\n`;
        if (msg.embeds.length > 0) {
            mentionedChannel.send({ embeds: msg.embeds });
        }
        
        if (msg.attachments.size > 0) {

            const originalMsgAttachments = msg.attachments.values();

            const attachmentsArr = [];
            for (let i = 0; i < msg.attachments.size; i++) {
                attachmentsArr.push(originalMsgAttachments.next().value);
            }

            let messStr = '';
            if (msg.content != '') {
                messStr = '\nMessage:\n' + msg.content;
            }

            mentionedChannel.send({ content: sentBy + messStr, files: attachmentsArr });
        }
        if (msg.content != '') {
            const embed = new EmbedBuilder()
                .setColor(help.randomColor())
                .addFields(
                    { name: 'MOO', value: sentBy },
                    { name: 'Message', value: msg.content },
                );
            mentionedChannel.send({ embeds: [embed] });
        }

        setTimeout(() => msg.delete(), 3000);
    });
    setTimeout(() => message.delete(), 3000);
}

module.exports = moove;