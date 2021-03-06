const {Op} = require('sequelize')
const router = require('express').Router()
const {Leaderboard} = require('../db/models')
module.exports = router

const getMonday = current => {
  var day = current.getDay(),
    diff = current.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(current.setDate(diff))
}

router.get('/', async (req, res, next) => {
  try {
    let start = new Date()
    start.setHours(0, 0, 0, 0)
    switch (req.query.board) {
      default:
      case 'ALL':
        start.setTime(0)
        break
      case 'MONTH':
        start.setDate(1)
        break
      case 'WEEK':
        start = getMonday(start)
        break
      case 'DAY':
        break
    }

    const NOW = new Date()
    const scores = await Leaderboard.findAll({
      limit: 10,
      order: [['score', 'desc']],
      where: {
        createdAt: {
          [Op.gt]: start,
          [Op.lt]: NOW
        }
      }
    })
    res.json(scores)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const {name, score, color} = req.body
    const result = await Leaderboard.create({name, score, color})
    res.json(result)
  } catch (err) {
    next(err)
  }
})
