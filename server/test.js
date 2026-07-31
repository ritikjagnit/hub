const bcrypt = require('bcryptjs');
const pmHash = '$2a$10$Fp0Z/F1pkFX8GgussTtiU.v0OZ5zsOLM7Ux0ZuLHOLo3mFOzuUtdC';
const johnHash = '$2a$10$Fp0Z/F1pkFX8GgussTtiU.84D4AJiu58aUpFhURPauxSyW34wY/bu';
const sarahHash = '$2a$10$Fp0Z/F1pkFX8GgussTtiU.DYee8e96SXoXH8DL613QmFSUjSl8qxe';
const clientHash = '$2a$10$Fp0Z/F1pkFX8GgussTtiU.J.xthI9f1GmOc6bcG0i0h2tuQHsAPEO';

const check = async (name, hash, list) => {
  for (const pw of list) {
    if (await bcrypt.compare(pw, hash)) {
      console.log(`${name} password is: ${pw}`);
      return;
    }
  }
  console.log(`${name} has no matching password in list`);
};

const list = ['password', 'password123', 'admin123', 'pm123', 'john123', 'sarah123', 'client123', 'pm', 'john', 'sarah', 'client'];
Promise.all([
  check('pm', pmHash, list),
  check('john', johnHash, list),
  check('sarah', sarahHash, list),
  check('client', clientHash, list)
]);
