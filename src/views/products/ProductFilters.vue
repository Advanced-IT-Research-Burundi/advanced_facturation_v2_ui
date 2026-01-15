<script setup>
defineProps({
  modelValue: String,
});

defineEmits(["update:modelValue"]);
</script>

<template>
  <div class="card mb-4 border-0 shadow-sm">
    <div class="card-body">
      <div class="row">
        <div class="col-md-4">
          <div class="input-group">
            <span class="input-group-text bg-light border-end-0">
              <i class="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              class="form-control bg-light border-start-0 ps-0"
              placeholder="Rechercher (Code, Designation...)"
              :value="modelValue"
              @input="$emit('update:modelValue', $event.target.value)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
