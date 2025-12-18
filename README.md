# Proyecto-SalesForce

Este repositorio contiene la resolución del **Assignment – Asynchronous Exercise**, cuyo objetivo es evaluar conocimientos prácticos en **Salesforce**, particularmente en el desarrollo con **Lightning Web Components (LWC)**, **Apex** y **Lightning Pages**, siguiendo buenas prácticas de arquitectura, usabilidad y validaciones de negocio.

---

## Objetivo del ejercicio

El objetivo principal del ejercicio es extender el objeto estándar **Account** mediante un campo personalizado y construir una **Lightning Page** que permita gestionar cuentas según su nivel, aplicando reglas de negocio y brindando una experiencia de usuario completa y accesible.

---

## Funcionalidades implementadas

### Modelo de Datos
- Creación del campo personalizado **`Level__c`** en el objeto **Account**
- Valores posibles:
  - `Level 1`
  - `Level 2`

---

### Interfaz de Usuario (Lightning Page)

La Lightning Page muestra las cuentas separadas en **dos tablas**:

- Tabla de **Level 1 Accounts**
- Tabla de **Level 2 Accounts**

Cada tabla incluye las siguientes columnas:
1. Account Name  
2. Phone  
3. Last Modified By  
4. Checkbox de selección por registro  

Además, la página incorpora un botón global:

- **Update Account Level**  
  - Intercambia el nivel de las cuentas seleccionadas:
    - Level 1 → Level 2
    - Level 2 → Level 1
  - Refresca automáticamente las tablas luego de la actualización

---

## Filtros, búsqueda y navegación

### Filtros
- Filtro por **Name** (texto) en cada tabla
- Filtro por **Phone** (texto) en cada tabla
- Filtro global por **Owner** (lookup), aplicado a ambas tablas

### Ordenamiento
- Ordenamiento ascendente y descendente por:
  - Name
  - LastModifiedDate

### Paginación
- Implementación de paginación básica para mejorar la experiencia de usuario con grandes volúmenes de datos

---

## Reglas de negocio (validaciones del lado del servidor)

Las validaciones se implementan en **Apex**, asegurando integridad de datos y cumplimiento de reglas:

- No se permite cambiar el nivel si la cuenta posee **Opportunities en estado “Closed Won”**
- No se permite bajar de **Level 2 → Level 1** si el **Type = "Customer - Direct"**
- Se maneja **éxito parcial**:
  - Las cuentas válidas se actualizan
  - Las cuentas inválidas retornan mensajes claros de error

---

## Experiencia de Usuario y Accesibilidad

- Notificaciones mediante **Toast Messages** para éxito y error
- **Modal de confirmación** previo a ejecutar la actualización
- **Spinners de carga** durante procesos asíncronos
- Deshabilitación de acciones mientras se procesan cambios

---

## Tecnologías utilizadas

- **Salesforce**
- **Lightning Web Components (LWC)**
- **Apex**
- **Lightning DataTable**
- **Lightning Pages**

📌 *No se utiliza Visualforce, cumpliendo con los requisitos del ejercicio.*

---

## Entorno de desarrollo

Para ejecutar o probar este proyecto se requiere una **Salesforce Developer Org**.

- Registro de org de prueba:  
  https://developer.salesforce.com/signup

- IDE recomendado:
  - Salesforce Developer Console
  - Visual Studio Code con Salesforce Extensions

---

## Recursos y documentación

Luego se desarrolló un desafío en el cual se agregó la funcionalidad de una Tabla de Level 3, en la cual si se actualiza el nivel esta pasa a nivel 1

---

📘 *Proyecto desarrollado con fines técnicos y de evaluación, enfocado en buenas prácticas de desarrollo Salesforce.*
