let path = require('path');
let winston = require('winston');

let logger = (name) => {
    return winston.createLogger({
        level: 'warn',
        format: winston.format.json(),
        defaultMeta: { service: name },
        transports: [
          new winston.transports.File({ filename: path.join(__dirname, '../../logs/error.log'), level: 'error' }),
          new winston.transports.File({ filename: path.join(__dirname, '../../logs/info.log'), level: 'info' }),
          new winston.transports.File({ filename: path.join(__dirname, '../../logs/warn.log'), level: 'warn' }),
          new winston.transports.File({ filename: path.join(__dirname, '../../logs/combined.log') }),
        ],
    })
};

module.exports = logger;