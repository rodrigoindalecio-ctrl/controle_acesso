#!/bin/bash

echo "======================================"
echo "TESTE COMPLETO DO SISTEMA"
echo "======================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

# Função para logar com credenciais
login() {
  local email=$1
  local password=$2
  
  echo "🔐 Fazendo login com: $email"
  
  local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
    -c /tmp/cookies_$email.txt)
  
  echo "$response"
}

# 1. TESTE DE LOGIN ADMIN
echo "======================================"
echo "TESTE 1: LOGIN ADMIN"
echo "======================================"
ADMIN_RESPONSE=$(login "admin@controleacesso.com" "Admin@123")
echo "$ADMIN_RESPONSE" | grep -q "success" && echo -e "${GREEN}✓ ADMIN login bem-sucedido${NC}" || echo -e "${RED}✗ ADMIN login falhou${NC}"
echo ""

# 2. TESTE DE LOGIN USER
echo "======================================"
echo "TESTE 2: LOGIN USER"
echo "======================================"
USER_RESPONSE=$(login "colaborador@controleacesso.com" "User@123")
echo "$USER_RESPONSE" | grep -q "success" && echo -e "${GREEN}✓ USER login bem-sucedido${NC}" || echo -e "${RED}✗ USER login falhou${NC}"
echo ""

# 3. TESTE: ADMIN CRIAR EVENTO
echo "======================================"
echo "TESTE 3: ADMIN CRIAR EVENTO"
echo "======================================"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/events" \
  -H "Content-Type: application/json" \
  -b /tmp/cookies_admin@controleacesso.com.txt \
  -d '{
    "name": "Teste Evento ADMIN",
    "date": "2026-06-15",
    "description": "Evento criado para teste",
    "status": "ACTIVE"
  }')

echo "$CREATE_RESPONSE" | grep -q "success\|id" && echo -e "${GREEN}✓ ADMIN conseguiu criar evento${NC}" || echo -e "${RED}✗ ADMIN não conseguiu criar evento${NC}"
echo "$CREATE_RESPONSE"
echo ""

# 4. TESTE: USER TENTAR CRIAR EVENTO (deve falhar)
echo "======================================"
echo "TESTE 4: USER TENTAR CRIAR EVENTO"
echo "======================================"
USER_CREATE=$(curl -s -X POST "$BASE_URL/api/events" \
  -H "Content-Type: application/json" \
  -b /tmp/cookies_colaborador@controleacesso.com.txt \
  -d '{
    "name": "Teste Evento USER",
    "date": "2026-07-15",
    "description": "Evento criado por user",
    "status": "ACTIVE"
  }')

echo "$USER_CREATE" | grep -q "administratores\|Apenas" && echo -e "${GREEN}✓ USER bloqueado corretamente${NC}" || echo -e "${RED}✗ USER conseguiu criar (não deveria!)${NC}"
echo "$USER_CREATE"
echo ""

# 5. TESTE: ADMIN LISTAR EVENTOS (deve ver todos)
echo "======================================"
echo "TESTE 5: ADMIN LISTAR EVENTOS"
echo "======================================"
ADMIN_LIST=$(curl -s -X GET "$BASE_URL/api/events" \
  -b /tmp/cookies_admin@controleacesso.com.txt)

echo "$ADMIN_LIST" | grep -q "events" && echo -e "${GREEN}✓ ADMIN consegue listar eventos${NC}" || echo -e "${RED}✗ ADMIN não consegue listar${NC}"
echo "$ADMIN_LIST" | jq '.events | length' && echo "Total de eventos para ADMIN"
echo ""

# 6. TESTE: USER LISTAR EVENTOS (deve ver apenas vinculados)
echo "======================================"
echo "TESTE 6: USER LISTAR EVENTOS"
echo "======================================"
USER_LIST=$(curl -s -X GET "$BASE_URL/api/events" \
  -b /tmp/cookies_colaborador@controleacesso.com.txt)

echo "$USER_LIST" | grep -q "events" && echo -e "${GREEN}✓ USER consegue listar eventos${NC}" || echo -e "${RED}✗ USER não consegue listar${NC}"
echo "$USER_LIST" | jq '.events | length' && echo "Total de eventos para USER"
echo ""

echo "======================================"
echo "TESTES CONCLUÍDOS"
echo "======================================"
