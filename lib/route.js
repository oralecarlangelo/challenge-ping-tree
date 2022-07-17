const cuid = require('cuid')
const reqLogger = require('req-logger')
const healthpoint = require('healthpoint')

const redis = require('./redis')
const { apiRoute } = require('./controller/api')
const version = require('../package.json').version
const logger = reqLogger({ version: version })
const health = healthpoint({ version: version }, redis.healthCheck)

function handler (req, res) {
  if (req.url === '/health') return health(req, res)

  apiRoute(req, res)

  req.id = cuid()
  logger(req, res, { requestId: req.id }, function (info) {
    info.authEmail = (req.auth || {}).email
    console.log(info)
  })
}

module.exports = {
  handler
}
