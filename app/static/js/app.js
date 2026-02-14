// ============================================
// NLP Training App - Main JavaScript
// ============================================

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/static/sw.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.log('SW registration failed:', err));
  });
}

// --- Rating Buttons ---
document.addEventListener('DOMContentLoaded', () => {
  // Score rating buttons
  document.querySelectorAll('.rating-group').forEach(group => {
    const input = group.dataset.input;
    const hiddenField = document.getElementById(input);

    group.querySelectorAll('.rating-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove selected from all
        group.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
        // Add selected to clicked
        btn.classList.add('selected');
        // Update hidden field
        if (hiddenField) {
          hiddenField.value = btn.dataset.value;
        }
      });
    });
  });

  // Mood slider value display
  document.querySelectorAll('.mood-slider').forEach(slider => {
    const display = document.getElementById(slider.dataset.display);
    if (display) {
      slider.addEventListener('input', () => {
        display.textContent = slider.value;
      });
    }
  });

  // Auto-dismiss flash messages after 4 seconds
  document.querySelectorAll('.flash').forEach(flash => {
    setTimeout(() => {
      flash.style.opacity = '0';
      flash.style.transition = 'opacity 0.5s';
      setTimeout(() => flash.remove(), 500);
    }, 4000);
  });
});

// --- Progress Chart (using simple canvas) ---
function drawProgressChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !data || data.labels.length === 0) return;

  const ctx = canvas.getContext('2d');
  const padding = 40;
  const width = canvas.width;
  const height = canvas.height;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 10; i++) {
    const y = padding + (chartHeight / 10) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  // Y-axis labels
  ctx.fillStyle = '#8892a4';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 10; i += 2) {
    const y = padding + chartHeight - (chartHeight / 10) * i;
    ctx.fillText(i.toString(), padding - 8, y + 4);
  }

  // Data points and line
  if (data.scores.length > 0) {
    const stepX = chartWidth / Math.max(data.scores.length - 1, 1);

    // Line
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.scores.forEach((score, i) => {
      const x = padding + stepX * i;
      const y = padding + chartHeight - (chartHeight / 10) * score;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
    data.scores.forEach((score, i) => {
      const x = padding + stepX * i;
      const y = padding + chartHeight - (chartHeight / 10) * score;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#e94560';
      ctx.fill();
    });

    // X-axis labels
    ctx.fillStyle = '#8892a4';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(data.labels.length / 8));
    data.labels.forEach((label, i) => {
      if (i % labelStep === 0) {
        const x = padding + stepX * i;
        ctx.fillText(label, x, height - 10);
      }
    });
  }
}

// Load chart data if on dashboard
document.addEventListener('DOMContentLoaded', () => {
  const chartCanvas = document.getElementById('progressChart');
  if (chartCanvas) {
    // Set canvas size for mobile
    chartCanvas.width = Math.min(window.innerWidth - 64, 440);
    chartCanvas.height = 200;

    fetch('/progress/api/chart-data')
      .then(res => res.json())
      .then(data => drawProgressChart('progressChart', data))
      .catch(err => console.log('Chart error:', err));
  }
});
