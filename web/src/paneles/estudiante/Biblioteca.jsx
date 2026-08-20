// Biblioteca Guyton: la app de biblioteca vive en NUESTRO propio dominio
// (web/public/biblioteca/, servida en /biblioteca/) y se embebe aqui. Al ser
// del mismo origen, no expone ningun enlace externo ni saca al alumno del aula.
export default function Biblioteca() {
  return (
    <div className="gy-biblioteca">
      <iframe
        className="gy-biblioteca-marco"
        src={`${import.meta.env.BASE_URL}biblioteca/index.html`}
        title="Biblioteca Guyton"
      />
    </div>
  )
}
