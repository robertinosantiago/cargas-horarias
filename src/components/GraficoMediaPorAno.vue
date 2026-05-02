<script setup>
import { computed } from 'vue'

const props = defineProps({
  turmas: Array
})

/**
 * 📊 calcular média por docente por ano
 */
const dados = computed(() => {
  const mapaDocente = {}
  const periodosPorAno = {}

  props.turmas.forEach(t => {
    // controle de períodos
    if (!periodosPorAno[t.ano]) {
      periodosPorAno[t.ano] = new Set()
    }
    periodosPorAno[t.ano].add(t.periodo)

    // carga por docente
    if (!mapaDocente[t.ano]) {
      mapaDocente[t.ano] = {}
    }

    if (!mapaDocente[t.ano][t.docente]) {
      mapaDocente[t.ano][t.docente] = 0
    }

    mapaDocente[t.ano][t.docente] += t.carga_horaria_semanal
  })

  const resultado = {}

  Object.keys(mapaDocente).forEach(ano => {
    const cargas = Object.values(mapaDocente[ano])
    const soma = cargas.reduce((a, b) => a + b, 0)

    const mediaDocentes = soma / cargas.length

    const qtdPeriodos = periodosPorAno[ano].size || 1

    // 🔥 ajuste solicitado
    resultado[ano] = mediaDocentes / qtdPeriodos
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
      formatter: val => Math.round(val) // 👈 sem decimal
    }
  },
  dataLabels: {
    enabled: true,
    formatter: val => val.toFixed(2),
    offsetY: -15,
    style: {
      colors: ['#000']
    }
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