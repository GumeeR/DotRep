# DotRep: Protocolo de Reputación Cross-Chain para Polkadot

**Versión:** 0.2.0
**Status:** Conceptual - Plan de Arquitectura Detallado
**Fecha:** 28 de Septiembre, 2025
**Autor:** [Tu Nombre/Alias]

## 1. Visión y Resumen

DotRep es un protocolo agnóstico y descentralizado que cuantifica la reputación on-chain dentro del ecosistema Polkadot. Mediante el análisis de datos históricos y continuos a través de múltiples parachains, DotRep genera un **RepScore** dinámico que se materializa en un **RepNFT** (un Soulbound Token). Nuestra visión es convertir a DotRep en la infraestructura de confianza fundamental para el ecosistema, desbloqueando una nueva generación de servicios DeFi eficientes en capital y aplicaciones Web3 personalizadas.

## 2. El Problema (Análisis Detallado)

### 2.1. Persona 1: Diego, el Usuario DeFi
Diego es un usuario activo de Polkadot. Provee liquidez en HydraDX, hace staking de sus DOT a través de Bifrost y ha pagado puntualmente 3 préstamos en Acala. A pesar de su historial impecable, cuando solicita un nuevo préstamo, se le exige el mismo colateral del 150% que a un usuario nuevo. Su buena reputación es invisible, intangible y no le genera ningún beneficio. Su capital es ineficiente.

### 2.2. Persona 2: Un Protocolo de Préstamos
Un nuevo protocolo de préstamos quiere competir ofreciendo mejores condiciones. Sin embargo, no tienen forma de diferenciar a un usuario de bajo riesgo como Diego de un actor de alto riesgo. Para protegerse, deben imponer altos requisitos de colateral a todos por igual, limitando su mercado potencial y su ventaja competitiva.

## 3. La Solución (Componentes Clave)

DotRep introduce tres componentes centrales:
* **RepScore:** Un puntaje numérico (ej. 300-850) que representa la reputación on-chain de una billetera.
* **RepNFT:** Un NFT no transferible (Soulbound Token) que actúa como una credencial portable. Contiene el RepScore, un "Nivel de Reputación" (ej. Bronce, Plata, Oro), y un hash de los datos utilizados para el cálculo, garantizando la transparencia.
* **DotRep Oracle:** Un servicio descentralizado (futura parachain) que los dApps pueden consultar para obtener el RepScore de un usuario en tiempo real, con su consentimiento.

## 4. Arquitectura del Sistema (Profunda)

### 4.1. Flujo de Datos
1.  **Conectores:** Módulos específicos para cada parachain que escuchan y extraen eventos relevantes.
2.  **Indexer:** Un servicio que procesa estos eventos, los estandariza y los almacena en una base de datos.
3.  **Base de Datos:** PostgreSQL para datos relacionales (préstamos, stakes) y posiblemente una base de datos de grafos para analizar las interacciones de la billetera.
4.  **Motor de Puntuación:** El núcleo del sistema. Un servicio que se ejecuta periódicamente para calcular el RepScore de las billeteras activas basándose en el algoritmo.
5.  **API:** Una API pública que permite a la dApp de DotRep y a los protocolos asociados consultar los RepScores.
6.  **dApp de Acuñación (Minting):** La interfaz donde el usuario conecta su billetera, revisa su desglose de puntuación y acuña/actualiza su RepNFT.

### 4.2. Fuentes de Datos y Ponderación (V1)

| Parachain | Evento / Dato | Impacto en Reputación | Racional |
| :--- | :--- | :--- | :--- |
| **Acala** | `loan.repaid` | +++ (Muy Positivo) | Demuestra alta fiabilidad y solvencia. |
| **Acala** | `loan.liquidated` | --- (Muy Negativo) | Indica gestión de riesgo deficiente. |
| **HydraDX** | `omnipool.lp_added` | ++ (Positivo) | Aporta valor y confianza al ecosistema. |
| **Bifrost** | `staking.joined` | ++ (Positivo) | Compromiso a largo plazo con la seguridad de la red. |
| **Moonbeam** | `governance.voted` | + (Positivo) | Participación activa en la evolución del ecosistema. |
| **Polkadot Relay**| `identity.set` | + (Positivo) | Aumenta la transparencia y la confianza. |
| **Genérico** | Antigüedad de la billetera | ++ (Positivo) | Un historial largo es más difícil de falsear. |
| **Genérico** | Nº Transacciones > 1 mes | + (Positivo) | Indica actividad genuina y constante. |

