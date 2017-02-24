const net = require('net');
const path = require('path');
const exec  = require('child_process').exec;
const uuid = require('uuid/v1');

const temp = 'temp';
const controlSocket = path.join(temp, 'control');
const logSocket = path.join(temp, 'log');

const id = uuid();
count = 0;
const command = `for i in {1..10}
do
  echo ${id}:stdout:$i
  echo ${id}:stderr:$i 1>&2
  sleep 0.1
done`

const control = net.createConnection(controlSocket);
control.on('connect', () => {
  console.log(`${id}: control: client connected`);
  control.write(JSON.stringify({id: id}));
  control.once('data', () => {
    let code;
    const log = net.createConnection(logSocket);
    log.on('connect', () => {
      console.log(`${id}: log: client connected`);
      log.write(JSON.stringify({id: id}));
      log.once('data', () => {
        const proc = exec(command);
        proc.on('exit', (c) => {
          code = c;
        });
        proc.stdout.pipe(log);
        proc.stderr.pipe(log);
      });
    });
    log.on('end', () => {
      console.log(`${id}: log: client disconnected`);
      control.end(JSON.stringify({code: code}));
    });
  });
  control.on('end', () => {
    console.log(`${id}: control: client disconnected`);
  });
});
