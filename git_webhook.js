require('dotenv').config()
const http = require('http')
const crypto = require('crypto')
const exec = require('child_process').exec

const secret = `${process.env.GITHUB_WEBHOOK}`
const repo = '/home/moover/MOOver'

http.createServer(function (req, res) {
    req.on('data', function (chunk) {
        const sig = 'sha1=' + crypto.createHmac('sha1', secret).update(chunk.toString()).digest('hex')
        if (req.headers['x-hub-signature'] == sig) {
            console.log('updating moover...')
            exec(`pm2 stop 'MOOver-main' && cd ${repo} && git pull && npm install && pm2 start 'MOOver-main'`)
            console.log('Success!')
        }
    })
// AAAAAAAAAAAAAAA
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Hello World\n')
}).listen(7481, '127.0.0.1', () => {
    console.log('Server is running')
})
