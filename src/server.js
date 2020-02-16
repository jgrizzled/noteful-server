// App server

const app = require('./app');
const logger = require('./logger');
const { PORT, DB_URL } = require('./config');

const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: DB_URL
});

app.set('db', db);

app.listen(PORT, () => {
  logger.info('server is listening on port ' + PORT);
});
