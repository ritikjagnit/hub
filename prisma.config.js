const path = require('path');
const dbPath = path.resolve(__dirname, 'server/config/project.db');

module.exports = {
  schema: 'server/prisma/schema.prisma',
  datasource: {
    url: 'file:' + dbPath,
  },
};
