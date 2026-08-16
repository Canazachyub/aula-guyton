// Isotipo de marca: el ave fénix con la "G" del logo real de la Academia
// Guyton, recortado como badge cuadrado. El asset vive en public/ y se
// referencia con BASE_URL para que funcione en cualquier subruta (GitHub Pages).

const ISOTIPO = `${import.meta.env.BASE_URL}isotipo-guyton.png`

export default function Isotipo({ tamano = 48 }) {
  return (
    <img
      className="gy-isotipo"
      src={ISOTIPO}
      alt="Isotipo de la Academia Preuniversitaria Guyton"
      width={tamano}
      height={tamano}
      style={{ width: tamano, height: tamano }}
    />
  )
}
