
const cloudinary = require('cloudinary').v2;

const uploadToCloudinary = (image, userID) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload("data:image/png;base64," + image, { resource_type: "image", overwrite: true, public_id: `mdmedica/${userID}_imagen` }, (err, url) => {
            if (err) return reject(err);
            return resolve(url);
        })
    });
}

module.exports = {
    uploadToCloudinary
}