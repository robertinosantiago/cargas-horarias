import fs from 'fs'
import path from 'path'
import xlsx from 'xlsx'

// 📄 caminho fixo do arquivo
const caminho = path.resolve('./data/disciplinas/disciplinas-campus.xlsx')

// ler planilha
const workbook = xlsx.readFile(caminho)
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const dados = xlsx.utils.sheet_to_json(sheet, { defval: '' })

let disciplinas = []

dados.forEach(linha => {
  const codigo = linha['Código']?.toString().trim()
  if (!codigo) return

  const coordenacoes = linha['Coordenações vinculadas']
    ? linha['Coordenações vinculadas']
        .split(',')
        .map(c => c.trim())
    : []

  disciplinas.push({
    codigo,
    nome: linha['Nome']?.trim(),
    ch_total: Number(linha['CH Total']) || 0,
    ch_padrao: Number(linha['CH Padrão']) || 0,
    ch_lab: Number(linha['CH Laboratório']) || 0,
    ch_campo: Number(linha['CH Campo']) || 0,
    coordenacoes,
    lingua: linha['Língua']?.trim()
  })
})

/**
 * remover duplicados
 */
const mapa = {}
disciplinas.forEach(d => {
  mapa[d.codigo] = d
})

disciplinas = Object.values(mapa)

/**
 * ordenar
 */
disciplinas.sort((a, b) => a.codigo.localeCompare(b.codigo))

/**
 * salvar
 */
fs.writeFileSync(
  './public/data/disciplinas.json',
  JSON.stringify(disciplinas, null, 2)
)

console.log('✅ Disciplinas importadas com sucesso!')