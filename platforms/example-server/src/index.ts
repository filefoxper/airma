import http from 'http';
import app from './app';

function normalizePort(val: string) {
  const port = parseInt(val, 10);

  if (Number.isNaN(Number(port))) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

const port = normalizePort((process.env.PORT as string | undefined) || '9999');

function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

const server = http.createServer(app);

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  if (!addr) {
    return;
  }
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
}

app.set('port', port);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
