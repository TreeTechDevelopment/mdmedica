
const cloudinary = require('cloudinary').v2;

const uploadToCloudinary = (image, userID) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload("data:image/png;base64," + image, { resource_type: "image", overwrite: true, public_id: `mdmedica/${userID}_imagen` }, (err, url) => {
            if (err) return reject(err);
            return resolve(url);
        })
    });
}

const removeCloudinary = (image, userID) => {
    return new Promise((resolve, reject) => {
        let nameFile = `mdmedica/${image.split('/')[image.split('/').length - 1]}`
        let public_id = `${nameFile.split('.')[0]}`
        cloudinary.uploader.destroy(public_id, (err, result) => {
            if (err || result.result === "not found") return reject(err);
            return resolve();
        })
    });
}

module.exports = {
    uploadToCloudinary,
    removeCloudinary
}