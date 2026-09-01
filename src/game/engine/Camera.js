/**
 * Câmera Dinâmica de Jogo de Luta
 * - Mantém ambos os lutadores enquadrados
 * - Zoom suave dependendo da distância entre os personagens
 * - Efeito de Screenshake ajustável para impactos
 */

export class Camera {
  constructor(viewportWidth = 1280, viewportHeight = 720) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.targetZoom = 1;

    // Screenshake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // Limites do cenário
    this.minX = 0;
    this.maxX = 2000;
    this.minY = -200;
    this.maxY = 720;
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  addShake(intensity = 10, duration = 0.2) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  update(f1, f2, dt = 1 / 60) {
    // 1. Atualizar Screenshake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeIntensity *= 0.9;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeIntensity = 0;
    }

    if (!f1 || !f2) return;

    // 2. Ponto médio entre os lutadores
    const midX = (f1.position.x + f2.position.x) / 2;
    const midY = Math.min((f1.position.y + f2.position.y) / 2 - 40, 480);

    // 3. Distância entre eles para calcular o Zoom dinâmico
    const dist = Math.abs(f1.position.x - f2.position.x);
    const minZoom = 0.85;
    const maxZoom = 1.25;
    const zoomFactor = 1 - (dist / 1400);
    this.targetZoom = Math.min(maxZoom, Math.max(minZoom, zoomFactor));

    // Suavização do Zoom (lerp)
    this.zoom += (this.targetZoom - this.zoom) * 0.08;

    // 4. Suavização da Posição da Câmera (lerp)
    const targetCamX = midX - (this.viewportWidth / (2 * this.zoom));
    const targetCamY = midY - (this.viewportHeight / (2 * this.zoom));

    this.x += (targetCamX - this.x) * 0.1;
    this.y += (targetCamY - this.y) * 0.1;

    // 5. Restringir aos limites da arena
    const maxCamX = this.maxX - (this.viewportWidth / this.zoom);
    this.x = Math.max(this.minX, Math.min(maxCamX, this.x));
  }

  applyTransform(ctx) {
    ctx.save();
    // Centralizar transformação com zoom
    ctx.translate(
      this.viewportWidth / 2 + this.shakeOffsetX,
      this.viewportHeight / 2 + this.shakeOffsetY
    );
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(
      -(this.x + (this.viewportWidth / (2 * this.zoom))),
      -(this.y + (this.viewportHeight / (2 * this.zoom)))
    );
  }

  restoreTransform(ctx) {
    ctx.restore();
  }
}
