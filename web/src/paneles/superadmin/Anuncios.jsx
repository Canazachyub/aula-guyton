// Anuncios del superadmin: globales (id_ciclo vacio) o por ciclo.
// Vista = bloque compartido GestionAnuncios con globales habilitados.

import GestionAnuncios from '../../componentes/GestionAnuncios.jsx'

export default function Anuncios() {
  return <GestionAnuncios permiteGlobal />
}
