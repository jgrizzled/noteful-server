// DB note CRUD actions

const notesService = {};

notesService.getAll = db => db.select('*').from('notes');

notesService.add = (db, note) =>
  db
    .insert(note)
    .into('notes')
    .returning('id');

notesService.getById = (db, id) =>
  db
    .select('*')
    .from('notes')
    .where({ id })
    .first();

notesService.delete = (db, id) =>
  db
    .from('notes')
    .where({ id })
    .delete();

notesService.update = (db, id, fields) =>
  db
    .from('notes')
    .where({ id })
    .update(fields);

module.exports = notesService;
