// router for notes endpoint

const express = require('express');
const cors = require('cors');
const catchAsync = require('express-async-handler'); // next(error) for async func
const path = require('path');

const logger = require('../logger');
const notesService = require('./notesService');
const foldersService = require('./foldersService');

const notesRouter = express.Router();

notesRouter.use(cors());

notesRouter
  .route('/')
  .get(
    // return all notes
    catchAsync(async (req, res) => {
      res.json(await notesService.getAll(req.app.get('db')));
    })
  )
  .post(
    // add note
    express.json(),
    catchAsync(async (req, res) => {
      const { title, content, folder_id } = req.body;

      // validate data
      if (!validateNoteTitle(title))
        return res.status(400).json({ error: 'invalid note title' });
      if (!validateNoteContent(content))
        return res.status(400).json({ error: 'invalid note content' });
      if (!(await validateNoteFolder(req.app.get('db'), folder_id)))
        return res.status(400).json({ error: 'invalid note folder_id' });

      const note = { title, content, folder_id };

      const [id] = await notesService.add(req.app.get('db'), note);
      const addedNote = await notesService.getById(req.app.get('db'), id);
      logger.info('Added note', addedNote);

      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${id}`))
        .json({ id });
    })
  );

notesRouter
  .route('/:id')
  .all(catchAsync(checkNoteId))
  .get((req, res) => {
    // return matching note
    res.json(res.note);
  })
  .delete(
    // delete matching note
    catchAsync(async (req, res) => {
      const id = await notesService.delete(req.app.get('db'), res.note.id);
      logger.info('Deleted folder', { id });
      res.status(204).end();
    })
  )
  .patch(
    // update matching note
    express.json(),
    catchAsync(async (req, res) => {
      const { title, content, folder_id } = req.body;
      const note = {};
      let modified = false;

      // validate data
      if (title) {
        if (!validateNoteTitle(title))
          return res.status(400).json({ error: 'invalid note title' });
        else {
          note.title = title;
          modified = true;
        }
      }
      if (content) {
        if (!validateNoteContent(content))
          return res.status(400).json({ error: 'invalid note content' });
        else {
          note.content = content;
          modified = true;
        }
      }
      if (folder_id) {
        if (!(await validateNoteFolder(req.app.get('db'), folder_id)))
          return res.status(400).json({ error: 'invalid note folder_id' });
        else {
          note.folder_id = folder_id;
          modified = true;
        }
      }

      // only update if at least one field was modified
      if (modified) {
        note.date_modified = new Date();
        await notesService.update(req.app.get('db'), res.note.id, note);
        logger.info('Updated note', { id: res.note.id });
        res.status(204).end();
      } else res.status(400).json({ error: 'no valid fields' });
    })
  );

// match note ID param
async function checkNoteId(req, res, next) {
  const id = Number(req.params.id);
  if (!isNaN(id)) res.note = await notesService.getById(req.app.get('db'), id);
  if (!res.note) return res.status(404).json({ error: 'note not found' });
  next();
}

function validateNoteTitle(title) {
  if (
    typeof title === 'string' &&
    // does not contain illegal characters
    title.match(/[^0-9a-zA-Z \-_!\?\.]/g) === null &&
    // isnt just spaces
    title.replace(/\s/g, '').length > 0
  )
    return true;
  return false;
}

function validateNoteContent(content) {
  if (
    typeof content === 'string' &&
    // isnt just spaces
    content.replace(/\s/g, '').length > 0
  )
    return true;
  return false;
}

async function validateNoteFolder(db, folderId) {
  try {
    const folder = await foldersService.getById(db, folderId);
    if (folder && folder.id === folderId) return true;
  } catch (e) {
    logger.warn(e);
  }
  return false;
}

module.exports = notesRouter;
