import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// resolver __dirname no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// diretório das planilhas
const dirPath = path.join(__dirname, '../data/disciplinas');

// normalização
const normalizar = (v) => (v || '').toString().trim();

// lista final
const disciplinas = [];

// controle de duplicatas (codigo + curriculo + ano)
const vistos = new Set();

// ler arquivos
const arquivos = fs.readdirSync(dirPath)
  .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));

arquivos.forEach(file => {
  const filePath = path.join(dirPath, file);
  console.log(`Processando: ${file}`);

  const workbook = XLSX.readFile(filePath);

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    rows.forEach(row => {
      const setor = normalizar(row['Setor/Campus']);
      const departamento = normalizar(row['Departamento']);
      const coordenacao = normalizar(row['Coordenação']);
      const curriculo = normalizar(row['Currículo']);
      const ano = normalizar(row['Ano da versão']);

      let natureza = normalizar(row['Natureza']);
      natureza = natureza.toLowerCase().includes('obrig')
        ? 'Obrigatória'
        : 'Optativa';

      const codigo = normalizar(row['Código da disciplina']);
      const nome = normalizar(row['Nome da disciplina']);

      // ignorar linhas inválidas
      if (!codigo || !nome) return;

      // chave única para evitar duplicação
      const chave = `${codigo}-${curriculo}-${ano}-${natureza}`;
      if (vistos.has(chave)) return;
      vistos.add(chave);

      disciplinas.push({
        codigo,
        nome,
        ch: Number(row['Ch Total']) || 0,
        periodo: normalizar(row['Período']),
        setor,
        departamento,
        coordenacao,
        curriculo,
        ano,
        natureza,
        lingua: normalizar(row['Língua'])
      });
    });
  });
});


// gerar dimensões automaticamente
const unique = (arr) => [...new Set(arr.filter(v => v))];

const dimensoes = {
  setores: unique(disciplinas.map(d => d.setor)),
  departamentos: unique(disciplinas.map(d => d.departamento)),
  coordenacoes: unique(disciplinas.map(d => d.coordenacao)),
  curriculos: unique(disciplinas.map(d => d.curriculo)),
  anos: unique(disciplinas.map(d => d.ano)),
  naturezas: unique(disciplinas.map(d => d.natureza)),
  linguas: unique(disciplinas.map(d => d.lingua))
};

// resultado final
const resultado = {
  disciplinas,
  dimensoes
};

// salvar
const outputPath = path.join(__dirname, '../public/data/disciplinas.json');

fs.writeFileSync(
  outputPath,
  JSON.stringify(resultado, null, 2),
  'utf-8'
);

console.log('JSON gerado com sucesso!');
console.log(`Total de disciplinas: ${disciplinas.length}`);