# 📖 Manual de Uso — LifeTracker

Bienvenido a **LifeTracker**, tu espacio para construir mejores hábitos y tomar el control de tus finanzas personales. Esta guía explica cómo funciona cada pantalla y qué significan las métricas que verás.

La app tiene tres secciones principales, accesibles desde el menú lateral (o la barra inferior en móvil):

- 🏠 **Dashboard** — resumen de todo
- 🔁 **Hábitos** — seguimiento diario y análisis
- 💰 **Finanzas** — balance, gastos y metas de ahorro

---

## 🏠 Dashboard Principal

Es la pantalla de inicio. Te da una foto rápida de tu día y tu mes.

### Tarjetas de métricas (KPIs)

En la parte superior verás cuatro tarjetas:

| Tarjeta | Qué significa |
|---------|---------------|
| **Progreso de Hábitos** | Tu **tasa global** de cumplimiento de la semana actual (%). Incluye una barra de progreso visual. |
| **Balance Disponible** | El dinero que te queda libre este mes tras gastos fijos y ahorros asignados. |
| **Gastos Fijos** | La suma de todos tus gastos fijos registrados. |
| **Fondo de Proyectos** | El total que has asignado (ahorrado) a tus metas. |

### Hábitos de Hoy — marca al instante ✅

En el panel **"Hábitos de Hoy"** aparecen todos tus hábitos del día:

- Haz clic en la casilla para **marcar un hábito como completado**. El cambio se ve **al instante** (mutación optimista): la casilla se llena y el texto se tacha inmediatamente, sin esperar al servidor.
- Si algo falla en la sincronización, la casilla vuelve automáticamente a su estado anterior.
- Con el botón **"Añadir"** puedes crear un hábito nuevo sin salir del Dashboard.

### Gráfica de Distribución Financiera 📊

A la derecha verás un gráfico de barras del mes en curso con cuatro columnas:

- **Ingresos** — tu ingreso mensual.
- **Fijos** — total de gastos fijos.
- **Ahorro** — total asignado a proyectos.
- **Disponible** — lo que te queda libre.

Debajo se muestra tu **proyecto destacado** con su porcentaje de avance, para tenerlo siempre a la vista.

---

## 🔁 Módulo de Hábitos

Aquí registras tu progreso y analizas tu constancia. Tiene **dos vistas** que cambias con el interruptor **Semanal / Mensual**.

### 📅 Vista Semanal

Pensada para el **día a día**:

- Muestra una tabla con tus hábitos en filas y los **7 días de la semana** (Lun–Dom) en columnas.
- Haz clic en cualquier casilla para **registrar el avance de ese día**. El día de hoy aparece resaltado.
- El botón **"+ Añadir Hábito"** está disponible **sólo en esta vista**. Al pulsarlo se abre un modal donde defines:
  - **Nombre** del hábito (ej. "Meditar 10 min").
  - **Ícono** (elige entre varias opciones visuales).
- Cada fila muestra a la derecha su **% de cumplimiento** de la semana.

### 🗓️ Vista Mensual

Pensada para el **análisis global**:

- Muestra todos los días del mes en curso, para que veas tu constancia a lo largo de las semanas.
- Igual que en la semanal, puedes marcar/desmarcar días, pero **no se crean hábitos nuevos aquí** (para eso usa la vista semanal).
- Ideal para detectar patrones: ¿en qué semanas fuiste más constante?

### 📈 Métricas automáticas

En la parte superior del módulo se calculan solas, según la vista activa (semana o mes):

- **Tasa de Cumplimiento (%)** de cada hábito:

  ```
  Tasa = (días completados en el periodo ÷ días totales del periodo) × 100
  ```

  Ejemplo: si completaste "Leer" 5 de los 7 días de la semana → **71%**.

- **Tasa Global:** el promedio de las tasas de **todos** tus hábitos. Es tu constancia general.

- **🏆 Mejor Hábito:** se identifica automáticamente el hábito con **mayor** porcentaje de cumplimiento en el periodo. Es tu punto fuerte.

- **📉 Por Mejorar:** el hábito con **menor** porcentaje. Es donde conviene poner atención.

> Estas métricas se recalculan solas cada vez que marcas un día. No tienes que hacer nada manual.

---

## 💰 Módulo de Finanzas y Proyectos

Controla tu dinero y tus metas de ahorro/compra.

### Lógica del Balance Disponible

La métrica central se calcula así:

```
Balance Disponible = Ingreso Mensual − Gastos Fijos − Asignaciones a Proyectos
```

- **Ingreso Mensual:** lo defines con el botón **"Ingreso mensual"**.
- **Gastos Fijos:** cada gasto recurrente (renta, servicios, suscripciones…) que agregas con **"Gasto fijo"**.
- **Asignaciones a Proyectos:** el dinero que has apartado (ahorrado) para tus metas.

> Si el Balance Disponible aparece en **rojo**, significa que asignaste más de lo que tienes disponible: revisa tus gastos o tus metas.

### Registrar un Proyecto / Meta de compra 🎯

Pulsa el botón **"+ Nuevo Proyecto"**. Se abre un modal donde defines:

| Campo | Qué es | Ejemplo |
|-------|--------|---------|
| **Nombre del Proyecto** | Qué quieres lograr o comprar | "Nueva laptop" |
| **Costo Total (Target)** | Cuánto cuesta en total | `1500` |
| **Ahorro Depositado (Allocated)** | Cuánto llevas ahorrado ya | `500` |
| **Etiqueta** | Categoría opcional | "Tech" |

Al guardar:
- El proyecto aparece **al instante** en la lista.
- El **Balance Disponible se recalcula automáticamente**, restando el monto que asignaste.

### Interpretar el avance de cada meta

Cada proyecto muestra su **porcentaje de progreso**:

```
Progreso = (Ahorro Depositado ÷ Costo Total) × 100
```

- Ejemplo: `500 ÷ 1500 = 33%`.
- Verás la barra de progreso, el monto ahorrado vs. el objetivo, y **cuánto te falta** para completarlo.
- El progreso se limita a 100% aunque ahorres de más.

### Gastos Fijos

En el panel lateral se listan todos tus gastos fijos con su categoría y monto. Su suma alimenta directamente el cálculo del Balance Disponible.

---

## 💡 Consejos de uso

- **Marca tus hábitos a diario** para que las tasas reflejen tu realidad.
- Usa la **vista mensual** una vez por semana para revisar tu constancia general.
- Mantén tu **ingreso y gastos fijos actualizados**: el Balance Disponible sólo es útil si los datos son reales.
- Crea proyectos concretos con un **costo total claro**; ver el porcentaje subir motiva a seguir ahorrando.

---

## ❓ Preguntas frecuentes

**¿Mis datos son privados?**
Sí. Cada usuario sólo ve y modifica sus propios datos; todas las consultas se filtran por tu usuario.

**¿Puedo usar la app sin crear cuenta?**
Sí, si el administrador activó el **Modo Usuario Único** (ver [DEPLOYMENT.md](./DEPLOYMENT.md)). En ese caso entras directo, sin login.

**¿Qué pasa si desmarco un hábito por error?**
Sólo vuelve a hacer clic; se actualiza al instante.

**¿El % de un hábito baja si me salto un día?**
Sí, porque la tasa es días completados sobre días del periodo. Al avanzar el periodo, marca tus días para mantenerla alta.

---

¿Necesitas instalar o publicar la app? Consulta la guía técnica en **[DEPLOYMENT.md](./DEPLOYMENT.md)**.
