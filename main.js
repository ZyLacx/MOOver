/**
    List of intents
    https://discord.com/developers/docs/topics/gateway#privileged-intents
*/
require('dotenv').config();

const http = require('http');
http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n');
}).listen(5000, '127.0.0.1');

const {
    Client,
    Collection,
    GatewayIntentBits,
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
});

const fs = require('fs');
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands')
    .filter(file => !file.includes('WIP'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
}

const mongoose = require('mongoose');
async function dbConnect() {
    mongoose.connect(process.env.DBSRV, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        console.log('Connected to database');
    }).catch((err) => {
        console.log(err);
    });
}

const help = require('./helpFunctions.js');
const cron = require('node-cron');

let gotMessage;
client.once('ready', async () => {
    gotMessage = require('./messageHandler');
    const ping = require('./ping');

    if (process.env.DEBUG != 'ON') {
        const turnOnMsg = ['AAAAAAAAAAAAA', 'Just turned on!',
                        'Just woke up!', 'May have crashed... sowwyyy >.<',
                        'Heyyyy!', 'I\'m baaaack', 'Whom\'st have summoned the ancient one?'];
        const debugChannel = client.channels.cache.get('780439236867653635');
        if (debugChannel) {
            debugChannel.send(turnOnMsg[help.RNG(turnOnMsg.length)]);
        }
    }
    await dbConnect();
    cron.schedule('0 13 * * *', async function() {
        ping();
    });
    console.log('Running!');
});

client.on('messageCreate', (message) => {
    gotMessage(message);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true,
        });
    }
});

client.login(process.env.TOKEN);

module.exports = client;
