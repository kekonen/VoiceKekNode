class Voice {
    constructor() {
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

    async init(ctx) {
        const {voice, from} = ctx.update.message;

        const voice_path = `./media/voices/${voice.file_id}.ogg`;
        const foundVoiceByCachedId = await ctx.db.getVoiceByCached(voice.file_id);
        if (foundVoiceByCachedId) {
            const foundPerm = await ctx.db.getPermByUserAndVoiceId(from.id, foundVoiceByCachedId.id)
            if (!foundPerm.length) {
                await ctx.db.createPerm(foundVoiceByCachedId.id, from.id)
                ctx.reply(`Cool, now u can use the voice: '${foundVoiceByCachedId.title}'`)
            } else {
                ctx.reply('U have it already!')
            }
        } else {
            await this.downloadFile(voice.file_id, voice_path);
            const [voice_hash, voice_size] = await ops.getHash(voice_path);
            const foundSourceByHash = await ctx.db.findSourceByHashAndMime(voice_hash, 'audio/ogg');
            console.log('=======foundSourceByHash', foundSourceByHash)
            if (foundSourceByHash) {
                // await ctx.db.getVoiceById(foundSourcesByHash[0].voice_id);
                const foundPerm = await ctx.db.getPermByUserAndVoiceId(from.id, foundSourceByHash.voice_id)
                if (!foundPerm.length) {
                    await ctx.db.createPerm(foundSourceByHash.voice_id, from.id)
                    const existingVoice = await ctx.db.getVoiceById(foundSourceByHash.voice_id)
                    ctx.reply(`Cool, now u can use the voice: '${existingVoice.title}'`)
                } else {
                    ctx.reply('U have it already!')
                }
            } else {
                console.log('=====1')
                const newVoice = await ctx.db.createVoice(voice.file_id, voice_hash, from.id, voice.duration, voice_size, false)
                console.log('=====2')
                console.log('newVoice', newVoice)
                await ctx.db.createSource(voice.mime_type, voice_hash, voice.file_id, voice_size, newVoice.id)
                console.log('=====3')
                this.targetVoice = newVoice;
                this.next = async (ctx) => {
                    if (ctx.text) {
                        await this.addName(ctx)
                        ctx.exit()
                    } 
                    // else if (ctx.document || ctx.audio) {
                    //     this.mp3OrDoc(ctx)
                    // } 
                    // else {
                    //     this.exit(ctx)
                    // }
                    return false
                }
                await ctx.db.createTask(from.id, 0, 'saveTitle.voice', newVoice.id)
                ctx.reply('Plz send the name')
            }
        }
            // const tasks = await ctx.db.getTasks(from.id, 1);
            // if (tasks.length) {
            //     const task = tasks[0];
            //     console.log(task)

            //     if (task.task === 'delete_voice') {
            //         let voice_entry = await ctx.db.getVoiceByCached(voice.file_id);
            //         let voice_source = await ctx.db.getSourcesVoiceId(voice_entry.id);


            //         await ops.deleteMedia(voice_source.original_id) // rm media/*/${voice_source.original_id}.*
            //         await Promise.all([ctx.db.deletePermByVoiceId(voice_entry.id), voice_source.destroy(), voice_entry.destroy()])
            //     }
            // } else {
            //     // ctx.reply('Got audio');
                
                
            // }
    
        return false
    }

    async addName(ctx) {
        let {text, from} = ctx.update.message;
        
        let zeroRe = /^\!z (.*)/;
        let zeroRight = zeroRe.exec(text);
        if (zeroRight) {
            text = zeroRight[1]
        }

        if (text.length > 40) {
            ctx.reply('Plz send name shorter than 40 characters')
        } else {
            console.log('-------1')
            const targetVoice = await this.toAdd.pop()
            console.log('-------1.5', targetVoice)

            if (this.targetVoice) {
                console.log('-------2')

                const {voice} = await ctx.replyWithVoice({
                    source: fs.createReadStream(`./media/voices/${this.targetVoice.file_id}.ogg`)
                })
                console.log('-------3')

                const updatedVoice = await this.targetVoice.update({
                    file_id_cached: voice.file_id,
                    size: voice.file_size,
                    title: text,
                    active: true,
                }) // ctx.db.updateCachedVoice(task.content, voice.file_id, voice.file_size, text);
                console.log('Updated voice', updatedVoice)
                console.log('-------4', updatedVoice)

                let from_id = from.id;
                if (zeroRight && (await ctx.db.getUserRoles(from.id)).indexOf('admin') > -1 ) from_id = 0;
                console.log(`Form id`, from_id, (await ctx.db.getUserRoles(from.id)))
                const permissionCreated = await ctx.db.createPerm(task.content, from_id)
                this.exit(ctx)
                // const voice = updateVoiceTitle(task.content, text);
            }
        }
    }

    exit(ctx) {
        ctx.user.flow = null;
    }
}


module.exports = Voice;