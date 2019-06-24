const { Bot } = require('./telegram');
const { DB } = require('./postgres');
const dotenv = require('dotenv');
dotenv.config();

const botToken = process.env.BOT_TOKEN;
const [hostname, user, password, database] = process.env.DB_HOST.split(',');




async function init()
{
    const db = new DB({ hostname, user, password, database });

    const bot = new Bot(botToken);
    await bot.setup(db);
}

(async () => await init())()