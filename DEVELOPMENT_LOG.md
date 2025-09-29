# DotRep - Diario de Desarrollo

**Autor:** Synapse, Arquitecto Técnico Principal
**Fecha de Inicio:** 28 de Septiembre, 2025

Este documento sirve como un registro cronológico de las decisiones técnicas, hitos completados y estado del proyecto DotRep.

---

### **Fase 1: Prototipo Funcional (Q4 2025)**

#### **Hito 3: Implementar el Algoritmo de Puntuación v1**
*   **Estado:** ✅ **Completado**
*   **Descripción:** Se creó la lógica inicial del `RepScore` en un entorno aislado.
*   **Decisiones Técnicas Clave:**
    *   **Lenguaje:** TypeScript, ejecutado con Node.js.
    *   **Algoritmo:** Implementa la fórmula `Σ (Weight * Value * TimeDecay)` del README (sección 4.3).
    *   **Ponderación:** Se asignaron pesos numéricos a los eventos cualitativos de la tabla 4.2.
    *   **Decaimiento Temporal:** Se implementó un decaimiento lineal simple donde los eventos de más de 2 años tienen valor 0 y los de menos de 6 meses tienen valor 1.0.
    *   **Normalización:** El score crudo se normaliza a un rango de 300-850.
*   **Archivos Creados:**
    *   `src/scoring-engine-v1.ts` (lógica principal)
    *   `src/scoring-engine-v1.test.ts` (verificación con personas)
    *   `package.json`, `tsconfig.json` (configuración del proyecto)

---

#### **Hito 2: Diseñar el Esquema de Base de Datos**
*   **Estado:** ✅ **Completado**
*   **Descripción:** Se diseñó el esquema inicial para la base de datos que almacenará los datos del indexador.
*   **Decisiones Técnicas Clave:**
    *   **Motor:** PostgreSQL.
    *   **Estructura:** Se optó por un diseño normalizado con dos tablas principales (`wallets`, `on_chain_events`) para optimizar el almacenamiento y la velocidad de las consultas.
    *   **Integridad:** Se utilizan tipos `ENUM` para la consistencia de los datos y restricciones `UNIQUE` (especialmente en `transaction_hash`) para prevenir la duplicación de eventos.
*   **Artefactos:**
    *   Definiciones SQL de las tablas y tipos.

---

#### **Hito 1: Construir Conectores de Datos**
*   **Estado:** 🟡 **En Progreso**
*   **Tarea Actual:** Conector para eventos `loan.repaid` de Acala.
*   **Decisiones Técnicas Clave:**
    *   **Librería:** `@polkadot/api` para la comunicación con el nodo RPC.
*   **Archivos Creados:**
    *   `src/acala-connector.ts`
*   **Último Suceso:**
    *   El primer intento de ejecución falló debido a un error de tipado en TypeScript (`TSError: Property 'forEach' does not exist on type 'Codec'`).
    *   **Acción Correctiva:** Se aplicó un parche al código para importar el tipo `EventRecord` y realizar un casteo explícito `(allRecords as unknown as EventRecord[])`, asegurando que el compilador trate el objeto como un array iterable.
    *   **Siguiente Paso:** Verificar la corrección ejecutando el script `moonbeam-connector.ts` nuevamente.
