const { createLogger, format, transports, addColors } = require('winston');
const os = require('os');

process.env.NODE_ENV = 'development';
const fakeUserId = '2123409';

// Example object for custom logging levels
// Logging levels from 0 - 4, 0 being the most critical
// color match each logging level
// https://github.com/winstonjs/winston#using-custom-logging-levels
const customLevels = {
  levels: {
    security: 0,
    error: 1,
    warning: 2,
    info: 3,
    debug: 4
  },
  colors: {
    security: 'magenta',
    error: 'red',
    warning: 'yellow',
    info: 'green',
    debug: 'blue'
  }
};

// Load custom colors to Winston
addColors(customLevels.colors);

// Ignore log messages if the have { private: true }
// https://github.com/winstonjs/winston#filtering-info-objects
const ignorePrivate = format((info, opts) => {
  if (info.private) {
    return false;
  }
  return info;
});

// Custom Winston format that appends the User ID and hostname to every log
// https://github.com/winstonjs/winston#filtering-info-objects
// https://github.com/winstonjs/winston#creating-custom-formats
const constants = format((info, opts) => {
  info.userId = fakeUserId;
  info.hostName = os.hostname();
  return info;
});

// Instantiation of Winston Logger
// Utilizes custom log levels
// Combines constant properties to every log
// Adds private property to hide log messages when needed
// Generates and updates Log files with label rules
//     i.e., security.log will display all security related logs
//     i.e., error.log will display all error level logs and above (including security logs)
// https://github.com/winstonjs/winston#multiple-transports-of-the-same-type
const logger = createLogger({
  levels: customLevels.levels,
  format: format.combine(constants(), ignorePrivate()),
  transports: [
    new transports.File({
      filename: './logs/security.log',
      level: 'security',
      format: format.json()
    }),
    new transports.File({
      filename: './logs/error.log',
      level: 'error',
      format: format.json()
    }),
    new transports.File({
      filename: './logs/combined.log',
      format: format.json()
    })
  ]
});

// Logs will output to the terminal when in development mode
// Setting NODE_ENV to production will prevent logs outputting to the terminal
// https://github.com/winstonjs/winston#usage
if (process.env.NODE_ENV !== 'production') {
  const myFormat = format.printf(info => {
    return `${info.level}: ${
      info.message
    }, User ID: ${fakeUserId}, Hostname: ${os.hostname()}`;
  });

  logger.add(
    new transports.Console({
      format: format.combine(
        constants(),
        format.colorize(),
        format.json(),
        myFormat
        //format.prettyPrint() // Structures terminal to output pretty Json.  Please note, colors are removed
      )
    })
  );
}

let messageObj = {
  message: 'processed job ABC123',
  jobId: 'ABC123',
  jobEvent: 'processed'
};

logger.log({
  level: 'error',
  message: JSON.stringify(messageObj)
});

// Messages with { private: true } will not be written when logged.
logger.log({
  level: 'security',
  message: 'CSRF attack detected.  Token and anti-csrf token diff'
});

logger.log({
  level: 'warning',
  message: 'Anomaly detected'
});

logger.log({
  level: 'info',
  message: 'User does not have authorization'
});

logger.security({
  message: 'This is a security test'
});
