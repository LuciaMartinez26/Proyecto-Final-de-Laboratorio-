# Programa_3_Galaxia
## Sistema Web Inteligente para la Gestión Académica y Seguimiento del Rendimiento Estudiantil

### Descripción
Versión **galaxy** del mismo sistema académico requerido por el Proyecto Final Integrador. Una experiencia académica inspirada en galaxias, estrellas y constelaciones.

### Tecnologías
- HTML5
- CSS3
- JavaScript ES6+
- Web Storage API: localStorage y sessionStorage
- Cookies del navegador
- RegExp
- Sin React, Angular, Vue, Bootstrap, jQuery ni base de datos externa.

### Ejecución
1. Descomprime el ZIP.
2. Abre `index.html` en un navegador moderno.
3. Pulsa **Entrar al sistema** o abre `login.html`.
4. Usuario demo: `admin`
5. Contraseña demo: `Admin123!`

No requiere servidor ni instalación de dependencias externas.

### Funcionalidades
Autenticación y registro, validaciones RegExp, fortaleza de contraseña, POO con `Persona`, `Estudiante`, `Curso` y `Administrador`, herencia, encapsulamiento mediante diseño de clases, prototipos, métodos estáticos/ públicos, arrays y sus métodos requeridos, Date/Math/Boolean/Function, CRUD local, búsquedas, dashboard, tablas dinámicas, cookies editables, sessionStorage, historial, contacto e importación/exportación JSON.

### GitHub y Netlify
El proyecto está preparado para GitHub y Netlify. Estos enlaces deben completarse al publicar:
- Repositorio GitHub: `PENDIENTE_DE_PUBLICAR`
- Sitio Netlify: `PENDIENTE_DE_PUBLICAR`

### Commits sugeridos
1. Estructura inicial.
2. Autenticación y validaciones.
3. Modelado POO y gestión de datos.
4. Dashboard, reportes y persistencia.
5. Diseño responsivo, pruebas y documentación.

### Estructura
`index.html`, `login.html`, `dashboard.html`, `css/estilos.css`, `js/app.js`, módulos documentales en `js/`, `assets/imagenes/` y `docs/informe.pdf`.

### Respaldo
Usa **Respaldo JSON → Exportar JSON** para guardar toda la información. **Importar JSON** permite restaurarla.

### Nota sobre el desafío de excelencia
La importación/exportación JSON respalda usuarios, estudiantes, cursos, historial y preferencias del sistema.

### Corrección de funcionamiento
- Se corrigió la inicialización del dashboard: el formulario de contacto ya no detiene la carga del resto del sistema.
- Se agregó un respaldo de sesión con `sessionStorage` para que la autenticación siga funcionando cuando el proyecto se abre directamente con `file://` en navegadores que limitan cookies locales.
- El cierre de sesión limpia tanto la cookie como el respaldo de sesión.
