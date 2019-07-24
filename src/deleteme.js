const Telegraf = require('telegraf')
const dotenv = require('dotenv');
dotenv.config();

const botToken = process.env.BOT_TOKEN;


class Bot {
    constructor(token) {
        this.bot = new Telegraf(process.env.BOT_TOKEN)

        this.context = {
            users: {}
        }
    }

    async setup() {
        this.bot.use(async (ctx, next) => {
            console.log(ctx.updateType, ctx.updateSubTypes)
        
            const {from} = ctx.update.message  || ctx.update.inline_query || ctx.update.chosen_inline_result || ctx.update.callback_query;
        
            ctx.bot = this;
        
            ctx.removeMarkup = () => {
                ctx.editMessageReplyMarkup({
                    inline_keyboard: []
                })
            }
        
            if (!this.context.users[from.id]) {
                
                this.context.users[from.id] = Object.assign(from, {cbqueries: {}})
            }
        
            ctx.updateSubTypes.forEach(t => {
                ctx[t] = ctx.update.message[t]
            })
        
            ctx.user = this.context.users[from.id]

            if (ctx.user.flow) {
                if (await ctx.user.flow.next(ctx)) {
                    return Promise.resolve()
                }
            } 

            if (ctx.update.callback_query && ctx.user.cbqueries[ctx.update.callback_query.message.message_id]) {
                if (await ctx.user.cbqueries[ctx.update.callback_query.message.message_id].next(ctx)) {
                    return Promise.resolve()
                }
            } 
        
            return next(ctx)
        })
        
        
        this.bot.on('text', (ctx) => {
            const {from, text} = ctx.update.message;
            if (ctx.text === 'hello') {
                ctx.user.flow = new GreetFlow(ctx)
            }
        })
        
        
        this.bot.on('voice', (ctx) => {
            const {from, voice} = ctx.update.message;
        })
        
        this.bot.on('photo', (ctx) => {
            const {from, photo} = ctx.update.message;
        })
        
        this.bot.on('sticker', (ctx) => {
            const {from, sticker} = ctx.update.message;
        })
        
        this.bot.on('callback_query', (ctx) => {
            let {from, data, message} = ctx.update.callback_query;
            
            ctx.answerCbQuery()
        })
        
        
        this.bot.launch()
    }
}

class GreetFlow {
    constructor(ctx, options) {
        ctx.user.flow = this
        ctx.reply('Hi, whats next?')

        this.someValue = 'Blueberry'
    
        this.next = async (ctx) => {
            if (ctx.text === 'lol') {
                this.lols = 0;
                this.lol(ctx)
            } else if (ctx.text === 'kek') {
                this.kek(ctx)
            } else if (ctx.text === 'sh') {
                await this.query(ctx)
            }else {
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
            }

            return false
        }
    }

    async query(ctx) {
        const cbqflow = new CBQflow(ctx)
        await cbqflow.init(ctx)

        this.exit(ctx)
    }

    exit(ctx) {
        ctx.user.flow = null;
    }
}


class CBQflow {
    constructor(ctx, options) {
        const {from} = ctx.update.message;
        this.someValue = 'Blueberry'
        this.mainValue = false
    }

    text() {
        return `Markup ${this.someValue}`
    }


    async init(ctx) {
        const cbq = await ctx.reply(this.text(), {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: `Toggle ${this.mainValue?'x':'v'}`,
                        callback_data: `{"f":"toggle","t":"mainValue","p":[0,0]}`
                    }, {
                        text: "Rename",
                        callback_data: `{"f":"rename","t":"someValue","p":[0,1]}`
                    }, {
                        text: "Close",
                        callback_data: `{"f":"close","p":[0,2]}`
                    }]
                ]
            }
        })
        ctx.user.cbqueries[cbq.message_id] = this
        this.message_id = cbq.message_id
        this.ctx = ctx

        this.next = this.processUpdate
    }

    async updateText() {
        return this.ctx.editMessageText(this.text(), {reply_markup: this.reply_markup})
    }

    async updateReplyMarkup(reply_markup) {
        return this.ctx.editMessageReplyMarkup(reply_markup)
    }

    async processUpdate(ctx) {
        this.ctx = ctx
        const {from ,data, message} = ctx.update.callback_query;
        let {reply_markup, message_id} = message;
        this.reply_markup = reply_markup
        let p = JSON.parse(data)

        if (p.f === 'toggle') {
            this[p.t] = !this[p.t]
            reply_markup.inline_keyboard[p.p[0]][p.p[1]].text = `Toggle ${this.mainValue?'x':'v'}`
            await this.updateReplyMarkup(reply_markup)
            this.next = this.processUpdate
        } else if (p.f === 'rename') {
            ctx.reply('Send the new name')
            ctx.user.flow = {next: async (ctx) => {
                if (ctx.update.message.text) {
                    this[p.t] = ctx.update.message.text
                    this.updateText()
                }
                ctx.user.flow = null
            }}
        } else if (p.f === 'close') {
            await this.updateReplyMarkup({inline_keyboard:[]})
            this.exit()
            return true
        }

        this.next = this.processUpdate
        return true
    }

    exit() {
        this.ctx.user.cbqueries[this.message_id] = null
    }
}

const b = new Bot()

b.setup()