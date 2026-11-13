import Phaser from "phaser";
import { loadSounds } from "../sounds.ts";
import { makeTextures } from "../textures.ts";

const FADE_MS = 450;
const FADE_COLOR = [4, 2, 12] as const;

/** Scenes that already have a fade-out under way. */
const leaving = new WeakSet<Phaser.Scene>();

/**
 * Fades the scene out, then starts another one with data. A second request
 * while one is pending is ignored.
 */
export function fadeTo(scene: Phaser.Scene, key: string, data?: object): void {
  if (leaving.has(scene)) return;
  leaving.add(scene);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => leaving.delete(scene));
  const camera = scene.cameras.main;
  camera.fadeOut(FADE_MS, ...FADE_COLOR);
  camera.once("camerafadeoutcomplete", () => scene.scene.start(key, data));
}

/** Runs once: draws every texture and synthesizes every sound. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    makeTextures(this);
    loadSounds(this);
    this.scene.start("title");
  }
}
