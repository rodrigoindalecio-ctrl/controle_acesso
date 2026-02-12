# P3.2 - Feedback Sonoro: Configuração de Áudios

## 📁 Estrutura de Pastas

Você precisa criar a seguinte estrutura em seu projeto:

```
public/
└── sounds/
    ├── checkin-success.mp3
    └── checkin-error.mp3
```

## 📝 Como Adicionar os Arquivos de Áudio

### Opção 1: Usar Ferramentas Online (Recomendado para Testes Rápidos)

1. **Gere os áudios usando:**
   - [TTS Converter Online](https://ttsconverter.com)
   - [Natural Readers](https://www.naturalreaders.com)
   - [Google Text-to-Speech](https://cloud.google.com/text-to-speech)

2. **Para sucesso (checkin-success.mp3):**
   - Som curto, agradável, tom positivo
   - Duração: ~0.5-1s
   - Exemplo: som tipo "ding" ou "beep" eletrônico positivo

3. **Para erro (checkin-error.mp3):**
   - Som curto, alerta, tom sutil
   - Duração: ~0.5s
   - Exemplo: "buzzer" ou "beep" mais grave

### Opção 2: Usar Royalty-Free

Sites com áudios livres:
- [Freesound.org](https://freesound.org) - buscar "success sound" e "error sound"
- [Zapsplat](https://www.zapsplat.com) - áudios de efeitos gratuitos
- [Pixabay](https://pixabay.com/sound-effects/) - múltiplos idiomas
- [OpenGameArt](https://opengameart.org) - áudios de jogos

### Opção 3: Criar com ffmpeg (Local)

Se tiver ffmpeg instalado:

```bash
# Som de sucesso (sino/chime)
ffmpeg -f lavfi -i "sine=f=1000:d=0.3" -f lavfi -i "sine=f=1500:d=0.2" -filter_complex "concat=n=2:v=0:a=1" checkin-success.mp3

# Som de erro (buzzer)
ffmpeg -f lavfi -i "sine=f=400:d=0.5" checkin-error.mp3
```

## 🎵 Arquivos Recomendados

### Success Sound
- **Características:** Positivo, amigável, claro
- **Duração:** 300-500ms
- **Volume:** App reduzirá para 0.4
- **Sugestões de busca:**
  - "notification sound success"
  - "ding chime"
  - "bell notification"

### Error Sound
- **Características:** Alerta sutil, não alarmante
- **Duração:** 300-500ms
- **Volume:** App reduzirá para 0.4
- **Sugestões de busca:**
  - "error notification sound"
  - "alert buzzer"
  - "warning beep"

## ✅ Passos de Instalação

1. **Crie a pasta `public/sounds/`** (se não existir):
   ```bash
   mkdir -p public/sounds
   ```

2. **Baixe ou gere os áudios:**
   - `checkin-success.mp3`
   - `checkin-error.mp3`

3. **Coloque os arquivos em `public/sounds/`**

4. **Reinicie o servidor dev:**
   ```bash
   npm run dev
   ```

5. **Teste:**
   - Faça um check-in bem-sucedido
   - Você deve ouvir o som de sucesso
   - Tente forçar um erro (desconectar internet, etc)
   - Você deve ouvir o som de erro

## 🔊 Comportamento Esperado

### Som Toca:
- ✅ Check-in bem-sucedido
- ❌ Erro de requisição
- ❌ Erro do servidor

### Som NÃO Toca:
- 🔁 Ao desfazer check-in (undo)
- 🔄 Auto-reset de busca/filtro
- ⚠️ Aviso de duplicata ("já entrou")
- 🔇 Se áudio não estiver carregado/bloqueado por navegador

## 🔇 Controle de Volume

O hook `useCheckInSounds.ts` define automaticamente:
- **Volume:** `0.4` (40% - profissional, não intrusivo)

Você pode ajustar na linha do hook se necessário:
```typescript
audio.volume = 0.4; // Altere este valor (0.0 a 1.0)
```

## 🛠️ Troubleshooting

**Som não toca?**
1. Verifique se os arquivos estão em `public/sounds/`
2. Verifique os nomes dos arquivos (deve ser exatamente `checkin-success.mp3` e `checkin-error.mp3`)
3. Abra a console do navegador (F12) e procure por erros
4. Navegadores podem bloquear áudio autoplay - permita na configuração de privacidade
5. Verifique o volume do sistema

**Som distorcido ou muito alto/baixo?**
1. Ajuste o volume no próprio arquivo de áudio (com software de edição)
2. Ou altere `audio.volume` no hook `useCheckInSounds.ts` (0.0 a 1.0)

**Suporte a navegadores:**
- Chrome: ✅ Completo
- Firefox: ✅ Completo
- Safari: ✅ (pode requerer permissão de áudio)
- Edge: ✅ Completo

## 📋 Checklist Final

- [ ] Pasta `public/sounds/` criada
- [ ] Arquivo `checkin-success.mp3` adicionado
- [ ] Arquivo `checkin-error.mp3` adicionado
- [ ] Servidor dev reiniciado
- [ ] Som toca ao fazer check-in bem-sucedido
- [ ] Som toca ao obter erro
- [ ] Som NÃO toca ao desfazer check-in

Pronto! 🎉 Seu feedback sonoro está funcionando!
