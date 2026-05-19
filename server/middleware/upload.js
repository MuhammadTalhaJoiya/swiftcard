const multer = require('multer')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    cb(null, allowed.includes(file.mimetype))
  },
})

module.exports = upload
