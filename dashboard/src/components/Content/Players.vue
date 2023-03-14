<template>
  <div id="container" :style="`height: ${containerHeight}px`">
    <div id="header">
      <h3>Connected Players: {{ $store.state.stats.onlinePlayers }}</h3>
      <p>Search:<input v-model="searchQuery" id="player-search-bar" /></p>
      <div>
        <label for="limit">Show </label>
        <select name="limit" id="limit" v-model="limit">
          <option v-for="option in limitOptions" :key="option" :value="option">
            {{ option }} entries
          </option>
        </select>
      </div>
    </div>
    <div id="content" :style="`height: ${containerHeight - 85}px`">
      <PlayerComponent
        v-for="player of (searchQuery.length
          ? $store.state.players.filter(
              (p) =>
                p.uuid.toLowerCase() == searchQuery.toLowerCase() ||
                p.uuid.replace(/-/g, '').toLowerCase() ==
                  searchQuery.toLowerCase() ||
                p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.server.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : $store.state.players
        ).slice(0, limit)"
        :key="player.uuid"
        :name="player.username"
        :uuid="player.uuid"
        :role="player.role"
        :version="player.version"
        :server="player.server"
        :cracked="player.cracked"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core';
import PlayerComponent from '../Dashboard/Player.vue';

export default defineComponent({
  name: 'Players',
  components: { PlayerComponent },
  data: () => ({
    limit: 100,
    limitOptions: [25, 50, 75, 100, 150, 200, 300, 500, 1000, 2500, 5000],
    containerHeight: 500,
    searchQuery: '',
  }),

  methods: {
    updateContainerHeight() {
      this.containerHeight = window.innerHeight - 90 - 68 - 25;
    },
  },

  created() {
    this.updateContainerHeight();
    window.addEventListener('resize', this.updateContainerHeight);
  },
});
</script>

<style scoped>
div#container {
  background-color: var(--color-box);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  box-shadow: 0 0 5px 0 var(--shadow);
  margin: 50px 0 0 60px;
  width: 1300px;
}

div#header {
  padding: 25px;
  display: flex;
  justify-content: space-between;
  color: var(--color-gray);
}

select {
  border-radius: 10px;
}

div#content {
  height: 80%;
  overflow-y: scroll;
}

div#content::-webkit-scrollbar {
  display: none;
}

#limit {
  background-color: var(--color-gray-outline);
  color: var(--color-light-gray);
  font-size: 0.8em;
  border: solid 1px var(--color-light-gray);
  padding: 3px 5px;
}

#player-search-bar {
  margin-left: 10px;
  background-color: var(--color-gray-outline);
  color: var(--color-light-gray);
  font-size: 0.8em;
  border: solid 1px var(--color-light-gray);
  padding: 3px 5px;
  border-radius: 10px;
}
</style>
