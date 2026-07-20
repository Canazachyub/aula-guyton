// Pantalla mínima provisional del Paso 1: solo verifica que la base visual
// (tokens, fuentes, gradiente de marca) está cargando. Se reemplaza por las
// rutas reales en el Paso 4.
function App() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--gy-gradiente)',
        color: 'var(--gy-blanco)',
        textAlign: 'center',
        padding: '1.5rem',
      }}
    >
      <div>
        <div
          title="Isotipo provisional - el logo real está pendiente"
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 1.25rem',
            borderRadius: 'var(--gy-radio-l)',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '2px dashed rgba(255, 255, 255, 0.55)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--gy-fuente-titulos)',
            fontWeight: 800,
            fontSize: '2rem',
          }}
        >
          G
        </div>
        <h1 style={{ color: 'var(--gy-blanco)', fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' }}>
          Aula Virtual — Academia Guyton
        </h1>
        <p style={{ marginTop: '0.75rem', opacity: 0.85 }}>
          Base visual lista. Frontend en construcción (entorno DEMO).
        </p>
      </div>
    </main>
  )
}

export default App
