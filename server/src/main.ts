import * as path from 'path'
import Fastify from 'fastify'
import FastifyStatic from '@fastify/static'

const hostname = 'localhost'
const port = 3000

const fastify = Fastify({ logger: true })

let root = path.join(process.cwd(), '..', 'client/dist')

fastify.register(FastifyStatic, {
  root: root,
})

fastify.get('/', function (req, reply) {
  reply.type('text/html').sendFile('index.html')
})

fastify.listen(
  {
    port,
    host: hostname,
  },
  (err, address) => {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
  }
)
