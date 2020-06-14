const base64ArrayBuffer = require('base64-arraybuffer')

module.exports = function formatPhotoData(err, doc) {
    if(!err) {
        if(doc) {
            if(doc.fbId) {
                return {
                    src: doc.fbUrl,
                    username: doc.username
                }
            } else {
                const profilePhotoType = doc.userPhoto.mimetype
                const profilePhotoBase64 = base64ArrayBuffer.encode(doc.userPhoto.buffer.buffer)
                
                return {
                    src: `data:${profilePhotoType};base64, ${profilePhotoBase64}`,
                    username: doc.username
                }
            }
        } else {
            return {
                src: 'https://www.shareicon.net/data/512x512/2015/12/18/689279_block_512x512.png',
                username: 'User not found'
            }
        }
    } else {
        console.log(err)
    }
}