# GhostWords

**Entrena tu memoria con ocultación progresiva de palabras.**

Una webapp ligera, sin backend, diseñada para practicar memorización de textos mediante la técnica "ghosting": ocultamiento progresivo de palabras relevantes del contenido.

## 🚀 Acceso rápido

**[Abre GhostWords aquí](https://csernam.github.io/GhostWord/)**

O descarga los archivos y abre `index.html` en tu navegador.

## ✨ Características principales

- **Carga local de documentos**: Soporta Markdown (`.md`), texto plano (`.txt`), PDF y Word (`.docx`)
- **Drag & drop**: Arrastra archivos o toca el área de carga para seleccionar
- **Ocultación progresiva**: Reemplaza palabras relevantes con 👻 emoji
- **Slider de dificultad**: Ajusta el porcentaje de palabras ocultas (0-100%) en tiempo real
- **Dos modos de revelado**:
  - **Bloque**: Revela/oculta permanentemente un párrafo
  - **Párrafo**: Vista breve del bloque actual (1.5s) y vuelve al modo ghost
- **Long press**: Mantén pulsado un bloque para alternar su estado de revelado
- **Persistencia**: Guarda automáticamente tu progreso en localStorage
- **Modo examen**: Desactiva los controles de revelado para pruebas sin ayuda
- **Tema claro/oscuro**: Interfaz adaptable a tu preferencia visual
- **Responsivo**: Funciona perfectamente en móvil, tablet y escritorio

## 🎮 Cómo usar

### 1. Cargar un documento

- **Arrastra y suelta** un archivo (MD, TXT, PDF, DOCX) en el área de carga, o
- **Toca el área** para abrir el selector de archivos

### 2. Ajustar dificultad

Usa el slider "Ocultación" para controlar el porcentaje de palabras ocultas (0-100%).

### 3. Entrenar

- **Tooltip**: Toca brevemente una palabra oculta (👻) para ver la respuesta original
- **Vista rápida**: Presiona el botón "Vista rápida" para ver el párrafo completo durante 1.5s
- **Revelar bloque**: Alterna el estado de revelado del bloque actual
- **Mostrar todo**: Revela el documento completo

### 4. Long press (móvil/desktop)

Mantén pulsado en cualquier parte de un bloque (no en 👻) durante ~500ms para alternar su revelado sin perder la posición.

### 5. Modo examen

Activa "Modo examen" para desactivar todos los botones de revelado y crear una prueba sin ayuda.

## 🛠️ Tecnologías

- **HTML5 + CSS3 + JavaScript vanilla** (sin dependencias externas)
- **Marked.js**: Parseo de Markdown
- **PDF.js**: Extracción de texto de PDFs
- **Mammoth.js**: Lectura de documentos Word
- **localStorage**: Persistencia de datos locales

## 💾 Persistencia

La app guarda automáticamente:
- Documento cargado
- Porcentaje de ocultación
- Bloques revelados
- Posición de lectura
- Preferencia de tema
- Estado del modo examen

## 📱 Compatibilidad

- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Navegadores móviles modernos

## 🎯 Casos de uso

- Entrenar memorización de textos (artículos, poesía, fichas de estudio)
- Practicar lectura rápida con contexto
- Pruebas de retención sin ayuda (modo examen)
- Aprendizaje de idiomas

## ⚙️ Configuración local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/csernam/GhostWord.git
   cd GhostWord
   ```

2. Abre `index.html` en tu navegador:
   ```bash
   # Windows
   start index.html
   
   # macOS
   open index.html
   
   # Linux
   xdg-open index.html
   ```

3. ¡Carga un documento y comienza a entrenar!

## 📋 Notas técnicas

- **Sin servidor**: Toda la lógica ocurre en el navegador del usuario
- **Sin conexión**: Los datos nunca salen de tu dispositivo
- **Rendimiento**: Optimizado para textos largos
- **Stopword filtering**: Evita ocultar palabras de relleno (artículos, preposiciones)
- **Ancho proporcional**: El emoji 👻 ocupa espacio según la longitud de la palabra oculta

## 📝 Desarrollo

El proyecto está estructurado en tres archivos principales:
- `index.html`: Estructura y controles de la interfaz
- `styles.css`: Temas, layout responsivo y animaciones
- `app.js`: Lógica de carga, ghosting, persistencia e interacción

## 🐛 Limitaciones conocidas

- PDF/DOCX: La extracción de texto puede perder formatos complejos
- Offline: Funciona completamente offline sin problemas
- Storage: localStorage limita a ~5-10MB por navegador

## 📄 Licencia

MIT - Libre para usar, modificar y distribuir.

## 🤝 Contribuciones

¿Ideas o mejoras? Las PRs son bienvenidas.

---

**Disfruta entrenando tu memoria con GhostWords** 👻📚
