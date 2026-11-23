# Ruta de Mates

App para que Manyl y Lamine repasen Matemáticas CCSS II (2º Bach) por su cuenta y Pau les corrija.

- **Alumnos:** cada examen es una ruta de hasta 12 paradas. En cada ejercicio suben foto, dificultad y tiempo. Al final eligen una carita y entregan. Tienen monigote personalizable, niveles, cofres por bloque y una vitrina de premios.
- **Profe:** panel de los dos, corrección encima de la foto (boli, bien, mal, rodear, texto), nota por ejercicio, nota final, comentario y «repasa…». También tiene evolución y la opción de archivar un examen y empezar el siguiente.
- **Técnica:** una sola página (`public/index.html`) en Firebase Hosting, con datos en Firestore e inicio de sesión con Google. Es una PWA que se instala en Android e iPhone. Funciona con el **plan gratuito (Spark)**: las fotos y los PDF se guardan comprimidos dentro de Firestore, sin Cloud Storage.

## Puesta en marcha (una vez)

1. **Crea el proyecto** en https://console.firebase.google.com: «Añadir proyecto», sin Google Analytics. Se queda en el plan Spark (gratis).
2. **Firestore:** menú *Firestore Database* → *Crear base de datos* → modo **producción** → región `eur3` (o `europe-southwest1`, Madrid).
3. **Login con Google:** *Authentication* → *Comenzar* → *Sign-in method* → **Google** → habilitar → elige el correo de asistencia → guardar.
4. **App web:** *Configuración del proyecto* (rueda) → *Tus apps* → icono `</>` → ponle de nombre «Ruta de Mates» → registrar. Copia el objeto `firebaseConfig` en `public/firebase-config.js`.
   - **Importante para iPhone:** en `authDomain` cambia `TU-PROYECTO.firebaseapp.com` por `TU-PROYECTO.web.app`. Si no, el login puede fallar en la app instalada en iOS.
5. En `.firebaserc` cambia `PON-AQUI-EL-ID-DE-TU-PROYECTO` por el ID del proyecto (sale en la configuración).
6. **Publica** desde tu ordenador, en la carpeta del repo:
   ```bash
   npm install -g firebase-tools
   ```
   ```bash
   firebase login
   ```
   ```bash
   firebase deploy --only hosting,firestore
   ```
   Al acabar te da la dirección: `https://TU-PROYECTO.web.app`.

## Primer uso

1. **Pau entra primero** con su Google y elige «Soy el profe». Hasta que no lo haga, los demás no pueden elegir perfil.
2. En el Panel, pulsa **«Cargar el Examen de repaso 1»**: sube el examen (solo enunciados), la guía de repaso y los 12 ejercicios.
3. Manda el enlace a Manyl y Lamine. Cada uno entra con su Google y elige su nombre **una sola vez**; queda guardado con su cuenta. Sus correos los ves en *Gestión → Cuentas*, y desde ahí puedes desvincular si alguien se equivoca.
4. Cualquier otra cuenta que entre verá «Esta ruta ya está completa» y no podrá leer nada.

## Instalar en el móvil

- **Android (Chrome):** abre el enlace → botón «Instalar app» de la propia app, o menú ⋮ → «Instalar aplicación».
- **iPhone (Safari):** abre el enlace → Compartir → «Añadir a pantalla de inicio». La app tiene un botón «Instalar app» que lo explica.

## Actualizar la app

Cambia lo que sea en `public/` y vuelve a ejecutar `firebase deploy --only hosting`. Los móviles cogen la versión nueva al volver a abrirla.

## Seguridad (`firestore.rules`)

- Solo el profe cambia exámenes, notas, marcas, PDF e historial.
- Cada alumno solo escribe lo suyo: respuestas, fotos, monigote y premios.
- Cada alumno solo puede leer **su** nota y solo cuando el profe la ha enviado.
- Los correos de las cuentas solo los ve el profe.

Las pruebas de las reglas están en `tests/rules.test.cjs` (necesitan Java para el emulador):

```bash
npm install
```
```bash
npm run test:rules
```

## Límites del plan gratuito

Spark permite 50.000 lecturas y 20.000 escrituras al día y 1 GiB de datos. Cada foto ocupa entre 150 y 700 KB, y un examen completo de los dos, unos 15–30 MB. Al archivar una prueba se borran sus fotos, así que hay sitio para todo el curso.
