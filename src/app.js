// App

const express = require('express'); // HTTP server
const morgan = require('morgan'); // HTTP logging
const helmet = require('helmet'); // secure HTTP headers

const { NODE_ENV } = require('./config');
const logger = require('./logger');
const foldersRouter = require('./api/foldersRouter');
const notesRouter = require('./api/notesRouter');

const app = express();

// global middleware

const morganSetting = NODE_ENV === 'production' ? 'tiny' : 'common';
app.use(morgan(morganSetting, { skip: () => false }));
app.use(helmet());

// routes

// public static files
app.use(express.static('public'));

// API endpoints
app.use('/api/folders', foldersRouter);
app.use('/api/notes', notesRouter);

// global error handler
app.use(function errorHandler(error, req, res, next) {
  logger.error(error);
  let response;
  if (NODE_ENV === 'production') {
    response = { error: 'server error' };
  } else {
    response = { error: error.message };
  }
  res.status(500).json(response);
});

module.exports = app;
