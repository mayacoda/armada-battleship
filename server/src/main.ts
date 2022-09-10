import * as path from 'path'
import FastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import fastifyIO from 'fastify-socket.io'

const fastify = Fastify({ logger: true })

let root = path.join(process.cwd(), '..', 'client/dist')

fastify.register(FastifyStatic, {
  root: root,
})

fastify.get('/', function (req, reply) {
  reply.header('Access-Control-Allow-Origin', '*')
  reply.header('Access-Control-Allow-Methods', 'GET')
  reply.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin, Cache-Control'
  )

  reply.type('text/html').sendFile('index.html')
})

// registering the socket.io plugin
fastify.register(fastifyIO)

fastify.ready().then(() => {
  fastify.io.on('connection', (socket) => {
    console.log('a user connected')
    emitStatus()
    socket.on('disconnect', () => {
      emitStatus()
      console.log('user disconnected')
    })
  })
})

const emitStatus = () => {
  fastify.io.emit(
    'status',
    `Current connections: ${fastify.io.engine.clientsCount}`
  )
}

let externalPort = parseInt(process.env.PORT)
const port: number = isNaN(externalPort) ? 3000 : externalPort

fastify.listen(
  {
    port,
    host: '0.0.0.0',
  },
  (err, address) => {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
  }
)
