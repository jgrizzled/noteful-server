// app integration tests

const knex = require('knex');
require('dotenv').config();
const Postgrator = require('postgrator');

const app = require('../src/app');

describe('app', () => {
  // set up environment
  let db;

  const postgrator = new Postgrator({
    migrationDirectory: 'migrations',
    driver: 'pg',
    connectionString: process.env.TEST_DATABASE_URL
  });

  const testFolders = [
    { id: 1, name: 'Test Folder 1' },
    { id: 2, name: 'Test Folder 2' }
  ];

  const testNotes = [
    {
      id: 1,
      title: 'Test Note 1',
      content: 'Test Note 1 Content',
      folder_id: 1,
      date_created: '2020-02-17T07:39:05.649Z',
      date_modified: '2020-02-17T07:39:05.649Z'
    },
    {
      id: 2,
      title: 'Test Note 2',
      content: 'Test Note 2 Content',
      folder_id: 2,
      date_created: '2020-02-17T07:39:05.649Z',
      date_modified: '2020-02-17T07:39:05.649Z'
    }
  ];

  before(async () => {
    // initialize db
    await postgrator.migrate('000');

    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL
    });

    app.set('db', db);
  });

  after(() => {
    // teardown  db
    db.destroy();
    postgrator.migrate('000');
  });

  describe('/api/folders', () => {
    beforeEach(async () => {
      // populate db
      await postgrator.migrate('002');
      await db
        .insert(
          // insert test folders without ID
          testFolders.map(f => ({
            name: f.name
          }))
        )
        .into('folders');
    });

    afterEach(async () => {
      // reset db
      await postgrator.migrate('000');
    });

    it('GET /api/folders returns all folders', done => {
      supertest(app)
        .get('/api/folders')
        .end((req, res) => {
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.eql(testFolders);
          done();
        });
    });

    it('POST /api/folders adds folder and returns id', done => {
      const folder = { id: 3, name: 'Test Folder 3' };
      supertest(app)
        .post('/api/folders/')
        .send(folder)
        .end((req, res) => {
          expect(res.statusCode).to.equal(201);
          expect(res.body).to.eql({ id: folder.id });
          expect(res.headers.location).to.eql(`/api/folders/${folder.id}`);
          done();
        });
    });

    it('POST /api/folders with invalid name returns 400', () => {
      const folder = { name: '<script>' };
      return supertest(app)
        .post('/api/folders/')
        .send(folder)
        .expect(400);
    });

    it('GET api/folders/:id returns specific folder', done => {
      supertest(app)
        .get('/api/folders/1')
        .end((req, res) => {
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.eql(testFolders[0]);
          done();
        });
    });

    it('GET api/folders/:id returns 404 for nonexistent id', () => {
      return supertest(app)
        .get('/api/folders/999')
        .expect(404);
    });

    it('DELETE api/folders/:id deletes specific folder', done => {
      const id = testFolders[0].id;
      supertest(app)
        .delete('/api/folders/' + id)
        .end(async (req, res) => {
          expect(res.statusCode).to.equal(204);
          const folder = await db
            .select('*')
            .from('folders')
            .where({ id });
          expect(folder).to.eql([]);
          done();
        });
    });

    it('PATCH api/folders/:id updates specific folder', done => {
      const { id, name } = testFolders[0];
      const newFolder = {
        name: name + ' modified'
      };
      supertest(app)
        .patch('/api/folders/' + id)
        .send(newFolder)
        .end(async (req, res) => {
          expect(res.statusCode).to.equal(204);
          const folder = await db
            .select('*')
            .from('folders')
            .where({ id })
            .first();
          expect(folder.name).to.equal(newFolder.name);
          done();
        });
    });
  });

  describe('/api/notes', () => {
    beforeEach(async () => {
      // populate db
      await postgrator.migrate('002');
      await db
        .insert(
          // insert test folders without id
          testFolders.map(f => ({
            name: f.name
          }))
        )
        .into('folders');
      await db
        .insert(
          // insert test notes without id
          testNotes.map(n => ({
            title: n.title,
            content: n.content,
            folder_id: n.folder_id,
            date_created: n.date_created,
            date_modified: n.date_modified
          }))
        )
        .into('notes');
    });

    afterEach(async () => {
      // reset db
      await postgrator.migrate('000');
    });

    it('GET /api/notes returns all notes', done => {
      supertest(app)
        .get('/api/notes')
        .end((req, res) => {
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.eql(testNotes);
          done();
        });
    });

    it('POST /api/notes adds note and returns id', done => {
      const note = {
        title: 'Test Note 3',
        content: 'Test Note 3 Content',
        folder_id: 1
      };
      const id = 3;
      supertest(app)
        .post('/api/notes')
        .send(note)
        .end((req, res) => {
          expect(res.statusCode).to.equal(201);
          expect(res.body.id).to.equal(id);
          expect(res.headers.location).to.eql(`/api/notes/${id}`);
          done();
        });
    });

    it('POST /api/notes with invalid folder returns 400', () => {
      const note = {
        title: 'Test Note 3',
        content: 'Test Note 3 Content',
        folder_id: 999
      };
      return supertest(app)
        .post('/api/notes')
        .send(note)
        .expect(400);
    });

    it('GET api/notes/:id returns specific note', done => {
      supertest(app)
        .get('/api/notes/1')
        .end((req, res) => {
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.eql(testNotes[0]);
          done();
        });
    });

    it('DELETE api/notes/:id deletes specific note', done => {
      const id = testNotes[0].id;
      supertest(app)
        .delete('/api/notes/' + id)
        .end(async (req, res) => {
          expect(res.statusCode).to.equal(204);
          const note = await db
            .select('*')
            .from('notes')
            .where({ id });
          expect(note).to.eql([]);
          done();
        });
    });

    it('PATCH api/notes/:id updates specific folder', done => {
      const { id, title, content } = testNotes[0];
      const newNote = {
        title: title + ' modified',
        content: content + ' modified',
        folder_id: 2
      };
      supertest(app)
        .patch('/api/notes/' + id)
        .send(newNote)
        .end(async (req, res) => {
          expect(res.statusCode).to.equal(204);
          const note = await db
            .select('*')
            .from('notes')
            .where({ id })
            .first();
          expect(note.title).to.equal(newNote.title);
          expect(note.content).to.equal(newNote.content);
          expect(note.folder_id).to.equal(newNote.folder_id);
          done();
        });
    });

    it('PATCH api/notes/:id with invalid data returns 400', () => {
      const { id, title, content } = testNotes[0];
      const newNote = {
        title: title + ' modified',
        content: content + ' modified',
        folder_id: 999
      };
      return supertest(app)
        .patch('/api/notes/' + id)
        .send(newNote)
        .expect(400);
    });
  });
});
