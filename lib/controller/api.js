const redis = require('../redis')

let STORED_DATA = [
  {
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
  }
]

let STORED_PUBLISHERS = []

const apiRoute = async (req, res) => {
  if (req.url === '/api/targets') {
    if (req.method === 'POST') {
      const body = []

      req.on('data', (chunk) => {
        body.push(chunk)
      })

      req.on('end', async () => {
        const parsedBody = JSON.parse(Buffer.concat(body).toString())
        const idGenerator = parseInt(STORED_DATA[STORED_DATA.length - 1].id) > 0 ? parseInt(STORED_DATA[STORED_DATA.length - 1].id) + 1 : 1

        const targetsData = await redis.getorSetCache('targets', () => {
          return JSON.stringify(STORED_DATA)
        })
        const getSpecifiedTarget = targetsData.find(data => data.url === parsedBody.url)

        if (getSpecifiedTarget) {
          res.write('Similar Target Found!')
          res.end()
        } else {
          STORED_DATA.push({ ...parsedBody, id: idGenerator.toString() })
          await redis.setCache('targets', STORED_DATA)
          res.write('Create Target Success!')
          res.end()
        }
      })
    }
    if (req.method === 'GET') {
      const targetsData = await redis.getorSetCache('targets', () => {
        return JSON.stringify(STORED_DATA)
      })

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(targetsData))
    }
  }

  const targetUrl = req.url.split('/')
  targetUrl.shift()

  if (targetUrl[0] === 'api' && targetUrl[1] === 'target') {
    if (req.method === 'GET') {
      const targetsData = await redis.getorSetCache('targets', () => {
        return JSON.stringify(STORED_DATA)
      })
      const getSpecifiedTarget = targetsData.find(data => data.id === targetUrl[2])

      if (getSpecifiedTarget) {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(getSpecifiedTarget))
      }

      res.write('No Target Found')
      res.end()
    }
    if (req.method === 'POST') {
      const body = []

      req.on('data', (chunk) => {
        body.push(chunk)
      })

      req.on('end', async () => {
        const parsedBody = JSON.parse(Buffer.concat(body).toString())

        const targetsData = await redis.getorSetCache('targets', () => {
          return JSON.stringify(STORED_DATA)
        })

        STORED_DATA = targetsData.forEach((data) => {
          if (data.id === targetUrl[2]) {
            return { ...data, ...parsedBody }
          }

          return data
        })

        await redis.setCache('targets', STORED_DATA)
        res.write('Target Updated Successfully')
        res.end()
      })
    }
    res.end()
  }

  if (req.url === '/route') {
    if (req.method === 'POST') {
      const body = []

      req.on('data', (chunk) => {
        body.push(chunk)
      })

      req.on('end', async () => {
        const parsedBody = JSON.parse(Buffer.concat(body).toString())
        const publishersData = await redis.getorSetCache('publishers', () => {
          return JSON.stringify(STORED_PUBLISHERS)
        })

        const existingPublisher = publishersData.find((pub) => pub.publisher === parsedBody.publisher)

        if (!existingPublisher) {
          STORED_PUBLISHERS.push({ ...parsedBody, visits: 1 })
          await redis.setCache('publishers', STORED_PUBLISHERS)
        }

        STORED_DATA.forEach(async (data) => {
          if (data.accept.geoState.$in.includes(parsedBody.geoState)) {
            STORED_PUBLISHERS = publishersData.map(pub => {
              if (existingPublisher) {
                return { ...pub, visits: pub.visits + 1 }
              }

              return pub
            })
            await redis.setCache('publishers', STORED_PUBLISHERS)

            if (existingPublisher && existingPublisher.visits >= parseInt(data.maxAcceptsPerDay)) {
              res.write(JSON.stringify({ decision: 'rejected' }))
              res.statusCode = 404
              res.end()
            }

            res.write(JSON.stringify({ decision: 'accepted' }))
            res.statusCode = 200
            res.end()
          }
        })
      })
    }
  }
  console.log(req.method)
}

module.exports = { apiRoute }
