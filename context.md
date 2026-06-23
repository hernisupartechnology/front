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
| **Estado** | ✅ **MVP completo e implementado.** Verificado de extremo a extremo en navegador (Playwright) contra el backend real, con ambos roles (`admin` y `operador`) |

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
| Ítem de sidebar "Reportes Financieros" | ✅ visible | ❌ oculto (`_nav.jsx` filtra por `adminOnly`) |
| Ruta `/reportes/financiero` por URL directa | ✅ accede | ❌ `AdminRoute` redirige a `/dashboard` |
| Tarjetas de balance (ingresos/egresos/utilidad) en Dashboard | ✅ visibles | ❌ ocultas |
| Botones Crear/Editar/Eliminar en Productos | ✅ visibles | ❌ ocultos |
| Botón "Registrar egreso" en Flujo de Caja | ✅ visible | ❌ oculto |
| Registrar movimientos de Kardex (entrada/salida) | ✅ | ✅ (ambos roles) |
| Ver catálogo, alertas, kardex, flujo de caja | ✅ | ✅ (ambos roles) |

---

## 4. MAPA DE ARCHIVOS DEL FRONTEND (`/front/src`)

### Capa de servicios y autenticación
| Archivo | Responsabilidad |
|---|---|
| `services/api.js` | Instancia Axios (`baseURL: http://localhost:8000/api`). Interceptor de request inyecta `Authorization: Bearer {token}`. Interceptor de response: 401 → limpia sesión y redirige a `#/login` |
| `context/AuthContext.jsx` | `AuthProvider` + hook `useAuth()`. Expone `{ user, token, rol, login, logout }`. Persiste en `localStorage` |
| `components/ProtectedRoute.jsx` | Bloquea acceso si no hay `token` → redirige a `/login` |
| `components/AdminRoute.jsx` | Bloquea acceso si `rol !== 'admin'` → redirige a `/dashboard` |

### Routing y layout (archivos nativos de CoreUI, modificados quirúrgicamente)
| Archivo | Cambio aplicado |
|---|---|
| `index.jsx` | Envuelve `<App />` en `<AuthProvider>` |
| `App.jsx` | La ruta wildcard `*` (que renderiza `DefaultLayout`) está envuelta en `<ProtectedRoute>` |
| `_nav.jsx` | Ya **no** exporta un array estático por default. Exporta `getNavItems(rol)` (función) que filtra los ítems marcados con `adminOnly: true` cuando `rol !== 'admin'`. El `export default _nav` (array crudo) se mantiene por compatibilidad pero **no debe usarse directamente** en componentes — siempre usar `getNavItems(rol)` |
| `components/AppSidebar.jsx` | Consume `useAuth()` → `getNavItems(rol)` en vez de importar `_nav` directo |
| `components/AppContent.jsx` | `routes.js` soporta la propiedad `adminOnly: true` por ruta; si está presente, envuelve el `element` en `<AdminRoute>` |
| `components/header/AppHeaderDropdown.jsx` | El ítem "Lock Account" del template se reemplazó por "Cerrar sesión", conectado a `useAuth().logout()` |
| `routes.js` | Rutas nuevas: `/inventario/productos`, `/kardex/movimientos`, `/caja/flujo`, `/reportes/financiero` (esta última con `adminOnly: true`) |

### Vistas del MVP
| Carpeta | Vista | Notas clave |
|---|---|---|
| `views/dashboard/Dashboard.jsx` | Reemplaza el dashboard demo de CoreUI | Carga `/productos/alertas` y `/movimientos?per_page=5` para ambos roles; si `rol === 'admin'` añade `/reportes/financiero` del mes en curso para las tarjetas de balance |
| `views/inventario/Productos.jsx` + `ProductoForm.jsx` | Catálogo paginado + modal crear/editar | Paginación manual (Anterior/Siguiente) sobre `meta.current_page`/`meta.last_page` del paginador de Laravel. Botones de admin condicionados por `rol` |
| `views/kardex/Movimientos.jsx` + `MovimientoForm.jsx` | Kardex paginado con filtro por `tipo` + modal de registro | El combo de producto se carga con `per_page=100` (limitación conocida de MVP: catálogos >100 productos necesitarían un select con búsqueda) |
| `views/caja/FlujoCaja.jsx` + `EgresoForm.jsx` | Historial con filtros (`tipo`, `fecha_inicio`, `fecha_fin`) + modal de egreso (solo admin) | — |
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
| **Modales de formulario (Crear/Editar)** | Se montan **condicionalmente** desde el padre (`{modalVisible && <XForm ... />}`), nunca con un prop `visible` que se mantenga siempre montado. Así el estado inicial se deriva una sola vez con `useState(() => ...)` sin necesidad de un `useEffect` de "reset" (evita el problema de lint anterior y es más simple) |
| **Paginación** | Se consume el contrato estándar de Laravel: `response.data.data` (array) + `response.data.meta` (`current_page`, `last_page`, `total`, etc). No se usa `CPagination` con números de página — solo botones Anterior/Siguiente, suficiente para el MVP |
| **Formato de moneda** | `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })` o `Number(value).toLocaleString('es-CO')` con prefijo `$` manual, según el componente. El backend ya entrega los montos como string con 2 decimales fijos — no hacer aritmética de punto flotante en el front, solo formatear |
| **Errores de validación (422)** | Los formularios leen `err.response.data.errors` (objeto `{ campo: [mensajes] }` de Laravel) y lo pasan a `invalid`/`feedbackInvalid` de los componentes `CFormInput`/`CFormSelect` de CoreUI |
| **No tocar JSX/clases de CoreUI** | Al conectar `Login.jsx` al backend solo se agregaron `value`/`onChange`/`required` a los inputs existentes y un `CAlert` condicional — no se reescribió el layout visual de la plantilla |

