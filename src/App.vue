<script setup>
import { ref, onMounted, computed } from 'vue'

import FiltrosPainel from './components/FiltrosPainel.vue'
import DocentesCards from './components/DocentesCards.vue'
import GraficoCargaDocente from './components/GraficoCargaDocente.vue'
import GraficoMediaPorAno from './components/GraficoMediaPorAno.vue'

const turmas = ref([])
const dimensoes = ref({})
const filtros = ref({})
const opcoesFiltradas = ref({})
const tab = ref('periodo')

const labels = {
  cursos: 'Cursos',
  docentes: 'Docentes',
  anos: 'Anos',
  periodos: 'Períodos',
  disciplinas: 'Disciplinas'
}

/**
 * 🚫 Dimensões removidas
 */
const filtrosAtivos = [
  'cursos',
  'disciplinas',
  'docentes',
  'anos',
  'periodos',
  'disciplinas'
]

onMounted(async () => {
  const response = await fetch(import.meta.env.BASE_URL + 'data/turmas.json')
  const data = await response.json()

  turmas.value = data.turmas

  /**
   * 🔹 Carregar dimensões (filtradas)
   */
  Object.keys(data.dimensoes).forEach(dim => {
    if (!filtrosAtivos.includes(dim)) return

    dimensoes.value[dim] = [...data.dimensoes[dim]]
    filtros.value[dim] = ['Todos']
    opcoesFiltradas.value[dim] = [...data.dimensoes[dim]]
  })

  /**
   * 🔹 Criar dimensão disciplinas (label/value)
   */
  const mapa = {}

  turmas.value.forEach(t => {
    if (!mapa[t.codigo]) {
      mapa[t.codigo] = {
        label: `${t.codigo} - ${t.nome}`,
        value: t.codigo
      }
    }
  })

  dimensoes.value.disciplinas = Object.values(mapa)
  filtros.value.disciplinas = ['Todos']
  opcoesFiltradas.value.disciplinas = [...dimensoes.value.disciplinas]
})

/**
 * 🔎 autocomplete
 */
function filtrarOpcoes(dim, val, update) {
  update(() => {
    if (!val) {
      opcoesFiltradas.value[dim] = dimensoes.value[dim]
      return
    }

    const needle = val.toLowerCase()

    opcoesFiltradas.value[dim] = dimensoes.value[dim].filter(opt => {
      const texto = opt.label || opt
      return texto.toLowerCase().includes(needle)
    })
  })
}

/**
 * 🔄 atualização vinda do componente
 */
function atualizarFiltros({ dim, valores }) {
  filtros.value[dim] = valores
}

/**
 * 🔍 aplicar filtros
 */
const turmasFiltradas = computed(() => {
  return turmas.value.filter(t => {
    return Object.keys(filtros.value).every(dim => {
      const selecionados = filtros.value[dim]

      if (
        selecionados.length === 0 ||
        selecionados.includes('Todos')
      ) return true

      if (dim === 'disciplinas') {
        return selecionados.includes(t.codigo)
      }

      const campo = dim.slice(0, -1)
      return selecionados.includes(t[campo])
    })
  })
})
</script>

<template>
  <div class="q-pa-md">
    <div class="row q-col-gutter-md">

      <!-- 🔹 FILTROS -->
      <div class="col-12 col-md-3">
        <FiltrosPainel
          :dimensoes="dimensoes"
          :filtros="filtros"
          :opcoesFiltradas="opcoesFiltradas"
          :labels="labels"
          @update:filtros="atualizarFiltros"
          @filter-opcoes="({ dim, val, update }) => filtrarOpcoes(dim, val, update)"
        />
      </div>

      <!-- CONTEÚDO -->
      <div class="col-12 col-md-9">
        <div class="row q-mb-md">
          <div class="col">
            <qcard>
              <q-tabs
                v-model="tab"
                dense
                class="bg-purple text-white"
                align="justify"
                narrow-indicator
              >
                <q-tab name="periodo" label="Por período" />
                <q-tab name="ano" label="Por ano" />
              </q-tabs>
              <q-separator />
              <q-tab-panels 
                v-model="tab" 
                animated
                class="text-dark text-center"
              >
                <q-tab-panel name="periodo">
                  <GraficoCargaDocente :turmas="turmasFiltradas" />
                </q-tab-panel>
                <q-tab-panel name="ano">
                  <GraficoMediaPorAno :turmas="turmasFiltradas" />
                </q-tab-panel>
              </q-tab-panels>
            </qcard>

          </div>
        </div>
        <DocentesCards :turmas="turmasFiltradas" />
      </div>

    </div>
  </div>
</template>