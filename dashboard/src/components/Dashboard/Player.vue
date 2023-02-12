<template>
  <div class="container">
    <img class="avatar" :src="`https://cravatar.eu/avatar/${uuid}`" />
    <div class="infos">
      <h5>{{ name }}</h5>
      <p>{{ uuid }}</p>
      <h6>{{ role }}</h6>
    </div>
    <div class="actions">
      <div
        class="player-action"
        style="background-color: rgba(84, 200, 119, 0.1)"
        @click="sendMessage()"
      >
        <i class="fa-solid fa-message" style="color: rgb(84, 200, 119)"></i>
      </div>
      <div
        class="player-action"
        style="background-color: rgba(59, 161, 219, 0.2)"
        @click="setRole()"
      >
        <i class="fa-solid fa-user-gear" style="color: rgb(59, 161, 219)"></i>
      </div>
    </div>
  </div>
</template>

<script alng="ts">
import { defineComponent } from '@vue/runtime-core';
import { sendMessage, setRole } from '../../api';

export default defineComponent({
  name: 'Player',
  props: {
    name: String,
    uuid: String,
    role: String,
  },

  methods: {
    async sendMessage() {
      const message = prompt(
        `What message do you want to send to ${this.$props.name}?`
      );
      await sendMessage(this.$props.uuid, message);
    },
    async setRole() {
      const role = prompt(
        `What role do you want to set for ${this.$props.name}?`
      );
      await setRole(this.$props.uuid, role);
    },
  },
});
</script>

<style scoped>
div.container {
  height: 60px;
  border-radius: 15px;
  margin: 5px 20px;
  display: flex;
  padding-left: 10px;
  justify-content: center;
}

div.infos {
  display: flex;
}

div.infos > *,
div.actions > * {
  margin: auto 0 auto 0;
  text-align: center;
  color: var(--color-light-gray);
}

div.infos > h5 {
  font-weight: 600;
  width: 250px;
    color: var(--color-light-gray);
}

div.infos > p {
  font-size: 16px;
  width: 400px;
  color: var(--color-gray);
}

div.infos > h6 {
  font-weight: normal;
  width: 200px;
}

div.actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

div.player-action {
  cursor: pointer;
  width: 50px;
  height: 50px;
  border-radius: 16px;
  margin-right: 15px;
}

div.player-action > i {
  margin-top: 16px;
}

img.avatar {
  width: 45px;
  height: 45px;
  border-radius: 10px;
  margin-top: 8px;
  margin-left: 5px;
}
</style>
