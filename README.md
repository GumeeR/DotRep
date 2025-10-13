<p align="center">
  <img src="Img/Logo/Logo Nfondo.png" alt="DotRep Logo" width="200">
</p>

<h1 align="center">DotRep: Reputación On-Chain para Polkadot</h1>

<p align="center">
  <i>Sistema de reputación descentralizado para el ecosistema Polkadot</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Fase%201%20Completa-brightgreen" alt="Status: Fase 1 Completa">
  <img src="https://img.shields.io/badge/Built%20with-TypeScript-blue" alt="Built with TypeScript">
  <img src="https://img.shields.io/badge/Powered%20by-Subscan%20API-orange" alt="Powered by Subscan API">
</p>

---

## 🌟 Introducción

DotRep es un protocolo agnóstico y descentralizado diseñado para cuantificar la reputación on-chain dentro del ecosistema Polkadot. Nuestro objetivo es transformar la actividad histórica de una billetera en un **RepScore** dinámico, que eventualmente se materializará como un **RepNFT** (Soulbound Token).

### ❓ El Problema

En el mundo DeFi actual, incluso los usuarios más fiables y con un historial impecable son tratados como "nuevos" en cada interacción. Esto lleva a:
*   **Capital Ineficiente:** Usuarios como "Diego" (nuestra persona) deben aportar colaterales excesivos en préstamos, a pesar de su historial de pagos.
*   **Limitaciones para Protocolos:** Nuevos protocolos no pueden diferenciar entre usuarios de bajo y alto riesgo, forzándolos a imponer condiciones conservadoras a todos.

La buena reputación on-chain es invisible e intangible, y no genera beneficios para quienes la construyen.

### ✅ Nuestra Solución

DotRep hace visible la reputación. A través de un análisis profundo de la actividad on-chain, generamos un **RepScore** numérico (300-850) que representa la confianza de una billetera. Este puntaje será la base para:
*   **RepNFT:** Un token no transferible que actúa como una credencial portable, conteniendo el `RepScore` y un "Nivel de Reputación".
*   **DotRep Oracle:** Un servicio descentralizado (futura parachain) que permitirá a las dApps consultar el `RepScore` de un usuario en tiempo real.

## 🚀 Prototipo Actual: DotRep Scorecard

Hemos completado la Fase 1 del proyecto, un prototipo funcional que demuestra el poder de DotRep. La aplicación web **DotRep Scorecard** te permite:
*   Introducir cualquier dirección de Polkadot o Moonbeam
*   Detección automática de red (direcciones con 0x = Moonbeam, otras = Polkadot)
*   Obtener un `RepScore` calculado en tiempo real (rango 300-850)
*   Visualizar el puntaje con animación de partículas

## ⚙️ ¿Cómo Funciona? (Arquitectura)

El prototipo actual sigue una arquitectura serverless eficiente:
1.  **Frontend:** Aplicación web vanilla (HTML, CSS, JS) con Particles.js
2.  **Backend API:** Vercel Serverless Function (`/api/checker`)
3.  **Recolección de Datos:** Consulta a Subscan API para obtener historial de extrínsecos
4.  **Motor de Puntuación:** Algoritmo ponderado con decaimiento temporal (`scoring-engine-v1.ts`)
5.  **Respuesta:** RepScore (300-850) + eventos relevantes encontrados

## 🛠️ Stack Tecnológico

*   **Frontend:** HTML, CSS, JavaScript (Vanilla), Particles.js
*   **Backend:** TypeScript, Vercel Serverless Functions
*   **API Externa:** Subscan API
*   **Testing:** ts-node

## 🏁 Hoja de Ruta

*   **Fase 1: Prototipo Funcional (✅ Completa)**
    *   Motor de puntuación v1 implementado
    *   Integración con Subscan API (Polkadot y Moonbeam)
    *   Interfaz web "Scorecard" funcional
    *   Sistema de tests básico
*   **Fase 2: Expansión y RepNFT (📋 Planeada)**
    *   Conectores para Acala, HydraDX y Bifrost
    *   Contrato inteligente RepNFT en ink!
    *   dApp de acuñación de RepNFT
    *   Despliegue en testnet
*   **Fase 3: Mainnet (🔜 Futuro)**
    *   Auditoría de seguridad
    *   DotRep Oracle descentralizado
    *   Programa de socios Genesis

## 🚀 Desarrollo Local

### Requisitos Previos
- Node.js 16+
- npm o yarn
- Cuenta en Subscan para API key

### Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/GumeeR/DotRep.git
    ```

2.  **Instala dependencias:**
    ```bash
    npm install
    ```

3.  **Configura variables de entorno:**

    Crea un archivo `.env` en la raíz:
    ```bash
    SUBSCAN_API=tu_api_key_de_subscan
    ```

    Obtén tu API key en [Subscan](https://www.subscan.io/)

4.  **Inicia el servidor de desarrollo:**
    ```bash
    vercel dev
    ```

    La aplicación estará disponible en `http://localhost:3000`

### Comandos Disponibles

```bash
# Ejecutar tests
npm test

# Desarrollo local
vercel dev
```

## 🧪 Probando la Aplicación

**Direcciones de ejemplo para probar:**

- **Polkadot:** `15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5`
- **Moonbeam:** `0x...` (cualquier dirección EVM válida)

El sistema detecta automáticamente la red según el formato de la dirección.

## 🔧 Troubleshooting

**Error: "Clave de API de Subscan no configurada"**
- Verifica que el archivo `.env` existe y contiene `SUBSCAN_API=...`
- Reinicia `vercel dev` después de crear el `.env`

**Error: "Red no soportada"**
- Actualmente solo soportamos Polkadot y Moonbeam
- Verifica el formato de la dirección

**RepScore muy bajo (300)**
- Es normal para wallets nuevas o inactivas
- El score considera: antigüedad, transacciones, gobernanza, identidad

## 🤝 Contribuir

Si te interesa contribuir al proyecto:
1. Abre un issue para discutir cambios mayores
2. Fork el repositorio
3. Crea una rama para tu feature
4. Envía un Pull Request

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.