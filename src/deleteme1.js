const Telegraf = require('telegraf')
const dotenv = require('dotenv');
dotenv.config();

const botToken = process.env.BOT_TOKEN;

const bot = new Telegraf(process.env.BOT_TOKEN)

let app_context = {
    thingy: 'kek'
}

bot.use((ctx, next) => {
    ctx.removeMarkup = () => {
        ctx.editMessageReplyMarkup({
            inline_keyboard: []
        })
    }

    // const start = new Date()
    return next(ctx)
    // .then(() => {
    //     const ms = new Date() - start
    //     console.log('Response time %sms', ms, what)
    // })
})


bot.hears('lol', (ctx) => {
    console.log(`LOL text =======>`, ctx)
    ctx.reply(`Markup, ${ctx.c}`, {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: "add",
                    callback_data: "add_1"
                }, {
                    text: "rename thingy",
                    callback_data: "rename_thingy"
                }, {
                    text: "close",
                    callback_data: "close"
                }]
            ]
        }
    })
})

bot.on('text', (ctx) => {
    console.log(`text =======>`, ctx)
    ctx.reply(`Hello World, ${ctx.c}`)
})


bot.on('voice', (ctx) => {
    console.log(`voice =======>`, ctx)
    ctx.reply(`Hello World, ${ctx.c}`)
})

bot.on('photo', (ctx) => {
    console.log(`photo =======>`, ctx)
    ctx.reply(`Hello World, ${ctx.c}`)
})

bot.on('sticker', (ctx) => {
    console.log(`sticker =======>`, ctx)
    ctx.reply(`Hello World, ${ctx.c}`)
})

bot.on('callback_query', (ctx) => {
    let {from, data, message} = ctx.update.callback_query;
    let previousMarkup = message.reply_markup;
    console.log(`callback_query =======>`, message)
    data = data.split(';')

    data.forEach(command => {
        if (command === 'close') {
            ctx.removeMarkup()
        } else if (command.startsWith('rename')) {
            const toChange = command.split('_')[1] 
            ctx.reply(`Enter new name for '${toChange}':`)
            ctx.removeMarkup()
        } else if (command.startsWith('add')) {
            previousMarkup.inline_keyboard[0].push({
                text: 'lol',
                callback_data: 'close'
            })
            ctx.editMessageReplyMarkup(previousMarkup)
        }
    })

    
    ctx.answerCbQuery()
})

bot.launch()