<script setup>
import { computed } from 'vue'

const props = defineProps({
  turmas: Array
})

/**
 * 📊 Média por ano (média das médias dos períodos)
 */
const dados = computed(() => {
  const resultado = {}

  // obter anos únicos
  const anos = [...new Set(props.turmas.map(t => t.ano))]

  anos.forEach(ano => {
    // obter períodos únicos do ano
    const periodos = [
      ...new Set(
        props.turmas
          .filter(t => t.ano === ano)
          .map(t => t.periodo)
      )
    ]

    const mediasPorPeriodo = periodos.map(periodo => {
      const turmasPeriodo = props.turmas.filter(
        t => t.ano === ano && t.periodo === periodo
      )

      // agrupar por docente
      const mapaDocente = {}

      turmasPeriodo.forEach(t => {
        if (!mapaDocente[t.docente]) {
          mapaDocente[t.docente] = 0
        }
        mapaDocente[t.docente] += t.carga_horaria_semanal
      })

      const cargas = Object.values(mapaDocente)

      if (cargas.length === 0) return 0

      const soma = cargas.reduce((a, b) => a + b, 0)

      return soma / cargas.length
    })

    // média dos períodos
    if (mediasPorPeriodo.length > 0) {
      const somaMedias = mediasPorPeriodo.reduce((a, b) => a + b, 0)
      resultado[ano] = somaMedias / mediasPorPeriodo.length
    } else {
      resultado[ano] = 0
    }
  })

  return resultado
})

/**
 * 📊 opções do gráfico
 */
const chartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 350
  },
  xaxis: {
    categories: Object.keys(dados.value)
  },
  yaxis: {
    labels: {
      formatter: val => Math.round(val) // sem casas decimais no eixo
    }
  },
  dataLabels: {
    enabled: true,
    formatter: val => val.toFixed(2),
    offsetY: -15,
    style: {
      colors: ['#000']
    }
  },
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

const series = computed(() => [
  {
    name: 'Média CH Semanal',
    data: Object.values(dados.value)
  }
])
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">
        Média de Carga Horária por Ano
      </div>
    </q-card-section>

    <q-card-section>
      <apexchart
        type="bar"
        height="350"
        :options="chartOptions"
        :series="series"
      />
    </q-card-section>
  </q-card>
</template>