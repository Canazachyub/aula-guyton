// Anuncios del auxiliar: publica solo POR CICLO (los globales son del
// superadmin; la capa de datos lo refuerza). Vista = bloque compartido.

import GestionAnuncios from '../../componentes/GestionAnuncios.jsx'

export default function Anuncios() {
  return <GestionAnuncios permiteGlobal={false} />
}
