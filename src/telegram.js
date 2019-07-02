const Telegraf = require('telegraf')
const ops = require('./ops')
const sa = require('superagent')
const fs = require('fs')
var Promise = require("bluebird");
const announcements = require('./files/announcements.json')
const AddMusic = require('./flows/addMusic')
const Voice = require('./flows/Voice')



class Bot {
    constructor(token) {
        this.bot = new Telegraf(token)

        this.context = {
            users: {}
        }
    }

    async setup(db) {

        this.bot.use(async (ctx, next) => {
            const {from} = ctx.update.message;
            console.log(ctx.updateType, ctx.updateSubTypes)

            if (ctx.updateType != 'inline_query' && ctx.updateType != 'chosen_inline_result') {
                if (!(await db.isHe(from.id, 'user'))) {
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
            ctx.db = db;
        
            if (ctx.user.flow) {
                if (await ctx.user.flow.next(ctx)) {
                    return Promise.resolve()
                }
            } 
        
            return next(ctx)
        })

        this.bot.start(async (ctx) => {
            const {from} = ctx.update.message;
    
            if (!(await db.isHe(from.id, 'user'))) {
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
                await db.createTask(from.id, 0, 'make_me_admin', "kek")
            } 
        })

        this.bot.command('delete', async (ctx) => {
            const {from} = ctx.update.message;

            if (await db.isHe(from.id, 'admin')) {
                ctx.reply('Send voice to delete')
                await db.createTask(from.id, 1, 'delete_voice', "kek")
            } else {
                ctx.reply('No, u are not an admin')
            }
            
        })
    
        // this.bot.help((ctx) => ctx.reply('Send me a sticker'))
        this.bot.on('audio', async (ctx) => {
            const {audio, from} = ctx.update.message;

            let flow = new AddMusic()

            if (!(await flow.mp3OrDoc(ctx))) {
                ctx.reply(`Ты мне втираешь какую то дичь`)
            } else {
                ctx.reply(`OK!!!`)
            }
        })

        this.bot.on('document', async (ctx) => {
            const {document, from} = ctx.update.message;

            let flow = new AddMusic()

            ctx.user.flow = flow

            if (!(await flow.mp3OrDoc(ctx))) {
                ctx.reply(`Ты мне втираешь какую то дичь`)
            } else {
                ctx.reply(`OK!!!`)
            }
        })

        this.bot.on('voice', async (ctx) => {
            

            let flow = new Voice();

            ctx.user.flow = flow;

            flow.init(ctx)

            
        })

        // this.bot.hears('hi', (ctx) => ctx.reply('Hey there'))
        this.bot.on('text', async (ctx) => {
            let {text, from} = ctx.update.message;

            const tasks = await db.getTasks(from.id, 0);

            let zeroRe = /^\!z (.*)/;
            let zeroRight = zeroRe.exec(text);
            if (zeroRight) {
                text = zeroRight[1]
            }
            console.log(zeroRight, text)

            if (tasks.length) {
                const task = tasks[0];
                console.log(task)

                if (task.task === 'saveTitle.wav' || task.task === 'saveTitle.mp3' || task.task === 'saveTitle.voice') {
                    if (text.length > 40) {
                        ctx.reply('Plz send name shorter than 40 characters')
                    } else {
                        console.log('-------1')
                        const targetVoice = await db.getVoiceById(task.content)
                        console.log('-------1.5', targetVoice)

                        if (targetVoice) {
                            console.log('-------2')

                            const {voice} = await ctx.replyWithVoice({
                                source: fs.createReadStream(`./media/voices/${targetVoice.file_id}.ogg`)
                            })
                            console.log('-------3')

                            const updatedVoice = await db.updateCachedVoice(task.content, voice.file_id, voice.file_size, text);
                            console.log('Updated voice', updatedVoice)
                            const taskFullfilled = await db.fullfillTask(task.id)
                            console.log('-------4', updatedVoice)

                            let from_id = from.id;
                            if (zeroRight && (await db.getUserRoles(from.id)).indexOf('admin') > -1 ) from_id = 0;
                            console.log(`Form id`, from_id, (await db.getUserRoles(from.id)))
                            const permissionCreated = await db.createPerm(task.content, from_id)
                            // const voice = updateVoiceTitle(task.content, text);
                        }
                    }

                } xxxxxxelse if (task.task === 'make_me_admin') {
                    if (text === 'в попу раз' || text === 'В попу раз') {
                        await db.createUserRole(from.id, 'admin')
                        ctx.reply('я заскринил')
                    }
                    const taskFullfilled = await db.fullfillTask(task.id)
                }
            }
            // ctx.reply('text')
        })

        this.bot.on('inline_query', async (ctx) => {
            const {id, query, from} = ctx.update.inline_query;

            // console.log('query===', ctx)
            
            if (!(await db.getUser(from.id))) {
                console.log('No user!')
                await db.createUser(from.id, {queries: 0});
                // ctx.answerInlineQuery([], {
                //     is_personal: true,
                //     switch_pm_text: "Hey, click here",
                //     switch_pm_parameter: "new"
                // })
                // return ;
            }

            // console.log(`from====`, await db.getAllowedVoicesLike(from.id, query))
            // let results = []
            const results = (await db.getAllowedVoicesLike(from.id, query)).slice(0,20).map((v, i) => {
                // console.log('v============', v.voice_permissions)
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

            console.log('result_id', result_id)
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