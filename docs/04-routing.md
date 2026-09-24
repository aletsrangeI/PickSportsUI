# 04 Routing - PickSports.UI

## Enrutador Principal (React Router)
El enrutamiento se gestiona mediante `createBrowserRouter` o `<BrowserRouter>` con protección de rutas (`PrivateRoute`):

```text
/auth/login                 # Inicio de sesión
/auth/register              # Registro de nuevo usuario
/auth/forgot-password       # Recuperación de contraseña

# Rutas protegidas dentro de AppLayout:
/                           # Redirección a /picks o selección de quiniela
/picks                      # Jornada activa y emisión de pronósticos
/picks/history              # Histórico de pronósticos de jornadas anteriores
/standings                  # Tabla general de posiciones y desempates
/awards                     # Galardones semanales (MVP, Rey de Sorpresas, etc.)
/quinielas                  # Mis quinielas, crear nueva, unirse con código
/settings                   # Notificaciones Web Push y perfil de usuario
/admin                      # Gestión de ligas y sincronización ESPN (Rol Admin)
```

## Guardias y Persistencia de Sesión
- `PrivateRoute`: Si no hay token JWT válido en Redux o localStorage, redirige a `/auth/login`.
- `QuinielaGuard`: Si el usuario no pertenece a ninguna quiniela activa, lo redirige al flujo de bienvenida `/quinielas/join` para unirse o crear una.
