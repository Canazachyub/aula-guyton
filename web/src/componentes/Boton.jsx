// Boton de la identidad Guyton. Variantes: primario (azul electrico), acento
// (naranja, solo llamadas a la accion), secundario, peligro.

export default function Boton({
  variante = 'primario',
  chico = false,
  bloque = false,
  type = 'button',
  children,
  ...resto
}) {
  const clases = ['gy-boton', `gy-boton--${variante}`]
  if (chico) clases.push('gy-boton--chico')
  if (bloque) clases.push('gy-boton--bloque')
  return (
    <button type={type} className={clases.join(' ')} {...resto}>
      {children}
    </button>
  )
}
