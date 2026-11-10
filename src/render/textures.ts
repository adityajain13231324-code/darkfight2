import { Texture } from 'pixi.js';

export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): Texture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  return Texture.from(c);
}

/** Soft white blob, for fog and glows (tint it). */
export function softBlob(size = 256, falloff = 1): Texture {
  return canvasTexture(size, size, (ctx) => {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35 * falloff, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  });
}

export function verticalGradient(stops: [number, string][], h = 512): Texture {
  return canvasTexture(4, h, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    for (const [o, c] of stops) g.addColorStop(o, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, h);
  });
}

export function vignette(): Texture {
  return canvasTexture(512, 512, (ctx) => {
    const g = ctx.createRadialGradient(256, 256, 120, 256, 256, 362);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  });
}

export function grain(): Texture {
  return canvasTexture(256, 256, (ctx) => {
    const img = ctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
}
