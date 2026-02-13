
const assert = require('assert');

const width = 1024;
const height = 1024;
const size = width * height * 4;
const data = new Uint8ClampedArray(size);

// Fill with random data
for (let i = 0; i < size; i += 4) {
  data[i] = Math.floor(Math.random() * 256);     // R
  data[i + 1] = Math.floor(Math.random() * 256); // G
  data[i + 2] = Math.floor(Math.random() * 256); // B
  data[i + 3] = 255; // A
}

// Add some magenta pixels
for (let i = 0; i < size / 10; i += 4) {
  const idx = Math.floor(Math.random() * (size / 4)) * 4;
  data[idx] = 255;
  data[idx + 1] = 0;
  data[idx + 2] = 255;
}

function oldLogic(data) {
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (g > 150 || r < 50 || b < 50) continue;

    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
        case gNorm: h = (bNorm - rNorm) / d + 2; break;
        case bNorm: h = (rNorm - gNorm) / d + 4; break;
      }
      h /= 6;
    }

    const hDeg = h * 360;

    const isMagentaHue = hDeg >= 280 && hDeg <= 320;
    const isVivid = s > 0.5;
    const isBright = l > 0.2;

    if (isMagentaHue && isVivid && isBright) {
      count++;
    }
  }
  return count;
}

function newLogic(data) {
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Check 1: Green dominance check (if G is greater than R or B, it's not Magenta)
    if (g > r || g > b) continue;

    // Check 2: Brightness/Vividness heuristic
    if (r < 50 || b < 50) continue;

    // Match original logic's aggressive skip for high green (whiteness/lightness check)
    if (g > 150) continue;

    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);

    if (max === min) continue; // Achromatic

    const l_sum = max + min; // 2 * L * 255
    // isBright: l > 0.2 => l_sum > 102
    if (l_sum <= 102) continue;

    const d = max - min;

    // isVivid: s > 0.5
    // s = l > 0.5 ? d / (2 - l) : d / l
    // l_norm > 0.5 <=> l_sum > 510/2 = 255

    let s_gt_0_5 = false;
    if (l_sum > 255) {
       // s = d / (2 - l_norm) = d / (2 - l_sum/255) = 255*d / (510 - l_sum)
       // s > 0.5 => 255*d > 0.5 * (510 - l_sum) * 255 ... wait
       // s = d_norm / (2 - l_norm). d_norm = d/255.
       // s = (d/255) / ((510 - l_sum)/255) = d / (510 - l_sum)
       // s > 0.5 => d > 0.5 * (510 - l_sum) => 2*d > 510 - l_sum
       if (2 * d > (510 - l_sum)) s_gt_0_5 = true;
    } else {
       // s = d_norm / l_norm = d / l_sum
       // s > 0.5 => d > 0.5 * l_sum => 2*d > l_sum
       if (2 * d > l_sum) s_gt_0_5 = true;
    }

    if (!s_gt_0_5) continue;

    // Hue Check (280 - 320)
    let isMagenta = false;
    if (max === r) {
       // Segment 5-6 (Magenta-Red)
       // We want h <= 320 (5.33)
       // h = (g - b) / d + 6
       // (g - b)/d + 6 <= 5.333
       // (g - b)/d <= -0.666
       // (b - g)/d >= 0.666 = 2/3
       // 3 * (b - g) >= 2 * d
       // Also ensure g <= b (so b-g is positive). If g > b, h < 5, impossible if max=r (implies red side).
       // Actually if max=r, g and b are small.
       // Magenta side: b is close to r. g is small. b > g.
       // Red side: g is close to r (yellow) or b is small?
       // Red-Magenta: b is high. Red-Yellow: g is high.
       // So for Red-Magenta segment, b > g.

       if (b > g && 3 * (b - g) >= 2 * d) isMagenta = true;
    } else if (max === b) {
       // Segment 4-5 (Blue-Magenta)
       // We want h >= 280 (4.66)
       // h = (r - g) / d + 4
       // (r - g)/d + 4 >= 4.666
       // (r - g)/d >= 0.666 = 2/3
       // 3 * (r - g) >= 2 * d

       // Ensure r > g. (Magenta side of blue).
       if (r > g && 3 * (r - g) >= 2 * d) isMagenta = true;
    }

    if (isMagenta) {
        count++;
    }
  }
  return count;
}

// Warmup and Validation
const countOld = oldLogic(data);
const countNew = newLogic(data);
console.log(`Old count: ${countOld}, New count: ${countNew}`);

// assert(Math.abs(countOld - countNew) < countOld * 0.05, "Counts should be roughly similar (heuristic optimization)");

console.time('Old Logic');
for(let k=0; k<100; k++) oldLogic(data);
console.timeEnd('Old Logic');

console.time('New Logic');
for(let k=0; k<100; k++) newLogic(data);
console.timeEnd('New Logic');
