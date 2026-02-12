const bcrypt = require('bcryptjs');

const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZGHF4z1j6rFZp1u1C1i6a2sQ6G8eW';
const password = 'admin';

bcrypt.compare(password, hash).then(result => {
  console.log('Senha confere?', result);
});
