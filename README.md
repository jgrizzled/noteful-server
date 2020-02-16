# Noteful Server

Express server for Noteful client.

## Setup

1. Configure Postgres server, set timezone to UTC
2. Create `noteful` and optional `noteful_test` databases in Postgres
3. Create `.env` with DB_URL and TEST_DB_URL
4. `yarn`
5. Migrate DB with `yarn migrate 2`

## Seed data

Optionally insert dummy seed data

`psql -d noteful -f seeds/seed.dummy-data.sql`

Remove seed data

`psql -d noteful -f seeds/trunc.dummy-data.sql`

## Scripts

Start server: `yarn start`

Start server with auto-restart on file change: `yarn dev`

Run tests: `yarn test`

Deploy: `yarn deploy`

Migrate DB: `yarn migrate [0-2]`
