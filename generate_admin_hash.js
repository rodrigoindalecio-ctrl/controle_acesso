const bcrypt = require('bcryptjs');
bcrypt.hash('admin', 10).then(hash => {
  console.log('Novo hash:', hash);
});
