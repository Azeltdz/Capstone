const multer = require('multer');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    ALLOWED.includes(file.mimetype)
      ? cb(null, true)
      : cb(Object.assign(new Error('Only JPEG, PNG, or WEBP images are allowed'), { statusCode: 400 }), false),
});