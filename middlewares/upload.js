// middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'profilePicture') {
            cb(null, 'uploads/profilePictures');
        } else if (file.fieldname === 'audioBio') {
            cb(null, 'uploads/audioBios');
        } else if (file.fieldname === 'audio') {
            cb(null, 'uploads/linkAudio');
        } else if (file.fieldname === 'linkPictures') {
            cb(null, 'uploads/linkPictures');
        } else {
            cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        }
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
