const router = require('express').Router()
const { protect, adminOnly } = require('../middleware/authMiddleware')
const upload = require('../middleware/upload')
const { generateInsights, chat, generateDescription, invoiceOcr } = require('../controllers/aiController')

router.post('/insights', protect, adminOnly, generateInsights)
router.post('/chat', protect, adminOnly, chat)
router.post('/generate-description', protect, adminOnly, generateDescription)
router.post('/invoice-ocr', protect, adminOnly, upload.single('invoice'), invoiceOcr)

module.exports = router
