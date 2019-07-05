const telegram = require('telegraf')
const fs = require('fs')
var Promise = require("bluebird");
const ops = require('../ops')

class CBQVoiceflow {
    constructor(ctx, options) {
        const {from, chat} = ctx.update.message;
        this.chat = chat
        this.inLibrary = false
        this.isPublic = false
        this.owner = false
        this.admin = false
        this.message_id = false
        this.voice = false
    }

    generateReplyMarkup(admin, owner) {
        const rm = [];
        let row = 0;

        rm.push([{
            text: this.inLibrary ? "Remove from mine" : "Add",
            callback_data: `toggle_inLibrary_${row}`
        }])

        if (this.admin || admin){
            row+=1;
            rm.push([{
                text: this.isPublic ? "Make private" : "Make public",
                callback_data: `toggle_public_${row}`
            }])
        }

        if (this.admin || this.owner || admin || owner) {
            row+=1;
            rm.push([{
                text: "Rename",
                callback_data: `rename_${row}`
            }, {
                text: "Delete",
                callback_data: `delete_${row}`
            }])
        }

        return {
            inline_keyboard: rm
        }
    }


    async init(ctx) {
        let {voice, from} = ctx.update.message;
        this.ctx = ctx
        console.log(ctx)

        const inpt = ctx.update.message.audio || ctx.update.message.document || ctx.update.message.voice
        const caption = ctx.update.message.caption

        if (!(inpt.mime_type === 'audio/x-wav' || inpt.mime_type === 'audio/mpeg' || inpt.mime_type === 'audio/ogg')) {
            return Promise.resolve(false);
        }

        this.admin = await ctx.db.isHe(ctx.user.id, 'admin')

        const voice_path = `./media/voices/${inpt.file_id}.ogg`;
        
        let foundVoiceByCachedId = false;

        if (inpt.mime_type === 'audio/ogg') {
            console.log(`GOT VOICE====>`)
            foundVoiceByCachedId = await ctx.db.getVoiceByCached(voice.file_id);
            
            if (foundVoiceByCachedId) {
                this.isPublic = await ctx.db.isPublic(foundVoiceByCachedId.id)
                console.log(`Found Voice By Cached Id; is Public====>`, this.isPublic)
                
                this.voice = foundVoiceByCachedId; // added voice
    
                const foundPerm = await ctx.db.getPermByUserAndVoiceId(from.id, foundVoiceByCachedId.id)
                if (foundPerm.length) {
                    console.log(`FoundPerm; ====>`)
                    this.inLibrary = true //added inLibrary
                } else {
                    console.log(`Not FoundPerm; ====>`)
                    // await ctx.db.createPerm(foundVoiceByCachedId.id, from.id)
                }
            } else {
                console.log(`NOT Found Voice By Cached Id; is Public====>`, this.isPublic)
                await ctx.bot.downloadFile(voice.file_id, voice_path);
                const [voice_hash, voice_size] = await ops.getHash(voice_path);
                const foundSourceByHash = await ctx.db.findSourceByHashAndMime(voice_hash, 'audio/ogg');
                if (foundSourceByHash) {
                    console.log(`FoundSourceByHash; ====>`)

                    const foundPerm = await ctx.db.getPermByUserAndVoiceId(from.id, foundSourceByHash.voice_id)
                    if (foundPerm.length) {
                        console.log(`FoundPerm; ====>`)

                        this.voice = await ctx.db.getVoiceById(foundSourceByHash.voice_id)
                        this.inLibrary = true
                    } else {
                        console.log(`Not FoundPerm; ====>`)

                        this.voice = await ctx.db.getVoiceById(foundSourceByHash.voice_id)
                        // await ctx.db.createPerm(foundSourceByHash.voice_id, from.id)
                    }
                } else {
                    console.log(`Not FoundSourceByHash; ====>`)
                    this.owner = true
                    this.inLibrary = true
                    this.isPublic = false
                    const original_voice = ctx.update.message.voice

                    const {message_id, voice} = await ctx.replyWithVoice({
                        source: fs.createReadStream(voice_path),
                    }, {
                        caption: original_voice && original_voice.caption || "",
                        // reply_markup: this.generateReplyMarkup()
                    })
                    this.message_id = message_id
    
                    // const updatedVoice = await this.voice.update({
                    //     file_id_cached: voice.file_id,
                    //     size: voice.file_size,
                    //     title: text,
                    //     active: true,
                    // })
                    const newVoice = await ctx.db.createVoice({file_id: voice.file_id, file_id_cached: voice.file_id, hash_sha256: voice_hash, owner_id: from.id, duration: voice.duration, size: voice.file_size, active: true, title:voice.caption || 'Undefined'}) //file_id, hash_sha256, owner_id, duration, size, active, title = 'Untitled'
                    await ctx.db.createSource(voice.mime_type, voice_hash, voice.file_id, voice_size, newVoice.id)
                    const permissionCreated = await ctx.db.createPerm(newVoice.id, ctx.user.id)

                    this.voice = newVoice;

                    const send_msg = await ctx.reply('Send name plz')
                    ctx.user.flow = {
                        next: async (ctx) => {
                            if (ctx.text) {
                                if (ctx.text.length <= 40 ){
                                    await this.addName(ctx)
                                    // this.ctx.editMessageCaption(this.chat.id, this.message_id, ctx.text)//, {reply_markup: this.generateReplyMarkup()})
                                    ctx.deleteMessage(this.message_id)
                                    ctx.deleteMessage(send_msg.message_id)
                                    const {message_id, voice} = await ctx.replyWithVoice({
                                        source: fs.createReadStream(voice_path),
                                    }, {
                                        caption: ctx.text || "LOL?",
                                        reply_markup: this.generateReplyMarkup()
                                    })
                                    this.message_id = message_id
                                    ctx.user.cbqueries[message_id] = this
                                    this.next = this.processUpdate
                                } else {
                                    ctx.reply('Plz send title shorter that 40 characters')
                                }
                                
                            } 
                            // TODO: handle multiple
                            return false
                        }
                    }
                    

                    return true
                }
            }
        } else {
            const extension = inpt.mime_type === 'audio/x-wav' ? 'wav' : 'mp3'
            const inpt_path = `./media/${extension}/${inpt.file_id}.${extension}`;
            await ctx.bot.downloadFile(inpt.file_id, inpt_path);
            const [inpt_hash, inpt_size] = await ops.getHash(inpt_path);
            const foundSourceByHash = await ctx.db.findSourceByHashAndMime(inpt_hash, inpt.mime_type);

            if (foundSourceByHash) {
                console.log(`foundSourceByHash; ====>`, foundSourceByHash.voice_id)

                this.voice = await ctx.db.getVoiceById(foundSourceByHash.voice_id)
                if (this.voice.owner_id === ctx.user.id) this.owner = true
                this.isPublic = ctx.db.isPublic(this.voice.id)
                // await ctx.db.getVoiceById(foundSourcesByHash.voice_id);
                const foundPerm = await ctx.db.getPermByUserAndVoiceId(ctx.user.id, this.voice.id)
                if (foundPerm.length) {
                    console.log(`foundPerm; ====>`)

                    this.inLibrary = true
                } else {
                    console.log(`Not foundPerm; ====>`)
                    this.inLibrary = false

                    // await ctx.db.createPerm(foundSourceByHash.voice_id, from.id)
                }
            } else {
                console.log(`Not foundSourceByHash; ====>`, inpt_hash)

                const voice_path = `media/voices/${inpt.file_id}.ogg`;
                await ops.smth2ogg(inpt_path, voice_path);
                const [voice_hash, voice_size] = await ops.getHash(voice_path);

                this.owner = true
                this.inLibrary = true
                this.isPublic = false
                const original_voice = ctx.update.message.voice

                const {message_id, voice} = await ctx.replyWithVoice({
                    source: fs.createReadStream(voice_path),
                }, Object.assign({
                    caption: caption || ""
                }, caption ? {reply_markup: this.generateReplyMarkup()} : {}))
                this.message_id = message_id

                // const updatedVoice = await this.voice.update({
                //     file_id_cached: voice.file_id,
                //     size: voice.file_size,
                //     title: text,
                //     active: true,
                // })
                const newVoice = await ctx.db.createVoice({file_id: voice.file_id, file_id_cached: voice.file_id, hash_sha256: voice_hash, owner_id: from.id, duration: voice.duration, size: voice.file_size, active: true, title: (caption && caption.length <= 40)? caption : 'Undefined'}) //file_id, hash_sha256, owner_id, duration, size, active, title = 'Untitled'
                await ctx.db.createSource(inpt.mime_type, inpt_hash, newVoice.file_id, inpt_size, newVoice.id)
                const permissionCreated = await ctx.db.createPerm(newVoice.id, ctx.user.id)

                this.voice = newVoice;

                if (!caption || caption.length > 40) {
                    const send_msg = await ctx.reply('Send name plz')
                    ctx.user.flow = {
                        next: async (ctx) => {
                            if (ctx.text) {
                                if (ctx.text.length <= 40) {
                                    await this.addName(ctx)
                                    // this.ctx.editMessageCaption(this.chat.id, this.message_id, ctx.text)//, {reply_markup: this.generateReplyMarkup()})
                                    ctx.deleteMessage(this.message_id)
                                    ctx.deleteMessage(send_msg.message_id)
                                    const {message_id, voice} = await ctx.replyWithVoice({
                                        source: fs.createReadStream(voice_path),
                                    }, {
                                        caption: ctx.text || "LOL?",
                                        reply_markup: this.generateReplyMarkup()
                                    })
                                    this.message_id = message_id
                                    ctx.user.cbqueries[message_id] = this
                                    this.next = this.processUpdate
                                } else {
                                    ctx.reply('Plz send title shorter that 40 characters')
                                }
                                
                                // console.log()
                            } 
                            // TODO: handle multiple
                            return false
                        }
                    }

                    return true
                } else {
                    this.message_id = message_id
                    ctx.user.cbqueries[message_id] = this
                    this.next = this.processUpdate
                }
                return true
            }
        }

        

        const cbq = await ctx.replyWithVoice(this.voice.file_id_cached, {
            caption: this.voice.title,
            reply_markup: this.generateReplyMarkup()
        })
        ctx.user.cbqueries[cbq.message_id] = this
        this.message_id = cbq.message_id
        // this.ctx = ctx

        this.next = this.processUpdate
        return true
    }

