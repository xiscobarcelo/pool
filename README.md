# 📁 Pool Tracker

## 📋 Estructura del Proyecto

```
/
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


## 🚀 Beneficios

1. **Mantenibilidad**: Cambios en estilos comunes se aplican a todas las páginas
2. **Organización**: Código separado por responsabilidad
3. **Reutilización**: CSS y JS comunes no se duplican
4. **Debugging**: Más fácil encontrar y corregir errores
5. **Colaboración**: Varios desarrolladores pueden trabajar en diferentes archivos
6. **Performance**: Los navegadores pueden cachear archivos CSS/JS separados
7. **Escalabilidad**: Fácil añadir nuevas páginas usando los mismos estilos


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
