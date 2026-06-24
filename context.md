# 📑 MEMORY BANK — UPARCONTABLE (FRONTEND)
> **Propósito:** Context Bootstrap de una sola lectura. Al abrir este archivo, cualquier agente de IA o desarrollador Junior queda completamente en contexto sin revisar código. Actualizar este archivo al final de cada sesión de trabajo.
> **Última actualización:** 2026-06-23 · Hernis Mercado
> **Contraparte:** El backend tiene su propio Memory Bank en `/back/conext.md`. No duplicar aquí el detalle de endpoints/BD — solo lo que el Frontend necesita consumir.

---

## 1. RESUMEN EJECUTIVO

| Campo | Detalle |
|---|---|
| **Proyecto** | UparContable — MVP de Inventario y Contabilidad Básica |
| **Stack** | React 19 + plantilla CoreUI Free Admin Template (CoreUI React 5) + Vite 8 |
| **Filosofía** | Cero sobreingeniería. Scope Creep bloqueado. Código pedagógico para Junior. Respetar al máximo los componentes CoreUI ya existentes (intervención "quirúrgica") |
| **Idioma** | Todo el código, comentarios y documentación en **Español** |
| **Estado** | ✅ **MVP completo, implementado y con el template ya limpio de demo.** Verificado de extremo a extremo en navegador (Playwright) contra el backend real, con ambos roles (`admin` y `operador`) |

---

## 2. ARQUITECTURA DEL WORKSPACE

```
/UparContable
  ├── /back     → API RESTful (Laravel + Sanctum) — ver /back/conext.md
  └── /front    → SPA (React + CoreUI) — este archivo
```

**Regla de oro:** Nunca mezclar código del `/back` en `/front` ni viceversa. Siempre especificar la ruta exacta del archivo al generar código.

**Servidores en desarrollo:**
| Servicio | URL | Comando |
|---|---|---|
| Backend (API) | `http://localhost:8000/api` | `php artisan serve --port=8000` (desde `/back`) |
| Frontend (SPA) | `http://localhost:3000` | `npm run start` (Vite, desde `/front`; el script se llama `start`, **no** `dev`) |

> ⚠️ El puerto real de Vite es **3000** (definido en `vite.config.mjs`), no 5173 (el default de Vite). `back/config/cors.php` está configurado para `http://localhost:3000`.

---

## 3. AUTENTICACIÓN Y RBAC (CONTRATO CON EL BACKEND)

- **Mecanismo:** Laravel Sanctum, Bearer token plano (NO cookies/SPA-session, NO CSRF). El front solo necesita guardar el token y mandarlo en el header `Authorization`.
- **Login:** `POST /api/login` con `{ email, password }` → `{ access_token, token_type, user: { id, name, email, rol } }`. `rol` es el slug (`'admin'` | `'operador'`), ya viene calculado del backend — el front nunca decide el rol, solo lo lee.
- **Persistencia:** `localStorage` (`token`, `user`). Sobrevive recargas de página.
- **Logout:** `POST /api/logout` (revoca el token actual en el backend) + limpiar `localStorage`.
- **401 global:** el interceptor de `services/api.js` limpia la sesión y redirige a `#/login` automáticamente ante cualquier 401.
- **Credenciales de prueba** (sembradas en el backend): `admin@uparcontable.com` / `Admin@1234` (admin) y `operador@uparcontable.com` / `Oper@1234` (operador).

### Matriz de UI por rol (ya implementada)
| Elemento de UI | Admin | Operador |
|---|:---:|:---:|
| Submenú "Registro de Egresos" (Contabilidad) | ✅ visible | ❌ oculto (`_nav.jsx`, `adminOnly`) |
| Submenú "Reporte Financiero" (Contabilidad) | ✅ visible | ❌ oculto |
| Rutas `/caja/egresos` y `/reportes/financiero` por URL directa | ✅ accede | ❌ `AdminRoute` redirige a `/dashboard` |
| Tarjetas KPI "Total Ingresos" y "Utilidad Neta" en Dashboard | ✅ visibles | ❌ ocultas (solo ve "Total Productos" y "Alertas Activas") |
| Botones Crear/Editar/Eliminar en Productos (también en la vista de Alertas, que reusa el mismo componente) | ✅ visibles | ❌ ocultos |
| Botón "Registrar egreso" en Historial de Caja / Registro de Egresos | ✅ visible | ❌ oculto |
| Registrar movimientos de Kardex (entrada/salida) | ✅ | ✅ (ambos roles) |
| Ver catálogo, alertas, kardex, historial de caja | ✅ | ✅ (ambos roles) |

