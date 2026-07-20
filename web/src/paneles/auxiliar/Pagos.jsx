// Pagos del auxiliar: ve todos, registra reportados y verifica/rechaza.
// NOTA: la matriz dice que el auxiliar verifica "solo si superadmin delega",
// pero el modelo no tiene campo para esa delegacion; la verificacion esta
// habilitada de forma provisional (GUIA_FRONTEND.md seccion 5 y comentario
// PENDIENTE en api/cliente.js). La vista es el bloque compartido GestionPagos.

import GestionPagos from '../../componentes/GestionPagos.jsx'

export default function Pagos() {
  return <GestionPagos />
}
