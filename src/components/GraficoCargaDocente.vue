<script setup>
import { computed } from 'vue'

const props = defineProps({
  turmas: Array
})

/**
 * 🔧 Normalizar período (garante padronização)
 */
function normalizarPeriodo(valor) {
  const v = valor?.toString().toLowerCase() || ''

  if (v.includes('1') && v.includes('sem')) return '1 Semestre'
  if (v.includes('2') && v.includes('sem')) return '2 Semestre'
  if (v.includes('esp') && v.includes('1')) return 'Especial 1'
  if (v.includes('esp') && v.includes('2')) return 'Especial 2'

  return valor || 'Outro'
}

/**
 * 🔧 Ordenação customizada
 */
function ordenarPeriodos(periodos) {
  const ordem = {
    '1 Semestre': 1,
    '2 Semestre': 2,
    'Especial 1': 3,
    'Especial 2': 4
  }

  return periodos.sort((a, b) => {
    return (ordem[a] || 999) - (ordem[b] || 999)
  })
}

/**
 * 1️⃣ Soma carga por docente em cada (ano, período)
 */
const cargaPorDocente = computed(() => {
  const mapa = {}

  props.turmas.forEach(t => {
    const periodo = normalizarPeriodo(t.periodo)
    const chave = `${t.ano}-${periodo}-${t.docente}`

    if (!mapa[chave]) {
      mapa[chave] = {
        ano: t.ano,
        periodo,
        docente: t.docente,
        carga: 0
      }
    }

    mapa[chave].carga += t.carga_horaria_semanal
  })

  return Object.values(mapa)
})

/**
 * 2️⃣ Média por (ano, período)
 */
const mediaPorPeriodo = computed(() => {
  const mapa = {}

  cargaPorDocente.value.forEach(d => {
    const chave = `${d.ano}-${d.periodo}`

    if (!mapa[chave]) {
      mapa[chave] = {
        ano: d.ano,
        periodo: d.periodo,
        total: 0,
        docentes: new Set()
      }
    }

    mapa[chave].total += d.carga
    mapa[chave].docentes.add(d.docente)
  })

  return Object.values(mapa).map(d => ({
    ano: d.ano,
    periodo: d.periodo,
    media: d.total / d.docentes.size
  }))
})

/**
 * 3️⃣ Montar gráfico (ano no eixo X, período como série)
 */
const chartData = computed(() => {
  const anos = [...new Set(mediaPorPeriodo.value.map(d => d.ano))]
    .sort((a, b) => a - b)

  let periodos = [...new Set(mediaPorPeriodo.value.map(d => d.periodo))]
  periodos = ordenarPeriodos(periodos)

  const series = periodos.map(periodo => ({
    name: periodo,
    data: anos.map(ano => {
      const item = mediaPorPeriodo.value.find(
        d => d.ano === ano && d.periodo === periodo
      )
      return item ? Number(item.media.toFixed(2)) : 0
    })
  }))

  return { anos, series }
})

/**
 * 4️⃣ Opções do gráfico
 */
const options = computed(() => ({
  chart: {
    type: 'bar',
    stacked: false
  },

  xaxis: {
    categories: chartData.value.anos,
    title: { text: 'Ano' }
  },

  yaxis: {
    title: { text: 'Carga horária semanal média' }
  },

  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '60%',
      dataLabels: {
        position: 'top'
      }
    }
  },

  dataLabels: {
  enabled: false,
  formatter: val => val.toFixed(2),

  offsetY: -18, // 👈 sobe mais (ajuste fino aqui)

  style: {
    fontSize: '12px',
    colors: ['#000'],
    fontWeight: 'bold',
  },

  background: {
    enabled: false
  },

  // 👇 rotação via CSS
  textAnchor: 'middle',

  dropShadow: {
    enabled: false
  }
},

  /**
   * 🎯 Linhas de meta
   */
  annotations: {
    yaxis: [
      {
        y: 8,
        borderColor: '#008000',
        label: {
          text: 'Meta 8h',
          style: {
            color: '#fff',
            background: '#008000'
          }
        }
      },
      {
        y: 12,
        borderColor: '#FF0000',
        label: {
          text: 'Meta 12h',
          style: {
            color: '#fff',
            background: '#FF0000'
          }
        }
      }
    ]
  }
}))
</script>

<template>
  <q-card class="q-mt-md">
    <q-card-section>
      <div class="text-h6">
        Média de carga docente por período
      </div>

      <apexchart
        type="bar"
        height="400"
        :options="options"
        :series="chartData.series"
      />
    </q-card-section>
  </q-card>
</template>

