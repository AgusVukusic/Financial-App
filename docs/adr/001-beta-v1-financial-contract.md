# ADR 001: Contrato Financiero Beta V1

## Contexto
Para la Beta V1 de la Financial App, se requiere aislar las escrituras de datos financieros (Cuentas y Transacciones) del cliente para garantizar seguridad, integridad y atocimidad. Actualmente la V1 realiza mutaciones directamente desde el frontend en Firestore.

## Decisiones

1. **Unidad Monetaria y Divisa:** 
   Todas las transacciones y balances se almacenarán en unidades menores (centavos) bajo el campo `amountMinor` (entero). La moneda será exclusivamente `ARS` para la Beta V1.
   *Ejemplo:* $1,500.50 ARS se almacena como `amountMinor: 150050, currency: 'ARS'`.

2. **Propiedades Base del Contrato:**
   - `direction`: `'IN'` o `'OUT'`.
   - `occurredAt`: Timestamp de cuando la transacción sucedió en el mundo real.
   - `createdAt`: Timestamp generado automáticamente en el servidor.
   - `schemaVersion`: Entero indicando la versión del esquema, en este caso `1`.

3. **Inmutabilidad de Transacciones:**
   Las transacciones son inmutables. Una vez creadas, el cliente no puede modificarlas ni eliminarlas directamente. Cualquier anulación o corrección deberá realizarse mediante transacciones compensatorias en Cloud Functions.

4. **Reglas de Seguridad y Control de Backend:**
   - Colecciones `accounts` y `transactions`:
     - Lectura: Permitida si `request.auth.uid == resource.data.userId`.
     - Escritura: `allow write: if false;`. Solo el Admin SDK (Cloud Functions) podrá escribir en estas colecciones.
   
5. **Estrategia de Migración del Frontend:**
   - El frontend deberá dejar de invocar `addDoc` o `updateDoc` sobre estas colecciones.
   - Se crearán Callable Functions (e.g., `createTransaction`) que el frontend deberá invocar pasándole el payload.
   - Hasta que el frontend no esté migrado para consumir el nuevo backend, no se mezclará el contrato V1 (con `amount`, `type`, `date`) con el nuevo modelo V2. El cambio debe ser atómico en una Fase de Refactorización.

## Consecuencias
- Incremento de latencia en escrituras debido al viaje redondo hacia la Cloud Function.
- Seguridad robusta: el cliente no puede inyectar saldos falsos.