### 4.3. Modelo del Algoritmo de Puntuación (Conceptual V1)
El RepScore se basará en una fórmula ponderada con un factor de decaimiento en el tiempo.
`RepScore = Σ (Weight_action * Value_action * TimeDecay_factor)`
* **Categorías de Puntuación:** Longevidad y Actividad Base, Gestión de Deuda, Participación en el Ecosistema, Diversidad de Activos.
* **Decaimiento Temporal (Time Decay):** Las acciones más recientes (últimos 6 meses) tendrán un peso significativamente mayor que las acciones antiguas para reflejar el estado actual del usuario.

### 4.4. Especificación del RepNFT (SBT)
* **Estándar:** Basado en ERC-721 con una restricción de transferencia a nivel de contrato. Se investigarán estándares emergentes de SBT.
* **Metadata On-Chain:** `score` (uint), `level` (string), `updatedAt` (timestamp).
* **Metadata Off-Chain (IPFS):** Un hash apuntando a un JSON con un desglose detallado (no privado) de los datos que contribuyeron al puntaje para total transparencia.

## 5. Estrategia Go-to-Market (GTM) y Adopción
* **Público Objetivo Inicial:** Protocolos de Préstamos y Mercados de Opciones en Astar, Moonbeam y Acala.
* **Programa de Socios "Genesis":** Ofrecer a los primeros 5 protocolos que se integren: soporte técnico prioritario, participación en la gobernanza del algoritmo y una futura asignación del token del protocolo. Esto crea un ciclo de retroalimentación y un efecto de red.

## 6. Tokenomics (Conceptual a Futuro)
El futuro token nativo, **$REP**, tendrá las siguientes utilidades:
* **Gobernanza:** Votar sobre los pesos del algoritmo, la incorporación de nuevas parachains, etc.
* **Staking:** Los operadores de nodos del oráculo deberán hacer staking de $REP como garantía de honestidad.
* **Pagos:** Requerido para consultas de API de alto volumen o análisis de datos avanzados por parte de instituciones.

## 7. Hoja de Ruta Detallada
* **Q4 2025 (Fase 1 - Prototipo Funcional):**
    * **Hito 1:** Construir conectores de datos para Moonbeam y HydraDX.
    * **Hito 2:** Diseñar e implementar el esquema de la base de datos en PostgreSQL.
    * **Hito 3:** Implementar el algoritmo de puntuación v1 en un entorno de prueba aislado.
* **Q1 2026 (Fase 2 - Lanzamiento en Testnet):**
    * **Hito 1:** Desarrollar el contrato inteligente del RepNFT en ink!.
    * **Hito 2:** Construir la dApp de acuñación y visualización del puntaje.
    * **Hito 3:** Despliegue completo en la Testnet de Rococo/Westend.
* **Q2 2026 (Fase 3 - Preparación Mainnet):**
    * **Hito 1:** Auditoría de seguridad profesional del contrato inteligente y la infraestructura.
    * **Hito 2:** Firmar acuerdos con al menos 2 socios "Genesis".

## 8. Riesgos y Mitigación
* **Riesgo: Ataques Sybil / "Farming" del Puntaje.**
    * **Mitigación:** El algoritmo ponderará fuertemente la antigüedad y la diversidad de acciones, haciendo muy costoso y lento crear una billetera con un puntaje alto de forma artificial.
* **Riesgo: Privacidad de Datos.**
    * **Mitigación:** El protocolo solo agrega datos que ya son públicos en la blockchain. La acuñación del RepNFT es 100% voluntaria por parte del usuario. Se explorarán soluciones con ZK-Proofs en el futuro para verificaciones privadas.
