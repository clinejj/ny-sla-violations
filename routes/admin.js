const basicAuth = require('express-basic-auth');
const { Op } = require("sequelize");

module.exports = (app) => {

  const authConfig = { users: {}, challenge: true, realm: process.env.AUTH_REALM };
  authConfig.users[process.env.QUEUE_ADMIN_NAME] = process.env.QUEUE_ADMIN_PASSWORD;

  app.use('/admin', basicAuth(authConfig));

  app.get('/raw/premises', async (req, res) => {
    const premises = await app.get('models').Premise.findAll({ raw: true });

    if (!premises[0]) {
      premises.push({ empty: true });
    }

    const keys = Object.keys(premises[0]);

    res.render('admin', { models: premises, keys: keys, type: 'premise' });
  });

  app.get('/raw/violations', async (req, res) => {
    const violations = await app.get('models').Violation.findAll({ raw: true });

    if (!violations[0]) {
      violations.push({ empty: true });
    }

    const keys = Object.keys(violations[0]);

    res.render('admin', { models: violations, keys: keys, type: 'violation' });
  });

  app.get('/raw/suspensions', async (req, res) => {
    const suspensions = await app.get('models').Suspension.findAll({ raw: true });

    if (!suspensions[0]) {
      suspensions.push({ empty: true });
    }

    const keys = Object.keys(suspensions[0]);

    res.render('admin', { models: suspensions, keys: keys, type: 'suspension' });
  });

  app.get('/raw/updates', async (req, res) => {
    const updates = await app.get('models').Update.findAll({
      raw: true,
      order: [['createdAt', 'DESC']]
    });

    if (!updates[0]) {
      updates.push({ empty: true });
    }

    const keys = Object.keys(updates[0]);

    res.render('admin', { models: updates, keys: keys, type: 'update' });
  });

  app.get('/raw/missing', async (req, res) => {
    const premises = await app.get('models').Premise.findAll({
      where: {
        [Op.or]: [
          { latitude: { [Op.is]: null } },
          { longitude: { [Op.is]: null } },
        ],
      },
      raw: true
    });

    if (!premises[0]) {
      premises.push({ empty: true });
    }

    const keys = Object.keys(premises[0]);

    res.render('admin', { models: premises, keys: keys, type: 'missing' });
  });
}
