<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  turmas: Array
})

const dialog = ref(false)
const docenteSelecionado = ref(null)
const disciplinasSelecionadas = ref([])

function ordemPeriodo(periodo) {
  const mapa = {
    '1 Semestre': 1,
    '2 Semestre': 2,
    'Especial 1': 3,
    'Especial 2': 4
  }

  return mapa[periodo] || 999
}

const docentesAgrupados = computed(() => {
  const mapa = {}

  props.turmas.forEach(t => {
    const nome = t.docente?.trim() || 'Sem docente'

    if (!mapa[nome]) {
      mapa[nome] = []
    }

    mapa[nome].push(t)
  })

  return Object.entries(mapa)
    .map(([docente, disciplinas]) => ({
      docente,
      disciplinas: Array.isArray(disciplinas) ? disciplinas : []
    }))
    .sort((a, b) =>
      a.docente.localeCompare(b.docente, 'pt-BR', { sensitivity: 'base' })
    )
})

function abrirModal(docente, disciplinas) {
  docenteSelecionado.value = docente

  disciplinasSelecionadas.value = [...disciplinas].sort((a, b) => {
    // 1️⃣ ordenar por ano
    if (a.ano !== b.ano) {
      return a.ano - b.ano
    }

    // 2️⃣ ordenar por período
    return ordemPeriodo(a.periodo) - ordemPeriodo(b.periodo)
  })

  dialog.value = true
}

function totalCarga(disciplinas) {
  if (!Array.isArray(disciplinas)) return 0

  return disciplinas
    .reduce((s, d) => s + d.carga_horaria_semanal, 0)
    .toFixed(2)
}

const mediaCargaHorariaSemanal = (disciplinas) => {
  if (!Array.isArray(disciplinas) || disciplinas.length === 0) {
    return 0
  }
  const total = disciplinas.reduce((sum, disc) => sum + disc.carga_horaria_semanal, 0);
  const periodos = new Set(disciplinas.map(d => `${d.ano}-${d.periodo}`)).size;
  return total / periodos;
};
</script>

<template>
  <div class="row q-col-gutter-md">

    <div
      v-for="item in docentesAgrupados"
      :key="item.docente"
      class="col-12 col-md-4"
    >
      <q-card>

        <q-card-section>
          <div class="text-h6">{{ item.docente }}</div>

          <div class="text-caption">
            Total: {{ totalCarga(item.disciplinas) }} h
          </div>

          <div class="text-caption">
            Média: {{ mediaCargaHorariaSemanal(item.disciplinas).toFixed(2) }} h/semana
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            label="Visualizar disciplinas"
            flat
            color="primary"
            @click="abrirModal(item.docente, item.disciplinas)"
          />
        </q-card-actions>

      </q-card>
    </div>

    <!-- MODAL -->
    <q-dialog v-model="dialog">
      <q-card style="min-width: 600px">

        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ docenteSelecionado }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-list bordered separator>

            <q-item
              v-for="(disc, i) in disciplinasSelecionadas"
              :key="i"
            >
              <q-item-section>
                <div>
                  {{ disc.codigo }} - {{ disc.disciplina }}
                </div>
                <div class="text-caption">
                  {{ disc.curso }}
                </div>
                <div class="text-caption">
                  {{ disc.periodo }} / {{ disc.ano }}
                </div>
                <div class="text-caption">
                  {{ disc.carga_horaria_semanal.toFixed(2) }} h/semana
                </div>
              </q-item-section>
            </q-item>

          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            label="Fechar"
            color="primary"
            flat
            v-close-popup
          />
        </q-card-actions>

      </q-card>
    </q-dialog>

  </div>
</template>