---

## 4. MAPA DE ARCHIVOS DEL FRONTEND (`/front/src`)

### Capa de servicios y autenticación
| Archivo | Responsabilidad |
|---|---|
| `services/api.js` | Instancia Axios (`baseURL: http://localhost:8000/api`). Interceptor de request inyecta `Authorization: Bearer {token}`. Interceptor de response: 401 → limpia sesión y redirige a `#/login` |
| `context/AuthContext.jsx` | `AuthProvider` + hook `useAuth()`. Expone `{ user, token, rol, login, logout }`. Persiste en `localStorage` |
| `components/ProtectedRoute.jsx` | Bloquea acceso si no hay `token` → redirige a `/login` |
| `components/AdminRoute.jsx` | Bloquea acceso si `rol !== 'admin'` → redirige a `/dashboard` |

### Routing y layout
| Archivo | Estado actual |
|---|---|
| `index.jsx` | Envuelve `<App />` en `<AuthProvider>` |
| `App.jsx` | La ruta wildcard `*` (que renderiza `DefaultLayout`) está envuelta en `<ProtectedRoute>`. Ya **no** importa `scss/examples.scss` (se borró, era demo) |
| `_nav.jsx` | Reescrito por completo: solo 4 entradas (`Dashboard`, `Inventario`, `Movimientos`, `Contabilidad`). Exporta `getNavItems(rol)`, que filtra ítems de primer nivel **y** de submenús marcados con `adminOnly: true`, y además limpia ese flag del objeto final (si no se limpia, `AppSidebarNav.jsx` lo esparce sobre el DOM y React tira un warning de prop desconocida) |
| `components/AppSidebar.jsx` | Sin cambios — sigue consumiendo `useAuth()` → `getNavItems(rol)` |
| `components/AppContent.jsx` | Sin cambios — `routes.js` soporta `adminOnly: true` por ruta; si está presente, envuelve el `element` en `<AdminRoute>` |
| `components/AppHeader.jsx` | Se quitaron los links demo "Users"/"Settings" (`href="#"`) y los íconos sin acción (campana, lista, sobre). Queda: toggler de sidebar, link real a Dashboard, theme switcher y `AppHeaderDropdown` |
| `components/header/AppHeaderDropdown.jsx` | Se quitaron todos los ítems demo (Updates/Messages/Tasks/Comments/Profile/Settings/Payments/Projects con badges falsos "42"). Queda un `CDropdownHeader` con nombre y rol del usuario actual (`useAuth().user`) + "Cerrar sesión" conectado a `useAuth().logout()` |
| `routes.js` | Limpio de demo. Rutas: `/`, `/dashboard`, `/inventario/productos`, `/inventario/alertas`, `/kardex/movimientos`, `/caja/flujo`, `/caja/egresos` (`adminOnly`), `/reportes/financiero` (`adminOnly`) |

### Patrón de "variante de ruta" (`/inventario/alertas` y `/caja/egresos`)
`routes.js` reutiliza `Productos.jsx` y `FlujoCaja.jsx` en dos rutas cada uno, pasándoles un prop distinto vía un wrapper `React.lazy` + `React.createElement` (este archivo es `.js`, no `.jsx`, por eso no usa sintaxis JSX directamente):
```js
const AlertasStock = React.lazy(() =>
  import('./views/inventario/Productos').then((m) => ({
    default: () => React.createElement(m.default, { soloAlertas: true }),
  })),
)
```
No se duplicó ningún componente. Si se necesita una tercera variante de una vista existente, seguir este mismo patrón en lugar de copiar el archivo.

