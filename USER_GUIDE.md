# 📖 Manual de Uso — LifeTracker

Bienvenido a **LifeTracker**, tu espacio para construir mejores hábitos y tomar el control de tus finanzas personales. Esta guía explica cómo funciona cada pantalla y qué significan las métricas que verás.

La app tiene estas secciones, accesibles desde el menú lateral (o la barra inferior en móvil):

- 🏠 **Dashboard** — resumen de todo
- 🔁 **Hábitos** — seguimiento diario y análisis
- 💰 **Finanzas** — balance, gastos, ahorro y metas
- 🗂️ **Proyectos** — (en construcción, próximamente)
- ⚙️ **Ajustes** — perfil, moneda y tus datos (también se abre con el icono de perfil, arriba a la derecha)
- ❓ **Soporte** — (en construcción)

---

## 🏠 Dashboard Principal

Es la pantalla de inicio. Te da una foto rápida de tu día y tu mes.

### Tarjetas de métricas (KPIs)

En la parte superior verás cuatro tarjetas:

| Tarjeta | Qué significa |
|---------|---------------|
| **Progreso de Hábitos** | Tu **tasa global** de cumplimiento de la semana actual (%). Incluye una barra de progreso visual. |
| **Balance Disponible** | El dinero que te queda libre este mes tras el ahorro, los gastos fijos y lo asignado a proyectos. |
| **Ahorro Protegido** | Tu ahorro mensual (el que definas, o el 20% del ingreso por defecto). |
| **Fondo de Proyecto Activo** | El total que has asignado (ahorrado) a tus metas. |

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
- El botón **"+ Añadir Hábito"** abre un modal donde defines:
  - **Nombre** del hábito (ej. "Meditar 10 min").
  - **Ícono** (elige entre varias opciones visuales).