---

## 7. ESTADO ACTUAL Y PRÓXIMOS PASOS

### ✅ FRONTEND COMPLETADO (100% del MVP planeado)
- [x] **Cliente API** (`services/api.js`) con interceptores de request (Bearer) y response (401 → logout)
- [x] **AuthContext** (`context/AuthContext.jsx`) con persistencia en `localStorage`
- [x] **Rutas protegidas**: `ProtectedRoute` (sesión) y `AdminRoute` (rol admin)
- [x] **Login real** conectado a `/api/login`, con manejo de error 422/401 vía `CAlert`
- [x] **Sidebar dinámico por rol** (`_nav.jsx` → `getNavItems(rol)`, consumido en `AppSidebar.jsx`)
- [x] **Logout funcional** desde el dropdown del header
- [x] **Dashboard real** con alertas de stock, últimos movimientos y balance mensual (solo admin)
- [x] **Módulo Inventario**: CRUD completo de productos con permisos por rol
- [x] **Módulo Kardex**: registro de movimientos (entrada/salida) con la convención de `motivo`
- [x] **Módulo Caja**: historial con filtros + egreso manual (solo admin)
- [x] **Módulo Reportes**: balance financiero por rango de fechas (solo admin, protegido a nivel de ruta)
- [x] **CORS configurado** en el backend (`back/config/cors.php`) para `http://localhost:3000`
- [x] **Build de producción** (`npm run build`) verificado sin errores
- [x] **Lint** (`npm run lint`) sin errores nuevos atribuibles a este trabajo (ver nota en sección 9)
- [x] **Verificación end-to-end en navegador real** (Playwright headless contra ambos servidores corriendo en local): login con credenciales válidas/inválidas, persistencia de sesión tras reload, redirect sin sesión, CRUD de productos, entrada/salida de Kardex (confirmando que `venta_*` genera ingreso en caja y `baja_*` no), egreso manual, logout, y todas las restricciones de rol para `operador` (sidebar, dashboard, redirect de ruta admin, botones ocultos)

### 🔜 Pendiente / fuera de alcance de este sprint (no implementado, decisión consciente)
- [ ] Select de producto con búsqueda en `MovimientoForm.jsx` (actualmente carga solo los primeros 100 productos vía `per_page=100`; suficiente para el MVP)
- [ ] `CPagination` numerada (actualmente solo Anterior/Siguiente)
- [ ] Vista de "Forgot password?" (el botón existe en `Login.jsx` por herencia de la plantilla, sin funcionalidad — no estaba en el alcance del MVP)
- [ ] Tests automatizados (unitarios/e2e). La verificación de esta sesión fue manual-asistida por Playwright, no quedó como suite reproducible en el repo

---

## 8. DECISIONES TÉCNICAS IMPORTANTES (No revertir sin consultar a Hernis)

1. **Puerto de Vite es 3000, no 5173.** `vite.config.mjs` ya traía `server.port: 3000` configurado de antes. `back/config/cors.php` se configuró para ese puerto real, no para el default de Vite.
2. **Axios ya estaba en `package.json`** (`^1.18.1`) antes de empezar — no fue necesario instalarlo.
3. **AuthProvider vive en `index.jsx`, no en `App.jsx`.** `App.jsx` solo consume `ProtectedRoute`. Esto evita que `App.jsx` mezcle responsabilidades de bootstrap de la app con las de routing.
4. **Redux (`store.js`) se mantiene exclusivo para UI** (`sidebarShow`, `theme`). El estado de autenticación vive 100% en `AuthContext`, deliberadamente desacoplado de Redux para no extender el store legacy (`legacy_createStore`) con lógica de negocio.
5. **`_nav.jsx` sigue exportando el array crudo por default** (compatibilidad), pero el consumo real de la app es siempre vía `getNavItems(rol)`. Si se agregan nuevos ítems de sidebar exclusivos de admin, marcarlos con `adminOnly: true`.
6. **Los modales de formulario se montan condicionalmente** (`{visible && <Form />}`) en vez de mantenerse siempre montados con un prop `visible`. Esto es una decisión de lint (regla `react-hooks/set-state-in-effect` del React Compiler), no solo de estilo — no revertir a "siempre montado + reset por `useEffect`" sin replantear el patrón de inicialización de estado.
7. **No existe `.prettierrc` en el repo.** Esto causa que `npm run lint` reporte cientos de errores `prettier/prettier` en **todo** el proyecto (incluyendo archivos del template nunca tocados, como `vite.config.mjs`) porque Prettier cae a comillas dobles por defecto contra un código base escrito en comillas simples. Es un problema preexistente y transversal, no introducido por el trabajo de este MVP — **no intentar "arreglarlo" tocando archivos al voleo**; si se decide resolver, debe ser una tarea explícita de crear `.prettierrc` y correr `prettier --write` sobre todo el repo de una vez.