### Vistas del MVP
| Carpeta | Vista | Notas clave |
|---|---|---|
| `views/dashboard/Dashboard.jsx` | 4 KPIs con `CWidgetStatsA` (Total Productos, Alertas Activas — ambos roles; Total Ingresos, Utilidad Neta — solo admin) + 2 tablas (alertas de stock, últimos movimientos) | `CWidgetStatsA` no tiene prop `icon` nativo (verificado en sus `.d.ts`): el ícono se embebe dentro del `value` como `<><CIcon .../>{valor}</>` |
| `views/inventario/Productos.jsx` + `ProductoForm.jsx` | Catálogo paginado + modal crear/editar. **Prop `soloAlertas` (default `false`)**: si es `true`, hace fetch a `/productos/alertas` (sin paginar) en vez de `/productos`, oculta los controles Anterior/Siguiente y cambia el título del header a "Alertas de Stock Bajo" | Botones de admin (Crear/Editar/Eliminar) se comportan igual en ambos modos |
| `views/kardex/Movimientos.jsx` + `MovimientoForm.jsx` | Kardex paginado con filtro por `tipo` + modal de registro | El combo de producto se carga con `per_page=100` (limitación conocida de MVP) |
| `views/caja/FlujoCaja.jsx` + `EgresoForm.jsx` | Historial con filtros (`tipo`, `fecha_inicio`, `fecha_fin`) + modal de egreso (solo admin). **Prop `tipoInicial` (default `''`)**: si es `'egreso'`, precarga el filtro de tipo en `'egreso'` (tanto el fetch inicial como el `<CFormSelect>`) y cambia el título del header a "Registro de Egresos" | El botón "Registrar egreso" y el modal `EgresoForm` son los mismos en ambas rutas |
| `views/reportes/ReporteFinanciero.jsx` | Selector de rango de fechas + 3 tarjetas (ingresos/egresos/utilidad neta) | Protegida a nivel de ruta por `AdminRoute`, no solo a nivel de UI |

---

## 5. CONVENCIÓN CRÍTICA: "VENTA" EN EL MOTIVO DEL MOVIMIENTO

Al registrar una **salida** de Kardex (`MovimientoForm.jsx`), si el campo `motivo` empieza con la palabra `venta` (case-insensitive, ej: `venta_factura_001`), el backend genera automáticamente un **ingreso** en el flujo de caja. Cualquier otro motivo de salida (ej: `baja_dano`) solo decrementa stock, sin tocar caja. El formulario muestra un texto de ayuda (`form-text`) que lo explica al usuario. **No hay un checkbox "es venta"** — la convención vive en el string del `motivo`, replicando exactamente la lógica de `MovimientoService.php` del backend.

---

## 6. PATRONES Y CONVENCIONES ESTABLECIDAS

> **Leer SIEMPRE antes de generar código nuevo.** Respetar estos patrones evita refactorizaciones y errores de lint.

| Patrón | Implementación |
|---|---|
| **Lint `react-hooks/set-state-in-effect`** | El proyecto tiene activa esta regla (React Compiler, `eslint-plugin-react-hooks@7`, ver `eslint.config.mjs`). **Prohibido** llamar `setState` síncronamente dentro de un `useEffect` (ni directo ni a través de una función nombrada que lo haga antes de un `await`). Patrón correcto para fetch inicial: `useState(true)` para loading inicial + función async inline en el efecto que solo hace `setState` **después** de un `await`/`.then()` |
| **Modales de formulario (Crear/Editar)** | Se montan **condicionalmente** desde el padre (`{modalVisible && <XForm ... />}`), nunca con un prop `visible` que se mantenga siempre montado. Así el estado inicial se deriva una sola vez con `useState(() => ...)` sin necesidad de un `useEffect` de "reset" |
| **Paginación** | Se consume el contrato estándar de Laravel: `response.data.data` (array) + `response.data.meta` (`current_page`, `last_page`, `total`, etc). No se usa `CPagination` con números de página — solo botones Anterior/Siguiente, suficiente para el MVP |
| **Formato de moneda** | `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })` o `Number(value).toLocaleString('es-CO')` con prefijo `$` manual, según el componente. El backend ya entrega los montos como string con 2 decimales fijos — no hacer aritmética de punto flotante en el front, solo formatear |
| **Errores de validación (422)** | Los formularios leen `err.response.data.errors` (objeto `{ campo: [mensajes] }` de Laravel) y lo pasan a `invalid`/`feedbackInvalid` de los componentes `CFormInput`/`CFormSelect` de CoreUI |
| **No tocar JSX/clases de CoreUI sin necesidad** | Los componentes visuales de CoreUI (`CCard`, `CTable`, `CWidgetStatsA`, etc.) se usan con su API documentada, sin reescribir su markup interno |
| **Reusar vista existente con un prop antes que duplicar** | Ver "Patrón de variante de ruta" en la sección 4 (`soloAlertas`, `tipoInicial`). Antes de crear una vista nueva, evaluar si una existente puede cubrir el caso con un prop opcional |

