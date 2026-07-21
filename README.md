# 🎓 ClassHub — Plataforma Unificada de Juegos Educativos

Plataforma web que integra **MecanoClass**, **RompeCódigos**, **H3L4D0S** y **MOON** bajo un único login y gestión de clases con integración de Google Classroom.

## 🚀 Configuración inicial

### 1. Crear el proyecto Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. **Nuevo proyecto** → ponle un nombre (ej: `classhub-tu-centro`)
3. **Authentication** → Iniciar sesión → Habilita:
   - ✅ Google
   - ✅ Correo electrónico/contraseña
4. **Firestore Database** → Crear base de datos → Modo producción
5. **Configuración del proyecto** → Tus apps → Añadir app Web (icono `</>`)
6. Copia los valores del `firebaseConfig`

### 2. Configurar credenciales

Edita el archivo `js/common/firebase-config.js` y reemplaza los placeholders:

```javascript
const firebaseConfig = {
  apiKey:            "TU_API_KEY",          // ← Tu valor real
  authDomain:        "TU_PROJECT.firebaseapp.com",
  projectId:         "TU_PROJECT_ID",
  storageBucket:     "TU_PROJECT.firebasestorage.app",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID"
};
```

### 3. Habilitar la API de Google Classroom

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Selecciona el proyecto de Firebase que acabas de crear
3. **APIs y servicios** → **Habilitar APIs** → Busca "Google Classroom API" → Habilitar
4. **APIs y servicios** → **Credenciales** → Editar el OAuth client ID:
   - Añade tu dominio de GitHub Pages a **Orígenes de JavaScript autorizados**
   - Ejemplo: `https://tu-usuario.github.io`

### 4. Aplicar reglas de Firestore

En la consola de Firebase, ve a **Firestore → Reglas** y copia el contenido de `firestore.rules`.

### 5. Configurar GitHub Pages

1. Crea un repositorio en GitHub con el nombre que quieras
2. Sube todo el contenido de esta carpeta
3. Ve a **Settings → Pages** → Selecciona la rama `main` y la carpeta raíz `/`
4. Tu URL será: `https://tu-usuario.github.io/nombre-repo/`
5. Añade esa URL a los orígenes autorizados de OAuth en Google Cloud Console

---

## 📁 Estructura del proyecto

```
/
├── index.html                    # Login unificado
├── dashboard_teacher.html        # Dashboard del docente
├── dashboard_student.html        # Dashboard del alumno
├── class_detail.html             # Gestión de clase (docente)
├── firestore.rules               # Reglas de seguridad Firestore
│
├── js/
│   ├── index.js                  # Lógica de login
│   ├── dashboard_teacher.js
│   ├── dashboard_student.js
│   ├── class_detail.js
│   └── common/
│       ├── firebase-config.js    # ⚠️ Pon aquí tus credenciales
│       ├── auth.js               # Autenticación unificada
│       ├── db.js                 # Capa de datos Firestore
│       ├── classroom.js          # Google Classroom API
│       ├── ui.js                 # Componentes UI comunes
│       └── utils.js              # Utilidades comunes
│
├── css/
│   ├── index.css
│   ├── dashboard_teacher.css
│   ├── dashboard_student.css
│   ├── class_detail.css
│   └── common/
│       ├── design-system.css     # Variables CSS globales
│       ├── reset.css             # Reset y estilos base
│       ├── layout.css            # Navbar, grid, layout
│       └── components.css        # Botones, cards, modals, etc.
│
├── mecanoclass/                  # Juego de mecanografía
│   ├── index.html                # Guard de acceso
│   ├── practice.html             # Práctica individual
│   ├── live_host.html            # Sesión en vivo (anfitrión)
│   ├── live_player.html          # Sesión en vivo (jugador)
│   ├── js/
│   │   ├── practice.js
│   │   ├── live_host.js
│   │   ├── live_player.js
│   │   ├── typing-engine.js      # Motor de mecanografía
│   │   └── initial_texts.js      # Textos de práctica
│   └── css/
│       └── mecanoclass.css
│
├── rompecodigos/                 # Juego de criptografía (multijugador)
│   ├── index.html                # Entrada (crear/unirse a sala)
│   ├── sala_profesor.html        # Panel del docente/organizador
│   ├── sala_alumno.html          # Vista del alumno
│   ├── js/
│   │   ├── index.js
│   │   ├── sala_profesor.js
│   │   ├── sala_alumno.js
│   │   └── cifrado.js            # Algoritmos de cifrado
│   └── css/
│       └── rompecodigos.css
│
├── helados/                      # Juego de helados
│   ├── index.html
│   ├── game.html
│   ├── js/
│   │   └── game.js
│   └── css/
│       └── helados.css
│
└── moon/                         # Juego espacial
    ├── index.html
    ├── game.html
    ├── tasks.html
    ├── js/
    │   ├── game.js
    │   └── tasks.js
    └── css/
        └── moon.css
```

---

## 🎮 Juegos incluidos

| Juego | Tipo | Modo |
|-------|------|------|
| ⌨️ **MecanoClass** | Mecanografía | Individual + Sesiones en vivo |
| 🔐 **RompeCódigos** | Criptografía | Multijugador en tiempo real |
| 🍦 **H3L4D0S** | Acción | Individual |
| 🌙 **MOON** | Plataformas | Individual |

---

## 👥 Flujo de uso

### Para el docente:
1. Entra en `index.html` → **Soy Docente** (login con Google + Classroom)
2. Crea una clase o importa desde Google Classroom
3. En la clase: activa los juegos que quieres usar
4. Comparte el PIN de 6 dígitos con tus alumnos
5. Crea tareas de Classroom para cada juego
6. Cuando los alumnos hayan jugado, sincroniza las notas a Classroom

### Para el alumno:
1. Entra en `index.html` → **Soy Alumno/a** (login con Google)
2. Introduce el PIN de tu clase para unirte
3. Verás los juegos que tu docente ha habilitado
4. ¡A jugar! Tus puntuaciones se guardan automáticamente

---

## 🔒 Seguridad

- Las reglas de Firestore garantizan que:
  - Los alumnos solo ven sus propias clases y resultados
  - Los profesores solo gestionan sus propias clases
  - Nadie puede modificar los resultados ya guardados
- El token de Google Classroom se guarda en memoria (no en localStorage)
- Si el token expira, el docente recibe un aviso para reautenticarse

---

## 🛠 Tecnologías

- **Frontend**: HTML + Vanilla CSS + Vanilla JavaScript (ES Modules)
- **Backend**: Firebase Firestore + Firebase Authentication
- **APIs externas**: Google Classroom API
- **Hosting**: GitHub Pages
- **Sin frameworks**: No React, no Vue, no Angular, no Tailwind
