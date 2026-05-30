# Escuela Dominical · El Divino Redentor

App web progresiva (PWA) para control de asistencia, lectura bíblica y peso misionero.

## Requisitos
- Node.js 18+
- Cuenta en Supabase (base de datos)
- Cuenta en Vercel (hosting)
- Cuenta en GitHub (código)

## Configuración

1. Copia `.env.example` como `.env`
2. Llena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` desde Supabase → Settings → API
3. Ejecuta el script SQL en Supabase SQL Editor

## Instalación local
```bash
npm install
npm run dev
```

## Despliegue en Vercel
1. Sube este código a GitHub
2. En Vercel → Import Project → selecciona el repositorio
3. Agrega las variables de entorno en Vercel → Settings → Environment Variables
4. Vercel despliega automáticamente

## Crear el primer usuario administrador
1. En Supabase → Authentication → Users → Invite user (correo del administrador)
2. El administrador recibe el correo, crea su contraseña
3. En Supabase → SQL Editor ejecuta:
```sql
INSERT INTO perfiles (id, nombre, clase_id, rol)
VALUES ('UUID_DEL_USUARIO', 'Nombre Admin', 1, 'admin');
```
(El UUID lo obtienes en Supabase → Authentication → Users)

## Estructura
- `src/pages/Login.jsx` — Pantalla de inicio de sesión
- `src/pages/Dashboard.jsx` — Inicio / resumen del día
- `src/pages/MiClase.jsx` — Registro por maestro (asistencia, capítulos, peso misionero)
- `src/pages/ReporteDominical.jsx` — Reporte consolidado (admin)
- `src/pages/Miembros.jsx` — Alta/baja de miembros (admin)
- `src/pages/Estadisticas.jsx` — Gráficas del periodo
- `src/pages/Configuracion.jsx` — Periodos, semanas y usuarios (admin)
