const mongoose = require('mongoose');

const birthdaySchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
    },
    day: Number,
    month: Number,
    nickname: {
        type: String,
        default: '',
    },
});

const bdmodel = mongoose.model('birthdays', birthdaySchema);

const eventSchema = new mongoose.Schema({
    guild: String,
    id: {
        type: Number,
        index: true,
        unique: true,
    },
    name: String,
    day: Number,
    month: Number,
    specialMessage: String,
});

const emodel = mongoose.model('events', eventSchema);

module.exports = {
    bModel: bdmodel,
    eModel: emodel,
};