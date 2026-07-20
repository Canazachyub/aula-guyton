# Identidad Visual — Academia Guyton

Este documento recoge el branding **tal como lo entregó el usuario**. Ninguna decisión de
diseño aquí es una invención del equipo: donde falta un dato real, se marca explícitamente como
pendiente en vez de rellenarlo con una suposición.

## Paleta de colores

| Nombre | Hex | Variable CSS sugerida | Uso previsto |
|---|---|---|---|
| Azul noche | `#050B2B` | `--gy-azul-noche` | Fondos oscuros, header, footer |
| Azul real | `#0829B8` | `--gy-azul-real` | Color primario de marca |
| Azul eléctrico | `#145CFF` | `--gy-azul-electrico` | Acentos interactivos, links, hover |
| Naranja Guyton | `#FF4A18` | `--gy-naranja` | Color de acento / llamadas a la acción, ligado al isotipo |
| Blanco | `#FFFFFF` | `--gy-blanco` | Texto sobre fondo oscuro, fondos claros |
| Superficie | `#EDF2F7` | `--gy-superficie` | Fondos de tarjetas/paneles en modo claro |
| Gris | `#64748B` | `--gy-gris` | Texto secundario, bordes, estados deshabilitados |

```css
:root {
  --gy-azul-noche: #050B2B;
  --gy-azul-real: #0829B8;
  --gy-azul-electrico: #145CFF;
  --gy-naranja: #FF4A18;
  --gy-blanco: #FFFFFF;
  --gy-superficie: #EDF2F7;
  --gy-gris: #64748B;

  --gy-gradiente: linear-gradient(135deg, var(--gy-azul-noche), var(--gy-azul-real), var(--gy-azul-electrico));
}
```

**Gradiente de marca:** 135°, azul noche → azul real → azul eléctrico. Pensado para héroes de
landing, fondos de secciones destacadas y posiblemente el splash de carga del aula.

## Tipografías propuestas

- **Títulos:** Montserrat ExtraBold o Anton (ambas de peso muy alto, para titulares de
  landing y encabezados de sección — no confirmado cuál de las dos, o si se usará una según
  contexto: Anton para titulares muy grandes, Montserrat ExtraBold para subtítulos).
- **UI / texto de interfaz:** Inter o Poppins (para el aula, formularios, tablas — legibilidad
  en pantalla por encima de personalidad).

Ambos pares están **propuestos**, no confirmados por el usuario como decisión final. Se listan
aquí para que el frontend de la Fase 3 tenga un punto de partida, no como especificación
cerrada.

## Isotipo

Descripción dada por el usuario: un ave de color naranja combinada con la letra "G", con
posible lectura de fénix o águila — **sin confirmar cuál de las dos** (o si es otra ave). No
existe hoy un archivo vectorial del isotipo; todo lo que hay es esta descripción textual.

**Nota importante de identidad de marca:** no se debe forzar una lectura andina/vicuña sobre
esta mascota. Es una decisión explícita del usuario para la marca de este proyecto — a
diferencia de la mascota de otro proyecto del mismo usuario (el "lobito estudioso" de
SimulaUNA, que tampoco es una vicuña ni lleva simbología andina impuesta), aquí tampoco corresponde
introducir esa lectura sin que el usuario la pida. El ave naranja de Guyton se trabaja como lo
que es — un ave estilizada con la "G" — sin añadirle una narrativa cultural que nadie pidió.

## Lema

**"Asegura tu ingreso"** — pensado para la landing promocional y materiales de captación
(examen de admisión universitaria).

## Dirección visual

"Academia moderna + estética competitiva": la combinación de azules profundos con el naranja de
acento y tipografía de titulares muy pesada busca transmitir seriedad académica sin caer en lo
soso — algo más cercano a la energía de una marca deportiva o de preparación competitiva que a
un colegio tradicional. El gradiente diagonal refuerza esa sensación de movimiento/avance,
coherente con el lema.

## Usos previstos del isotipo (una vez exista el vectorial)

- Favicon y logo de header del aula y la landing.
- Marca de agua discreta en materiales descargables (PDFs de práctica/teoría), para
  identificar el origen sin interferir con el contenido.
- Ícono de splash/carga.

Estos son usos **previstos**, a definir con más detalle cuando el archivo vectorial exista y se
pueda ver cómo escala en tamaños pequeños (favicon) vs. grandes (header de landing).

## Regla de honestidad

Nada de esta identidad visual se presenta como terminado si no lo está. Estado real hoy:

| Recurso | Estado |
|---|---|
| Paleta de colores | Confirmada por el usuario |
| Gradiente | Confirmado por el usuario |
| Lema | Confirmado por el usuario |
| Tipografías | Propuestas, no confirmadas |
| Isotipo (concepto: ave naranja + "G") | Descrito, no confirmado qué ave exactamente |
| Isotipo (archivo vectorial) | No existe todavía |
| Fotos autorizadas de la academia | No existen todavía |
| Dominio | No definido todavía |

Cualquier mockup o pieza que se produzca en fases futuras usando colores/gradiente reales pero
un isotipo de marcador de posición (placeholder) debe decirlo explícitamente como tal, para que
nadie confunda un boceto con el logo final.
