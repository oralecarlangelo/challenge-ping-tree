process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')
var server = require('../lib/server')

const STORED_DATA = [{
  id: '1',
  url: 'http://example.com',
  value: '0.50',
  maxAcceptsPerDay: '10',
  accept: {
    geoState: {
      $in: ['ca', 'ny']
    },
    hour: {
      $in: ['13', '14', '15']
    }
  }
}]

const createRequestData = {
  url: 'http://youtube.com',
  value: '0.50',
  maxAcceptsPerDay: '10',
  accept: {
    geoState: {
      $in: ['ca', 'ph']
    },
    hour: {
      $in: ['13', '14', '15']
    }
  }
}

const updateRequestData = {
  url: 'http://www.google.com'
}

const userRequestData = {
  geoState: 'ca',
  publisher: 'abc',
  timestamp: new Date().toUTCString()
}

test.serial.cb('healthcheck', function (t) {
  const url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('Get All Targets Successfully', (t) => {
  servertest(server(), '/api/targets', { encoding: 'json' }, (err, res) => {
    t.falsy(err, 'No Error')
    t.deepEqual(res.body, STORED_DATA, 'Data is Complete')
    t.is(res.statusCode, 200, 'Correct Status Code')
    t.end()
  })
})

test.serial.cb('Get A Target Successfully', (t) => {
  servertest(server(), '/api/target/1', { encoding: 'json' }, (err, res) => {
    t.falsy(err, 'No Error')
    t.deepEqual(res.body, STORED_DATA[0], 'Data is Complete')
    t.is(res.statusCode, 200, 'Correct Status Code')
    t.end()
  })
})

test.serial.cb('Create A Target Successfully', (t) => {
  const req = servertest(server(), '/api/targets', { method: 'POST' }, (err, res) => {
    t.falsy(err, 'No Error')
    t.is(res.body.toString(), 'Create Target Success!', 'Response is Correct')
    t.end()
  })

  req.write(JSON.stringify(createRequestData))
  req.end()
})

test.serial.cb('Update A Target Successfully', (t) => {
  const req = servertest(server(), '/api/target/1', { method: 'POST' }, (err, res) => {
    t.falsy(err, 'No Error')
    t.deepEqual(res.body.toString(), 'Target Update Success', 'Response is Correct')
    t.end()
  })

  req.write(JSON.stringify(updateRequestData))
  req.end()
})

test.serial.cb('Response Accepted on User Request', (t) => {
  const req = servertest(server(), '/route', { method: 'POST' }, (err, res) => {
    t.falsy(err, 'No Error')
    t.is(res.body.toString(), JSON.stringify({ decision: 'accepted' }), 'Response is Correct')
    t.end()
  })

  req.write(JSON.stringify(userRequestData))
  req.end()
})
