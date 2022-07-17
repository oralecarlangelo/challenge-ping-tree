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

// const requestData = {
//   url: 'http://google.com',
//   value: '0.50',
//   maxAcceptsPerDay: '10',
//   accept: {
//     geoState: {
//       $in: ['ca', 'ph']
//     },
//     hour: {
//       $in: ['13', '14', '15']
//     }
//   }
// }

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
    t.falsy(err, 'no error')
    t.deepEqual(res.body, STORED_DATA, 'Data is Complete')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.end()
  })
})

test.serial.cb('Get A Target Successfully', (t) => {
  servertest(server(), '/api/target/1', { encoding: 'json' }, (err, res, req) => {
    t.falsy(err, 'no err')
    t.deepEqual(res.body, STORED_DATA[0], 'Data is Complete')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.end()
  })
})

test.serial.cb('Create A Target Successfully', (t) => {
  const req = servertest(server(), '/api/targets', {
    method: 'POST',
    body: {
      url: 'http://google.com',
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
  })

  req.on('end', (err, data) => {
    t.isError(err, 'no error')
    t.deepEqual(data, 'Create Target Success', 'Data is Equal')
  })
  t.end()
})

test.serial.cb('Update A Target Successfully', (t) => {
  const req = servertest(server(), '/api/target/1', {
    method: 'POST',
    body: {
      url: 'http://www.google.com'
    }
  })

  req.on('end', (err, data) => {
    t.isError(err, 'no error')
    t.deepEqual(data, 'Target Update Success', 'Data is Equal')
  })
  t.end()
})

test.serial.cb('Request to Server Expected Accepted', (t) => {
  const req = servertest(server(), '/api/target/1', {
    encoding: 'json',
    method: 'POST',
    body: {
      geoState: 'ca',
      publisher: 'abc',
      timestamp: '2018-07-19T23:28:59.513Z'
    }
  })

  req.on('end', (err, data) => {
    t.isError(err, 'no error')
    t.deepEqual(data, { decision: 'accepted' }, 'Data is Equal')
  })
  t.end()
})
