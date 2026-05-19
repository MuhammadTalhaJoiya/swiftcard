const router = require('express').Router()
const { protect, adminOnly } = require('../middleware/authMiddleware')
const { getAnalytics } = require('../controllers/analyticsController')

router.get('/', protect, adminOnly, getAnalytics)

module.exports = router