    async addName(ctx) {
        let {text, from} = ctx.update.message;

        if (text.length > 40) {
            ctx.reply('Plz send name shorter than 40 characters')
        } else {
            if (this.voice) {
                // const {message_id, voice} = await ctx.replyWithVoice({
                //     source: fs.createReadStream(`./media/voices/${this.voice.file_id}.ogg`)
                // })
                // this.message_id = message_id

                const updatedVoice = await this.voice.update({
                    title: text,
                }) // ctx.db.updateCachedVoice(task.content, voice.file_id, voice.file_size, text);

                // if (zeroRight && (await ctx.db.getUserRoles(from.id)).indexOf('admin') > -1 ) from.id = 0;
                // const permissionCreated = await ctx.db.createPerm(this.voice.id, from.id)
                this.voice = updatedVoice
                ctx.user.flow = null

                return updatedVoice
                // const voice = updateVoiceTitle(task.content, text);
            }
        }

        return false
    }

    async updateText() {
        return this.ctx.editMessageText(this.text(), {reply_markup: this.reply_markup})
    }

    async updateReplyMarkup(reply_markup) {
        return this.ctx.editMessageReplyMarkup(reply_markup)
    }

    // toggle_inLibrary
    // toggle_public
    // rename
    // delete

    async processUpdate(ctx) {
        this.ctx = ctx
        this.cbqctx = ctx
        console.log(`DATA?`, ctx.update)
        const {from ,data, message} = ctx.update.callback_query;
        let {reply_markup, message_id} = message;
        this.reply_markup = reply_markup
        console.log(data)
        // let p = JSON.parse(data)

        if (data.startsWith('toggle_inLibrary')) {
            this.inLibrary = !this.inLibrary
            if (this.inLibrary) {
                await ctx.db.createPerm(this.voice.id, from.id)
            } else {
                await ctx.db.deletePermByVoiceAndUserId(this.voice.id, from.id)
            }
            // await this.updateReplyMarkup(reply_markup)
        } else if (data.startsWith('toggle_public')) {
            this.isPublic = !this.isPublic
            if (this.isPublic) {
                await ctx.db.makePublic(this.voice.id)
                console.log('made public====================>')
            } else {
                await ctx.db.makePrivate(this.voice.id)
                console.log('made private====================>')
            }
            // ctx.user.flow = {next: async (ctx) => {
            //     if (ctx.update.message.text) {
            //         this[p.t] = ctx.update.message.text
            //         this.updateText()
            //     }
            //     ctx.user.flow = null
            // }}

        } else if (data.startsWith('rename')) {
            ctx.reply('Send name plz')
            ctx.user.flow = {
                next: async (ctx) => {
                    if (ctx.text) {
                        await this.addName(ctx)
                        console.log('TEXT===>', ctx.text)
                        this.ctx.editMessageCaption(ctx.text, {reply_markup: this.generateReplyMarkup()})
                        ctx.user.cbqueries[message_id] = this
                        this.next = this.processUpdate
                    } 
                    // TODO: handle multiple
                    return false
                }
            }
            await ctx.answerCbQuery()
            return false

            // await this.updateReplyMarkup({inline_keyboard:[]})
            // this.exit()
            // return true
        } else if (data.startsWith('delete')) {
            let voice_entry = await ctx.db.getVoiceByCached(this.voice.file_id);
            let voice_source = await ctx.db.getSourcesVoiceId(voice_entry.id);


            await ops.deleteMedia(voice_source.original_id) // rm media/*/${voice_source.original_id}.*
            await Promise.all([ctx.db.deletePermByVoiceId(voice_entry.id), voice_source.destroy(), voice_entry.destroy()])
            await ctx.deleteMessage(this.message_id)
            this.exit()
            await ctx.answerCbQuery()
            return true
        }
        console.log('doing whats left====================>')


        this.next = this.processUpdate
        console.log( {reply_markup: this.generateReplyMarkup()})
        await this.ctx.editMessageCaption(this.voice.title, {reply_markup: this.generateReplyMarkup()})
        console.log('LOOOOOOOOOOOOOOOL')


        await ctx.answerCbQuery()
        return true
    }

    exit() {
        this.ctx.user.cbqueries[this.message_id] = null
    }
}

module.exports = CBQVoiceflow