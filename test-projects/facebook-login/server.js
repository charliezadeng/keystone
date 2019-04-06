const keystone = require('@keystone-alpha/core');

const { facebookAuthEnabled, port, staticRoute, staticPath } = require('./config');
const { configureFacebookAuth } = require('./facebook');

const initialData = require('./data');

keystone
  .prepare({ port })
  .then(async ({ server, keystone: keystoneApp }) => {
    if (facebookAuthEnabled) {
      configureFacebookAuth(keystoneApp, server);
    }
    await keystoneApp.connect();

    // Initialise some data.
    // NOTE: This is only for test purposes and should not be used in production
    const users = await keystoneApp.lists.User.adapter.findAll();
    if (!users.length) {
      Object.values(keystoneApp.adapters).forEach(async adapter => {
        await adapter.dropDatabase();
      });
      await keystoneApp.createItems(initialData);
    }

    server.app.get('/reset-db', async (req, res) => {
      Object.values(keystoneApp.adapters).forEach(async adapter => {
        await adapter.dropDatabase();
      });
      await keystoneApp.createItems(initialData);
      res.redirect('/admin');
    });
    server.app.use(staticRoute, server.express.static(staticPath));
    await server.start();
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
