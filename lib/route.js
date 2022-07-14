const healthpoint = require('healthpoint')
const reqLogger = require('req-logger')
const cuid = require('cuid')
const redis = require('./redis')
const HttpHashRouter = require('http-hash-router')
const { getQuery, onError } = require('./helpers')
const { apiRoute } = require('./controller/api')
const version = require('../package.json').version

const router = HttpHashRouter()
const logger = reqLogger({ version: version })
const health = healthpoint({ version: version }, redis.healthCheck)

const handler = (req, res) => {
  if (req.url === '/health') return health(req, res)

  apiRoute(req, res)

  req.id = cuid()
  logger(req, res, { requestId: req.id }, function (info) {
    info.authEmail = (req.auth || {}).email
    console.log(info)
  })

  //   router(req, res, { query: getQuery(req.url) }, onError.bind(null, req, res))
}

module.exports = {
  handler
}
