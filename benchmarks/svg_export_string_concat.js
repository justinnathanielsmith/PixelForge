// benchmark_svg.js

const ITERATIONS = 100;
const WIDTH = 1000;
const HEIGHT = 1000;

// Create dummy image data
const length = WIDTH * HEIGHT * 4;
const data = new Uint8ClampedArray(length);

// Fill with some pattern to simulate real image (not just zeros)
for (let i = 0; i < length; i += 4) {
    if (Math.random() > 0.5) {
        data[i] = Math.floor(Math.random() * 256); // R
        data[i + 1] = Math.floor(Math.random() * 256); // G
        data[i + 2] = Math.floor(Math.random() * 256); // B
        data[i + 3] = Math.floor(Math.random() * 256); // A
    } else {
         // Transparent
        data[i + 3] = 0;
    }
}

function oldMethod(data, finalW, finalH) {
    let rects = '';

    for (let y = 0; y < finalH; y++) {
      let startX = 0;
      let currentFill = null;
      let currentOpacity = null;

      for (let x = 0; x < finalW; x++) {
        const i = (y * finalW + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) {
          if (currentFill !== null) {
            rects += `<rect x="${startX}" y="${y}" width="${x - startX}" height="1" fill="${currentFill}"${currentOpacity ? ` fill-opacity="${currentOpacity}"` : ''}/>`;
            currentFill = null;
            currentOpacity = null;
          }
          continue;
        }

        const fill = `rgb(${r},${g},${b})`;
        const opacity = a < 255 ? (a / 255).toFixed(3) : null;

        if (fill !== currentFill || opacity !== currentOpacity) {
          if (currentFill !== null) {
             rects += `<rect x="${startX}" y="${y}" width="${x - startX}" height="1" fill="${currentFill}"${currentOpacity ? ` fill-opacity="${currentOpacity}"` : ''}/>`;
          }
          currentFill = fill;
          currentOpacity = opacity;
          startX = x;
        }
      }
      if (currentFill !== null) {
        rects += `<rect x="${startX}" y="${y}" width="${finalW - startX}" height="1" fill="${currentFill}"${currentOpacity ? ` fill-opacity="${currentOpacity}"` : ''}/>`;
      }
    }
    return rects;
}

function newMethod(data, finalW, finalH) {
    const rects = []; // Array instead of string

    for (let y = 0; y < finalH; y++) {
      let startX = 0;
      let currentFill = null;
      let currentOpacity = null;

      for (let x = 0; x < finalW; x++) {
        const i = (y * finalW + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) {
          if (currentFill !== null) {
            rects.push(`<rect x="${startX}" y="${y}" width="${x - startX}" height="1" fill="${currentFill}"${currentOpacity ? ` fill-opacity="${currentOpacity}"` : ''}/>`);
            currentFill = null;
            currentOpacity = null;
          }
          continue;
        }

        const fill = `rgb(${r},${g},${b})`;
        const opacity = a < 255 ? (a / 255).toFixed(3) : null;

        if (fill !== currentFill || opacity !== currentOpacity) {
          if (currentFill !== null) {
             rects.push(`<rect x="${startX}" y="${y}" width="${x - startX}" height="1" fill="${currentFill}"${currentOpacity ? ` fill-opacity="${currentOpacity}"` : ''}/>`);
          }
          currentFill = fill;
          currentOpacity = opacity;
          startX = x;
        }
      }
      if (currentFill !== null) {
        rects.push(`<rect x="${startX}" y="${y}" width="${finalW - startX}" height="1" fill="${currentFill}"${currentOpacity ? ` fill-opacity="${currentOpacity}"` : ''}/>`);
      }
    }
    return rects.join('');
}

console.log('Starting benchmark...');

// Warmup
for (let i = 0; i < 2; i++) {
    oldMethod(data, WIDTH, HEIGHT);
    newMethod(data, WIDTH, HEIGHT);
}

const startOld = performance.now();
for (let i = 0; i < 10; i++) { // Fewer iterations as it might be slow
    oldMethod(data, WIDTH, HEIGHT);
}
const endOld = performance.now();
console.log(`Old method (String Concat): ${(endOld - startOld).toFixed(2)}ms`);

const startNew = performance.now();
for (let i = 0; i < 10; i++) {
    newMethod(data, WIDTH, HEIGHT);
}
const endNew = performance.now();
console.log(`New method (Array Join): ${(endNew - startNew).toFixed(2)}ms`);
