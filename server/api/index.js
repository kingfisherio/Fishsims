const router = require('express').Router()
module.exports = router

router.use('/titles', require('./titles'))
router.use('/leaderboards', require('./leaderboards'))
router.use('/image', require('./image'))

router.use((req, res, next) => {
  const error = new Error('Not Found')
  error.status = 404
  next(error)
})
