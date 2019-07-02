class AdminMe {
    constructor(ctx) {
        ctx.user.flow = this
        this.toAdd = []
        // ctx.reply('Hi, whats next?')
    
        // this.next = (ctx) => {
        //     if (ctx.text === 'lol') {
        //         this.lols = 0;
        //         this.lol(ctx)
        //     } else if (ctx.text === 'kek') {
        //         this.kek(ctx)
        //     } else {
        //         this.exit(ctx)
        //     }

        //     return false
        // }

    }

    // async init(ctx) {
    //     const {from} = ctx.update.message;

    //     const inpt = ctx.update.message.audio || ctx.update.message.document

    //     if (!(inpt.mime_type === 'audio/x-wav' || inpt.mime_type === 'audio/mpeg')) {
    //         return Promise.resolve(false);
    //     }

    //     ctx.reply(`Got audio '${inpt.mime_type}'`);
    //     const extension = inpt.mime_type === 'audio/x-wav' ? 'wav' : 'mp3'
    //     const inpt_path = `./media/${extension}/${inpt.file_id}.${extension}`;
    //     await this.downloadFile(inpt.file_id, inpt_path);
    //     const [inpt_hash, inpt_size] = await ops.getHash(inpt_path);
    //     const foundSourceByHash = await ctx.db.findSourceByHashAndMime(inpt_hash, inpt.mime_type);

    //     if (foundSourceByHash) {
    //         // await ctx.db.getVoiceById(foundSourcesByHash.voice_id);
    //         const foundPerm = await ctx.db.getPermByUserAndVoiceId(from.id, foundSourcesByHash.voice_id)
    //         if (!foundPerm.length) {
    //             await ctx.db.createPerm(foundSourcesByHash.voice_id, from.id)
    //             const existingVoice = await ctx.db.getVoiceById(foundSourcesByHash.voice_id)
    //             ctx.reply(`Cool, now u can use the voice: '${existingVoice.title}'`)
    //         } else {
    //             ctx.reply('U have it already!')
    //         }
    //     } else {
    //         const voice_path = `media/voices/${inpt.file_id}.ogg`;
    //         await ops.smth2ogg(inpt_path, voice_path);
    //         const [voice_hash, voice_size] = await ops.getHash(voice_path);
    //         const voice = await ctx.db.createVoice(inpt.file_id, voice_hash, from.id, inpt.duration, voice_size, false)
    //         await ctx.db.createSource(inpt.mime_type, inpt_hash, inpt.file_id, inpt_size, voice.id)
    //         this.toAdd.unshift(voice)

    //         this.next = async (ctx) => {
    //             if (ctx.text) {
    //                 await this.addName(ctx)
    //             } else if (ctx.document || ctx.audio) {
    //                 await this.mp3OrDoc(ctx)
    //             } 
    //             // else {
    //             //     this.exit(ctx)
    //             // }
    //             return false
    //         }

    //         // await ctx.db.createTask(from.id, 0, 'saveTitle.mp3', voice.id)
    //         ctx.reply('Plz send the name')
    //     }
    
    //     return false
    // }


    exit(ctx) {
        if (!this.toAdd.length) {
            ctx.user.flow = null;
        }
    }
}


module.exports = AdminMe;