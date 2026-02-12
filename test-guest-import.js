#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        ...headers,
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function testGuestImport() {
  log('cyan', '\n🧪 TESTE DE IMPORTAÇÃO DE CONVIDADOS - FRONTEND\n');

  try {
    // 1. Fazer login como ADMIN
    log('blue', '1️⃣  Fazendo login como ADMIN...');
    const loginBody = JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123'
    });

    const loginResponse = await makeRequest('POST', '/api/auth/login', loginBody, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginBody)
    });

    if (loginResponse.status !== 200) {
      log('red', `❌ Falha no login: ${loginResponse.status}`);
      console.log(loginResponse.data);
      return;
    }

    log('green', '✅ Login bem-sucedido como ADMIN');
    const authToken = loginResponse.headers['set-cookie'];
    console.log(`Token recebido: ${authToken ? '✅' : '❌'}`);

    // 2. Buscar um evento para teste
    log('blue', '\n2️⃣  Buscando eventos...');
    const eventsResponse = await makeRequest('GET', '/api/events', null, {
      'Cookie': authToken?.[0] || ''
    });

    if (eventsResponse.status !== 200) {
      log('red', `❌ Falha ao buscar eventos: ${eventsResponse.status}`);
      return;
    }

    const events = eventsResponse.data.events || [];
    if (events.length === 0) {
      log('yellow', '⚠️  Nenhum evento encontrado. Criando um para teste...');
      return;
    }

    const testEvent = events[0];
    log('green', `✅ Evento encontrado: ${testEvent.name} (ID: ${testEvent.id})`);

    // 3. Criar arquivo CSV temporário
    log('blue', '\n3️⃣  Criando arquivo CSV para teste...');
    const csvContent = `full_name,phone,category,table_number,notes
  Convidado Teste 1,11900000001,amigos,A01,Teste import
  Convidado Teste 2,11900000002,amigos,A02,
  Convidado Teste 3,11900000003,outros,,Sem informação`;

    const csvPath = path.join(__dirname, 'test_guests.csv');
    fs.writeFileSync(csvPath, csvContent);
    log('green', `✅ Arquivo criado: ${csvPath}`);

    // 4. Realizar upload do CSV
    log('blue', '\n4️⃣  Enviando arquivo CSV para importação...');

    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath));

    const uploadOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/events/${testEvent.id}/guests/import`,
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Cookie': authToken?.[0] || ''
      }
    };

    const uploadResponse = await new Promise((resolve, reject) => {
      const req = http.request(uploadOptions, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: responseBody });
          }
        });
      });

      req.on('error', reject);
      form.pipe(req);
    });

    console.log('\nResposta do servidor:');
    console.log(JSON.stringify(uploadResponse.data, null, 2));

    if (uploadResponse.status === 200) {
      log('green', '✅ Importação bem-sucedida!');
      const result = uploadResponse.data;
      console.log(`
  📊 Resultado:
  - Importados: ${result.imported || 0}
  - Ignorados: ${result.ignored || 0}
  - Erros: ${result.errors?.length || 0}`);
    } else {
      log('red', `❌ Falha na importação: ${uploadResponse.status}`);
    }

    // 5. Limpar arquivo de teste
    log('blue', '\n5️⃣  Limpando arquivos de teste...');
    fs.unlinkSync(csvPath);
    log('green', '✅ Arquivo de teste removido');

    log('cyan', '\n✨ Teste concluído!\n');

  } catch (error) {
    log('red', `❌ Erro durante teste: ${error.message}`);
    console.error(error);
  }
}

// Executar testes
testGuestImport().catch(console.error);
