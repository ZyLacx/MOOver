require('dotenv').config();

module.exports = {
    randomColor: randomColor,
    RNG: RNG,
    returnPromiseString: returnPromiseString,
};

function randomColor() {
    let color = '#';
        for (let i = 0; i < 6; i++) {
            const random = Math.random();
            const bit = (random * 16) | 0;
            color += (bit).toString(16);
        }
        return color;
}

function RNG(max) {
    return Math.floor(Math.random() * max);
}

async function returnPromiseString(guildMembers) {
    return new Promise(() => {
        guildMembers.fetch();
    });
}

