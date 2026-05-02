import fs from 'fs'
import path from 'path'
import xlsx from 'xlsx'

// 📁 pasta com as planilhas
const pasta = path.resolve('./data/turmas')

// 📄 carregar disciplinas
const disciplinas = JSON.parse(
  fs.readFileSync('./public/data/disciplinas.json', 'utf-8')
)

// mapa para busca rápida
const mapaDisciplinas = Object.fromEntries(
  disciplinas.map(d => [d.codigo, d])
)

const descartadas = []

const situacoesIgnoradas = ['Inativada'];

// disciplinas a ignorar
const ignorarCodigos = [
  //Estagios e TCC LCO
  'JLC018', 'JLC018A', 'JLC019', 'JLC021', 'JLC022', 'JLC045', 'JLC067',
  //Estagios e TCC Alimentos
  'JAL031', 'JAL030',
  //Estagios e TCC Produção
  'JEP025', 'JEP025A', 'JEP044', 'JEP044A',
  //TCC Exatas
  'JCE047', 'JCE052',
  //Estagios e TCC Agricola
  'JAG044', 'JAG044A', 'JAG043', 'JAG043A', 'JAG045A',
]

const regrasDisciplinaEspelho = [
  {
    curso: 'ENGENHARIA AGRÍCOLA  - Presencial - Jandaia do Sul',
    sufixo: 'ESP'
  },
  {
    curso: 'CIÊNCIAS EXATAS  - Presencial - Jandaia do Sul',
    sufixo: 'B'
  },
  {
    curso: 'COMPUTAÇÃO  - Presencial - Jandaia do Sul',
    sufixo: 'E'
  }
]

const registrarDescartada = (linha, motivo) => {
  descartadas.push({
    Curso: linha['Curso'],
    Departamento: linha['Departamento'],
    Código: linha['Código'],
    Disciplina: linha['Disciplina'],
    Nome: linha['Nome'],
    Ano: linha['Ano'],
    Período: linha['Período'],
    Turno: linha['Turno'],
    Docente: linha['Docente(s)'],
    Situação: linha['Situação'],
    Encontros: linha['Encontro(s)'],
    Motivo: motivo
  })
}

const normalizar = (v) => (v || '').toString().trim();

const normalizarPeriodo = (p) => {
  if (p.includes("Especial 1")) return "1 Semestre";

  if (p.includes("Especial 2")) return "2 Semestre";

  if (p.includes("Estágio")) return "1 Semestre";

  return p.replace(/°/g, "");
}

const ignorarDisciplinaEspelho = (curso, codigo) => {
  const cod = codigo?.toString().toUpperCase() || ''
  
  return regrasDisciplinaEspelho.some(regra =>
    curso === regra.curso && cod.endsWith(regra.sufixo)
  )
}

const extrairSlots = (encontros) => {
  if (!encontros) return []

  return encontros.split(',').map(e => e.trim())
}

const ajustarConflitosHorarios = (turmas) => {
  const grupos = {}

  // 🔹 agrupar
  turmas.forEach(t => {
    if (!t.encontros) return

    const chave = `${t.codigo}_${t.ano}_${t.periodo}_${t.turno}_${t.docente}`

    if (!grupos[chave]) {
      grupos[chave] = []
    }

    grupos[chave].push(t)
  })

  // 🔹 processar cada grupo
  Object.values(grupos).forEach(lista => {
    const ocupacao = new Set()

    lista.forEach((t, index) => {
      const slots = extrairSlots(t.encontros)

      let conflitos = 0

      slots.forEach(slot => {
        if (ocupacao.has(slot)) {
          conflitos++
        } else {
          ocupacao.add(slot)
        }
      })

      // 🔥 descontar conflitos
      if (conflitos > 0) {
        console.warn(`⚠️ Conflitos encontrados: ${t.codigo} (${t.ano} - ${t.periodo} - ${t.turno}) - ${t.docente} - ${conflitos} conflito(s)`)
        t.carga_horaria_semanal -= conflitos

        // segurança
        if (t.carga_horaria_semanal < 0) {
          t.carga_horaria_semanal = 0
        }
      }
    })
  })
}


let turmas = []

// 🔄 ler todos os arquivos .xlsx da pasta
const arquivos = fs.readdirSync(pasta)

