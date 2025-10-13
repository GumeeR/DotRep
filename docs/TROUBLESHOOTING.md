# Guía de Troubleshooting - DotRep

## Problemas Comunes y Soluciones

### 🔴 Errores de Configuración

#### Error: "Clave de API de Subscan no configurada"

**Síntomas:**
```json
{
  "error": "Error interno del servidor: Clave de API de Subscan no configurada."
}
```

**Solución:**
1. Verifica que existe el archivo `.env` en la raíz del proyecto
2. Confirma que contiene la línea: `SUBSCAN_API=tu_api_key`
3. Reinicia el servidor después de crear/modificar `.env`:
   ```bash
   # Detén vercel dev (Ctrl+C)
   vercel dev
   ```

**Verificación:**
```bash
# Verifica que el archivo .env existe
ls -la .env

# Verifica el contenido (sin mostrar la key completa)
cat .env | grep SUBSCAN_API
```

---

#### Error: "vercel: command not found"

**Síntomas:**
```bash
bash: vercel: command not found
```

**Solución:**
```bash
# Instala Vercel CLI globalmente
npm install -g vercel

# O usa npx sin instalación global
npx vercel dev
```

**Verificación:**
```bash
vercel --version
```

---

### 🟡 Errores de Red/API

#### Error: "Red no soportada"

**Síntomas:**
```json
{
  "error": "Red no soportada."
}
```

**Causa:**
Intentaste usar una red que no está implementada (ej: Kusama, Astar)

**Solución:**
Usa solo direcciones de:
- **Polkadot**: Direcciones que NO comienzan con `0x`
- **Moonbeam**: Direcciones que comienzan con `0x`

---

#### Error: "Error de Subscan: Invalid API key"

**Síntomas:**
```json
{
  "error": "Error interno del servidor: Error de Subscan: Invalid API key"
}
```

**Solución:**
1. Verifica que tu API key de Subscan sea válida
2. Genera una nueva key en https://www.subscan.io/
3. Actualiza el archivo `.env`
4. Reinicia `vercel dev`

**Verificación:**
```bash
# Prueba la API key directamente
curl -X POST https://polkadot.api.subscan.io/api/v2/scan/extrinsics \
  -H "Content-Type: application/json" \
  -H "X-API-Key: TU_API_KEY" \
  -d '{"row": 1, "page": 0}'
```

---

#### Error: "Error de Subscan: Too Many Requests"

**Síntomas:**
La API retorna error 429 o mensaje de rate limiting

**Solución:**
1. Espera 1-2 minutos antes de hacer más consultas
2. Subscan tiene límites de rate:
   - Free tier: ~5 requests/segundo
   - Considera upgrade si necesitas más
3. Implementa debouncing en el frontend

---

### 🟢 Problemas de Datos

#### RepScore siempre 300 (mínimo)

**Síntomas:**
Todas las wallets retornan score de 300

**Causas Posibles:**
1. **Wallet muy nueva** (< 1 mes)
2. **Sin actividad on-chain** relevante
3. **Red incorrecta** - consultando Moonbeam cuando debería ser Polkadot

**Diagnóstico:**
Revisa el campo `events` en la respuesta:
```json
{
  "repScore": 300,
  "events": []  // ← Sin eventos encontrados
}
```

**Solución:**
- Usa una wallet con más actividad histórica
- Verifica que la red sea correcta
- Prueba con dirección de ejemplo: `15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5`

---

#### Eventos no aparecen en la lista

**Síntomas:**
La wallet tiene actividad pero `events: []` está vacío

**Causa:**
El código solo rastrea eventos específicos:
- `identity.set_identity`
- `convictionVoting.vote` o `democracy.vote`
- `balances.transfer*`

**Verificación:**
Consulta manualmente en Subscan:
1. Ve a https://polkadot.subscan.io/
2. Busca la dirección
3. Revisa la pestaña "Extrinsics"
4. Verifica si existen los eventos mencionados

---

#### walletCreationDate muy reciente

**Síntomas:**
`walletCreationDate` muestra fecha de hoy para wallet antigua

**Causa:**
- Subscan no retornó suficiente historial
- Error al calcular última página de extrinsics

**Diagnóstico temporal:**
Revisa logs del servidor:
```bash
# En la terminal donde corre vercel dev
# Busca líneas con [API_ERROR]
```

**Solución:**
Este es un bug conocido. Workaround:
- El cálculo de antigüedad puede ser inexacto
- Afecta al score final
- Se corregirá en próxima versión con backend persistente

