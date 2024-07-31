<template>
    <q-dialog v-model="showDialog" persistent>
      <q-card>
        <q-card-section>
          <q-toolbar color="primary">
            <q-btn flat round dense icon="close" @click="hideDialog" />
            <q-toolbar-title>Test Dialog</q-toolbar-title>
          </q-toolbar>
        </q-card-section>
        <q-card-section>
          <p>This is a test dialog.</p>
        </q-card-section>
        <q-card-actions>
          <q-btn flat color="primary" label="Close" @click="hideDialog" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </template>
  
  <script setup>
  import { defineEmits, ref, computed } from 'vue';
  
  const emit = defineEmits(['update:modelValue']);
  
  const props = defineProps({
    showDialog: Boolean
  });
  
  const showDialog = computed({
    get: () => props.showDialog,
    set: (value) => emit('update:modelValue', value)
  });
  
  function hideDialog() {
    showDialog.value = false;
  }
  </script>
  