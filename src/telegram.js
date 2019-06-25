const Telegraf = require('telegraf')
const ops = require('./ops')
const sa = require('superagent')
const fs = require('fs')
var Promise = require("bluebird");



class Bot {
    constructor(token) {
        this.bot = new Telegraf(token)
    }

    async setup(db) {
        this.bot.start(async (ctx) => {
            const chatId = (await ctx.getChat()).id;
    
            const user = await db.getUser(chatId);
    
            if (!user.length) {
                await db.createUser(chatId);
                ctx.reply('Welcome!');
                return ;
            }
    
            ctx.reply('Hello again!');
        })

        this.bot.command('admin_me', async (ctx) => {
            const {from} = ctx.update.message;

            if (!(await db.getUser(from.id)).length) {
                ctx.reply('Register first with /start')
                return ;
            }

            if ((await db.getUserRoles(from.id)).indexOf('admin') > -1 ) {
                ctx.reply('Да все с тобой ясно')
            } else {
                ctx.reply('Вилкой в глаз или в попу раз?')
                await db.createTask(from.id, 0, 'make_me_admin', "kek")
            }
            
        })

        this.bot.command('delete', async (ctx) => {
            const {from} = ctx.update.message;

            if (!(await db.getUser(from.id)).length) {
                ctx.reply('Register first with /start')
                return ;
            }

            if ((await db.getUserRoles(from.id)).indexOf('admin') > -1 ) {
                ctx.reply('Send voice to delete')
                await db.createTask(from.id, 1, 'delete_voice', "kek")
            } else {
                ctx.reply('No, u are not an admin')
            }
            
        })
    
        // this.bot.help((ctx) => ctx.reply('Send me a sticker'))
        this.bot.on('audio', async (ctx) => {
            const {audio, from} = ctx.update.message;

            if (!(await db.getUser(from.id)).length) {
                ctx.reply('Register first with /start')
                return ;
            }

            ctx.reply(`Got audio '${audio.mime_type}'`);
            const mp3_path = `./media/mp3/${audio.file_id}.mp3`;
            await this.downloadFile(audio.file_id, mp3_path);
            const [mp3_hash, mp3_size] = await ops.getHash(mp3_path);
            const foundSourcesByHash = await db.findSourceByHashAndMime(mp3_hash, 'audio/mpeg');

            if (foundSourcesByHash.length) {
                // await db.getVoiceById(foundSourcesByHash[0].voice_id);
                const foundPerm = await db.getPermByUserAndVoiceId(from.id, foundSourcesByHash[0].voice_id)
                if (!foundPerm.length) {
                    await db.createPerm(foundSourcesByHash[0].voice_id, from.id)
                    ctx.reply('Cool, now u can use the audio')
                } else {
                    ctx.reply('U have it already!')
                }
            } else {
                const voice_path = `media/voices/${audio.file_id}.ogg`;
                await ops.smth2ogg(mp3_path, voice_path);
                const [voice_hash, voice_size] = await ops.getHash(voice_path);
                const voice = await db.createVoice(audio.file_id, voice_hash, from.id, audio.duration, voice_size, false)
                await db.createSource(audio.mime_type, mp3_hash, audio.file_id, mp3_size, voice.id)
                await db.createTask(from.id, 0, 'saveTitle.mp3', voice.id)
                ctx.reply('Plz send the name')
            }
        })

        this.bot.on('document', async (ctx) => {
            const {document, from} = ctx.update.message;

            if (!(await db.getUser(from.id)).length) {
                ctx.reply('Register first with /start')
                return ;
            }

            if (document.mime_type === 'audio/x-wav') {
                ctx.reply('Got wav');
                const wav_path = `./media/wav/${document.file_id}.wav`;
                await this.downloadFile(document.file_id, wav_path);
                const [wav_hash, wav_size] = await ops.getHash(wav_path);
                const foundSourcesByHash = await db.findSourceByHashAndMime(wav_hash, 'audio/x-wav');

                if (foundSourcesByHash.length) {
                    // await db.getVoiceById(foundSourcesByHash[0].voice_id);
                    const foundPerm = await db.getPermByUserAndVoiceId(from.id, foundSourcesByHash[0].voice_id)
                    if (!foundPerm.length) {
                        await db.createPerm(foundSourcesByHash[0].voice_id, from.id)
                        ctx.reply('Cool, now u can use the audio')
                    } else {
                        ctx.reply('U have it already!')
                    }
                } else {
                    const voice_path = `media/voices/${document.file_id}.ogg`;
                    await ops.smth2ogg(wav_path, voice_path);
                    const [voice_hash, voice_size] = await ops.getHash(voice_path);
                    const voice = await db.createVoice(document.file_id, voice_hash, from.id, document.duration, voice_size, false)
                    await db.createSource(document.mime_type, wav_hash, document.file_id, wav_size, voice.id)
                    await db.createTask(from.id, 0, 'saveTitle.wav', voice.id)
                    ctx.reply('Plz send the name')
                }
            }
        })

        this.bot.on('voice', async (ctx) => {
            const {voice, from} = ctx.update.message;

            if (!(await db.getUser(from.id)).length) {
                ctx.reply('Register first with /start')
                return ;
            }

            const tasks = await db.getTasks(from.id, 1);
            if (tasks.length) {
                const task = tasks[0];
                console.log(task)

                if (task.task === 'delete_voice') {
                    let voice_entry = await db.getVoiceByCached(voice.file_id);
                    let voice_source = await db.getSourcesVoiceId(voice_entry.id);


                    await ops.deleteMedia(voice_source.original_id) // rm media/*/${voice_source.original_id}.*
                    await Promise.all([db.deletePermByVoiceId(voice_entry.id), voice_source.destroy(), voice_entry.destroy()])
                }
            } else {
                // ctx.reply('Got audio');
                const voice_path = `./media/voices/${voice.file_id}.ogg`;
                await this.downloadFile(voice.file_id, voice_path);
                const [voice_hash, voice_size] = await ops.getHash(voice_path);
                const foundSourcesByHash = await db.findSourceByHashAndMime(voice_hash, 'audio/ogg');
                console.log('=======foundSourcesByHash', foundSourcesByHash)
                if (foundSourcesByHash.length) {
                    // await db.getVoiceById(foundSourcesByHash[0].voice_id);
                    const foundPerm = await db.getPermByUserAndVoiceId(from.id, foundSourcesByHash[0].voice_id)
                    if (!foundPerm.length) {
                        await db.createPerm(foundSourcesByHash[0].voice_id, from.id)
                        ctx.reply('Cool, now u can use the audio')
                    } else {
                        ctx.reply('U have it already!')
                    }
                } else {
                    console.log('=====1')
                    const newVoice = await db.createVoice(voice.file_id, voice_hash, from.id, voice.duration, voice_size, false)
                    console.log('=====2')
                    console.log('newVoice', newVoice)
                    await db.createSource(voice.mime_type, voice_hash, voice.file_id, voice_size, newVoice.id)
                    console.log('=====3')
                    await db.createTask(from.id, 0, 'saveTitle.voice', newVoice.id)
                    ctx.reply('Plz send the name')
                }
            }

            
        })

        // this.bot.hears('hi', (ctx) => ctx.reply('Hey there'))
        this.bot.on('text', async (ctx) => {
            let {text, from} = ctx.update.message;

            if (!(await db.getUser(from.id)).length) {
                ctx.reply('Register first with /start')
                return ;
            }

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

                } else if (task.task === 'make_me_admin') {
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


            const user = await db.getUser(from.id);
            console.log('user', user)
            if (!user.length) {
                console.log('No user!')
                ctx.answerInlineQuery([], {
                    is_personal: true,
                    switch_pm_text: "Hey, click here",
                    switch_pm_parameter: "new"
                })
                return ;
            }

            // console.log(`from====`, await db.getAllowedVoicesLike(from.id, query))
            // let results = []
            const results = (await db.getAllowedVoicesLike(from.id, query)).slice(0,20).map((v, i) => {
                console.log('v============', v.voice_permissions)
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