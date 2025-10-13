# Documentación de API - DotRep

## Endpoint Principal

### GET/POST `/api/checker`

Calcula el RepScore de una wallet basado en su actividad on-chain.

#### Parámetros de Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `address` | string | Sí | Dirección de la wallet (Polkadot o Moonbeam) |
| `network` | string | No | Red a consultar: `polkadot` o `moonbeam` (se detecta automáticamente) |

#### Detección Automática de Red

- Direcciones que comienzan con `0x` → Moonbeam
- Otras direcciones → Polkadot

#### Respuesta Exitosa (200)

```json
{
  "wallet": "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
  "network": "polkadot",
  "repScore": 456,
  "events": [
    "Extrínseco 'balances.transfer' encontrado en bloque 12345678",
    "Voto de gobernanza encontrado en bloque 12346000",
    "Identidad establecida encontrada en bloque 12340000"
  ],
  "scoreFactors": {
    "acala": {
      "loanRepaid": [],
      "loanLiquidated": []
    },
    "hydraDx": {
      "omnipoolLpAdded": []
    },
    "bifrost": {
      "stakingJoined": []
    },
    "moonbeam": {
      "governanceVoted": [
        {
          "timestamp": "2025-01-15T10:30:00.000Z",
          "value": 1
        }
      ]
    },
    "polkadotRelay": {
      "identitySet": [
        {
          "timestamp": "2024-06-20T08:15:00.000Z",
          "value": 1
        }
      ]
    },
    "generic": {
      "walletCreationDate": "2023-03-10T12:00:00.000Z",
      "transactionCountLastMonth": 25
    }
  }
}
```

#### Campos de Respuesta

**Nivel Superior:**
- `wallet` (string): Dirección consultada
- `network` (string): Red detectada/usada
- `repScore` (number): Score calculado (300-850)
- `events` (array): Lista de eventos relevantes encontrados
- `scoreFactors` (object): Desglose detallado de factores de puntuación

**scoreFactors:**
- `acala`: Eventos de préstamos (actualmente no implementado)
- `hydraDx`: Eventos de liquidez (actualmente no implementado)
- `bifrost`: Eventos de staking (actualmente no implementado)
- `moonbeam`: Eventos de gobernanza
- `polkadotRelay`: Eventos de identidad
- `generic`: Antigüedad de wallet y actividad de transacciones

#### Errores Comunes

**400 Bad Request - Dirección Faltante**
```json
{
  "error": "El parámetro \"address\" es requerido."
}
```

**400 Bad Request - Red No Soportada**
```json
{
  "error": "Red no soportada."
}
```

**500 Internal Server Error**
```json
{
  "error": "Error interno del servidor: Clave de API de Subscan no configurada."
}
```

o

```json
{
  "error": "Error interno del servidor: Error de Subscan: Invalid API key"
}
```

## Ejemplos de Uso

### JavaScript (Fetch API)

```javascript
const address = '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5';

fetch(`/api/checker?address=${address}`)
  .then(response => response.json())
  .then(data => {
    console.log('RepScore:', data.repScore);
    console.log('Eventos:', data.events);
  })
  .catch(error => console.error('Error:', error));
```

### cURL

```bash
# Polkadot
curl "http://localhost:3000/api/checker?address=15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"

# Moonbeam (con detección automática)
curl "http://localhost:3000/api/checker?address=0x1234567890123456789012345678901234567890"

# Especificar red manualmente
curl "http://localhost:3000/api/checker?address=15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5&network=polkadot"
```

### Python (requests)

```python
import requests

address = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
response = requests.get(f"http://localhost:3000/api/checker?address={address}")

if response.status_code == 200:
    data = response.json()
    print(f"RepScore: {data['repScore']}")
    print(f"Eventos encontrados: {len(data['events'])}")
else:
    print(f"Error: {response.json()['error']}")
```

## Algoritmo de Puntuación

El RepScore se calcula usando la fórmula:

```
RepScore = Σ (Peso_acción * Valor_acción * Factor_Decaimiento)
```

### Pesos de Acciones (V1)

| Acción | Peso | Parachain | Estado |
|--------|------|-----------|--------|
| Préstamo pagado | +100 | Acala | Planeado |
| Préstamo liquidado | -300 | Acala | Planeado |
| Liquidez añadida | +50 | HydraDX | Planeado |
| Staking iniciado | +50 | Bifrost | Planeado |
| Voto de gobernanza | +25 | Moonbeam | ✅ Activo |
| Identidad establecida | +25 | Polkadot | ✅ Activo |
| Antigüedad (por año) | +50 | Genérico | ✅ Activo |
| Transacción | +1 | Genérico | ✅ Activo |

### Decaimiento Temporal

El factor de decaimiento penaliza eventos antiguos:

- **< 6 meses**: Factor 1.0 (peso completo)
- **6 meses - 2 años**: Decaimiento lineal
- **> 2 años**: Factor 0.0 (sin peso)

Fórmula:
```
Factor = 1 - ((días - 180) / (730 - 180))
```

### Normalización

El score bruto se normaliza al rango 300-850:

```
Score_Final = MIN(850, MAX(300, 300 + (Score_Bruto / 1500) * 550))
```

## Limitaciones Conocidas

1. **Sin caché**: Cada consulta hace llamadas en tiempo real a Subscan
2. **Sin rate limiting**: No hay límite de consultas por usuario
3. **Eventos limitados**: Solo identidad, gobernanza y transacciones básicas
4. **Sin persistencia**: No se almacenan scores históricos
5. **Subscan dependency**: Totalmente dependiente de disponibilidad de Subscan API

## Datos de Prueba

### Direcciones de Ejemplo

**Polkadot (Relay Chain):**
- `15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5` - Wallet con actividad moderada
- `14Gjs1TD93gnwEBfDMHoCgsuf1s2TVKUP6Z1qKmAZnZ8cW5q` - Wallet antigua

**Moonbeam:**
- Cualquier dirección EVM válida que comience con `0x`

### Score Esperados

- **Wallet nueva (< 1 mes)**: ~300-350
- **Wallet activa (1-2 años)**: ~400-550
- **Wallet antigua y activa (> 3 años)**: ~500-700
- **Wallet con identidad + gobernanza**: +25-50 adicional

## Soporte y Reportes

Para reportar bugs o solicitar features:
- Abrir issue en el repositorio
- Incluir ejemplo de dirección que causa el problema
- Adjuntar respuesta completa de la API si es posible
