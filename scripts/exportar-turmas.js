import fs from 'fs'
import xlsx from 'xlsx'

// 📄 carregar JSON das válidas
const data = JSON.parse(
  fs.readFileSync('./public/data/turmas.json', 'utf-8')
)

const turmas = data.turmas

// 📄 carregar JSON das descartadas
const descartadas = JSON.parse(
  fs.readFileSync('./public/data/descartadas.json', 'utf-8')
)

/**
 * 🔄 preparar dados (válidas)
 */
const linhas = turmas.map(t => ({
  Curso: t.curso,
  Departamento: t.departamento,
  Código: t.codigo,
  Disciplina: t.disciplina,
  Nome: t.nome,
  Período: t.periodo,
  Ano: t.ano,
  Turno: t.turno,
  Docente: t.docente,

  'CH Total': t.carga_horaria_total,
  'CH Semanal': Number(t.carga_horaria_semanal.toFixed(2)),
  Semanas: t.semanas,

  Vagas: t.vagas,
  'Vagas Calouros': t.vagas_calouros,
  'Vagas Veteranos': t.vagas_veteranos,
  'Encontro(s)': t.encontros
}))

/**
 * 🔄 preparar dados (descartadas)
 */
const linhasDescartadas = descartadas.map(t => ({
  Curso: t.Curso || t.curso,
  Departamento: t.Departamento || t.departamento,
  Código: t.Código || t.codigo,
  Disciplina: t.Disciplina || t.disciplina,
  Nome: t.Nome || t.nome,
  Período: t.Período || t.periodo,
  Ano: t.Ano || t.ano,
  Turno: t.Turno || t.turno,
  Docente: t.Docente || t.docente,

  'CH Total': t['CH Total'] || t.carga_horaria_total,
  'CH Semanal': t['CH Semanal'] ?? t.carga_horaria_semanal,
  Semanas: t.Semanas || t.semanas,

  Vagas: t.Vagas || t.vagas,
  'Vagas Calouros': t['Vagas Calouros'] || t.vagas_calouros,
  'Vagas Veteranos': t['Vagas Veteranos'] || t.vagas_veteranos,
  'Encontro(s)': t.Encontros || t.encontros,

  Motivo: t.Motivo || t.motivo
}))

/**
 * 📊 criar planilhas
 */
const worksheetValidas = xlsx.utils.json_to_sheet(linhas)
const worksheetDescartadas = xlsx.utils.json_to_sheet(linhasDescartadas)

/**
 * 📘 criar workbook
 */
const workbook = xlsx.utils.book_new()

xlsx.utils.book_append_sheet(workbook, worksheetValidas, 'Turmas')
xlsx.utils.book_append_sheet(workbook, worksheetDescartadas, 'Descartadas')

/**
 * 💾 salvar arquivo
 */
xlsx.writeFile(workbook, './data/turmas_exportadas.xlsx')

console.log('✅ Planilha exportada com sucesso (válidas + descartadas)!')