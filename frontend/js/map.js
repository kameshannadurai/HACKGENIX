/**
 * SyncField Offline Tactical Vector Map
 * Renders an offline GPS coordinate grid with live pin, crosshairs,
 * click-to-pin coordinate setting, and hardware sensor telemetry.
 * Styled in Electric Cyan & Deep Obsidian Mission Control.
 */

class OfflineGpsMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.lat = 34.0522;
    this.lon = -118.2437;
    this.accuracy = 3.2;
    this.zoom = 1;
    this.targetAsset = 'Panel #47 (Mojave Sector 7)';
    this.onLocationChanged = null;

    if (this.canvas) {
      this.bindEvents();
      this.render();
    }
  }

  bindEvents() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert pixel delta to lat/lon offset
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;

      const dLat = (cy - y) * 0.0003;
      const dLon = (x - cx) * 0.0003;

      this.lat = Number((this.lat + dLat).toFixed(5));
      this.lon = Number((this.lon + dLon).toFixed(5));

      this.render();
      if (this.onLocationChanged) {
        this.onLocationChanged(this.lat, this.lon, this.accuracy);
      }
    });
  }

  setLocation(lat, lon, accuracy = 3.2, label = '') {
    this.lat = Number(lat);
    this.lon = Number(lon);
    this.accuracy = accuracy;
    if (label) this.targetAsset = label;
    this.render();
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Clear background: deep obsidian black
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, w, h);

    // 1. Grid lines (Latitude / Longitude meridians)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    const gridSize = 36;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Tactical Field Topography / Asset footprint simulation
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.lineWidth = 1.5;

    // Solar array / field sectors
    ctx.strokeRect(cx - 110, cy - 60, 90, 50);
    ctx.strokeRect(cx + 20, cy - 60, 90, 50);
    ctx.strokeRect(cx - 110, cy + 10, 90, 50);
    ctx.strokeRect(cx + 20, cy + 10, 90, 50);

    ctx.fillStyle = 'rgba(0, 229, 255, 0.06)';
    ctx.fillRect(cx - 110, cy - 60, 90, 50);
    ctx.fillRect(cx + 20, cy - 60, 90, 50);
    ctx.fillRect(cx - 110, cy + 10, 90, 50);
    ctx.fillRect(cx + 20, cy + 10, 90, 50);

    // Sector labels
    ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.font = '9px monospace';
    ctx.fillText('SECTOR 7-A', cx - 100, cy - 40);
    ctx.fillText('SECTOR 7-B', cx + 30, cy - 40);
    ctx.fillText('SECTOR 7-C', cx - 100, cy + 30);
    ctx.fillText('SECTOR 7-D', cx + 30, cy + 30);

    // 3. Accuracy circle around target
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Center Crosshairs
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx, cy + 20);
    ctx.stroke();

    // 5. GPS Pin
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 6. Coordinates Overlay & Compass
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText(`N ${this.lat.toFixed(4)}°`, 12, 20);
    ctx.fillText(`W ${Math.abs(this.lon).toFixed(4)}°`, 12, 34);

    // Compass symbol in top right
    ctx.strokeStyle = '#00e5ff';
    ctx.strokeRect(w - 26, 10, 18, 18);
    ctx.fillStyle = '#00e5ff';
    ctx.font = '9px monospace';
    ctx.fillText('N', w - 21, 23);

    // Bottom banner
    ctx.fillStyle = 'rgba(6, 9, 17, 0.85)';
    ctx.fillRect(0, h - 22, w, 22);
    ctx.fillStyle = '#00e5ff';
    ctx.font = '10px monospace';
    ctx.fillText(`OFFLINE GPS LOCKED • ${this.targetAsset} • ACCURACY ±${this.accuracy}m`, 10, h - 7);
  }
}

window.OfflineGpsMap = OfflineGpsMap;
