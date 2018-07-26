const logcat = require('adbkit-logcat')
const { spawn } = require('child_process')

// Retrieve a binary log stream
const proc = spawn('adb', ['logcat', '-B'])

// Connect logcat to the stream
reader = logcat.readStream(proc.stdout)
reader.on('entry', entry => {
  console.log(entry.message)
})

// Make sure we don't leave anything hanging
process.on('exit', () => {
  proc.kill()
})