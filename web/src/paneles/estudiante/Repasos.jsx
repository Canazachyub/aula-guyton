// Repasos del estudiante: PLACEHOLDER. El banco de preguntas de opción múltiple
// está en diseño y todavía no se construye; esta pantalla solo anuncia que la
// zona llegará pronto. La mascota tipo fénix es PROVISIONAL y se rotula como tal
// en pantalla (regla de honestidad del proyecto: nada provisional se presenta
// como definitivo).

// El asset vive en public/. Se referencia con BASE_URL para que funcione en
// cualquier subruta de hosting (GitHub Pages) sin conocer el nombre del repo.
const MASCOTA = `${import.meta.env.BASE_URL}mascota-fenix-placeholder.svg`

export default function Repasos() {
  return (
    <div className="gy-bento">
      <div className="gy-bs-12">
        <section className="gy-repasos">
          <span className="gy-repasos-etiqueta">Próximamente</span>
          <h2 className="gy-repasos-titulo">La zona de repasos está en camino</h2>
          <p className="gy-repasos-texto">
            Muy pronto vas a poder practicar con preguntas de opción múltiple para
            reforzar cada curso y llegar bien preparado al examen de admisión.
            Todavía la estamos armando, así que aún no está disponible; apenas la
            activemos, la vas a encontrar en este mismo lugar.
          </p>

          <img
            className="gy-repasos-mascota"
            src={MASCOTA}
            alt="Mascota provisional de la Academia Guyton: un fénix estilizado"
            width="170"
            height="150"
          />
          <p className="gy-repasos-nota">
            Mascota provisional — la versión final se generará después.
          </p>
        </section>
      </div>
    </div>
  )
}
