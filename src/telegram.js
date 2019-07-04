const Telegraf = require('telegraf')
const sa = require('superagent')
const fs = require('fs')
var Promise = require("bluebird");
const announcements = require('./files/announcements.json')
const AddMusic = require('./flows/addMusic')
const Voice = require('./flows/Voice')
const AdminMe = require('./flows/adminMe')



class Bot {
    constructor(token) {
        this.bot = new Telegraf(token)

        this.context = {
            users: {}
        }
    }

    async setup(db) {

        this.bot.use(async (ctx, next) => {
            console.log(`lol0`)

            const {from} = ctx.update.message  || ctx.update.inline_query || ctx.update.chosen_inline_result;

            console.log(ctx.updateType, ctx.updateSubTypes)
            ctx.db = db;
            ctx.bot = this;

            if (ctx.updateType != 'inline_query' && ctx.updateType != 'chosen_inline_result') {
                if (!ctx.update.message.text === '/start' && (await db.isHe(ctx.update.message.from.id, 'user'))) {
                    ctx.reply('Register first with /start')
                    return Promise.resolve();
                }

                
            }

            ctx.removeMarkup = () => {
                ctx.editMessageReplyMarkup({
                    inline_keyboard: [] 
                })
            }

            if (!this.context.users[from.id]) {
                this.context.users[from.id] = from
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
        
            return next(ctx)
        })

        this.bot.start(async (ctx) => {
            const {from} = ctx.update.message;
            console.log('start')
    
            if (!(await db.isHe(from.id, 'user'))) {
                console.log('start and user')
                if (!(await db.getUser(from.id))) await db.createUser(from.id);
                await db.createUserRole(from.id, 'user')
                ctx.reply(announcements.start);
                return ;
            }
    
            ctx.reply('Hello again!');
        })

        this.bot.help(async (ctx) => {
            ctx.reply(announcements.help);
        })

        this.bot.command('admin_me', async (ctx) => {
            const {from} = ctx.update.message;

            if (await db.isHe(from.id, 'admin')) {
                ctx.reply('Да все с тобой ясно')
            } else {
                ctx.reply('Вилкой в глаз или в попу раз?')
                const flow = new AdminMe(ctx)
                flow.next = async (ctx) => {
                    const {text} = ctx.update.message;

                    if (text === 'в попу раз' || text === 'В попу раз') {
                        await db.createUserRole(from.id, 'admin')
                        ctx.reply('я заскринил')
                    }
                }
            } 
        })
    
        this.bot.on('audio', async (ctx) => {
            const flow = new AddMusic(ctx)
            if (!(await flow.init(ctx))) {
                ctx.reply(`Ты мне втираешь какую то дичь`)
            } else {
            }
        })

        this.bot.on('document', async (ctx) => {
            const flow = new AddMusic(ctx)
            if (!(await flow.init(ctx))) {
                ctx.reply(`Ты мне втираешь какую то дичь`)
            }
        })

        this.bot.on('voice', async (ctx) => {
            const flow = new Voice(ctx)
            flow.init(ctx)
        })

        this.bot.on('text', async (ctx) => {
            let {text, from} = ctx.update.message;

            ctx.reply('Void')
        })

        this.bot.on('inline_query', async (ctx) => {
            const {id, query, from} = ctx.update.inline_query;

            if (!(await db.getUser(from.id))) {
                console.log('No user!')
                await db.createUser(from.id, {queries: 0});
            }

            const results = (await db.getAllowedVoicesLike(from.id, query)).slice(0,20).map((v, i) => {
                return {
                    type: "voice",
                    id: `voice_${id}_${v.voice_permissions[0].voice_id}`,
                    voice_file_id: v.file_id_cached,
                    title: v.title
                }
            }) || []

            ctx.answerInlineQuery(results, {
                is_personal: true,
            })
        })

        this.bot.on('chosen_inline_result', async (ctx) => {
            const {from, result_id} = ctx.update.chosen_inline_result;

            const user = await db.getUser(from.id);
            user.update({queries: user.queries + 1})

            const [type, queryId, voice_id] = result_id.split('_')
            db.updateVoiceCounterById(voice_id)
        })
        
        this.bot.launch()
    }

    async downloadFile(fileId, path) {
        const {body: {result}} = await sa.get(`https://api.telegram.org/bot${this.bot.telegram.token}/getFile?file_id=${fileId}`) 
    
        if (typeof path === 'function') {
            path = path(result)
        }
    
        var stream = fs.createWriteStream(path);
    
        const response = await sa.get(`https://api.telegram.org/file/bot${this.bot.telegram.token}/${result.file_path}`).pipe(stream)
        return new Promise((resolve, reject) => {
            stream.on('end', () => {
                resolve(result);
            });
            stream.on('finish', () => {
                resolve(result);
            });
            stream.on('error', (error) => {
                reject(error);
            });
        });
    }
}


module.exports = { Bot }