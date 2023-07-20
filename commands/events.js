const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const help = require('../helpFunctions.js');
const { eModel } = require('../database/schemas');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('event')
		.setDescription('Adds events to celebrate!')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Adds new event to the database')
                .addStringOption(option => option.setName('name')
                    .setDescription('Name of the event you want to add')
                    .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('day')
                    .setDescription('Day of event')
                    .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('month')
                    .setDescription('Month of event')
                    .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('global')
                    .setDescription('Should this event display on all servers?'))
                .addStringOption(option =>
                    option.setName('message')
                    .setDescription('Special message to send in event announcement')))
        .addSubcommand(subcommand =>
            subcommand.setName('delete')
                .setDescription('Deletes event from database')
                .addIntegerOption(option => option.setName('id')
                .setDescription('Id of the even you want to change')
                .setRequired(true)))
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup.setName('change')
                .setDescription('Change the event entry')
                .addSubcommand(subcommand =>
                    subcommand.setName('date')
                        .setDescription('Change date of an event')
                        .addIntegerOption(option =>
                            option.setName('day')
                            .setDescription('New event day')
                            .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('month')
                            .setDescription('New event month')
                            .setRequired(true))
                        .addIntegerOption(option => option.setName('id')
                            .setDescription('Id of the even you want to change')
                            .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand.setName('name')
                        .setDescription('Change name of an event')
                        .addStringOption(option =>
                            option.setName('name')
                            .setDescription('New name of the event')
                            .setRequired(true))
                        .addIntegerOption(option => option.setName('id')
                            .setDescription('Id of the even you want to change')
                            .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand.setName('message')
                        .setDescription('Change special message of an event')
                        .addStringOption(option =>
                            option.setName('message')
                            .setDescription('New special message')
                            .setRequired(true))))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
            .setDescription('List all events')),
        async execute(interaction) {
            // make this help function you basically copy it evrytime (in birthday.js aswell)
            const error = catchErrors(interaction.options);
            if (error != null) {
                await interaction.reply(error);
            }
            let subcommandGroup;
            try {
                subcommandGroup = interaction.options.getSubcommandGroup();
            }
            catch {
                subcommandGroup = undefined;
            }
            const subcommand = interaction.options.getSubcommand();
            if (subcommandGroup == undefined) {
                switch (subcommand) {
                    case 'list':
                        await interaction.reply({ embeds: [await listEvents(interaction)] });
                        break;
                    case 'add':
                        await interaction.reply(await addEvent(interaction));
                        break;
                    case 'delete':
                        await interaction.reply(await deleteEvent(interaction));
                        break;
                }
            }
            else {
                switch (subcommand) {
                    case 'date':
                        await interaction.reply(await changeEventDate(interaction));
                        break;
                    case 'name':
                        await interaction.reply(await changeEventName(interaction));
                        break;
                    case 'message':
                        await interaction.reply(await changeSpecialMessage(interaction));
                        break;
                }
            }
        },
};

async function changeEventDate(interaction) {
    const id = interaction.options.getInteger('id');
    const newDay = interaction.options.getInteger('day');
    const newMonth = interaction.options.getInteger('month');

    try {
        await eModel.findOneAndUpdate({ id: id }, { $set: { day: newDay, month: newMonth } });
    }
    catch (err) {
        console.log(err);
        return 'There was an error while updating the event list';
    }
    return `Changed event date to ${newDay}. ${newMonth}.`;
}

async function changeEventName(interaction) {
    const id = interaction.options.getInteger('id');
    const newName = interaction.options.getString('name');

    try {
        await eModel.findOneAndUpdate({ id: id }, { $set: { name: newName } });
    }
    catch {
        return 'There was an error';
    }
    return `Changed event name to ${newName}`;
}

async function deleteEvent(interaction) {
    const id = interaction.options.getInteger('id');

    let error = null;
    await eModel.deleteOne({ id: id }), function(err) {
        if (err) error = err;
    };
    if (error) return 'There was an error';
    return 'Successfuly deleted event from event list';
}

