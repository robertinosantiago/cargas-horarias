<script setup>
import { computed } from 'vue'

const props = defineProps({
  dimensoes: Object,
  filtros: Object,
  opcoesFiltradas: Object,
  labels: Object
})

const emit = defineEmits([
  'update:filtros',
  'filter-opcoes'
])

function isSelecionado(dim, opt) {
  const valores = props.filtros[dim] || []
  const valor = opt?.value || opt

  if (valores.includes('Todos')) return true
  return valores.includes(valor)
}

function toggleOpcao(dim, opt) {
  const valor = opt?.value || opt
  let valores = [...(props.filtros[dim] || [])]
  const total = props.dimensoes[dim].length

  // 👉 clicou em "Todos"
  if (valor === 'Todos') {
    if (valores.includes('Todos')) {
      // 🔥 DESMARCAR TODOS → limpa tudo
      emit('update:filtros', { dim, valores: [] })
    } else {
      // 🔥 MARCAR TODOS
      emit('update:filtros', { dim, valores: ['Todos'] })
    }
    return
  }

  // 👉 remove "Todos" se existir
  valores = valores.filter(v => v !== 'Todos')

  if (valores.includes(valor)) {
    valores = valores.filter(v => v !== valor)
  } else {
    valores.push(valor)
  }

  // 👉 se selecionou todos manualmente → vira "Todos"
  if (valores.length === total) {
    valores = ['Todos']
  }

  //if (valores.length === 0) {
  //  valores = ['Todos']
  //}

  // 👉 se não sobrou nada → estado vazio (não volta automaticamente pra Todos)
  emit('update:filtros', { dim, valores })
}

function atualizarFiltro(dim, valores) {
  if (!valores || valores.length === 0) {
    emit('update:filtros', { dim, valores: [] })
    return
  }

  if (valores.includes('Todos')) {
    emit('update:filtros', { dim, valores: ['Todos'] })
    return
  }

  emit('update:filtros', { dim, valores })
}

function getDisplayValue(dim) {
  const valores = props.filtros[dim] || []
  if (valores.includes('Todos')) return 'Todos'
  return valores.join(', ')
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">Filtros</div>

      <div
        v-for="(opcoes, dim) in dimensoes"
        :key="dim"
        class="q-mt-md"
      >
        <q-select
          :model-value="filtros[dim]"
          @update:model-value="val => atualizarFiltro(dim, val)"
          :options="[
            dim === 'disciplinas'
              ? { label: 'Todos', value: 'Todos' }
              : 'Todos',
            ...opcoesFiltradas[dim]
          ]"
          :label="labels[dim] || dim"
          multiple
          outlined
          use-chips
          use-input
          @filter="(val, update) => emit('filter-opcoes', { dim, val, update })"
          option-label="label"
          option-value="value"
          :display-value="getDisplayValue(dim)"
        >
          <template v-slot:option="scope">
            <q-item clickable @click="toggleOpcao(dim, scope.opt)">
              <q-item-section avatar>
                <q-checkbox
                  :model-value="isSelecionado(dim, scope.opt)"
                />
              </q-item-section>

              <q-item-section>
                {{ scope.opt.label || scope.opt }}
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </q-card-section>
  </q-card>
</template>