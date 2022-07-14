var config = require('../config')

var engine = {
  undefined: require('fakeredis'),
  test: require('fakeredis'),
  production: require('redis'),
  development: require('redis')
}.development

var redis = module.exports = engine.createClient(config.redis)

redis.healthCheck = function (cb) {
  var now = Date.now().toString()
  redis.set('!healthCheck', now, function (err) {
    if (err) return cb(err)

    redis.get('!healthCheck', function (err, then) {
      if (err) return cb(err)
      if (now !== then.toString()) return cb(new Error('Redis write failed'))

      cb()
    })
  })
}

redis.getorSetCache = function (key, cb) {
  return new Promise((resolve, reject) => {
    redis.get(key, async (error, data) => {
      if (error) return reject(error)
      // console.log(data)
      if (data != null) return resolve(JSON.parse(data))

      const freshData = await cb()
      redis.set(key, freshData)
      resolve(JSON.parse(freshData))
    })
  })
}

redis.getCache = function (key) {
  return new Promise((resolve, reject) => {
    redis.get(key, async (error, data) => {
      if (error) return reject(error)
      if (data != null) return resolve(JSON.parse(data))
    })
  })
}

redis.setCache = (key, value) => {
  return new Promise((resolve, reject) => {
    redis.set(key, JSON.stringify(value), (err) => {
      if (err) {
        reject(err)
      }

      resolve()
    })
  })
}