---

## 7. ESTADO ACTUAL Y PRÓXIMOS PASOS

### ✅ FRONTEND COMPLETADO (100% del MVP planeado + limpieza profunda del template)
- [x] **Cliente API**, **AuthContext**, **rutas protegidas** (`ProtectedRoute`/`AdminRoute`), **Login real**, **Logout funcional**
- [x] **Sidebar reducido a la IA del negocio**: Dashboard, Inventario (Catálogo + Alertas), Movimientos, Contabilidad (Historial + Egresos + Reporte) — sin rastro de Theme/Base/Buttons/Forms/Charts/Icons/Notifications/Widgets
- [x] **Dashboard con 4 KPIs reales** vía `CWidgetStatsA` (Total Productos, Alertas Activas, Total Ingresos*, Utilidad Neta*) — *solo admin
- [x] **Módulo Inventario**: CRUD completo de productos + vista dedicada de alertas de stock (mismo componente, prop `soloAlertas`)
- [x] **Módulo Kardex**: registro de movimientos (entrada/salida) con la convención de `motivo`
- [x] **Módulo Caja**: historial con filtros + vista dedicada de registro de egresos (mismo componente, prop `tipoInicial`)
- [x] **Módulo Reportes**: balance financiero por rango de fechas (solo admin, protegido a nivel de ruta)
- [x] **Header y dropdown del avatar limpios** de relleno de plantilla (sin links muertos, sin badges falsos "42")
- [x] **CORS configurado** en el backend (`back/config/cors.php`) para `http://localhost:3000`
- [x] **Build de producción** (`npm run build`) verificado sin errores — el bundle bajó de tener chunks de >1MB (Brands/Flags/Widgets demo) a solo los módulos del MVP
- [x] **Lint** sin errores nuevos atribuibles a este trabajo (ver nota sobre `.prettierrc` en sección 9)
- [x] **Verificación end-to-end en navegador real** (Playwright) en dos sesiones: la del MVP funcional (auth, CRUD, kardex venta/baja, caja, RBAC) y la de esta limpieza (sidebar reducido, rutas `/inventario/alertas` y `/caja/egresos`, KPIs del Dashboard, header sin relleno, rutas públicas `/login`/`/404`/`/500` intactas)

### 🔜 Pendiente / fuera de alcance (decisión consciente, no implementado)
- [ ] Select de producto con búsqueda en `MovimientoForm.jsx` (carga solo los primeros 100 productos vía `per_page=100`)
- [ ] `CPagination` numerada (actualmente solo Anterior/Siguiente)
- [ ] Vista de "Forgot password?" (botón existe en `Login.jsx`, sin funcionalidad)
- [ ] Tests automatizados (unitarios/e2e) como suite reproducible en el repo — la verificación fue manual-asistida por Playwright en cada sesión
- [ ] Prune de `@coreui/chartjs` / `@coreui/react-chartjs` / `chart.js` en `package.json` — quedaron **instaladas pero sin uso** tras borrar `Charts.jsx` y `MainChart.jsx` (decisión explícita del usuario: no tocar el lockfile en esta tarea)