---

### 🔵 Problemas de Frontend

#### Pantalla en blanco / No carga

**Síntomas:**
La página no muestra contenido

**Solución:**
1. Abre DevTools del navegador (F12)
2. Revisa la consola por errores JavaScript
3. Verifica que Particles.js cargó correctamente:
   ```javascript
   // En consola del navegador
   typeof particlesJS
   // Debería retornar "function"
   ```

**Si Particles.js no carga:**
- Verifica conexión a internet
- El CDN puede estar caído
- Considera usar versión local de la librería

---

#### "Calculando..." se queda colgado

**Síntomas:**
El indicador de carga no desaparece

**Causa:**
Request a la API falló o está colgado

**Diagnóstico:**
1. Abre DevTools → Network tab
2. Busca el request a `/api/checker`
3. Revisa status code y response

**Soluciones:**
- Si 500: Problema en backend (revisa logs)
- Si timeout: Subscan API lenta (reintenta)
- Si 400: Dirección inválida

---

### 🟣 Problemas de Tests

#### Tests fallan con error de tipos

**Síntomas:**
```bash
npm test
# Error: Cannot find module './scoring-engine-v1'
```

**Solución:**
```bash
# Verifica que TypeScript esté instalado
npm install

# Ejecuta con ruta absoluta
npx ts-node src/scoring-engine-v1.test.ts
```

---

#### Tests pasan pero scores son inesperados

**Síntomas:**
El test reporta SUCCESS pero los números no tienen sentido

**Causa:**
Los tests usan timestamps relativos (ej: `new Date().setMonth(...)`)

**Verificación:**
```bash
npm test
# Revisa los valores de RepScore impresos
# Diego debería ser > 400
# High-Risk debería ser ~300
```

**Si los valores son muy diferentes:**
- Puede ser variación temporal normal
- El algoritmo es sensible a fechas
- Considera ajustar los tests con fechas fijas

---

## 🛠️ Debugging Avanzado

### Habilitar logs detallados

Modifica `api/checker.ts` temporalmente:

```typescript
// Después de obtener realData
console.log('[DEBUG] realData:', JSON.stringify(realData, null, 2));
console.log('[DEBUG] walletData:', JSON.stringify(walletData, null, 2));
```

### Verificar requests a Subscan

```bash
# En api/checker.ts, agrega antes del fetch:
console.log('[DEBUG] Fetching:', `https://${subscanDomain}.api.subscan.io/api/v2/scan/extrinsics`);
console.log('[DEBUG] Body:', JSON.stringify(body));
```

### Inspeccionar cálculo de score

En `src/scoring-engine-v1.ts`:

```typescript
export function calculateRepScoreV1(walletData: WalletData): number {
    let rawScore = 0;
    console.log('[SCORE] Wallet age years:', walletAgeYears);
    console.log('[SCORE] TX count:', walletData.generic.transactionCountLastMonth);

    // ... resto del código

    console.log('[SCORE] Raw score:', rawScore);
    console.log('[SCORE] Normalized:', normalizeScore(rawScore));
    return normalizeScore(rawScore);
}
```

---

## 📞 Soporte Adicional

Si el problema persiste:

1. **Recopila información:**
   - Dirección de wallet usada
   - Red (Polkadot/Moonbeam)
   - Respuesta completa de la API
   - Logs del servidor
   - Versión de Node.js (`node --version`)

2. **Crea un issue:**
   - Repositorio: GitHub del proyecto
   - Template: Bug Report
   - Incluye toda la información recopilada

3. **Recursos:**
   - Documentación de API: `docs/API.md`
   - Subscan Docs: https://support.subscan.io/
   - Vercel Docs: https://vercel.com/docs

---

## 🔍 Checklist de Diagnóstico Rápido

Antes de reportar un bug, verifica:

- [ ] Archivo `.env` existe y contiene `SUBSCAN_API`
- [ ] `vercel dev` corre sin errores
- [ ] `npm test` pasa exitosamente
- [ ] La dirección de wallet es válida para la red
- [ ] Subscan API key es válida (probada con curl)
- [ ] Node.js versión 16+ (`node --version`)
- [ ] npm install ejecutado recientemente
- [ ] No hay firewall bloqueando Subscan API
- [ ] Navegador actualizado (Chrome/Firefox latest)
- [ ] DevTools console no muestra errores JavaScript
