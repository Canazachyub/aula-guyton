// Heroe de los Inicio: banda con el gradiente de marca y arte geometrico
// (circulos, cuadrados y lineas — NUNCA un ave ni una mascota inventada;
// el isotipo real esta pendiente, ver IDENTIDAD_VISUAL.md).

export default function Heroe({ micro = 'Aula Virtual', titulo, sub, children }) {
  return (
    <section className="gy-heroe">
      <div className="gy-heroe-contenido">
        <p className="gy-micro gy-micro--claro">{micro}</p>
        <h2 className="gy-heroe-titulo">{titulo}</h2>
        {sub && <p className="gy-heroe-sub">{sub}</p>}
        {children}
      </div>
      <svg
        className="gy-heroe-arte"
        viewBox="0 0 210 210"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="150" cy="60" r="46" stroke="rgba(255,255,255,0.25)" strokeWidth="10" />
        <circle cx="150" cy="60" r="20" fill="rgba(255,255,255,0.14)" />
        <rect x="30" y="118" width="62" height="62" rx="16" fill="rgba(255,255,255,0.14)" />
        <rect x="118" y="128" width="52" height="52" rx="14" fill="#FF4A18" opacity="0.9" />
        <path d="M20 60h44" stroke="rgba(255,255,255,0.3)" strokeWidth="8" strokeLinecap="round" />
        <path d="M20 84h28" stroke="rgba(255,255,255,0.18)" strokeWidth="8" strokeLinecap="round" />
      </svg>
    </section>
  )
}
