const telegram = require('telegraf')

class CBQVoiceflow {
    constructor(ctx, options) {
        const {from} = ctx.update.message;
        this.inLibrary = false
        this.isPublic = false
        this.owner = false
        this.admin = false
        this.message_id = false
        this.voice = voice
    }

    generateReplyMarkup() {
        const rm = [];
        rm.push([{
            text: this.inLibrary ? "Remove from mine" : "Add",
            callback_data: "toggle_inLibrary"
        }])

        if (this.admin){
            rm.push([{
                text: this.isPublic ? "Make private" : "Make public",
                callback_data: "toggle_public"
            }])
        }

        if (this.admin || this.owner) {
            rm.push([{
                text: "Rename",
                callback_data: "rename"
            }, {
                text: "Delete",
                callback_data: "delete"
            }])
        }

        return {
            inline_keyboard: rm
        }
    }


    async init(ctx) {
        let {voice, from} = ctx.update.message;
        this.ctx = ctx

        const kb = [[],[]]

        const inpt = ctx.update.message.audio || ctx.update.message.document || ctx.update.message.voice

        if (!(inpt.mime_type === 'audio/x-wav' || inpt.mime_type === 'audio/mpeg' || inpt.mime_type === 'audio/ogg')) {
            return Promise.resolve(false);
        }

        const voice_path = `./media/voices/${voice.file_id}.ogg`;
        
        let foundVoiceByCachedId = false;

        if (inpt.mime_type === 'audio/ogg') {
            foundVoiceByCachedId = await ctx.db.getVoiceByCached(voice.file_id);
            this.isPublic = ctx.db.isPublic(voice.id)
            if (foundVoiceByCachedId) {
                this.voice = foundVoiceByCachedId; // added voice
    
                const foundPerm = await ctx.db.getPermByUserAndVoiceId(from.id, foundVoiceByCachedId.id)
                if (foundPerm.length) {
                    this.inLibrary = true //added inLibrary
                } else {
                    // await ctx.db.createPerm(foundVoiceByCachedId.id, from.id)
                }
            } else {
                await this.downloadFile(voice.file_id, voice_path);
                const [voice_hash, voice_size] = await ops.getHash(voice_path);
                const foundSourceByHash = await ctx.db.findSourceByHashAndMime(voice_hash, 'audio/ogg');
                if (foundSourceByHash) {
                    const foundPerm = await ctx.db.getPermByUserAndVoiceId(from.id, foundSourceByHash.voice_id)
                    if (foundPerm.length) {
                        this.voice = await ctx.db.getVoiceById(foundSourceByHash.voice_id)
                        this.inLibrary = true
                    } else {
                        this.voice = await ctx.db.getVoiceById(foundSourceByHash.voice_id)
                        // await ctx.db.createPerm(foundSourceByHash.voice_id, from.id)
                    }
                } else {
                    const {message_id, voice} = await ctx.replyWithVoice({
                        source: fs.createReadStream(`./media/voices/${this.voice.file_id}.ogg`),
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
                    this.inLibrary = true
                    this.owner = true
                    this.admin = await ctx.db.isHe(ctx.user.id, 'admin')
                    this.isPublic = false

                    this.voice = newVoice;

                    ctx.reply('Send name plz')
                    ctx.user.flow = {
                        next: (ctx) => {
                            if (ctx.text) {
                                await this.addName(ctx)
                                telegram.editMessageText(message_id, ctx.text, {reply_markup: this.generateReplyMarkup()})
                                ctx.user.cbqueries[message_id] = this
                                this.next = this.processUpdate
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
            foundSourceByHash = await ctx.db.findSourceByHashAndMime(inpt_hash, inpt.mime_type);

            if (foundSourceByHash) {
                this.voice = await ctx.db.getVoiceById(foundSourceByHash.voice_id)
                this.isPublic = ctx.db.isPublic(voice.id)
                // await ctx.db.getVoiceById(foundSourcesByHash.voice_id);
                const foundPerm = await ctx.db.getPermByUserAndVoiceId(from.id, foundSourceByHash.voice_id)
                if (foundPerm.length) {
                    this.inLibrary = true
                } else {
                    // await ctx.db.createPerm(foundSourceByHash.voice_id, from.id)
                }
            } else {
                const voice_path = `media/voices/${inpt.file_id}.ogg`;
                await ops.smth2ogg(inpt_path, voice_path);
                const [voice_hash, voice_size] = await ops.getHash(voice_path);

                const {message_id, voice} = await ctx.replyWithVoice({
                    source: fs.createReadStream(voice_path)
                })
                this.message_id = message_id

                const newVoice = await ctx.db.createVoice({file_id: voice.file_id, file_id_cached: voice.file_id, hash_sha256: voice_hash, owner_id: from.id, duration: voice.duration, size: voice.file_size, active: true, title:voice.caption || 'Undefined'}) //file_id, hash_sha256, owner_id, duration, size, active, title = 'Untitled'
                await ctx.db.createSource(voice.mime_type, voice_hash, voice.file_id, voice_size, newVoice.id)
                const permissionCreated = await ctx.db.createPerm(newVoice.id, ctx.user.id)
                this.inLibrary = true
                this.owner = true
                this.admin = await ctx.db.isHe(ctx.user.id, 'admin')
                this.isPublic = false

                this.voice = newVoice;

                ctx.reply('Send name plz')
                ctx.user.flow = {
                    next: (ctx) => {
                        if (ctx.text) {
                            await this.addName(ctx)
                            telegram.editMessageText(message_id, ctx.text, {reply_markup: this.generateReplyMarkup()})
                            ctx.user.cbqueries[message_id] = this
                            this.next = this.processUpdate
                        } 
                        // TODO: handle multiple
                        return false
                    }
                }
                return true
            }
        }

        

        const cbq = await ctx.replyWithVoice(this.voice.file_id_cached, {
            reply_markup: this.generateReplyMarkup()
        })
        ctx.user.cbqueries[cbq.message_id] = this
        this.message_id = cbq.message_id
        // this.ctx = ctx

        this.next = this.processUpdate
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
                ctx.user.flow = null
                // const voice = updateVoiceTitle(task.content, text);
            }
        }
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

module.exports = CBQVoiceflow