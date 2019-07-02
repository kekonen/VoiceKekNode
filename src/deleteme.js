const Telegraf = require('telegraf')
const dotenv = require('dotenv');
dotenv.config();

const botToken = process.env.BOT_TOKEN;

const bot = new Telegraf(process.env.BOT_TOKEN)

let appContext = {
    users: {}
}

class GreetFlow {
    constructor(ctx) {
        ctx.reply('Hi, whats next?')
    
        this.next = (ctx) => {
            if (ctx.text === 'lol') {
                this.lols = 0;
                this.lol(ctx)
            } else if (ctx.text === 'kek') {
                this.kek(ctx)
            } else {
                this.exit(ctx)
            }

            return false
        }

    }

    async lol(ctx) {
        this.lols +=1;
        await ctx.reply('Oh yeah lol, any more?')

        this.next = (ctx) => {
            if (ctx.text === 'lol') {
                this.lol(ctx)
            } else if (ctx.text === 'enough') {
                ctx.reply(`Lols: ${this.lols}`)
                this.exit(ctx)
            } else {
                this.exit(ctx)
            }
            return false
        }
    
        return false
    }

    async kek(ctx) {
        await ctx.reply('Oh yeah kek, pic or voice?')
        
        this.next = (ctx) => {
            if (ctx.photo) {
                ctx.reply('Nice pic!')
                this.exit(ctx)
            } else if (ctx.voice) {
                ctx.reply(`Nice voice`)
                this.exit(ctx)
            } else {
                this.exit(ctx)
            }

            return false
        }
    }

    exit(ctx) {
        ctx.user.flow = null;
    }
}

bot.use(async (ctx, next) => {
    console.log(ctx.updateType, ctx.updateSubTypes)
    ctx.removeMarkup = () => {
        ctx.editMessageReplyMarkup({
            inline_keyboard: []
        })
    }

    if (!appContext.users[ctx.update.message.from.id]) {
        appContext.users[ctx.update.message.from.id] = ctx.update.message.from
    }

    ctx.updateSubTypes.forEach(t => {
        ctx[t] = ctx.update.message[t]
    })

    ctx.user = appContext.users[ctx.update.message.from.id]

    if (ctx.user.flow) {
        if (await ctx.user.flow.next(ctx)) {
            return Promise.resolve()
        }
    } 

    return next(ctx)
})


bot.on('text', (ctx) => {
    const {from, text} = ctx.update.message;
    console.log('text=', ctx.text)
    if (ctx.text === 'hello') {
        ctx.user.flow = new GreetFlow(ctx)
    }
    // textHandler(from.id, ctx)

})


bot.on('voice', (ctx) => {
    const {from, voice} = ctx.update.message;
})

bot.on('photo', (ctx) => {
    const {from, photo} = ctx.update.message;
})

bot.on('sticker', (ctx) => {
    const {from, sticker} = ctx.update.message;
})

bot.on('callback_query', (ctx) => {
    let {from, data, message} = ctx.update.callback_query;
    
    ctx.answerCbQuery()
})


bot.launch()