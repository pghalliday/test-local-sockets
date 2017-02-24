const _ = require('lodash');
const fs = require('fs');
const net = require('net');
const path = require('path');

const temp = 'temp';
const controlSocket = path.join(temp, 'control');
const logSocket = path.join(temp, 'log');

fs.mkdir(temp, () => {
  fs.unlink(controlSocket, () => {
    fs.unlink(logSocket, () => {
      net.createServer((client) => {
        let id;
        console.log('control: client connected');
        client.on('data', (data) => {
          const message = JSON.parse(data);
          if (!_.isUndefined(message.id)) {
            id = message.id;
            console.log(`control: begin: ${id}`);
            client.write('ready');
          } else if (!_.isUndefined(message.code)) {
            console.log(`control: end: ${id}: ${message.code}`);
          };
        });
        client.on('end', () => {
          console.log(`control: client disconnected: ${id}`);
        });
      }).listen(controlSocket, () => {
        console.log('control: listening');
      });
      net.createServer((client) => {
        let id;
        console.log('log: client connected');
        client.once('data', (data) => {
          const message = JSON.parse(data);
          if (message.id) {
            id = message.id;
            console.log(`log: begin: ${id}`);
            client.pipe(process.stdout);
            client.write('ready');
          };
        });
        client.on('end', () => {
          console.log(`log: client disconnected: ${id}`);
        });
      }).listen(logSocket, () => {
        console.log('log: listening');
      });
    });
  });
});
