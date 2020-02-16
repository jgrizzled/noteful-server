// router for folders endpoint

const express = require('express');
const cors = require('cors');
const catchAsync = require('express-async-handler'); // next(error) for async func
const path = require('path');

const logger = require('../logger');
const foldersService = require('./foldersService');

const foldersRouter = express.Router();

foldersRouter.use(cors());

foldersRouter
  .route('/')
  .get(
    catchAsync(async (req, res) => {
      // return all folders
      res.json(await foldersService.getAll(req.app.get('db')));
    })
  )
  .post(
    express.json(),
    catchAsync(async (req, res) => {
      // add new folder
      let { name } = req.body;

      // validate name
      if (!validateFolderName(name))
        return res.status(400).json({ error: 'invalid folder name' });

      const [id] = await foldersService.add(req.app.get('db'), name);
      logger.info('Added folder', { name, id });
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${id}`))
        .json({ id });
    })
  );

foldersRouter
  .route('/:id')
  .all(catchAsync(checkFolderId))
  .get((req, res) => {
    // return matching folder
    res.json(res.folder);
  })
  .delete(
    // delete matching folder
    catchAsync(async (req, res) => {
      const id = await foldersService.delete(req.app.get('db'), res.folder.id);
      logger.info('Deleted folder', { id });
      res.status(204).end();
    })
  )
  .patch(
    // update matching folder
    express.json(),
    catchAsync(async (req, res) => {
      const { name } = req.body;
      // validate name
      if (!validateFolderName(name))
        return res.status(400).json({ error: 'invalid folder name' });
      await foldersService.update(req.app.get('db'), res.folder.id, { name });
      logger.info('Updated folder', { id: res.folder.id });
      res.status(204).end();
    })
  );

// match folder ID param
async function checkFolderId(req, res, next) {
  const id = Number(req.params.id);
  if (!isNaN(id))
    res.folder = await foldersService.getById(req.app.get('db'), id);
  if (!res.folder) return res.status(404).json({ error: 'folder not found' });
  next();
}

function validateFolderName(name) {
  if (
    typeof name === 'string' &&
    // does not contain illegal characters
    name.match(/[^0-9a-zA-Z \-_!\?\.]/g) === null &&
    // isnt just spaces
    name.replace(/\s/g, '').length > 0
  )
    return true;
  return false;
}

module.exports = foldersRouter;
