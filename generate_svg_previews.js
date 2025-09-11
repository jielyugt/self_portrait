const fs = require('fs');
const path = require('path');

// SVG generator for face previews - flexible path support
function generateSVGPreview(faceData, faceNumber, outputDir = './faces_v2') {
  const width = 400;
  const height = 400;
  const size = width * 0.8;
  const cx = width / 2;
  const cy = height / 2;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="white"/>
    <g stroke="#333" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
`;

  // Function to convert normalized coordinates to SVG coordinates
  function toSVG(x, y) {
    return {
      x: cx + (x - 0.5) * size,
      y: cy + (y - 0.5) * size
    };
  }

  // Function to create path from points
  function createPath(points, closed = false) {
    if (!points || points.length === 0) return '';

    let path = 'M';
    points.forEach(([x, y], i) => {
      const point = toSVG(x, y);
      if (i === 0) {
        path += `${point.x},${point.y}`;
      } else {
        path += ` L${point.x},${point.y}`;
      }
    });

    if (closed) path += ' Z';
    return path;
  }

  // Add face outline
  if (faceData.face && faceData.face.length > 0) {
    const facePath = createPath(faceData.face, true);
    svg += `        <path d="${facePath}" stroke-width="4"/>\n`;
  }

  // Add left eye
  if (faceData.left_eye && faceData.left_eye.length > 0) {
    const eyePath = createPath(faceData.left_eye, false);
    svg += `        <path d="${eyePath}" stroke-width="3"/>\n`;
  }

  // Add right eye
  if (faceData.right_eye && faceData.right_eye.length > 0) {
    const eyePath = createPath(faceData.right_eye, false);
    svg += `        <path d="${eyePath}" stroke-width="3"/>\n`;
  }

  // Add mouth
  if (faceData.mouth && faceData.mouth.length > 0) {
    const mouthPath = createPath(faceData.mouth, false);
    svg += `        <path d="${mouthPath}" stroke-width="3"/>\n`;
  }

  svg += `    </g>
    <text x="20" y="30" font-family="Arial" font-size="18" fill="#666">Face ${faceNumber}</text>
</svg>`;

  return svg;
}

// Generate SVG previews with flexible path support
function generateSVGPreviews(facesPath = './faces_v2') {
  console.log(`🎨 Generating SVG previews from ${facesPath}...\n`);

  // Ensure output directory exists
  if (!fs.existsSync(facesPath)) {
    console.error(`❌ Directory ${facesPath} does not exist!`);
    return;
  }

  for (let i = 1; i <= 6; i++) {
    const jsonPath = path.join(facesPath, `face_${i}.json`);
    const svgPath = path.join(facesPath, `face_${i}.svg`);

    try {
      const faceData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const svg = generateSVGPreview(faceData, i, facesPath);
      fs.writeFileSync(svgPath, svg);

      console.log(`✅ Generated SVG for face ${i}`);
      console.log(`📁 Saved to: ${svgPath}`);
    } catch (error) {
      console.error(`❌ Error processing face ${i}:`, error.message);
    }
  }

  console.log('\n🎉 SVG generation complete!');
}

// Command line usage: node generate_svg_previews.js [path]
const facesPath = process.argv[2];
if (!facesPath) {
  console.error('❌ Please provide a folder path for faces (e.g. faces_v2 or faces_v3)');
  console.error('Usage: node generate_svg_previews.js <faces_folder>');
  process.exit(1);
}
generateSVGPreviews(facesPath);
