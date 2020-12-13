const express = require('express');

const bullConfig = require('./config/bull');
const models = require('./models');

const redisClient = require('./config/redis');

// Express app setup
const ejs = require('ejs');

const adminRoutes = require('./routes/admin');
const indexRoutes = require('./routes/index');

const app = express();

bullConfig(app);

app.set('trust proxy', 1);
app.use(express.static('public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Make models available as ~singleton so we can better reuse connections
// See https://www.redotheweb.com/2013/02/20/sequelize-the-javascript-orm-in-practice.html for details
app.set('models', models);

adminRoutes(app);
indexRoutes(app);

try {
  models.sequelize.sync().then(() => {
    const server = app.listen(process.env.PORT, function() {
      console.log('Your app is listening on port ' + server.address().port);
    });
  });
} catch (error) {
  console.log('Failedto start app.');
  console.log(error);
}

