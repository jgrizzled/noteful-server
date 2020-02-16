// DB folder CRUD actions

const foldersService = {};

foldersService.getAll = db => db.select('*').from('folders');

foldersService.getById = (db, id) =>
  db
    .select('*')
    .from('folders')
    .where({ id })
    .first();

foldersService.add = (db, name) =>
  db
    .insert({ name })
    .into('folders')
    .returning('id');

foldersService.delete = (db, id) =>
  db
    .from('folders')
    .where({ id })
    .delete();

foldersService.update = (db, id, fields) =>
  db
    .from('folders')
    .where({ id })
    .update(fields);

module.exports = foldersService;