---

## 8. LIMPIEZA PROFUNDA DEL TEMPLATE COREUI (sesión 2026-06-23)

El front nació del template CoreUI con todo su contenido de demo intacto, y el MVP se construyó **encima** sin removerlo. Esta sesión lo limpió por completo:

**Borrado (carpetas/archivos completos, confirmado sin referencias activas antes de borrar):**
`src/views/theme/`, `src/views/base/` (16 subcarpetas + `index.js` barrel ya huérfano), `src/views/buttons/`, `src/views/forms/`, `src/views/charts/`, `src/views/icons/`, `src/views/notifications/`, `src/views/widgets/`, `src/views/dashboard/MainChart.jsx`, `src/components/Docs{Components,Icons,Link,Example}.jsx`, `src/scss/examples.scss`.

**Si en el futuro hace falta un componente de ejemplo de CoreUI** (para ver cómo se usa algo), está en la documentación oficial de CoreUI React, no hace falta restaurarlo del repo.

**Lo que NO se tocó a propósito:**
- `package.json`/`package-lock.json` — las dependencias de gráficas quedaron instaladas (ver pendientes en sección 7).
- `AppBreadcrumb.jsx` — lee `routes.js` dinámicamente, sigue funcionando igual con la lista reducida de rutas, no necesitó cambios.
- `Login.jsx`, `Register.jsx`, `Page404.jsx`, `Page500.jsx` — son páginas reales de la app (no demo), se dejaron intactas.

---

## 9. DECISIONES TÉCNICAS IMPORTANTES (No revertir sin consultar a Hernis)

1. **Puerto de Vite es 3000, no 5173.** `vite.config.mjs` ya traía `server.port: 3000` configurado de antes. `back/config/cors.php` se configuró para ese puerto real, no para el default de Vite.
2. **Axios ya estaba en `package.json`** (`^1.18.1`) antes de empezar — no fue necesario instalarlo.
3. **AuthProvider vive en `index.jsx`, no en `App.jsx`.** `App.jsx` solo consume `ProtectedRoute`. Esto evita que `App.jsx` mezcle responsabilidades de bootstrap de la app con las de routing.
4. **Redux (`store.js`) se mantiene exclusivo para UI** (`sidebarShow`, `theme`). El estado de autenticación vive 100% en `AuthContext`, deliberadamente desacoplado de Redux para no extender el store legacy (`legacy_createStore`) con lógica de negocio.
5. **`getNavItems(rol)` limpia el flag `adminOnly` del objeto antes de devolverlo.** `AppSidebarNav.jsx` esparce todas las props "extra" del ítem directamente sobre el DOM (`<CNavLink {...rest}>`); si `adminOnly` no se limpia, React tira un warning de prop desconocida. Si se agrega un nuevo flag de filtrado a `_nav.jsx`, replicar este mismo patrón de limpieza.
6. **Los modales de formulario se montan condicionalmente** (`{visible && <Form />}`) en vez de mantenerse siempre montados con un prop `visible`. Esto es una decisión de lint (regla `react-hooks/set-state-in-effect` del React Compiler), no solo de estilo — no revertir a "siempre montado + reset por `useEffect`" sin replantear el patrón de inicialización de estado.
7. **Reutilizar componente + prop antes que duplicar vista.** `/inventario/alertas` y `/caja/egresos` reusan `Productos.jsx`/`FlujoCaja.jsx` (ver sección 4) en vez de tener su propio archivo. Decisión explícita del usuario para evitar duplicación de código en una IA de navegación más rica.
8. **No existe `.prettierrc` en el repo.** Esto causa que `npm run lint` reporte cientos de errores `prettier/prettier` en **todo** el proyecto (incluyendo archivos del template nunca tocados, como `vite.config.mjs`) porque Prettier cae a comillas dobles por defecto contra un código base escrito en comillas simples. Es un problema preexistente y transversal — **no intentar "arreglarlo" tocando archivos al voleo**; si se decide resolver, debe ser una tarea explícita de crear `.prettierrc` y correr `prettier --write` sobre todo el repo de una vez.
