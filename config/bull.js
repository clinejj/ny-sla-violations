const Bull = require('bull');
const Arena = require('bull-arena');
const config = require('../config/config').redis;

const basicAuth = require('express-basic-auth');

const maintenanceQueue = new Bull('maintenance', {redis: config});

const maintenanceProcessors = require('../queues/maintenance');

module.exports = (app) => {
  maintenanceQueue.process('keep_alive', maintenanceProcessors.keepAlive);

  // Schedule the keep alive job for every 2 minutes
  maintenanceQueue.add('keep_alive', {}, {
    jobId: 'keep_alive',
    removeOnComplete: true,
    repeat: {
      cron: '*/2 * * * *',
      startDate: Date.now()
    }
  });

  maintenanceQueue.process('update_data', maintenanceProcessors.updateData);

  // Schedule the update_data job for every 6 hours
  // cron: '0 */6 * * *',
  maintenanceQueue.add('update_data', {}, {
    jobId: 'update_data',
    removeOnComplete: true,
    repeat: {
      cron: '0 */6 * * *',
      startDate: Date.now()
    }
  });


  const authConfig = { users: {}, challenge: true, realm: process.env.AUTH_REALM };
  authConfig.users[process.env.QUEUE_ADMIN_NAME] = process.env.QUEUE_ADMIN_PASSWORD;

  app.use('/admin/queues', basicAuth(authConfig));

  const redisConfig = { port: process.env.REDIS_PORT, host: process.env.REDIS_HOST };

  const arenaConfig = Arena({
    Bull,
    queues: [
      {
        name: "maintenance",
        hostId: "Maintenance",
        type: 'bull',
        redis: redisConfig
      }
    ]
  },
  {
    basePath: '/admin/queues',
    disableListen: true
  });
  app.use('/', arenaConfig);
}
