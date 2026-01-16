<script setup lang="ts">
import { onMounted, ref } from "vue";
import { GameResultWinEvent } from "./events/game";
import { MouseLeftClickEvent } from "./events/input";
import Game from "./game";
import settings from "./settings";

const canvasElement = ref<HTMLCanvasElement | null>(null);
const imageElement = ref<HTMLImageElement | null>(null);
const win = ref<boolean>(false);

onMounted(async () => {
  const canvas = canvasElement.value;

  if (canvas === null) {
    throw new Error("failed to retrieve canvas");
  }

  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("failed to retrieve rendering context");
  }

  const filenames = [
    "photo1.jpeg",
    "photo2.jpeg",
    "photo3.jpeg",
    "photo4.jpeg",
    "photo5.jpeg",
    "photo6.jpeg",
  ];

  const randomIndex = Math.floor(Math.random() * filenames.length);

  const imageURL = new URL(
    `./assets/images/${filenames[randomIndex]}?url`,
    import.meta.url,
  );

  const image = imageElement.value;

  if (image) {
    image.src = imageURL.href;
  }

  const game = new Game(canvas, settings, imageURL.href);

  canvas.addEventListener("click", (e: MouseEvent) => {
    game.dispatchEvent(new MouseLeftClickEvent(e.offsetX, e.offsetY));
  });

  game.addEventListener(GameResultWinEvent.name, () => {
    win.value = true;
  });

  game.start();

  Object.defineProperty(window, "solve", {
    value: game.solve.bind(game),
  });
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen gap-24">
    <div class="relative flex justify-center items-center">
      <canvas ref="canvasElement" :width="settings.size * settings.blockSize"
        :height="settings.size * settings.blockSize">
      </canvas>
      <div v-if="win"
        class="absolute bg-slate-800/90 inset-0 opacity-100 transition-opacity duration-300 ease-out delay-1000 hover:opacity-0 hover:delay-0 flex justify-center items-center text-6xl">
        You Win!
      </div>
    </div>
    <div class="relative">
      <img ref="imageElement" :width="settings.size * settings.blockSize" :height="settings.size * settings.blockSize"
        alt="preview">
      <div
        class="absolute bg-slate-500/80 inset-0 opacity-100 transition-opacity duration-300 ease-out delay-1000 hover:opacity-0 hover:delay-0 flex justify-center items-center text-6xl">
        Preview
      </div>
    </div>
  </div>
</template>

<style scoped></style>
