const base64ArrayBuffer = require('base64-arraybuffer')

module.exports = function formatPhotoData(photo) {
    const profilePhotoType = photo.mimetype
    const profilePhotoBase64 = base64ArrayBuffer.encode(photo.buffer.buffer)

    return `data:${profilePhotoType};base64, ${profilePhotoBase64}`
}