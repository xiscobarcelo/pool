# 📁 Proyecto Separado - Pool Tracker

## 📋 Estructura del Proyecto

```
proyecto-separado/
├── css/
│   ├── styles-common.css          # Estilos compartidos (header, nav, layout)
│   ├── styles-estadisticas.css    # Estilos específicos de estadísticas
│   └── styles-registro.css        # Estilos específicos de registro
├── js/
│   ├── common.js                  # Funciones compartidas (menú, logout, etc.)
│   ├── estadisticas.js            # Lógica de estadísticas (a crear)
│   └── registro.js                # Lógica de registro (a crear)
└── html/
    ├── estadisticas.html          # HTML limpio de estadísticas (a crear)
    └── registro-partidos.html     # HTML limpio de registro (a crear)
```

## 🎯 Ventajas de esta Estructura

### ✅ Antes (Archivos Monolíticos)
- **estadisticas.html**: 3,125 líneas (todo mezclado)
- **registro-partidos.html**: 2,409 líneas (todo mezclado)
- **Total**: 5,534 líneas difíciles de mantener

### ✨ Después (Archivos Separados)
- **CSS común**: ~200 líneas (reutilizable)
- **CSS específico estadísticas**: ~450 líneas
- **CSS específico registro**: ~650 líneas
- **JavaScript común**: ~50 líneas (reutilizable)
- **HTML limpio**: ~150 líneas cada uno (solo estructura)

## 📝 Descripción de los Archivos

### CSS

#### `styles-common.css`
Contiene todos los estilos compartidos entre páginas:
- Reset CSS básico
- Estilos del body y layout principal
- Header y navegación (desktop y móvil)
- Menú hamburguesa
- Menú lateral móvil
- Container y estructura básica
- Media queries responsive comunes

#### `styles-estadisticas.css`
Estilos específicos de la página de estadísticas:
- Loading spinner
- Tarjetas de estadísticas (stat-cards)
- Gráficos (charts)
- Tablas de partidos
- Selectores de jugadores
- Comparativas
- Paginación
- Animaciones

#### `styles-registro.css`
Estilos específicos de la página de registro:
- Formularios (form-card)
- Inputs y selects
- Botones
- Chips de materiales
- Sección de historial
- Tablas
- Mensajes de éxito/error
- Import/Export
- Info collapsible

### JavaScript

#### `common.js`
Funciones compartidas entre páginas:
- `toggleMenu()` - Abrir/cerrar menú móvil
- `toggleInfo()` - Abrir/cerrar secciones desplegables
- `logout()` - Cerrar sesión
- Event listeners comunes

## 🔧 Cómo Implementar

### Paso 1: Crear los HTML limpios

En cada archivo HTML, reemplazar la sección `<style>` y `<script>` con:

**Para estadisticas.html:**
```html
<head>
    <!-- ... otros meta tags ... -->
    <link rel="stylesheet" href="../css/styles-common.css">
    <link rel="stylesheet" href="../css/styles-estadisticas.css">
</head>
<body>
    <!-- ... contenido HTML ... -->
    
    <script src="../js/common.js"></script>
    <script src="../js/estadisticas.js"></script>
</body>
```

**Para registro-partidos.html:**
```html
<head>
    <!-- ... otros meta tags ... -->
    <link rel="stylesheet" href="../css/styles-common.css">
    <link rel="stylesheet" href="../css/styles-registro.css">
</head>
<body>
    <!-- ... contenido HTML ... -->
    
    <script src="../js/common.js"></script>
    <script src="../js/registro.js"></script>
</body>
```

### Paso 2: Extraer el JavaScript

Los archivos `estadisticas.js` y `registro.js` deben contener todo el código JavaScript que estaba dentro de las etiquetas `<script>` en los HTML originales, **excepto** las funciones que ya están en `common.js`.

## 🚀 Beneficios

1. **Mantenibilidad**: Cambios en estilos comunes se aplican a todas las páginas
2. **Organización**: Código separado por responsabilidad
3. **Reutilización**: CSS y JS comunes no se duplican
4. **Debugging**: Más fácil encontrar y corregir errores
5. **Colaboración**: Varios desarrolladores pueden trabajar en diferentes archivos
6. **Performance**: Los navegadores pueden cachear archivos CSS/JS separados
7. **Escalabilidad**: Fácil añadir nuevas páginas usando los mismos estilos

## 📦 Próximos Pasos

1. Crear `estadisticas.js` con el código JavaScript de estadísticas
2. Crear `registro.js` con el código JavaScript de registro
3. Crear los HTML limpios sin CSS ni JS inline
4. Probar que todo funcione correctamente
5. (Opcional) Minificar CSS y JS para producción

## 🔗 Orden de Carga Recomendado

```html
<!-- CSS: Primero común, luego específico -->
<link rel="stylesheet" href="css/styles-common.css">
<link rel="stylesheet" href="css/styles-[pagina].css">

<!-- JS: Primero común, luego específico -->
<script src="js/common.js"></script>
<script src="js/[pagina].js"></script>
```

## ⚠️ Notas Importantes

- Los archivos CSS deben cargarse en el `<head>`
- Los archivos JS deben cargarse al final del `<body>` (antes de `</body>`)
- Verificar que las rutas relativas sean correctas según la estructura de carpetas
- Probar en diferentes navegadores y dispositivos

## 🎨 Personalización

Para personalizar los estilos:
1. Edita `styles-common.css` para cambios globales
2. Edita archivos específicos para cambios de página
3. Los colores principales están definidos como valores directos (fácil buscar y reemplazar)

## 📧 Soporte

Si tienes dudas sobre la implementación o necesitas ayuda, revisa los comentarios en cada archivo CSS y JS.
