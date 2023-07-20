const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const help = require('../helpFunctions.js');
const { bModel } = require('../database/schemas.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('birthday')
		.setDescription('shows birthday')
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Checks who\'s birthday is the closest'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Adds user to birthday list')
                .addUserOption(option => option.setName('user')
                    .setDescription('Select a user')
                    .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('day')
                    .setDescription('Day of birth')
                    .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('month')
                    .setDescription('Month of birth')
                    .setRequired(true))
                .addStringOption(option =>
                    option.setName('nickname')
                    .setDescription('Nickname of birthday person')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes user from birthday list')
                .addUserOption(option => option.setName('user')
                    .setDescription('Select a user')
                    .setRequired(true)))
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('change')
                .setDescription('Change the birthday entry')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('date')
                        .setDescription('Change date of a user')
                        .addUserOption(option => option.setName('user')
                            .setDescription('Select a user')
                            .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('day')
                            .setDescription('Day of birth')
                            .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('month')
                            .setDescription('Month of birth')
                            .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('nickname')
                        .setDescription('Change nickname of a user')
                        .addUserOption(option => option.setName('user')
                            .setDescription('Select a user')
                            .setRequired(true))
                        .addStringOption(option =>
                            option.setName('nickname')
                            .setDescription('Nickname of birthday a user (can be empty to remove)')))),
    async execute(interaction) {
        const error = catchDateErrors(interaction.options);
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
                case 'add':
                    await interaction.reply(await addBirthday(interaction.options));
                    break;
                case 'remove':
                    await interaction.reply(await removeBirthday(interaction.options));
                    break;
                case 'check':
                    await interaction.reply({ embeds: [await checkBirthday(interaction)] });
                    break;
            }
        }
        else {
            switch (subcommand) {
                case 'date':
                    await interaction.reply(await changeDate(interaction.options));
                    break;
                case 'nickname':
                    await interaction.reply(await changeNickname(interaction.options));
                    break;
            }
        }
    },
};

async function addBirthday(options) {
    const userId = options.getUser('user').id;
    const newDay = options.getInteger('day');
    const newMonth = options.getInteger('month');

    const nickname = options.getString('nickname');

    try {
        const dbEntry = await bModel.create({
            id: userId,
            day: newDay,
            month: newMonth,
            name: nickname,
        });
        dbEntry.save();
        await sortTable();
    }
    catch (err) {
        console.log(err);
        return 'There was an error \n(user is probably already on the birthday list)';
    }
    return `Successfuly added <@${userId}> to the birthday list`;
}

async function checkBirthday(interaction) {
    const currDay = new Date().getDate();
    const currMonth = new Date().getMonth() + 1;

    const result = await bModel.find().exec();

    let closestD;
    let closestM;
    const closest = [];
    const guildMembers = interaction.guild.members;
    let isFirst = true;
    for (let i = 0; i < result.length; i++) {
        const birthDay = result[i].day;
        const birthMonth = result[i].month;
        const userId = result[i].id;
        const nick = result[i].nickname;
        if ((currMonth == birthMonth && currDay <= birthDay) || currMonth < birthMonth) {
            if (await isInGuild(guildMembers, userId)) {
                if (isFirst) {
                    closestD = birthDay;
                    closestM = birthMonth;
                    isFirst = false;
                }
                if (!isFirst && (closestD == birthDay && closestM == birthMonth)) {
                    closest.push(`<@${userId}>    ${nick}`);
                }
                else {
                    const probably = getProbably();
                    const personList = closest.join('\n');
                    const embed = new EmbedBuilder()
                    .setTitle(`Closest birthday is ${closestD}. ${closestM}.`)
                    .setDescription(`${personList} \n will celebrate... ${probably}`)
                    .setColor(help.randomColor());
                    return embed;
                }
            }
        }
    }

    if (closest.length > 0) {
        const probably = getProbably();
        const personList = closest.join('\n');
        const embed = new EmbedBuilder()
            .setTitle(`Closest birthday is ${closestD}. ${closestM}.`)
            .setDescription(`${personList} \n will celebrate... ${probably}`)
            .setColor(help.randomColor());
        return embed;
    }

    // ? if the closest is in next year -> closest is the first in list
    closestD = result[0].day;
    closestM = result[0].month;
    // check if there are others with the same date just to be sure
    for (let i = 0; i < result.length; i++) {
        const birthDay = result[i].day;
        const birthMonth = result[i].month;
        const userId = result[i].id;
        const nick = result[i].nickname;

        if (closestD == birthDay && closestM == birthMonth) {
            closest.push(`<@${userId}>    ${nick}`);
        }
        else {
            const probably = getProbably();
            closest.join('\n');
            const embed = new EmbedBuilder()
                .setTitle(`Closest birthday is ${closestD}. ${closestM}.`)
                .setDescription(`${closest} \n will celebrate ${probably}`)
                .setColor(help.randomColor());
                return embed;
        }
    }

    // if noone from server is in the birthday list (and maybe something else)
    const embed = new EmbedBuilder()
        .setTitle('Oh no...')
        .setDescription('There was an error');
    return embed;
}

async function removeBirthday(options) {
    const userId = options.getUser('user').id;

    let error = null;
    await bModel.deleteOne({ id: userId }), function(err) {
        if (err) error = err;
    };
    if (error) return 'There was an error';
    return `Successfuly deleted <@${userId}> from birthday list`;
}

function catchDateErrors(options) {
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

async function changeDate(options) {
    const userId = options.getUser('user').id;
    const newDay = options.getInteger('day');
    const newMonth = options.getInteger('month');

    try {
        await bModel.findOneAndUpdate({ id: userId }, { $set: { day: newDay, month: newMonth } });
        sortTable();
    }
    catch (err) {
        console.log(err);
        return 'There was an error while updating the birthday list';
    }
    return `Successfuly changed birthday date of <@${userId}> to ${newDay}. ${newMonth}.`;
}

async function changeNickname(options) {
    const userId = options.getUser('user').id;
    let nick = options.getString('nickname');
    if (nick == null) nick = '';
    try {
        await bModel.findOneAndUpdate({ id: userId }, { $set: { nickname: nick } });
    }
    catch {
        return 'There was an error';
    }
    return `Succesfully change nickname of <@${userId}> to ${nick}`;
}

async function sortTable() {
    const query = bModel.find({}).sort({ month: 'asc', day: 'asc' });
    const result = await query.exec();
    let error;
    await bModel.deleteMany({}), function(err) {
        if (err) error = err;
    };

    if (error) return error;

    for (let i = 0; i < result.length; i++) {
        const entry = await bModel.create({
            id: result[i].id,
            day: result[i].day,
            month: result[i].month,
            nickname: result[i].nickname,
        });
        entry.save();
    }

    return null;
}

function getProbably() {
    const rng = help.RNG(6);
    switch (rng) {
        case 0:
            return 'probably';
        case 1:
            return 'or not';
        case 2:
            return 'or will they?';
        case 3:
            return '\n You may be older, but I still love you the same don\'t worry';
        default:
            return '';
    }
}

async function checkMonth(month) {
    switch (month) {
        case 1:
            return 31;
        case 2:
            return 28;
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

async function isInGuild(guildMembers, userId) {
    try {
        await guildMembers.fetch(userId);
    }
    catch {
        return false;
    }
    return true;
}