async function addEvent(interaction) {
    const name = interaction.options.getString('name');
    const day = interaction.options.getInteger('day');
    const month = interaction.options.getInteger('month');

    let isGlobal = interaction.options.getBoolean('global');
    if (!isGlobal) isGlobal = false;
    // TODO if duplicate send if they want to add it anyway and 2 buttons yes/no

    const ms = new Date().getMilliseconds();
    const id = (1000 * day) + (1000 * (ms % 1000)) + month;

    const guildData = isGlobal ? 'guild' : interaction.guild.id;
    const eventType = isGlobal ? 'global' : 'guild';

    try {
        const dbEntry = await eModel.create({
            guild: guildData,
            id: id,
            name: name,
            day: day,
            month: month,
        });
        dbEntry.save();
        await sortTable();
    }
    catch (err) {
        console.log(err);
        return 'There was an error \n(user is probably already on the birthday list)';
    }

    return `Successfuly added ${eventType} event ${name}`;
}

async function listEvents(interaction) {
    let query = eModel.find({ guild: 'global' });
    const globalEvents = await query.exec();

    query = eModel.find({ guild: interaction.guild.id });
    const guildEvents = await query.exec();

    const embed = new EmbedBuilder()
        .setColor(help.randomColor())
        .setTitle('Literally nothing here');

    let eventIds = [];
    let eventNames = [];
    let eventDates = [];
    // TODO DEDUPLCIATE

    if (globalEvents.length > 0) {
        for (let i = 0; i < globalEvents.length; i++) {
            eventIds.push(globalEvents[i].id);
            eventNames.push(globalEvents[i].name);
            eventDates.push(`${globalEvents[i].day}. ${globalEvents[i].month}.`);
        }
        embed.addFields(
            { name: 'Global Events: ', value: '\u200b' },
            { name: 'Id: ', value: eventIds.join('\n'), intents: true },
            { name: 'Name: ', value: eventNames.join('\n'), intents: true },
            { name: 'Date: ', value: eventDates.join('\n'), intents: true },
            { name: '\u200b', value: '\u200b' },
        );
        embed.setTitle('');
        eventIds = [];
        eventNames = [];
        eventDates = [];
    }

    if (guildEvents.length > 0) {
        for (let i = 0; i < guildEvents.length; i++) {
            eventIds.push(guildEvents[i].id);
            eventNames.push(guildEvents[i].name);
            eventDates.push(`${guildEvents[i].day}. ${guildEvents[i].month}.`);
        }
        embed.addFields(
            { name: 'Guild events:', value: '\u200b' },
            { name: 'Id: ', value: eventIds.join('\n'), intents: true },
            { name: 'Name: ', value: eventNames.join('\n'), intents: true },
            { name: 'Date: ', value: eventDates.join('\n'), intents: true },
            { name: '\u200b', value: '\u200b' },
        );
        embed.setTitle('');
    }
    return embed;
}

async function changeSpecialMessage(interaction) {
    try {
        await eModel.findOneAndUpdate(
            { id: interaction.options.getInteger('id') },
            { $set: { specialMessage: interaction.options.getString('message') } },
        );
    }
    catch {
        return 'There was an error';
    }

    return 'Successfuly changed event message';
}

function catchErrors(options) {
    const month = options.getInteger('month');
    const day = options.getInteger('day');
    if (month == null || day == null) {
        return null;
    }

    if (month > 12 || month < 1) {
        return 'Bruh, "month" kinda poopy';
    }
    if (day > checkMonth(month) || day < 1) {
        return 'Bruh, "day" kinda poopy';
    }
    return null;
}

function checkMonth(month) {
    switch (month) {
        case 1:
            return 31;
        case 2:
            return 29;
        case 3:
            return 31;
        case 4:
            return 30;
        case 5:
            return 31;
        case 6:
            return 30;
        case 7:
            return 31;
        case 8:
            return 31;
        case 9:
            return 30;
        case 10:
            return 31;
        case 11:
            return 30;
        case 12:
            return 31;
    }
}

async function sortTable() {
    const query = eModel.find({}).sort({ month: 'asc', day: 'asc' });
    const result = await query.exec();
    let error;
    await eModel.deleteMany({}), function(err) {
        if (err) error = err;
    };

    if (error) return error;

    for (let i = 0; i < result.length; i++) {
        const entry = await eModel.create({
            guild: result[i].guild,
            id: result[i].id,
            name: result[i].name,
            day: result[i].day,
            month: result[i].month,
        });
        entry.save();
    }

    return null;
}