- Con el botón rojo **"Quitar Hábito"** (junto a "Añadir Hábito") abres una lista de tus hábitos para **eliminar** el que quieras. Ojo: quitar un hábito borra también su historial.
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
Balance Disponible = Ingreso Mensual − Ahorro Mensual − Gastos Fijos − Asignaciones a Proyectos
```

- **Ingreso Mensual:** lo defines con el botón **"Ingreso mensual"**.
- **Ahorro Mensual:** el dinero que apartas cada mes (ver abajo). **Se descuenta del balance.**
- **Gastos Fijos:** cada gasto recurrente (renta, servicios, suscripciones…) que agregas con **"Gasto fijo"**.
- **Asignaciones a Proyectos:** el dinero que has apartado (ahorrado) para tus metas.

> Si el Balance Disponible aparece en **rojo**, significa que asignaste más de lo que tienes disponible: revisa tus gastos, tu ahorro o tus metas.

### Ahorro Mensual 🐷

Debajo de "Ingreso Mensual" verás la sección **"Ahorro Mensual"** (con el icono del chanchito):

- Por defecto, sugiere y descuenta el **20% de tu ingreso**.
- Con el botón **"Editar ahorro"** puedes poner el monto que quieras. El modal incluye un atajo para "Usar sugerencia (20%)".
- El ahorro **se resta automáticamente del Balance Disponible**.

### Moneda 💱

Tu moneda por defecto (**USD $** o **PEN S/**) se elige en **Ajustes → Moneda por Defecto** y se aplica a todos los montos de Finanzas.

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

> 🗑️ Para **quitar un proyecto**, usa el botón **"-"** en la esquina superior derecha de su tarjeta.

### Registrar el abono mensual (botón verde ➕)

Cada proyecto tiene un **botón verde con "+"**. El monto que pusiste en **"Monto a Ahorrar / Depositar Inicialmente"** es tu **abono mensual fijo**:

- Cada vez que pagas/ahorras ese mes, pulsa el **botón verde "+"** → el proyecto **avanza** ese monto y su **porcentaje sube**.
- Así ves de un vistazo **qué tanto te falta** para tu meta.
- Cuando el proyecto llega al **100%**, se marca **✓ Cumplido** automáticamente y **deja de descontar** de tu Balance Disponible (tu balance vuelve a subir). El proyecto queda visible como logro; puedes quitarlo cuando quieras.

### Interpretar el avance de cada meta

Cada proyecto muestra su **porcentaje de progreso**:

```
Progreso = (Ahorro Depositado ÷ Costo Total) × 100
```

- Ejemplo: `500 ÷ 1500 = 33%`.
- Verás la barra de progreso, el monto ahorrado vs. el objetivo, y **cuánto te falta** para completarlo.
- El progreso se limita a 100% aunque ahorres de más.

### Gastos Fijos

En el panel se listan todos tus gastos fijos con su categoría y monto. Su suma alimenta directamente el cálculo del Balance Disponible.

- Agrega uno con **"+ Gasto fijo"**.
- Con el botón **"Quitar Gasto"** (se pone rojo) abres una lista de tus gastos para **eliminar** el que quieras.

#### ✅ Marcar como pagado (doble clic / doble tap)

Puedes marcar cada gasto fijo como **"pagado"** para saber de un vistazo cuáles ya cubriste este mes:

- **En desktop:** haz **doble clic** sobre el gasto.
- **En móvil:** haz **doble tap** (dos toques rápidos) sobre el gasto.

Cuando un gasto está marcado como pagado:
- Su fondo se pone **verde** 🟢.
- El icono cambia a un **check** y el nombre se tacha.
- Aparece un badge "verificado" junto al monto.

Para **desmarcarlo**, simplemente vuelve a hacer doble clic/tap. El cambio es instantáneo (mutación optimista).

> 💡 Arriba de la sección "Gastos Fijos" verás un tip recordándote cómo funciona esta acción.

---

## ⚙️ Ajustes y Perfil

Se abre desde **Ajustes** en el menú o con el **icono de perfil** (arriba a la derecha).

- **Identidad:** tu nombre, correo y foto de perfil. Con **"Editar Perfil"** puedes:
  - **Cambiar tu nombre** → aparece en el saludo del Dashboard ("Hola, tu nombre") y en toda la app.
  - **Subir una foto de perfil** desde tu equipo. La app la **optimiza automáticamente** (la achica y comprime) para que ocupe muy poco. Puedes usar **AVIF (recomendado, más ligero)**, PNG, WebP o JPG. Tu foto se verá en el icono de perfil (arriba a la derecha) y en esta sección.
- **Moneda por Defecto:** elige **USD ($)** o **PEN (S/)**. Se aplica a todo Finanzas.
- **Gestión de Datos:**
  - **Exportar como JSON / CSV:** descarga una copia de todos tus datos (hábitos, finanzas, proyectos).
  - **Purgar Datos de Cuenta:** borra **de forma permanente** tus hábitos, gastos y proyectos. Pide confirmación escribiendo una palabra; **no se puede deshacer**.

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

## ✨ Novedades recientes

Estas son las mejoras más recientes de LifeTracker:

### ✅ Marcar gastos fijos como pagados

En la página de **Finanzas (edición)**, ahora puedes marcar cada gasto fijo como **pagado** con un **doble clic** (desktop) o **doble tap** (móvil):

- El gasto se pone con **fondo verde**, icono de check y texto tachado → sabes de un vistazo qué ya pagaste.
- Para desmarcar, vuelve a hacer doble clic/tap.
- Un tip verde arriba de la sección te recuerda cómo funciona.

### 💾 Guardar Finanza (cierre mensual)

En la página de Finanzas ahora tienes un botón **"Guardar Finanza"**. Al pulsarlo, se guarda un resumen/cierre del mes y te lleva a una nueva vista **"Finanzas del Mes"** donde verás:

- **KPIs del mes:** Ingreso Total, Gasto Fijo Total, Ahorro Neto y Balance Disponible.
- **Metas Activas:** tus proyectos con barras de progreso.
- **Categorías de Gastos:** anillo visual + tarjetas con el desglose por categoría.

Desde esa vista puedes volver a modificar datos con el botón **"Editar Finanza"**.

### 🗑️ Confirmación al borrar proyecto

Antes, al pulsar **"−"** en un proyecto se borraba de inmediato. Ahora aparece un popup de confirmación:

> *"¿Seguro que quieres borrar tu proyecto [nombre]?"*

- ✅ **Check verde** → confirma y borra.
- ❌ **X roja** → cancela y vuelve sin cambios.

Así evitas borrados accidentales.

### 📅 Tracker Semanal mejorado

Nuevo diseño más limpio y uniforme:

- Cada hábito se muestra en una **tarjeta** con su ícono en badge.
- El **día de hoy** aparece resaltado para ubicarte rápido.
- Las celdas tienen **mejor contraste**, más fáciles de leer.

### 🔒 Tracker Mensual: solo lectura

La vista Mensual ya **no permite marcar días** directamente. Solo refleja lo que marcas desde la vista Semanal.

- Incluye una **leyenda visual**: Completado / Pendiente / Fuera del mes.
- Muestra la nota: *"🔒 Solo lectura · marca desde Semanal"*.
- Al entrar, se **auto-selecciona la semana actual** del mes para que veas tu progreso al instante.

### 📊 Dashboard: Distribución Financiera mejorada

El gráfico de barras del Dashboard ahora incluye **5 barras**:

- **Ingresos** · **Fijos** · **Ahorro** · **Proyectos** · **Disponible**

Se eliminó la barra de "Proyecto destacado" que aparecía debajo. Ahora toda la info financiera está en un solo gráfico más completo.

### 📱 Responsive móvil en Hábitos

Los controles del módulo de Hábitos (toggle Semanal/Mensual, botones Quitar/Añadir Hábito) ya **no se desbordan en pantallas pequeñas**. Se adaptan correctamente al ancho del móvil.

### 🎨 Más iconos para tus hábitos

Al crear un hábito ahora puedes elegir entre **muchos más iconos** (más de 30): bienestar, estudio, ejercicio, alimentación, ocio y más. Si hay muchos, el selector tiene scroll para que los veas todos.

### 🏷️ Iconos para tus gastos fijos

Al añadir un **Gasto Fijo**, además de la categoría y el monto, ahora puedes elegir un **ícono** (casa, luz, agua, supermercado, auto, wifi, teléfono, etc.) para identificarlo de un vistazo en tu lista de gastos.

### 🧭 Navegación de Finanzas más clara

- Al pulsar **"Finanzas"** en el menú, vas directo a **"Finanzas del Mes"** (tu resumen guardado).
- Si aún **no has configurado nada**, la app te lleva directo a la vista de edición para que agregues tus ingresos, gastos y proyectos.
- Con **"Guardar Finanza"** guardas el cierre del mes y ves tu resumen; con **"Editar Finanza"** vuelves a modificar tus datos.
- Si **borras tus datos**, ya no aparece información vieja: la app te lleva a empezar de cero.

### 📈 Nuevas vistas de progreso en Hábitos

Además de **Semanal** y **Mensual**, ahora tienes dos vistas para ver tu progreso a largo plazo:

- **Trimestral** (últimos 3 meses) y **Semestral** (últimos 6 meses): muestran tu progreso **mes a mes** con barras de color, para que veas la tendencia y cuánto has mejorado.
- Color de las barras: 🟣 Consolidado (≥80%) · 🟠 En progreso (40–79%) · 🔴 En riesgo (<40%).

> 💡 Recuerda: los días solo se marcan desde la vista **Semanal**. Las demás vistas son de solo lectura y reflejan lo que ya marcaste.

### 💰 Historial de Ahorro Acumulado

La app ahora registra y muestra tu **ahorro acumulado mes a mes**:

- En **Finanzas** (edición): un mini-gráfico compacto debajo de "Ahorro Mensual" muestra cuánto llevas ahorrado.
- En **Finanzas del Mes** (resumen): un gráfico más amplio con barras por mes, promedio mensual y total acumulado.

**Reglas importantes:**
- Se registra **un solo valor por mes** (el último que guardaste con "Guardar Finanza"). Si editas varias veces, solo cuenta la última.
- Puedes editar el ahorro del mes **hasta el último día del mes**. Después de esa fecha, queda fijo en tu historial.
- La app te muestra cuántos días te quedan para editar el mes actual.

> 💡 Así evitas "ahorros falsos": solo se guarda lo definitivo de cada mes.

### 🎯 Más métricas en el Resumen

El panel de Resumen (ahora más grande) muestra, además de "Mejor Hábito" y "Por Mejorar", dos métricas nuevas:

- **Consolidados:** cuántos hábitos tienes bien afianzados (cumplimiento ≥ 80%).
- **En Riesgo:** cuántos necesitan atención (cumplimiento < 40%).

Así sabes de un vistazo cuántos hábitos van bien y cuántos deberías reforzar.

---

¿Necesitas instalar o publicar la app? Consulta la guía técnica en **[DEPLOYMENT.md](./DEPLOYMENT.md)**.
