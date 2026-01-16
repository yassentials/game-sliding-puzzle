/** biome-ignore-all lint/suspicious/noConfusingLabels: false */
/** biome-ignore-all lint/style/noNonNullAssertion: false */
import { Result } from "./enums";
import { GameResultWinEvent } from "./events/game";
import { MouseLeftClickEvent } from "./events/input";
import type Settings from "./settings";

declare global {
  interface Array<T> {
    shuffle(): Array<T>;
  }
}

Array.prototype.shuffle = function () {
  return this.sort(() => Math.random() - 0.5);
};

export default class Game extends EventTarget {
  private image: HTMLImageElement | null = null;
  private running = true;
  private ready = false;
  private blocks: number[][] = [];
  private requestAnimationFrameId: number | undefined;
  private clickPosition = new Proxy(
    {
      position: {
        x: -1,
        y: -1,
      },
      consumed: false,
    },
    {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        if (prop === "position" && !target.consumed) {
          target.consumed = true;
          return value;
        }

        if (prop === "position" && target.consumed) {
          return 0;
        }

        return value;
      },

      set(target, prop, value, receiver) {
        const ok = Reflect.set(target, prop, value, receiver);
        if (ok && prop === "position") {
          target.consumed = false;
        }
        return ok;
      },
    },
  );
  private readonly context: CanvasRenderingContext2D;

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly settings: typeof Settings,
    imageSrc: string,
  ) {
    super();
    const context = canvas.getContext("2d");

    if (context === null) {
      throw new Error("failed to retrieve rendering context");
    }

    const size = settings.size * settings.blockSize;

    this.image = new Image(size, size);
    this.image.src = imageSrc;

    this.context = context;
    for (let i = 0; i < settings.size; i++) {
      const row = [];
      for (let j = 0; j < settings.size; j++) {
        row.push(i * settings.size + j);
      }
      this.blocks.push(row.shuffle());
    }
    this.blocks.shuffle();
    this.registerEvents();
  }

  private registerEvents(): void {
    this.addEventListener(MouseLeftClickEvent.EVENT_NAME, (event: Event) => {
      const evt = event as MouseLeftClickEvent;
      const { x, y } = evt.detail;

      this.clickPosition.position = { x, y };
    });

    this.addEventListener(GameResultWinEvent.EVENT_NAME, () => {
      this.onExit();
    });

    this.image?.addEventListener("load", () => {
      this.ready = true;
    });
  }

  private onUpdate(): void {
    if (!this.ready) {
      return;
    }

    const length = this.settings.size * this.settings.size;
    const emptyIndex = length - 1;

    this.clearCanvas();

    if (this.getResult() === Result.WIN) {
      this.renderBlocks(emptyIndex);
      this.dispatchEvent(new GameResultWinEvent());
      return;
    }

    clickAction: if (!this.clickPosition.consumed) {
      const { x, y } = this.clickPosition.position;
      const { row, col } = this.getBlockPosfromLocalPos(x, y);

      const condition = {
        emptyLeft:
          col <= 0 ? false : (this.blocks[row]?.[col - 1] ?? -1) >= emptyIndex,
        emptyRight:
          col >= this.settings.size - 1
            ? false
            : (this.blocks[row]?.[col + 1] ?? -1) >= emptyIndex,
        emptyBelow:
          row >= this.settings.size - 1
            ? false
            : (this.blocks[row + 1]?.[col] ?? -1) >= emptyIndex,
        emptyAbove:
          row <= 0 ? false : (this.blocks[row - 1]?.[col] ?? -1) >= emptyIndex,
      };

      const val = this.blocks[row]?.[col];

      if (
        typeof val === "undefined" ||
        (typeof val === "number" && val >= emptyIndex)
      ) {
        break clickAction;
      }

      if (condition.emptyBelow) {
        this.blocks[row + 1]![col] = val;
        this.blocks[row]![col] = emptyIndex;
      }

      if (condition.emptyAbove) {
        this.blocks[row - 1]![col] = val;
        this.blocks[row]![col] = emptyIndex;
      }

      if (condition.emptyLeft) {
        this.blocks[row]![col - 1] = val;
        this.blocks[row]![col] = emptyIndex;
      }

      if (condition.emptyRight) {
        this.blocks[row]![col + 1] = val;
        this.blocks[row]![col] = emptyIndex;
      }
    }

    this.renderBlocks(emptyIndex);
  }

  private renderBlocks(emptyIndex: number) {
    for (const [row, block] of this.blocks.entries()) {
      for (const [col, v] of block.entries()) {
        if (v < emptyIndex) {
          const { x, y } = this.getLocalPosFromBlockPos(row, col);
          const { row: r, col: c } = this.getBlockPosFromIndex(v);
          const { x: sx, y: sy } = this.getLocalPosFromBlockPos(r, c);

          this.drawBlock(x, y, sx, sy);
        }
      }
    }
  }

  private onExit() {
    this.running = false;
  }

  public start() {
    if (!this.running && typeof this.requestAnimationFrameId === "number") {
      cancelAnimationFrame(this.requestAnimationFrameId);
      return;
    }

    this.requestAnimationFrameId = requestAnimationFrame(() => {
      this.onUpdate();
      this.start();
    });
  }

  private getBlockPosfromLocalPos(
    x: number,
    y: number,
  ): { row: number; col: number } {
    const w = this.settings.blockSize;

    return {
      row: Math.floor(y / w),
      col: Math.floor(x / w),
    };
  }

  private getLocalPosFromBlockPos(
    row: number,
    col: number,
  ): { x: number; y: number } {
    const w = this.settings.blockSize;

    return {
      x: col * w,
      y: row * w,
    };
  }

  private getBlockPosFromIndex(index: number): { row: number; col: number } {
    const size = this.settings.size;

    return {
      row: Math.floor(index / size),
      col: index % size,
    };
  }

  public setImageSource(src: string) {
    if (this.image) {
      this.image.src = src;
    }
  }

  private drawBlock(x: number, y: number, sx: number, sy: number): void {
    if (this.image === null) {
      return;
    }
    const context = this.context;

    context.save();
    context.strokeStyle = this.settings.canvasBackground;
    context.lineWidth = 5;
    context.drawImage(
      this.image,
      sx,
      sy,
      this.settings.blockSize,
      this.settings.blockSize,
      x,
      y,
      this.settings.blockSize,
      this.settings.blockSize,
    );
    context.stroke();
    context.restore();
  }

  private clearCanvas(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private getResult(): Result {
    const win = this.blocks.flat().every((value: number, index: number) => {
      return value === index;
    });

    if (win) return Result.WIN;

    return Result.CONTINUE;
  }

  public solve() {
    for (const [i, blocks] of this.blocks.entries()) {
      for (let j = 0; j < blocks.length; j++) {
        blocks[j] = i * this.settings.size + j;
      }
    }
  }
}
