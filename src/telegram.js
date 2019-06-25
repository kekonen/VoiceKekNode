const Telegraf = require('telegraf')
const ops = require('./ops')
const sa = require('superagent')
const fs = require('fs')


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
    
        // this.bot.help((ctx) => ctx.reply('Send me a sticker'))
        this.bot.on('audio', async (ctx) => {
            const {audio, from} = ctx.update.message;

            ctx.reply(`Got audio '${audio.mime_type}'`);
            const mp3_path = `./media/mp3/${audio.file_id}.mp3`;
            await this.downloadFile(audio.file_id, mp3_path);
            const [mp3_hash, mp3_size] = await ops.getHash(mp3_path);
            const foundSourcesByHash = await db.findSourceByHashAndMime(mp3_hash, 'audio/mpeg');

            if (foundSourcesByHash.length) {
                await db.findVoiceById(foundSourcesByHash[0].voice_id);
                const foundPerm = await db.findPermByUserAndVoiceId(from.id, foundSourcesByHash[0].voice_id)
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
                const [voice] = await db.createVoice(audio.file_id, voice_hash, from.id, audio.duration, voice_size, false)
                await db.createSource(audio.mime_type, mp3_hash, audio.file_id, mp3_size, voice.id)
                await db.createTask(from.id, 0, 'saveTitle.mp3', voice.id)
                ctx.reply('Plz send the name')
            }
        })

        this.bot.on('document', async (ctx) => {
            const {document, from} = ctx.update.message;
            console.log(document)

            if (document.mime_type === 'audio/x-wav') {
                ctx.reply('Got wav');
                const wav_path = `./media/wav/${document.file_id}.wav`;
                await this.downloadFile(document.file_id, wav_path);
                const [wav_hash, wav_size] = await ops.getHash(wav_path);
                const foundSourcesByHash = await db.findSourceByHashAndMime(wav_hash, 'audio/x-wav');

                if (foundSourcesByHash.length) {
                    await db.findVoiceById(foundSourcesByHash[0].voice_id);
                    const foundPerm = await db.findPermByUserAndVoiceId(from.id, foundSourcesByHash[0].voice_id)
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
                    const [voice] = await db.createVoice(document.file_id, voice_hash, from.id, document.duration, voice_size, false)
                    await db.createSource(document.mime_type, wav_hash, document.file_id, wav_size, voice.id)
                    await db.createTask(from.id, 0, 'saveTitle.wav', voice.id)
                    ctx.reply('Plz send the name')
                }
            }
        })

        this.bot.on('voice', async (ctx) => {
            const {voice, from} = ctx.update.message;
            console.log('voice', voice)
            // ctx.reply('Got audio');
            const voice_path = `./media/voices/${voice.file_id}.ogg`;
            await this.downloadFile(voice.file_id, voice_path);
            const [voice_hash, voice_size] = await ops.getHash(voice_path);
            const foundSourcesByHash = await db.findSourceByHashAndMime(voice_hash, 'audio/ogg');

            if (foundSourcesByHash.length) {
                await db.findVoiceById(foundSourcesByHash[0].voice_id);
                const foundPerm = await db.findPermByUserAndVoiceId(from.id, foundSourcesByHash[0].voice_id)
                if (!foundPerm.length) {
                    await db.createPerm(foundSourcesByHash[0].voice_id, from.id)
                    ctx.reply('Cool, now u can use the audio')
                } else {
                    ctx.reply('U have it already!')
                }
            } else {
                const [newVoice] = await db.createVoice(voice.file_id, voice_hash, from.id, voice.duration, voice_size, false)
                console.log('newVoice', newVoice)
                await db.createSource(voice.mime_type, voice_hash, voice.file_id, voice_size, newVoice.id)
                await db.createTask(from.id, 0, 'saveTitle.voice', newVoice.id)
                ctx.reply('Plz send the name')
            }
        })

        // this.bot.hears('hi', (ctx) => ctx.reply('Hey there'))
        this.bot.on('text', async (ctx) => {
            const {text, from} = ctx.update.message;
            const tasks = await db.findTasks(from.id, 0);

            if (tasks.length) {
                const task = tasks[0];
                console.log(task)

                if (task.task === 'saveTitle.wav' || task.task === 'saveTitle.mp3' || task.task === 'saveTitle.voice') {
                    if (text.length > 40) {
                        ctx.reply('Plz send name shorter than 40 characters')
                    } else {
                        const targetVoices = await db.getVoiceById(task.content)
                        if (targetVoices.length) {
                            const {voice} = await ctx.replyWithVoice({
                                source: fs.createReadStream(`./media/voices/${targetVoices[0].file_id}.ogg`)
                            })
                            const updatedVoice = await db.updateCachedVoice(task.content, voice.file_id, voice.file_size, text);
                            console.log('Updated voice', updatedVoice)
                            const taskFullfilled = await db.fullfillTask(task.id)
                            const permissionCreated = await db.createPerm(updatedVoice[0].id, from.id)
                            // const voice = updateVoiceTitle(task.content, text);
                        }
                    }

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
                return {
                    type: "voice",
                    id: `voice_${id}_${i}`,
                    voice_file_id: v.file_id_cached,
                    title: v.title
                }
            }) || []

            ctx.answerInlineQuery(results, {
                is_personal: true,
            })
            
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