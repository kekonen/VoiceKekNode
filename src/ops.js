const fs = require('fs')
const crypto = require('crypto')
const algorithm = 'sha1'
const shell = require('shelljs');

function getHash(path) {
    return new Promise((resolve, reject) => {
        // Algorithm depends on availability of OpenSSL on platform
        // Another algorithms: 'sha1', 'md5', 'sha256', 'sha512' ...
        try {
            let s = fs.ReadStream(path)
            const shasum = crypto.createHash(algorithm)

            s.on('data', function (data) {
                shasum.update(data)
            })

            // making digest
            s.on('end', function () {
                const hash = shasum.digest('hex')
                const stats = fs.statSync(path);
                return resolve([hash, stats.size]);
            })

        } catch (error) {
            return reject('calc fail');
        }
    });
}

function smth2ogg(mp3_filename, voice_filename) {
    shell.exec(`./src/utils/smth2ogg.sh ${mp3_filename} ${voice_filename}`)
}

function deleteMedia(file_id) {
    shell.exec(`rm media/*/${file_id}.*`)
}

module.exports = {getHash, smth2ogg, deleteMedia}