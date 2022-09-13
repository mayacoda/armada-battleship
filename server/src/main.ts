import * as path from 'path'
import FastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import fastifyIO from 'fastify-socket.io'
import { PlayerManager } from './PlayerManager.js'

const fastify = Fastify({ logger: true })

fastify.register(FastifyStatic, {
  root: path.join(process.cwd(), '..', 'client/dist'),
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
  const playerManger = new PlayerManager(fastify.io)

  fastify.io.on('connection', (socket) => {
    playerManger.initPlayerCommunication(socket)
  })
})

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