arquivos.forEach(arquivo => {
  if (!arquivo.endsWith('.xlsx') && !arquivo.endsWith('.xls')) return

  const caminho = path.join(pasta, arquivo)
  console.log(`📄 Processando: ${arquivo}`)

  const workbook = xlsx.readFile(caminho)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const dados = xlsx.utils.sheet_to_json(sheet, { defval: '' })


  dados.forEach(linha => {
    const codigo = normalizar(linha['Código'])
    const curso = normalizar(linha['Curso'])
    if (!codigo) return

    // ignorar disciplina
    if (ignorarCodigos.includes(codigo)) {
      registrarDescartada(linha, 'Código ignorado') 
      return
    }
    if (ignorarDisciplinaEspelho(curso, codigo)) {
      console.log(`Ignorada: ${codigo} (${curso})`)
      registrarDescartada(linha, 'Disciplina espelho ignorada')
      return
    }

    // ignorar turmas inativas
    const situacao = normalizar(linha['Situação']);
    if (situacoesIgnoradas.includes(situacao)) {
      registrarDescartada(linha, 'Turma inativa')
      return;
    }

    const disciplina = mapaDisciplinas[codigo]
    if (!disciplina) {
      registrarDescartada(linha, 'Disciplina não encontrada nos cursos do campus')
      console.warn(`⚠️ Disciplina não encontrada: ${codigo}`)
      return
    }

    const cargaTotal = disciplina.ch_total

    let cargaSemanal = 0
    let semanas = 0

    if (cargaTotal % 15 === 0) {
      cargaSemanal = cargaTotal / 15
      semanas = 15
    } else if (cargaTotal % 18 === 0) {
      cargaSemanal = cargaTotal / 18
      semanas = 18
    } else {
      console.warn(`⚠️ CH não padrão: ${codigo} (${cargaTotal})`)
      console.warn(`Ajustando para 15 semanas`)
      cargaSemanal = Math.floor(cargaTotal / 15)
      semanas = 15
    }

    // docentes
    const docentes = linha['Docente(s)']
      ? linha['Docente(s)']
          .split(',')
          .map(d => d.trim())
      : ['Sem docente']

    const cargaPorDocente = cargaSemanal / docentes.length

    docentes.forEach(docente => {
      turmas.push({
        curso: curso,
        departamento: normalizar(linha['Departamento']),
        codigo,
        nome: normalizar(linha['Nome']),
        disciplina: normalizar(linha['Disciplina']),
        periodo: normalizarPeriodo(normalizar(linha['Período'])),
        ano: Number(linha['Ano']) || 0,
        turno: normalizar(linha['Turno']),
        docente,

        carga_horaria_total: cargaTotal,
        carga_horaria_semanal: cargaPorDocente,
        semanas,

        vagas: Number(linha['Vagas']) || 0,
        vagas_calouros: Number(linha['Vagas Calouros']) || 0,
        vagas_veteranos: Number(linha['Vagas Veteranos']) || 0,
        encontros: normalizar(linha['Encontro(s)']) || 'N/A'
      })
    })
  })
})

/**
 * dimensões
 */
const dimensoes = {
  cursos: [...new Set(turmas.map(t => t.curso))].sort(),
  departamentos: [...new Set(turmas.map(t => t.departamento))].sort(),
  disciplinas: [...new Set(turmas.map(t => t.disciplina))].sort(),
  docentes: [...new Set(turmas.map(t => t.docente))].sort(),
  anos: [...new Set(turmas.map(t => t.ano))].sort((a, b) => a - b),
  periodos: [...new Set(turmas.map(t => t.periodo))].sort((a, b) => a - b),
  turnos: [...new Set(turmas.map(t => t.turno))].sort()
}

ajustarConflitosHorarios(turmas)

const removidos = turmas.filter(t => t.carga_horaria_semanal <= 0)
removidos.forEach(t => {
  descartadas.push({
    Curso: t.curso,
    Departamento: t.departamento,
    Código: t.codigo,
    Disciplina: t.disciplina,
    Nome: t.nome,
    Ano: t.ano,
    Período: t.periodo,
    Turno: t.turno,
    Docente: t.docente,
    Situação: t.situacao,
    Encontros: t.encontros,
    'CH Semanal': t.carga_horaria_semanal,
    Motivo: 'Duplicidade de horário'
  })
})

const turmasValidas = turmas.filter(t => t.carga_horaria_semanal > 0)

/**
 * salvar
 */
fs.writeFileSync(
  './public/data/turmas.json',
  JSON.stringify({ turmas: turmasValidas, dimensoes }, null, 2)
)
console.log('✅ Turmas importadas com sucesso!')

fs.writeFileSync(
  './public/data/descartadas.json',
  JSON.stringify(descartadas, null, 2), 'utf-8'
)
console.log(`📄 JSON de descartadas gerado (${descartadas.length} registros)`)
