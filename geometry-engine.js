(function () {
  const WIDTH = 1100;
  const HEIGHT = 760;
  const CX = WIDTH / 2;
  const CY = HEIGHT / 2;
  const TAU = Math.PI * 2;
  const UI_FONT = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';
  const PALETTE = {
    Ink: "#20231f",
    Moss: "#536b57",
    Water: "#456c7c",
    Clay: "#9b6048",
    Sand: "#beb7a7",
    Paper: "#f8f5eb"
  };
  const imageCache = new Map();
  const rasterCanvasCache = new Map();
  const rasterDataUrlCache = new Map();
  const weatheringCache = new Map();
  const CACHE_LIMIT = 24;

  const paperScope = window.paper ? new paper.PaperScope() : null;
  if (paperScope) {
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    paperScope.setup(canvas);
  }

  function noise(seed, index) {
    const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453123;
    return value - Math.floor(value);
  }

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function normalize(x, y) {
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  }

  function createTextShape(options, seed) {
    const text = (options.text || "NOMADIC").trim() || "NOMADIC";
    const font = options.font || "Georgia";
    const requestedSize = Number(options.size || 154);
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const size = fitTextSize(ctx, text, font, requestedSize);
    const baseline = CY + size * 0.04;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#000";
    ctx.font = `800 ${size}px ${font}, Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, CX, baseline);

    const image = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
    const fill = [];
    const boundary = [];
    let minX = WIDTH;
    let minY = HEIGHT;
    let maxX = 0;
    let maxY = 0;

    const alphaAt = (x, y) => {
      if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return 0;
      return image[(Math.round(y) * WIDTH + Math.round(x)) * 4 + 3];
    };

    for (let y = 80; y < HEIGHT - 80; y += 3) {
      for (let x = 70; x < WIDTH - 70; x += 3) {
        const alpha = alphaAt(x, y);
        if (alpha < 24) continue;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        if (noise(seed, x * 0.17 + y * 0.23) > 0.35) {
          fill.push(point(x, y, 0, -1, "interior"));
        }

        const edge =
          alphaAt(x - 5, y) < 24 ||
          alphaAt(x + 5, y) < 24 ||
          alphaAt(x, y - 5) < 24 ||
          alphaAt(x, y + 5) < 24;

        if (edge) {
          const gx = alphaAt(x - 4, y) - alphaAt(x + 4, y);
          const gy = alphaAt(x, y - 4) - alphaAt(x, y + 4);
          const normal = normalize(gx || x - CX, gy || y - CY);
          boundary.push(point(x, y, normal.x, normal.y, "boundary"));
        }
      }
    }

    const bounds = normalizeBounds({ minX, minY, maxX, maxY });
    const guides = createTextGuides(alphaAt, bounds, seed);

    if (!boundary.length) {
      boundary.push(point(CX, CY, 0, -1, "boundary"));
    }

    return {
      ngType: "Shape",
      kind: "text",
      label: `Text: ${text}`,
      text,
      font,
      size,
      showBody: options.body !== "Hide",
      layout: { x: CX, y: baseline, size, font },
      bounds,
      fill,
      boundary,
      guides,
      contours: [],
      history: [`Text Shape(${font})`],
      stats: {
        boundary: boundary.length,
        fill: fill.length,
        guides: guides.length,
        font,
        text
      }
    };
  }

  function fitTextSize(ctx, text, font, requestedSize) {
    let size = requestedSize;
    while (size > 42) {
      ctx.font = `800 ${size}px ${font}, Georgia, serif`;
      if (ctx.measureText(text).width <= 980) return size;
      size -= 4;
    }
    return size;
  }

  function createTextGuides(alphaAt, bounds, seed) {
    const guides = [];
    const left = Math.max(60, Math.floor(bounds.minX) - 8);
    const right = Math.min(WIDTH - 60, Math.ceil(bounds.maxX) + 8);
    const top = Math.max(60, Math.floor(bounds.minY) - 8);
    const bottom = Math.min(HEIGHT - 60, Math.ceil(bounds.maxY) + 8);

    for (let y = top; y <= bottom; y += 7) {
      let runStart = null;
      for (let x = left; x <= right; x += 3) {
        const inside = alphaAt(x, y) > 24;
        if (inside && runStart === null) runStart = x;
        if ((!inside || x >= right) && runStart !== null) {
          const runEnd = inside ? x : x - 3;
          if (runEnd - runStart > 12) guides.push(textGuidePath(runStart, runEnd, y, seed, guides.length));
          runStart = null;
        }
      }
    }

    return decimate(guides.filter((path) => path.length > 1), 180);
  }

  function textGuidePath(startX, endX, y, seed, index) {
    const path = [];
    const width = endX - startX;
    const segments = Math.max(2, Math.min(12, Math.round(width / 14)));
    for (let step = 0; step <= segments; step += 1) {
      const t = step / segments;
      path.push({
        x: lerp(startX, endX, t),
        y: y + (noise(seed, index * 19 + step) - 0.5) * 1.8
      });
    }
    return path;
  }

  function createCircleShape(options) {
    const radius = Number(options.radius || 210);
    const segments = Math.max(12, Math.round(Number(options.segments || 96)));
    const contour = Array.from({ length: segments }, (_, index) => {
      const angle = (index / segments) * TAU;
      return point(CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius, Math.cos(angle), Math.sin(angle), "boundary");
    });

    const fill = [];
    for (let y = CY - radius; y <= CY + radius; y += 8) {
      for (let x = CX - radius; x <= CX + radius; x += 8) {
        const dx = x - CX;
        const dy = y - CY;
        if (dx * dx + dy * dy <= radius * radius) {
          const normal = normalize(dx, dy);
          fill.push(point(x, y, normal.x, normal.y, "interior"));
        }
      }
    }

    return {
      ngType: "Shape",
      kind: "circle",
      label: "Circle",
      radius,
      showBody: options.body !== "Hide",
      bounds: { minX: CX - radius, minY: CY - radius, maxX: CX + radius, maxY: CY + radius },
      fill,
      boundary: contour,
      contours: [contour],
      history: ["Circle Shape"],
      stats: {
        radius: Math.round(radius),
        segments,
        boundary: contour.length,
        fill: fill.length
      }
    };
  }

  function createRectangleShape(options) {
    const width = Number(options.width || 560);
    const height = Number(options.height || 320);
    const x0 = CX - width / 2;
    const y0 = CY - height / 2;
    const vertices = [
      { x: x0, y: y0 },
      { x: x0 + width, y: y0 },
      { x: x0 + width, y: y0 + height },
      { x: x0, y: y0 + height }
    ];
    const contour = sampleClosedPolyline(vertices, 6).map((pt) => {
      const normal = normalize(pt.x - CX, pt.y - CY);
      return point(pt.x, pt.y, normal.x, normal.y, "boundary");
    });
    const fill = [];

    for (let y = y0; y <= y0 + height; y += 8) {
      for (let x = x0; x <= x0 + width; x += 8) {
        const normal = normalize(x - CX, y - CY);
        fill.push(point(x, y, normal.x, normal.y, "interior"));
      }
    }

    return {
      ngType: "Shape",
      kind: "rectangle",
      label: "Rectangle",
      width,
      height,
      showBody: options.body !== "Hide",
      bounds: { minX: x0, minY: y0, maxX: x0 + width, maxY: y0 + height },
      fill,
      boundary: contour,
      contours: [contour],
      history: ["Rectangle Shape"],
      stats: {
        width: Math.round(width),
        height: Math.round(height),
        boundary: contour.length,
        fill: fill.length
      }
    };
  }

  function createPolygonShape(options) {
    const sides = Math.max(3, Math.round(Number(options.sides || 6)));
    const radius = Number(options.radius || 260);
    const vertices = Array.from({ length: sides }, (_, index) => {
      const angle = -Math.PI / 2 + (index / sides) * TAU;
      return { x: CX + Math.cos(angle) * radius, y: CY + Math.sin(angle) * radius };
    });
    const contour = sampleClosedPolyline(vertices, 6).map((pt) => {
      const normal = normalize(pt.x - CX, pt.y - CY);
      return point(pt.x, pt.y, normal.x, normal.y, "boundary");
    });
    const bounds = normalizeBounds({
      minX: Math.min(...vertices.map((pt) => pt.x)),
      minY: Math.min(...vertices.map((pt) => pt.y)),
      maxX: Math.max(...vertices.map((pt) => pt.x)),
      maxY: Math.max(...vertices.map((pt) => pt.y))
    });
    const fill = [];

    for (let y = bounds.minY; y <= bounds.maxY; y += 8) {
      for (let x = bounds.minX; x <= bounds.maxX; x += 8) {
        if (!pointInPolygon({ x, y }, vertices)) continue;
        const normal = normalize(x - CX, y - CY);
        fill.push(point(x, y, normal.x, normal.y, "interior"));
      }
    }

    return {
      ngType: "Shape",
      kind: "polygon",
      label: `${sides}-Sided Polygon`,
      sides,
      radius,
      showBody: options.body !== "Hide",
      bounds,
      fill,
      boundary: contour,
      contours: [contour],
      history: [`Polygon Shape(${sides})`],
      stats: {
        sides,
        radius: Math.round(radius),
        boundary: contour.length,
        fill: fill.length
      }
    };
  }

  function createSvgShape(options) {
    const rawPath = extractSvgPathData(options.path || "");
    const parsed = normalizeSvgPaths(parseSvgPathData(rawPath));
    if (!parsed.length) return null;
    return shapeFromContours(parsed, "SVG Input", "svg", options.body !== "Hide", ["SVG Input"]);
  }

  function createRandomPoints(options, seed) {
    const count = Math.round(Number(options.count || 240));
    const spread = Number(options.spread || 360);
    const distribution = options.distribution || "Scatter";
    const points = [];

    for (let index = 0; index < count; index += 1) {
      let x;
      let y;
      if (distribution === "Ring") {
        const angle = noise(seed, index * 3 + 1) * TAU;
        const radius = spread * (0.62 + (noise(seed, index * 7 + 2) - 0.5) * 0.22);
        x = CX + Math.cos(angle) * radius;
        y = CY + Math.sin(angle) * radius;
      } else if (distribution === "Route") {
        const t = count <= 1 ? 0 : index / (count - 1);
        x = CX + (t - 0.5) * spread * 1.65 + (noise(seed, index * 11 + 5) - 0.5) * spread * 0.16;
        y = CY + Math.sin(t * TAU * 1.4 + seed) * spread * 0.2 + (noise(seed, index * 13 + 8) - 0.5) * spread * 0.22;
      } else {
        const angle = noise(seed, index * 5 + 1) * TAU;
        const radius = Math.sqrt(noise(seed, index * 7 + 3)) * spread;
        x = CX + Math.cos(angle) * radius;
        y = CY + Math.sin(angle) * radius;
      }
      const normal = normalize(x - CX, y - CY);
      points.push(point(x, y, normal.x, normal.y, "seed"));
    }

    return {
      ngType: "PointSet",
      label: `Random Points(${distribution})`,
      shapeKind: "random",
      sourceShape: null,
      points,
      bounds: boundsFromPoints(points),
      history: [`Random Points(${distribution})`],
      stats: {
        points: points.length,
        distribution,
        spread: Math.round(spread)
      }
    };
  }

  function createImageLayer(options) {
    const pixels = options.pixels || [];
    const cols = Number(options.cols || 0);
    const rows = Number(options.rows || 0);
    const originalWidth = Number(options.originalWidth || cols || 1);
    const originalHeight = Number(options.originalHeight || rows || 1);
    if (!options.dataUrl && (!pixels.length || !cols || !rows)) return null;

    const scaleValue = Number(options.scale || 100);
    const scale = Math.max(0.01, scaleValue / 100);
    const baseScale = Math.min((WIDTH - 220) / originalWidth, (HEIGHT - 180) / originalHeight);
    const physicalWidth = originalWidth * baseScale * scale;
    const physicalHeight = originalHeight * baseScale * scale;
    const opacity = clamp(Number(options.opacity ?? 100) / 100);

    return {
      ngType: "Image",
      label: options.label || "Image Input",
      dataUrl: options.dataUrl || null,
      pixels,
      cols,
      rows,
      originalWidth,
      originalHeight,
      width: physicalWidth,
      height: physicalHeight,
      originX: CX - physicalWidth / 2,
      originY: CY - physicalHeight / 2,
      opacity,
      blendMode: options.blend || "Normal",
      scale: scaleValue,
      history: ["Image Input"],
      stats: {
        width: Math.round(originalWidth),
        height: Math.round(originalHeight),
        scale: Math.round(scaleValue),
        opacity: Math.round(opacity * 100),
        blend: options.blend || "Normal"
      }
    };
  }

  function createImageField(options) {
    const pixels = options.pixels || [];
    const cols = Number(options.cols || 0);
    const rows = Number(options.rows || 0);
    if (!pixels.length || !cols || !rows) return null;

    const channel = options.channel || "Luma";
    const contrast = Number(options.contrast || 62) / 50;
    const scale = Math.max(0.01, Number(options.scale || 100) / 100);
    const baseScale = Math.min((WIDTH - 220) / cols, (HEIGHT - 180) / rows);
    const physicalWidth = cols * baseScale * scale;
    const physicalHeight = rows * baseScale * scale;
    const values = [];
    for (let index = 0; index < cols * rows; index += 1) {
      const offset = index * 4;
      const r = (pixels[offset] || 0) / 255;
      const g = (pixels[offset + 1] || 0) / 255;
      const b = (pixels[offset + 2] || 0) / 255;
      const a = (pixels[offset + 3] ?? 255) / 255;
      let value = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (channel === "Red") value = r;
      if (channel === "Green") value = g;
      if (channel === "Blue") value = b;
      if (channel === "Alpha") value = a;
      value = clamp((value - 0.5) * contrast + 0.5);
      values.push(options.invert === "On" ? 1 - value : value);
    }

    return {
      ngType: "Field",
      label: options.label || "Image Input",
      sourceShape: null,
      cols,
      rows,
      width: physicalWidth,
      height: physicalHeight,
      originX: CX - physicalWidth / 2,
      originY: CY - physicalHeight / 2,
      values,
      history: [`Image Input(${channel})`],
      stats: {
        cells: cols * rows,
        channel,
        invert: options.invert || "Off",
        contrast: Math.round(contrast * 50),
        scale: Math.round(scale * 100)
      }
    };
  }

  function imageToField(image, options = {}) {
    if (!isType(image, "Image")) return null;
    const sampled = resampleImageForField(image, 112);
    const field = createImageField({
      pixels: sampled.pixels,
      cols: sampled.cols,
      rows: sampled.rows,
      label: image.label,
      channel: options.channel,
      invert: options.invert,
      contrast: options.contrast,
      scale: image.scale || 100
    });
    if (!field) return null;
    return {
      ...field,
      originX: image.originX,
      originY: image.originY,
      width: image.width,
      height: image.height,
      label: `${image.label || "Image"} / Field`,
      history: (image.history || ["Image Input"]).concat([`Image To Field(${options.channel || "Luma"})`])
    };
  }

  function resampleImageForField(image, maxSide) {
    if (!image?.pixels?.length || !image.cols || !image.rows) return { pixels: [], cols: 0, rows: 0 };
    const aspect = image.cols / Math.max(1, image.rows);
    const cols = aspect >= 1 ? maxSide : Math.max(12, Math.round(maxSide * aspect));
    const rows = aspect >= 1 ? Math.max(12, Math.round(maxSide / aspect)) : maxSide;
    if (cols === image.cols && rows === image.rows) {
      return { pixels: image.pixels, cols: image.cols, rows: image.rows };
    }
    const pixels = new Uint8ClampedArray(cols * rows * 4);
    for (let y = 0; y < rows; y += 1) {
      const sy = Math.min(image.rows - 1, Math.floor((y / Math.max(1, rows - 1)) * (image.rows - 1)));
      for (let x = 0; x < cols; x += 1) {
        const sx = Math.min(image.cols - 1, Math.floor((x / Math.max(1, cols - 1)) * (image.cols - 1)));
        const source = (sy * image.cols + sx) * 4;
        const target = (y * cols + x) * 4;
        pixels[target] = image.pixels[source] || 0;
        pixels[target + 1] = image.pixels[source + 1] || 0;
        pixels[target + 2] = image.pixels[source + 2] || 0;
        pixels[target + 3] = image.pixels[source + 3] ?? 255;
      }
    }
    return { pixels: Array.from(pixels), cols, rows };
  }

  function imageWeathering(image, options = {}, seed = 0) {
    if (!isType(image, "Image") || !image.pixels?.length || !image.cols || !image.rows) return image || null;

    const mode = options.mode || "Photocopy";
    const cacheKey = imageWeatheringCacheKey(image, options, seed);
    const cached = weatheringCache.get(cacheKey);
    if (cached) return weatheredImageResult(image, cached, mode, options, cacheKey);

    const exposure = Number(options.exposure || 0) / 100;
    const contrast = 0.72 + Number(options.contrast || 72) / 34;
    const grain = clamp(Number(options.grain || 46) / 100);
    const dust = clamp(Number(options.dust || 30) / 100);
    const paper = clamp(Number(options.paper || 52) / 100);
    const fade = clamp(Number(options.fade || 16) / 100);
    const localSeed = seed + Number(options.seed || 0) * 991;
    const scratches = imageWearScratches(image, { dust, grain }, localSeed);
    const output = new Uint8ClampedArray(image.cols * image.rows * 4);

    for (let y = 0; y < image.rows; y += 1) {
      for (let x = 0; x < image.cols; x += 1) {
        const index = y * image.cols + x;
        const offset = index * 4;
        const r = image.pixels[offset] || 0;
        const g = image.pixels[offset + 1] || 0;
        const b = image.pixels[offset + 2] || 0;
        const a = image.pixels[offset + 3] ?? 255;
        let luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        luma = clamp((luma - 0.5) * contrast + 0.5 + exposure);

        const paperGrain = (noise(localSeed + 401, index) - 0.5) * paper * 0.22;
        const fiber = (noise(localSeed + 409, Math.round(x * 0.17 + y * 2.9)) - 0.5) * paper * 0.13;
        let paperTone = clamp(0.86 + paperGrain + fiber - fade * 0.1);
        let ink = imageInkAmount(luma, mode, fade, grain, localSeed, x, y);

        if (noise(localSeed + 421, index * 3) < dust * grain * 0.07) ink *= 0.18 + noise(localSeed + 431, index) * 0.45;
        if (noise(localSeed + 439, index * 5) < dust * 0.012) paperTone = clamp(paperTone - 0.55 * noise(localSeed + 443, index));
        if (noise(localSeed + 449, index * 7) < dust * 0.018) ink *= 0.08;

        const scratch = scratchWearAt(x, y, scratches);
        ink = clamp(ink - scratch.light * (0.38 + dust * 0.42) + scratch.dark * 0.34);
        paperTone = clamp(paperTone - scratch.dark * 0.2 + scratch.light * 0.08);

        const inkTone = mode === "Print Transfer" ? 0.12 + fade * 0.18 : 0.05 + fade * 0.1;
        let gray = lerp(paperTone, inkTone, ink);
        if (mode === "Newsprint") {
          const dot = newsprintDot(x, y, image.cols, image.rows);
          gray = lerp(gray, inkTone, ink * dot * 0.26);
        }

        const tint = mode === "Archive Dust" ? { r: 1.04, g: 1.0, b: 0.92 } : { r: 1, g: 0.99, b: 0.94 };
        const colorCarry = mode === "Print Transfer" ? 0.12 : mode === "Archive Dust" ? 0.08 : 0.02;
        output[offset] = Math.round(clamp(gray * tint.r * (1 - colorCarry) + (r / 255) * colorCarry) * 255);
        output[offset + 1] = Math.round(clamp(gray * tint.g * (1 - colorCarry) + (g / 255) * colorCarry) * 255);
        output[offset + 2] = Math.round(clamp(gray * tint.b * (1 - colorCarry) + (b / 255) * colorCarry) * 255);
        output[offset + 3] = a;
      }
    }

    const pixels = Array.from(output);
    cacheSetLimited(weatheringCache, cacheKey, pixels);
    return weatheredImageResult(image, pixels, mode, options, cacheKey);
  }

  function imageWeatheringCacheKey(image, options, seed) {
    return [
      "weather",
      image.cols,
      image.rows,
      pixelFingerprint(image.pixels),
      options.mode || "Photocopy",
      Math.round(Number(options.exposure || 0)),
      Math.round(Number(options.contrast || 72)),
      Math.round(Number(options.grain || 46)),
      Math.round(Number(options.dust || 30)),
      Math.round(Number(options.paper || 52)),
      Math.round(Number(options.fade || 16)),
      seed,
      Math.round(Number(options.seed || 0))
    ].join(":");
  }

  function weatheredImageResult(image, pixels, mode, options, cacheKey) {
    const exposure = Number(options.exposure || 0) / 100;
    const grain = clamp(Number(options.grain || 46) / 100);
    const dust = clamp(Number(options.dust || 30) / 100);
    const paper = clamp(Number(options.paper || 52) / 100);
    return {
      ...image,
      dataUrl: null,
      pixels,
      rasterKey: `weather:${cacheKey}`,
      label: `${image.label || "Image"} / Image Weathering`,
      history: (image.history || ["Image Input"]).concat([`Image Weathering(${mode})`]),
      stats: {
        ...(image.stats || {}),
        material: mode,
        exposure: Math.round(exposure * 100),
        contrast: Math.round(Number(options.contrast || 72)),
        grain: Math.round(grain * 100),
        dust: Math.round(dust * 100),
        paper: Math.round(paper * 100)
      }
    };
  }

  function imageInkAmount(luma, mode, fade, grain, seed, x, y) {
    if (mode === "Print Transfer") {
      return clamp((0.86 - luma) * (1.85 + grain * 1.2) - fade * 0.34);
    }
    if (mode === "Newsprint") {
      return clamp((0.78 - luma) * (2.7 + grain * 1.7) + (noise(seed + 457, x * 5 + y * 11) - 0.5) * grain * 0.18);
    }
    if (mode === "Archive Dust") {
      return clamp((0.9 - luma) * (1.45 + grain * 0.8) - fade * 0.42);
    }
    const copied = clamp((0.74 - luma) * (3.6 + grain * 2.5));
    const soft = clamp((0.96 - luma) * (0.55 + grain * 0.5));
    return clamp(lerp(copied, Math.max(copied, soft), fade * 0.35));
  }

  function imageWearScratches(image, options, seed) {
    const count = Math.round(3 + options.dust * 9 + options.grain * 5);
    return Array.from({ length: count }, (_, index) => {
      const angle = (noise(seed + 461, index * 19) - 0.5) * 1.2 + (noise(seed + 463, index) < 0.28 ? Math.PI / 2 : 0);
      return {
        x: noise(seed + 467, index * 23) * image.cols,
        y: noise(seed + 471, index * 29) * image.rows,
        dx: Math.cos(angle),
        dy: Math.sin(angle),
        length: 10 + noise(seed + 479, index * 31) * image.cols * (0.1 + options.dust * 0.22),
        width: 0.16 + noise(seed + 487, index * 37) * (0.32 + options.grain * 0.7),
        strength: 0.18 + noise(seed + 489, index * 39) * (0.28 + options.dust * 0.32),
        broken: 0.28 + noise(seed + 493, index * 43) * 0.48,
        wobble: 1.8 + noise(seed + 497, index * 47) * 6.5,
        light: noise(seed + 491, index * 41) < 0.68
      };
    });
  }

  function scratchWearAt(x, y, scratches) {
    let light = 0;
    let dark = 0;
    scratches.forEach((scratch) => {
      const px = x - scratch.x;
      const py = y - scratch.y;
      const along = px * scratch.dx + py * scratch.dy;
      if (along < 0 || along > scratch.length) return;
      const gap = noise(Math.round(scratch.x * 13 + scratch.y * 7), Math.floor(along / Math.max(2, scratch.length * 0.08)));
      if (gap < scratch.broken) return;
      const wobble = (noise(Math.round(scratch.x + scratch.y), Math.floor(along / Math.max(1, scratch.wobble))) - 0.5) * scratch.width * 1.8;
      const distance = Math.abs(px * -scratch.dy + py * scratch.dx + wobble);
      if (distance > scratch.width) return;
      const amount = (1 - distance / Math.max(0.1, scratch.width)) ** 1.7 * scratch.strength;
      if (scratch.light) light = Math.max(light, amount);
      else dark = Math.max(dark, amount);
    });
    return { light, dark };
  }

  function newsprintDot(x, y, cols, rows) {
    const step = Math.max(4, Math.min(cols, rows) / 34);
    const cx = (x % step) / step - 0.5;
    const cy = (y % step) / step - 0.5;
    return clamp(1 - Math.hypot(cx, cy) * 1.9);
  }

  function createNoiseField(options, seed) {
    const cols = 96;
    const rows = 66;
    const noiseType = options.noise || "Turbulent";
    const scale = Math.max(12, Number(options.scale || 86));
    const contrast = Number(options.contrast || 62) / 50;
    const values = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = (col / (cols - 1)) * WIDTH;
        const y = (row / (rows - 1)) * HEIGHT;
        const value = fractalNoise(x / scale, y / scale, seed, noiseType);
        values.push(clamp((value - 0.5) * contrast + 0.5));
      }
    }

    return {
      ngType: "Field",
      label: `Noise Field(${noiseType})`,
      sourceShape: null,
      cols,
      rows,
      width: WIDTH,
      height: HEIGHT,
      values,
      history: [`Noise Field(${noiseType})`],
      stats: {
        cells: cols * rows,
        noise: noiseType,
        scale: Math.round(scale),
        contrast: Math.round(contrast * 50)
      }
    };
  }

  function createValue(options) {
    const value = Number(options.value || 0);
    return {
      ngType: "Value",
      label: `Value(${round(value)})`,
      value,
      history: [`Value(${round(value)})`],
      stats: { value: round(value) }
    };
  }

  function createRandomArray(options, seed = 0) {
    const count = Math.max(1, Math.round(Number(options.count || 900)));
    const digits = Math.max(1, Math.round(Number(options.digits || 4)));
    const offset = Number(options.seed || 0) * 1009;
    const maxValue = Math.pow(10, digits);
    const values = Array.from({ length: count }, (_, index) => {
      const value = Math.floor(noise(seed + offset, index * 73 + 17) * maxValue);
      return String(value).padStart(digits, "0");
    });

    return {
      ngType: "Array",
      label: `Random Array(${count})`,
      values,
      history: [`Random Array(${digits})`],
      stats: {
        count,
        digits,
        preview: values.slice(0, 3).join(" ")
      }
    };
  }

  function createColor(options, seed = 0) {
    const palette = options.palette || "Moss";
    const opacity = clamp(Number(options.opacity || 72) / 100);
    const color = palette === "Random"
      ? randomPaletteColor(seed, Number(options.seed || 0))
      : PALETTE[palette] || PALETTE.Moss;
    return {
      ngType: "Color",
      label: `Color(${palette})`,
      color,
      palette,
      opacity,
      history: [`Color(${palette})`],
      stats: {
        color,
        opacity: Math.round(opacity * 100)
      }
    };
  }

  function mathValue(a, b, options) {
    if (!isType(a, "Value")) return null;
    const left = scalarValue(a, 0);
    const right = scalarValue(b, Number(options.fallbackB || 0));
    let value = left + right;
    if (options.operation === "Subtract") value = left - right;
    if (options.operation === "Multiply") value = left * right;
    if (options.operation === "Divide") value = Math.abs(right) < 0.0001 ? 0 : left / right;

    return {
      ngType: "Value",
      label: `${options.operation}(${round(value)})`,
      value,
      history: (a.history || ["Value"]).concat(b?.history || [`Fallback(${round(right)})`], [options.operation]),
      stats: {
        operation: options.operation,
        value: round(value),
        a: round(left),
        b: round(right)
      }
    };
  }

  function scaleShape(shape, options) {
    if (!isType(shape, "Shape")) return null;
    const mode = options.mode || "Factor";
    const multiplier = isType(options.scaleValue, "Value") ? scalarValue(options.scaleValue, 100) / 100 : Number(options.scale || 1);
    const bounds = shape.bounds || boundsFromPoints((shape.boundary || []).concat(shape.fill || []));
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const fit = mode === "Fit Canvas" ? Math.min((WIDTH * 0.84) / width, (HEIGHT * 0.72) / height) : 1;
    const factor = fit * multiplier;
    const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
    const transformPoint = (pt) => ({
      ...pt,
      x: CX + (pt.x - center.x) * factor,
      y: CY + (pt.y - center.y) * factor
    });
    const output = {
      ...shape,
      label: `${shape.label} / Scale`,
      bounds: transformBounds(bounds, center, factor),
      fill: (shape.fill || []).map(transformPoint),
      boundary: (shape.boundary || []).map(transformPoint),
      guides: (shape.guides || []).map((path) => path.map(transformPoint)),
      contours: (shape.contours || []).map((path) => path.map(transformPoint)),
      history: shape.history.concat([`Scale Shape(${round(factor)})`]),
      stats: {
        ...(shape.stats || {}),
        scale: round(factor),
        mode
      }
    };

    if (shape.layout) {
      output.layout = {
        ...shape.layout,
        x: CX + (shape.layout.x - center.x) * factor,
        y: CY + (shape.layout.y - center.y) * factor,
        size: shape.layout.size * factor
      };
      output.size = (shape.size || shape.layout.size) * factor;
      output.stats.size = Math.round(output.layout.size);
    }
    if (shape.radius) {
      output.radius = shape.radius * factor;
      output.stats.radius = Math.round(output.radius);
    }
    if (shape.width) {
      output.width = shape.width * factor;
      output.stats.width = Math.round(output.width);
    }
    if (shape.height) {
      output.height = shape.height * factor;
      output.stats.height = Math.round(output.height);
    }
    return output;
  }

  function sampleShape(shape, options, seed) {
    if (!isType(shape, "Shape")) return null;
    const count = Math.round(Number(options.count || 320));
    const mode = options.mode || "Boundary";
    const paperPoints = paperSampleShape(shape, mode, count, seed);
    const candidates = mode === "Interior"
      ? shape.fill
      : mode === "Mixed"
        ? shape.boundary.concat(shape.fill.filter((_, index) => index % 3 === 0))
        : shape.boundary;
    const source = candidates.length ? candidates : shape.boundary.concat(shape.fill);
    const points = paperPoints.slice();

    for (let index = points.length; index < count && source.length; index += 1) {
      const selected = source[Math.floor(noise(seed, index + 91) * source.length)];
      const jitter = mode === "Boundary" ? 1.4 : 3.5;
      const tangent = normalize(-selected.ny, selected.nx);
      points.push(point(
        selected.x + (noise(seed, index + 511) - 0.5) * jitter + tangent.x * (noise(seed, index + 19) - 0.5) * jitter,
        selected.y + (noise(seed, index + 733) - 0.5) * jitter + tangent.y * (noise(seed, index + 29) - 0.5) * jitter,
        selected.nx,
        selected.ny,
        selected.role
      ));
    }

    return {
      ngType: "PointSet",
      label: `${shape.label} / ${mode} Samples`,
      shapeKind: shape.kind,
      sourceShape: sourceGhost(shape),
      points,
      bounds: shape.bounds,
      history: shape.history.concat([`Sample Shape(${mode})`]),
      stats: {
        points: points.length,
        mode,
        sampler: paperPoints.length ? "Paper.js path" : "alpha pixels",
        source: shape.label
      }
    };
  }

  function instanceOnPoints(pointSet, shape, options = {}, seed = 0) {
    if (!isType(pointSet, "PointSet") || !isType(shape, "Shape")) return null;
    const scale = clamp(Number(options.scale || 0.22), 0.01, 5);
    const jitter = Math.max(0, Number(options.jitter || 0));
    const opacity = clamp(Number(options.opacity ?? 100) / 100);
    const points = decimate(pointSet.points || [], 900);
    const layers = points.map((pt, index) => {
      const dx = pt.x - CX + (noise(seed + 17, index * 53 + 3) - 0.5) * jitter;
      const dy = pt.y - CY + (noise(seed + 29, index * 59 + 7) - 0.5) * jitter;
      const localScale = scale * clamp(Number(pt.scale || 1), 0.01, 12);
      return {
        data: transformData(shape, dx, dy, localScale),
        opacity
      };
    });

    return {
      ngType: "LayerSet",
      label: `${shape.label || "Shape"} on ${pointSet.label || "Points"}`,
      layers,
      history: (pointSet.history || ["PointSet"]).concat(shape.history || ["Shape"], [`Instance On Points(${layers.length})`]),
      stats: {
        instances: layers.length,
        scale: round(scale),
        jitter: Math.round(jitter),
        opacity: Math.round(opacity * 100)
      }
    };
  }

  function paperSampleShape(shape, mode, count, seed) {
    if (!paperScope || mode === "Interior") return [];
    if (shape.kind === "text") return [];
    const rawPaths = shape.contours || [];
    if (!rawPaths.length) return [];

    const paths = rawPaths
      .map((pathPoints) => makePaperPath(pathPoints, true))
      .filter((path) => path && path.length > 0);
    if (!paths.length) return [];

    const quota = mode === "Mixed" ? Math.round(count * 0.65) : count;
    const total = paths.reduce((sum, path) => sum + path.length, 0);
    const points = [];

    for (let index = 0; index < quota; index += 1) {
      let distance = ((index + noise(seed, index + 303) * 0.65) / Math.max(1, quota)) * total;
      let selected = paths[paths.length - 1];
      for (const path of paths) {
        if (distance <= path.length) {
          selected = path;
          break;
        }
        distance -= path.length;
      }
      const offset = clamp(distance, 0, selected.length);
      const paperPoint = selected.getPointAt(offset);
      const tangent = selected.getTangentAt(offset) || new paperScope.Point(1, 0);
      const normal = normalize(-tangent.y, tangent.x);
      if (paperPoint) {
        points.push(point(paperPoint.x, paperPoint.y, normal.x, normal.y, "boundary"));
      }
    }

    paths.forEach((path) => path.remove());
    return points;
  }

  function makePaperPath(pathPoints, closed) {
    if (!pathPoints || pathPoints.length < 2) return null;
    const path = new paperScope.Path({ insert: false });
    pathPoints.forEach((pt) => path.add(new paperScope.Point(pt.x, pt.y)));
    path.closed = closed;
    path.flatten(4);
    return path;
  }

  function scanlineField(shape, options, seed) {
    if (!isType(shape, "Shape")) return null;
    const direction = options.direction || "Horizontal";
    const spacing = Math.max(4, Number(options.spacing || 9));
    const jitter = Number(options.jitter || 0);
    const gapAmount = clamp(Number(options.gaps || 0) / 100, 0, 0.85);
    const sourcePaths = shape.kind === "text" && direction === "Horizontal" && shape.guides?.length
      ? decimate(shape.guides, 260)
      : scanlineRunsFromFill(shape.fill || [], direction, spacing);
    const paths = applyScanlineTreatment(sourcePaths, direction, jitter, gapAmount, seed);

    return {
      ngType: "TraceSet",
      label: `${shape.label} / Scanline Field`,
      sourceShape: sourceGhost(shape),
      paths,
      style: "scanline",
      history: shape.history.concat(["Scanline Field"]),
      stats: {
        paths: paths.length,
        direction,
        spacing: Math.round(spacing),
        jitter: Math.round(jitter),
        gaps: Math.round(gapAmount * 100),
        source: shape.label
      }
    };
  }

  function scanlineRunsFromFill(fill, direction, spacing) {
    const buckets = new Map();
    fill.forEach((pt) => {
      const axis = direction === "Vertical" ? pt.x : pt.y;
      const key = Math.round(axis / spacing) * spacing;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(pt);
    });

    const paths = [];
    Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]).forEach(([key, points]) => {
      if (points.length < 2) return;
      points.sort((a, b) => direction === "Vertical" ? a.y - b.y : a.x - b.x);
      splitScanlineRuns(points, direction, spacing * 2.8).forEach((run) => {
        if (run.length < 2) return;
        const start = run[0];
        const end = run[run.length - 1];
        const span = direction === "Vertical" ? end.y - start.y : end.x - start.x;
        if (span < 14) return;
        paths.push(direction === "Vertical"
          ? [{ x: key, y: start.y }, { x: key, y: end.y }]
          : [{ x: start.x, y: key }, { x: end.x, y: key }]);
      });
    });
    return decimate(paths, 320);
  }

  function splitScanlineRuns(points, direction, maxGap) {
    const runs = [];
    let current = [];
    points.forEach((pt) => {
      const previous = current[current.length - 1];
      const gap = previous ? Math.abs((direction === "Vertical" ? pt.y - previous.y : pt.x - previous.x)) : 0;
      if (previous && gap > maxGap) {
        if (current.length > 1) runs.push(current);
        current = [];
      }
      current.push(pt);
    });
    if (current.length > 1) runs.push(current);
    return runs;
  }

  function applyScanlineTreatment(paths, direction, jitter, gapAmount, seed) {
    const treated = [];
    paths.forEach((path, pathIndex) => {
      if (!path || path.length < 2) return;
      const pieces = gapAmount > 0 ? 1 + Math.round(noise(seed, pathIndex + 501) * 3) : 1;
      for (let piece = 0; piece < pieces; piece += 1) {
        const shrink = gapAmount * (0.35 + noise(seed, pathIndex * 17 + piece) * 0.45);
        const t0 = clamp(piece / pieces + shrink / (pieces * 2));
        const t1 = clamp((piece + 1) / pieces - shrink / (pieces * 2));
        if (t1 - t0 < 0.08) continue;
        const segment = [];
        const steps = 3 + Math.round(noise(seed, pathIndex * 31 + piece) * 5);
        for (let step = 0; step <= steps; step += 1) {
          const t = lerp(t0, t1, step / steps);
          const base = samplePathAt(path, t);
          const cross = direction === "Vertical" ? { x: 1, y: 0 } : { x: 0, y: 1 };
          segment.push({
            x: base.x + (noise(seed, pathIndex * 101 + piece * 11 + step) - 0.5) * jitter * cross.x,
            y: base.y + (noise(seed, pathIndex * 113 + piece * 13 + step) - 0.5) * jitter * cross.y
          });
        }
        if (segment.length > 1) treated.push(segment);
      }
    });
    return treated;
  }

  function samplePathAt(path, t) {
    const total = pathLength(path);
    if (!total) return path[0];
    let distance = clamp(t) * total;
    for (let index = 0; index < path.length - 1; index += 1) {
      const a = path[index];
      const b = path[index + 1];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      if (distance <= length) {
        const local = length ? distance / length : 0;
        return { x: lerp(a.x, b.x, local), y: lerp(a.y, b.y, local) };
      }
      distance -= length;
    }
    return path[path.length - 1];
  }

  function pathLength(path) {
    let total = 0;
    for (let index = 0; index < path.length - 1; index += 1) {
      total += Math.hypot(path[index + 1].x - path[index].x, path[index + 1].y - path[index].y);
    }
    return total;
  }

  function distanceField(shape, options) {
    if (!isType(shape, "Shape")) return null;
    const cols = 96;
    const rows = 66;
    const samples = decimate(shape.boundary.concat(shape.fill.filter((_, index) => index % 4 === 0)), 1600);
    const boundary = decimate(shape.boundary, 1400);
    const values = [];
    const spread = Number(options.spread || 70);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = (col / (cols - 1)) * WIDTH;
        const y = (row / (rows - 1)) * HEIGHT;
        const dFill = nearestDistance(x, y, samples);
        const dBoundary = nearestDistance(x, y, boundary);
        const inside = shape.kind === "circle"
          ? Math.hypot(x - CX, y - CY) <= shape.radius
          : dFill < 9;
        const body = inside ? 1 - clamp(dBoundary / spread) * 0.72 : 0;
        const halo = clamp(1 - dBoundary / (spread * 1.8)) * 0.34;
        values.push(clamp(Math.max(body, halo)));
      }
    }

    return {
      ngType: "Field",
      label: `${shape.label} / Distance Field`,
      sourceShape: sourceGhost(shape),
      cols,
      rows,
      width: WIDTH,
      height: HEIGHT,
      values,
      history: shape.history.concat(["Distance Field"]),
      stats: {
        cells: cols * rows,
        spread: Math.round(spread),
        source: shape.label
      }
    };
  }

  function contourField(field, options) {
    if (!isType(field, "Field")) return null;
    const levels = Math.max(2, Math.round(Number(options.levels || 9)));
    const paths = [];

    for (let levelIndex = 1; levelIndex <= levels; levelIndex += 1) {
      const threshold = levelIndex / (levels + 1);
      for (let y = 0; y < field.rows - 1; y += 1) {
        for (let x = 0; x < field.cols - 1; x += 1) {
          const v0 = fieldValue(field, x, y);
          const v1 = fieldValue(field, x + 1, y);
          const v2 = fieldValue(field, x + 1, y + 1);
          const v3 = fieldValue(field, x, y + 1);
          const hits = [];
          edgeHit(hits, threshold, v0, v1, gridPoint(field, x, y), gridPoint(field, x + 1, y));
          edgeHit(hits, threshold, v1, v2, gridPoint(field, x + 1, y), gridPoint(field, x + 1, y + 1));
          edgeHit(hits, threshold, v2, v3, gridPoint(field, x + 1, y + 1), gridPoint(field, x, y + 1));
          edgeHit(hits, threshold, v3, v0, gridPoint(field, x, y + 1), gridPoint(field, x, y));
          if (hits.length === 2) paths.push(hits);
          if (hits.length === 4) {
            paths.push([hits[0], hits[1]]);
            paths.push([hits[2], hits[3]]);
          }
        }
      }
    }

    const stitched = stitchSegments(paths);

    return {
      ngType: "TraceSet",
      label: `${field.label} / Contours`,
      sourceShape: field.sourceShape,
      paths: stitched,
      style: "contour",
      history: field.history.concat([`Contour(${levels})`]),
      stats: {
        paths: stitched.length,
        segments: paths.length,
        levels
      }
    };
  }

  function traceFieldAtThreshold(field, threshold) {
    const segments = [];
    for (let y = 0; y < field.rows - 1; y += 1) {
      for (let x = 0; x < field.cols - 1; x += 1) {
        const v0 = fieldValue(field, x, y);
        const v1 = fieldValue(field, x + 1, y);
        const v2 = fieldValue(field, x + 1, y + 1);
        const v3 = fieldValue(field, x, y + 1);
        const hits = [];
        edgeHit(hits, threshold, v0, v1, gridPoint(field, x, y), gridPoint(field, x + 1, y));
        edgeHit(hits, threshold, v1, v2, gridPoint(field, x + 1, y), gridPoint(field, x + 1, y + 1));
        edgeHit(hits, threshold, v2, v3, gridPoint(field, x + 1, y + 1), gridPoint(field, x, y + 1));
        edgeHit(hits, threshold, v3, v0, gridPoint(field, x, y + 1), gridPoint(field, x, y));
        if (hits.length === 2) segments.push(hits);
        if (hits.length === 4) {
          segments.push([hits[0], hits[1]]);
          segments.push([hits[2], hits[3]]);
        }
      }
    }
    return stitchSegments(segments).filter((path) => path.length > 2);
  }

  function offsetContour(shape, options, seed) {
    if (!isType(shape, "Shape")) return null;
    const rings = Math.max(1, Math.round(Number(options.rings || 8)));
    const requestedStep = Number(options.step || 14);
    const maxStep = safeOffsetStep(shape.bounds, rings);
    const step = Math.min(requestedStep, maxStep);
    const drift = Number(options.drift || 0);
    const baseContours = (shape.contours || []).filter((path) => path.length > 2);
    const paths = [];

    if (baseContours.length) {
      baseContours.forEach((contour, contourIndex) => {
        for (let ring = 1; ring <= rings; ring += 1) {
          const offsetPath = contour.map((pt, pointIndex) => {
            const normal = normalize(pt.nx || pt.x - CX, pt.ny || pt.y - CY);
            const amount = ring * step + (noise(seed, contourIndex * 1009 + ring * 101 + pointIndex) - 0.5) * drift;
            return { x: pt.x + normal.x * amount, y: pt.y + normal.y * amount };
          });
          paths.push(closePath(offsetPath));
        }
      });
    } else {
      const samples = decimate(shape.boundary || [], Math.max(120, rings * 80));
      for (let ring = 1; ring <= rings; ring += 1) {
        samples.forEach((pt, index) => {
          const normal = normalize(pt.nx || pt.x - CX, pt.ny || pt.y - CY);
          const tangent = normalize(-normal.y, normal.x);
          const amount = ring * step + (noise(seed, ring * 409 + index) - 0.5) * drift;
          const length = 7 + noise(seed, ring * 313 + index) * 14;
          const x = pt.x + normal.x * amount;
          const y = pt.y + normal.y * amount;
          paths.push([
            { x: x - tangent.x * length, y: y - tangent.y * length },
            { x: x + tangent.x * length, y: y + tangent.y * length }
          ]);
        });
      }
    }

    return {
      ngType: "TraceSet",
      label: `${shape.label} / Offset Contour`,
      sourceShape: sourceGhost(shape),
      paths,
      style: "contour",
      history: shape.history.concat([`Offset Contour(${rings})`]),
      stats: {
        paths: paths.length,
        rings,
        step: Math.round(step),
        requestedStep: Math.round(requestedStep),
        drift: Math.round(drift)
      }
    };
  }

  function grow(pointSet, options, seed) {
    if (!isType(pointSet, "PointSet")) return null;
    const amount = Number(options.amount || 68);
    const length = scalarValue(options.lengthValue, Number(options.length || 58));
    const finalAmount = scalarValue(options.amountValue, amount);
    const mode = options.mode || "Curve";
    const isLine = mode === "Line";
    const points = pointSet.points || [];
    const count = Math.min(Math.max(80, Math.round(finalAmount * 4.4)), Math.max(120, points.length * 2));
    const paths = [];

    for (let index = 0; index < count && points.length; index += 1) {
      const base = points[Math.floor(noise(seed, index + 17) * points.length)];
      const outward = pointSet.shapeKind === "circle" ? 1 : noise(seed, index + 41) > 0.36 ? 1 : -1;
      let angle = Math.atan2(base.ny * outward, base.nx * outward);
      if (pointSet.shapeKind === "text" && base.role === "boundary") {
        const tangent = Math.atan2(-base.nx, base.ny);
        angle = tangent + (noise(seed, index + 121) > 0.5 ? 0 : Math.PI) + (noise(seed, index + 71) - 0.5) * 0.62;
      }
      if (pointSet.shapeKind === "text" && base.role === "interior") {
        angle += (noise(seed, index + 96) - 0.5) * Math.PI;
      }
      angle += (noise(seed, index + 71) - 0.5) * 0.9;

      const path = [{ x: base.x, y: base.y }];
      let x = base.x;
      let y = base.y;
      const steps = isLine ? 1 : 5 + Math.round(noise(seed, index + 84) * 7);

      for (let step = 1; step <= steps; step += 1) {
        if (!isLine) {
          const curl = Math.sin(index * 0.43 + step * 0.9 + seed) * 0.35;
          angle += curl + (noise(seed, index * 29 + step) - 0.5) * 0.58;
        }
        const textScale = pointSet.shapeKind === "text" ? 0.5 : 1;
        const lineBoost = isLine ? 2.4 : 1;
        const stepLength = 4 + textScale * lineBoost * (length / 100) * (12 + noise(seed, index * 47 + step) * 24);
        x += Math.cos(angle) * stepLength;
        y += Math.sin(angle) * stepLength;
        path.push({ x, y });
      }
      paths.push(path);
    }

    return {
      ngType: "TraceSet",
      label: `${pointSet.label} / Growth`,
      sourceShape: pointSet.sourceShape,
      paths,
      style: "growth",
      history: pointSet.history.concat(["Growth"]),
      stats: {
        paths: paths.length,
        sourcePoints: points.length,
        mode,
        growth: Math.round(finalAmount),
        length: Math.round(length)
      }
    };
  }

  function noiseDisplace(traceSet, options, seed) {
    if (!isType(traceSet, "TraceSet")) return null;
    const noiseType = options.noise || "Turbulent";
    const strength = scalarValue(options.strengthValue, Number(options.strength || 28));
    const scale = Math.max(12, Number(options.scale || 72));
    const paths = traceSet.paths.map((path, pathIndex) => path.map((pt, pointIndex) => {
      const nx = fractalNoise(pt.x / scale, pt.y / scale, seed + pathIndex * 3, noiseType) - 0.5;
      const ny = fractalNoise((pt.x + 91) / scale, (pt.y - 47) / scale, seed + pointIndex * 5, noiseType) - 0.5;
      return {
        x: pt.x + nx * strength,
        y: pt.y + ny * strength
      };
    }));

    return {
      ngType: "TraceSet",
      label: `${traceSet.label} / Noise Displace`,
      sourceShape: traceSet.sourceShape,
      paths,
      style: traceSet.style || "growth",
      history: traceSet.history.concat([`Noise Displace(${noiseType})`]),
      stats: {
        paths: paths.length,
        noise: noiseType,
        strength: Math.round(strength),
        scale: Math.round(scale)
      }
    };
  }

  function smoothTrace(traceSet, options) {
    if (!isType(traceSet, "TraceSet")) return null;
    const amount = clamp(Number(options.amount || 55) / 100);
    const passes = Math.max(1, Math.round(Number(options.passes || 2)));
    const paths = (traceSet.paths || []).map((path) => smoothPath(path, amount, passes));
    return {
      ...traceSet,
      label: `${traceSet.label} / Smooth`,
      paths,
      style: "smooth",
      history: traceSet.history.concat([`Smooth(${Math.round(amount * 100)})`]),
      stats: {
        ...(traceSet.stats || {}),
        smooth: Math.round(amount * 100),
        passes
      }
    };
  }

  function curveTension(traceSet, options) {
    if (!isType(traceSet, "TraceSet")) return null;
    const tension = clamp(Number(options.tension || 48) / 100);
    const paths = (traceSet.paths || []).map((path) => curvePath(path, tension));
    return {
      ...traceSet,
      label: `${traceSet.label} / Curve Tension`,
      paths,
      style: "curve",
      history: traceSet.history.concat([`Curve Tension(${Math.round(tension * 100)})`]),
      stats: {
        ...(traceSet.stats || {}),
        tension: Math.round(tension * 100)
      }
    };
  }

  function traceToShape(traceSet, options = {}) {
    if (!isType(traceSet, "TraceSet")) return null;
    const closeGap = Number(options.closeGap || 14);
    const contours = [];

    (traceSet.paths || []).forEach((path) => {
      if (!path || path.length < 3) return;
      const first = path[0];
      const last = path[path.length - 1];
      const gap = Math.hypot(last.x - first.x, last.y - first.y);
      if (gap > closeGap) return;
      contours.push(closePath(path));
    });

    const boundary = contours.flat().map((pt) => {
      const normal = normalize(pt.x - CX, pt.y - CY);
      return point(pt.x, pt.y, normal.x, normal.y, "boundary");
    });
    const bounds = boundsFromPaths(contours);
    const fill = sampleFillFromContours(contours, bounds, 8);

    return {
      ngType: "Shape",
      kind: "trace",
      label: `${traceSet.label} / Trace Shape`,
      showBody: true,
      bounds,
      fill,
      boundary,
      contours,
      history: traceSet.history.concat(["Trace To Shape"]),
      stats: {
        contours: contours.length,
        boundary: boundary.length,
        fill: fill.length,
        closeGap: Math.round(closeGap)
      }
    };
  }

  function traceToPoints(traceSet, options = {}) {
    if (!isType(traceSet, "TraceSet")) return null;
    const spacing = Math.max(2, Number(options.spacing || 24));
    const limit = Math.max(1, Math.round(Number(options.limit || 900)));
    const points = [];

    (traceSet.paths || []).forEach((path, pathIndex) => {
      if (!path || path.length < 2) return;
      for (let index = 0; index < path.length - 1; index += 1) {
        const a = path[index];
        const b = path[index + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy);
        if (!length) continue;
        const steps = Math.max(1, Math.floor(length / spacing));
        const normal = normalize(-dy, dx);
        for (let step = 0; step < steps; step += 1) {
          const t = step / steps;
          points.push(point(lerp(a.x, b.x, t), lerp(a.y, b.y, t), normal.x, normal.y, `trace-${pathIndex}`));
        }
      }
    });

    const sampled = decimate(points, limit);
    return {
      ngType: "PointSet",
      label: `${traceSet.label || "TraceSet"} / Points`,
      shapeKind: "trace",
      sourceShape: traceSet.sourceShape,
      points: sampled,
      bounds: boundsFromPoints(sampled),
      history: (traceSet.history || ["TraceSet"]).concat([`Trace To Points(${Math.round(spacing)})`]),
      stats: {
        points: sampled.length,
        sourcePaths: (traceSet.paths || []).length,
        spacing: Math.round(spacing),
        limit
      }
    };
  }

  function shapeToTraceSet(shape, options = {}, seed = 0) {
    if (!isType(shape, "Shape")) return null;
    const mode = options.mode || "Boundary";
    const density = Number(options.density || 52);
    let paths = [];

    if (mode === "Hatch") {
      const spacing = Math.max(4, 28 - density * 0.22);
      paths = applyScanlineTreatment(scanlineRunsFromFill(shape.fill || [], "Horizontal", spacing), "Horizontal", 0.7, 0.02, seed);
    } else if (mode === "Guides") {
      paths = shape.guides?.length
        ? shape.guides.map((path) => path.map((pt) => ({ x: pt.x, y: pt.y })))
        : scanlineRunsFromFill(shape.fill || [], "Horizontal", Math.max(5, 26 - density * 0.18));
    } else {
      paths = shape.contours?.length
        ? shape.contours.map((contour) => closePath(contour).map((pt) => ({ x: pt.x, y: pt.y })))
        : scanlineRunsFromFill(shape.fill || [], "Horizontal", Math.max(5, 30 - density * 0.2));
    }

    return {
      ngType: "TraceSet",
      label: `${shape.label} / Shape To TraceSet`,
      sourceShape: sourceGhost({ ...shape, showBody: false }),
      paths,
      style: mode === "Hatch" ? "scanline" : "contour",
      history: shape.history.concat([`Shape To TraceSet(${mode})`]),
      stats: {
        mode,
        paths: paths.length,
        density: Math.round(density)
      }
    };
  }

  function fieldMask(field, options, seed) {
    if (!isType(field, "Field")) return null;
    const threshold = clamp(Number(options.threshold || 52) / 100);
    const density = Number(options.density || 46);
    const mode = options.mode || "Solid";
    const color = resolveColor(options.color, "#536b57", 0.46);
    const marks = [];
    const paths = [];
    const fills = [];

    if (mode === "Dots") {
      const candidates = candidatesForDither(field).filter((pt) => fieldValueAtPoint(field, pt) >= threshold);
      const count = Math.min(1600, Math.max(80, Math.round(density * 14)));
      for (let index = 0; index < count && candidates.length; index += 1) {
        const base = candidates[Math.floor(noise(seed, index + 1223) * candidates.length)];
        marks.push({
          x: base.x + (noise(seed, index + 31) - 0.5) * 5,
          y: base.y + (noise(seed, index + 73) - 0.5) * 5,
          r: 1 + noise(seed, index + 83) * (density / 30),
          a: color.opacity
        });
      }
    } else if (mode === "Hatch") {
      paths.push(...fieldMaskHatches(field, threshold, density, seed));
    } else {
      fills.push({
        contours: fieldMaskCells(field, threshold),
        color: color.color,
        opacity: color.opacity
      });
    }

    return {
      ngType: "Artifact",
      label: `${field.label} / Field Mask`,
      sourceShape: field.sourceShape,
      fills,
      paths,
      marks,
      stroke: { color: color.color, opacity: color.opacity, width: 0.8 },
      history: field.history.concat([`Field Mask(${Math.round(threshold * 100)})`]),
      stats: {
        mode,
        threshold: Math.round(threshold * 100),
        fills: fills.reduce((sum, fill) => sum + fill.contours.length, 0),
        paths: paths.length,
        marks: marks.length,
        color: color.color
      }
    };
  }

  function invertField(field, options = {}) {
    if (!isType(field, "Field")) return null;
    const mix = clamp(Number(options.mix || 100) / 100);
    const values = field.values.map((value) => lerp(value, 1 - value, mix));
    return {
      ...field,
      label: `${field.label} / Invert Field`,
      values,
      history: field.history.concat([`Invert Field(${Math.round(mix * 100)})`]),
      stats: {
        ...(field.stats || {}),
        invertMix: Math.round(mix * 100)
      }
    };
  }

  function fillArea(input, options, seed) {
    if (isType(input, "LayerSet")) {
      return mapLayerSet(input, (layerData, index) => fillArea(layerData, options, seed + index * 31), "Fill Area");
    }
    if (isType(input, "Field")) return fieldMask(input, options, seed);
    if (isType(input, "TraceSet")) {
      const shape = traceToShape(input, { closeGap: 16 });
      if (!shape || !shape.contours.length) {
        return {
          ngType: "Artifact",
          label: `${input.label} / Fill Area`,
          sourceShape: input.sourceShape,
          fills: [],
          paths: [],
          marks: [],
          history: input.history.concat(["Fill Area(no closed traces)"]),
          stats: { closedContours: 0 }
        };
      }
      return fillArea(shape, options, seed);
    }
    if (!isType(input, "Shape")) return null;
    const shape = input;
    const mode = options.mode || "Solid";
    const density = Number(options.density || 46);
    const color = resolveColor(options.color, "#536b57", 0.48);
    const fills = [];
    const paths = [];
    const marks = [];

    if (mode === "Solid" && (shape.contours || []).length) {
      fills.push({
        contours: shape.contours,
        color: color.color,
        opacity: color.opacity
      });
    } else if (mode === "Hatch") {
      const spacing = Math.max(5, 26 - density * 0.18);
      paths.push(...applyScanlineTreatment(scanlineRunsFromFill(shape.fill || [], "Horizontal", spacing), "Horizontal", 1.2, 0.05, seed));
    } else {
      const count = Math.min(1800, Math.max(80, Math.round(density * 15)));
      const source = shape.fill?.length ? shape.fill : shape.boundary || [];
      for (let index = 0; index < count && source.length; index += 1) {
        const base = source[Math.floor(noise(seed, index + 811) * source.length)];
        marks.push({
          x: base.x + (noise(seed, index + 41) - 0.5) * 5,
          y: base.y + (noise(seed, index + 97) - 0.5) * 5,
          r: 1.1 + noise(seed, index + 59) * 2.2,
          a: color.opacity
        });
      }
    }

    return {
      ngType: "Artifact",
      label: `${shape.label} / Fill Area`,
      sourceShape: sourceGhost({ ...shape, showBody: false }),
      fills,
      paths,
      marks,
      stroke: { color: color.color, opacity: color.opacity, width: 0.9 },
      history: shape.history.concat([`Fill Area(${mode})`]),
      stats: {
        mode,
        density: Math.round(density),
        fills: fills.length,
        paths: paths.length,
        marks: marks.length,
        color: color.color
      }
    };
  }

  function shapeBoolean(a, b, options = {}) {
    if (!isType(a, "Shape") || !isType(b, "Shape")) return null;
    const mode = options.mode || "Subtract";
    const detail = Number(options.detail || 68);
    const step = Math.max(5, Math.round(18 - detail * 0.13));
    const circleResult = circleBooleanShape(a, b, mode, step);
    if (circleResult) return circleResult;
    const paperResult = paperBooleanShape(a, b, mode, step);
    if (paperResult) return paperResult;

    const bounds = booleanSampleBounds(a, b, mode, step);
    const testA = shapeTester(a, step);
    const testB = shapeTester(b, step);
    const fill = [];
    const values = [];
    const width = Math.max(step, bounds.maxX - bounds.minX);
    const height = Math.max(step, bounds.maxY - bounds.minY);
    const cols = Math.max(3, Math.ceil(width / step) + 1);
    const rows = Math.max(3, Math.ceil(height / step) + 1);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = bounds.minX + (col / (cols - 1)) * width;
        const y = bounds.minY + (row / (rows - 1)) * height;
        const inside = booleanModeIncludes(mode, testA(x, y), testB(x, y));
        values.push(inside ? 1 : 0);
        if (!inside) continue;
        const normal = normalize(x - CX, y - CY);
        fill.push(point(x, y, normal.x, normal.y, "interior"));
      }
    }

    const booleanField = {
      ngType: "Field",
      label: `${a.label} / ${mode} ${b.label}`,
      cols,
      rows,
      originX: bounds.minX,
      originY: bounds.minY,
      width,
      height,
      values,
      history: (a.history || [a.label]).concat([`${mode} ${b.label}`])
    };
    const contours = traceFieldAtThreshold(booleanField, 0.5).map(closePath);
    const boundary = decimate(contours.flat(), 2600);
    const shapeBounds = fill.length ? boundsFromPoints(fill) : bounds;

    return {
      ngType: "Shape",
      kind: "boolean",
      label: `${a.label} / ${mode} / ${b.label}`,
      showBody: true,
      bounds: shapeBounds,
      fill,
      boundary,
      contours,
      sampledBoolean: true,
      history: (a.history || [a.label]).concat([`${mode} ${b.label}`]),
      stats: {
        operation: mode,
        cells: fill.length,
        detail: Math.round(detail),
        step
      }
    };
  }

  function circleBooleanShape(a, b, mode, step) {
    if (a.kind !== "circle" || b.kind !== "circle") return null;
    const radiusA = Number(a.radius || 0);
    const radiusB = Number(b.radius || 0);
    const segments = Math.max(24, Math.round(Math.max(a.stats?.segments || a.boundary?.length || 96, b.stats?.segments || b.boundary?.length || 96)));
    let inner = 0;
    let outer = 0;
    let contours = [];

    if (mode === "Union") {
      outer = Math.max(radiusA, radiusB);
      contours = [circleContour(outer, segments)];
    } else if (mode === "Intersect") {
      outer = Math.min(radiusA, radiusB);
      contours = outer > 0 ? [circleContour(outer, segments)] : [];
    } else {
      inner = Math.min(radiusA, radiusB);
      outer = Math.max(radiusA, radiusB);
      contours = outer > inner ? [circleContour(outer, segments), circleContour(inner, segments, true)] : [];
    }

    const fill = circleFillBetween(inner, outer, step);
    const boundary = contours.flat();
    const shapeBounds = outer > 0
      ? { minX: CX - outer, minY: CY - outer, maxX: CX + outer, maxY: CY + outer }
      : { minX: CX, minY: CY, maxX: CX, maxY: CY };

    return {
      ngType: "Shape",
      kind: "boolean",
      label: `${a.label} / ${mode} / ${b.label}`,
      showBody: true,
      bounds: shapeBounds,
      fill,
      boundary,
      contours,
      fillRule: inner > 0 && outer > inner ? "evenodd" : "nonzero",
      sampledBoolean: false,
      history: (a.history || [a.label]).concat([`${mode} ${b.label}`]),
      stats: {
        operation: mode,
        radiusA: Math.round(radiusA),
        radiusB: Math.round(radiusB),
        inner: Math.round(inner),
        outer: Math.round(outer),
        segments
      }
    };
  }

  function paperBooleanShape(a, b, mode, step) {
    if (!paperScope) return null;
    const itemA = paperShapeItem(a);
    const itemB = paperShapeItem(b);
    if (!itemA || !itemB) {
      itemA?.remove();
      itemB?.remove();
      return null;
    }

    let result = null;
    try {
      if (mode === "Union") result = itemA.unite(itemB);
      else if (mode === "Intersect") result = itemA.intersect(itemB);
      else if (mode === "Difference") result = itemA.exclude(itemB);
      else result = itemA.subtract(itemB);

      const contours = paperItemContours(result, step).filter((path) => path.length > 2);
      if (!contours.length) return null;
      const bounds = boundsFromPaths(contours);
      const fill = sampleFillFromContours(contours, bounds, 8);
      return {
        ngType: "Shape",
        kind: "boolean",
        label: `${a.label} / ${mode} / ${b.label}`,
        showBody: true,
        bounds,
        fill,
        boundary: contours.flat(),
        contours,
        fillRule: "evenodd",
        sampledBoolean: false,
        history: (a.history || [a.label]).concat([`${mode} ${b.label}`]),
        stats: {
          operation: mode,
          contours: contours.length,
          boundary: contours.flat().length,
          detail: Math.round(18 - step),
          boolean: "Paper.js"
        }
      };
    } catch (error) {
      return null;
    } finally {
      itemA.remove();
      itemB.remove();
      result?.remove();
    }
  }

  function paperShapeItem(shape) {
    const contours = (shape.contours || []).filter((path) => path.length > 2);
    if (!contours.length) return null;
    if (contours.length === 1) return makePaperPath(contours[0], true);

    const compound = new paperScope.CompoundPath({ insert: false });
    contours.forEach((contour) => {
      const path = makePaperPath(contour, true);
      if (path) compound.addChild(path);
    });
    return compound.children.length ? compound : null;
  }

  function paperItemContours(item, step) {
    const contours = [];
    const collect = (node) => {
      if (!node) return;
      if (node.segments?.length) {
        if (typeof node.flatten === "function") node.flatten(Math.max(1.5, step / 2));
        contours.push(closePath(node.segments.map((segment) => {
          const normal = normalize(segment.point.x - CX, segment.point.y - CY);
          return point(segment.point.x, segment.point.y, normal.x, normal.y, "boundary");
        })));
      }
      if (node.children?.length) node.children.forEach(collect);
    };
    collect(item);
    return contours;
  }

  function mirrorData(data, options = {}) {
    if (!data) return null;
    const axis = options.axis || "Horizontal";
    if (isType(data, "Field")) return mirrorField(data, axis);
    const mapped = mapGeometryData(data, (pt) => mirrorPoint(pt, axis));
    return {
      ...mapped,
      label: `${data.label || data.ngType} / Mirror`,
      history: (data.history || [data.label || data.ngType]).concat([`Mirror(${axis})`]),
      stats: { ...(mapped.stats || data.stats || {}), mirror: axis }
    };
  }

  function rotateMirror(data, options = {}) {
    if (!data) return null;
    const copies = Math.max(2, Math.round(Number(options.copies || 6)));
    const rotation = Number(options.rotation || 0);
    const alternate = options.alternate !== "Off";
    const layers = [];

    for (let index = 0; index < copies; index += 1) {
      const angle = rotation + (360 / copies) * index;
      const source = alternate && index % 2 ? mirrorData(data, { axis: "Horizontal" }) : data;
      layers.push({
        data: rotateData(source, angle),
        opacity: 1
      });
    }

    return {
      ngType: "LayerSet",
      label: `${data.label || data.ngType} / Rotate Mirror`,
      layers,
      history: (data.history || [data.label || data.ngType]).concat([`Rotate Mirror(${copies})`]),
      stats: {
        copies,
        rotation: Math.round(rotation),
        alternate: alternate ? "On" : "Off"
      }
    };
  }

  function rotateData(data, degrees) {
    const mapped = mapGeometryData(data, (pt) => rotatePoint(pt, degrees));
    return {
      ...mapped,
      label: `${data.label || data.ngType} / Rotate`,
      history: (data.history || [data.label || data.ngType]).concat([`Rotate(${Math.round(degrees)})`])
    };
  }

  function fieldBoolean(a, b, options = {}) {
    if (!isType(a, "Field") || !isType(b, "Field")) return null;
    const mode = options.mode || "Max";
    const cols = Math.min(a.cols, b.cols);
    const rows = Math.min(a.rows, b.rows);
    const values = [];

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const av = sampleFieldValue(a, x, y, cols, rows);
        const bv = sampleFieldValue(b, x, y, cols, rows);
        values.push(fieldBooleanValue(mode, av, bv));
      }
    }

    return {
      ngType: "Field",
      label: `${a.label} / ${mode} / ${b.label}`,
      sourceShape: a.sourceShape || b.sourceShape,
      cols,
      rows,
      width: WIDTH,
      height: HEIGHT,
      values,
      history: (a.history || [a.label]).concat([`${mode} ${b.label}`]),
      stats: {
        operation: mode,
        cells: cols * rows,
        sourceA: a.label,
        sourceB: b.label
      }
    };
  }

  function strokeStyle(traceSet, options = {}) {
    if (!isType(traceSet, "TraceSet")) return null;
    const existingStroke = traceSet.stroke || {};
    const explicitColor = isType(options.color, "Color");
    const color = explicitColor
      ? resolveColor(options.color, "#536b57", Number(options.opacity || 68) / 100)
      : {
        color: existingStroke.color || "#536b57",
        opacity: existingStroke.opacity ?? Number(options.opacity || 68) / 100
      };
    color.opacity = clamp(Number(options.opacity || 68) / 100);
    const width = scalarValue(options.widthValue, Number(options.width || 1.2));
    return {
      ...traceSet,
      label: `${traceSet.label} / Stroke Style`,
      stroke: {
        ...(explicitColor ? {} : existingStroke),
        color: color.color,
        opacity: color.opacity,
        width: Math.max(0.1, width)
      },
      history: traceSet.history.concat(["Stroke Style"]),
      stats: {
        ...(traceSet.stats || {}),
        strokeWidth: round(Math.max(0.1, width)),
        strokeOpacity: Math.round(color.opacity * 100),
        strokeColor: color.color
      }
    };
  }

  function inkDistress(input, options = {}, seed = 0) {
    if (!input) return null;
    if (isType(input, "LayerSet")) {
      return mapLayerSet(input, (layerData, index) => inkDistress(layerData, options, seed + index * 61), "Ink Distress");
    }

    const mode = options.mode || "Dry";
    const distress = clamp(Number(options.distress ?? 46) / 100);
    const grain = clamp(Number(options.grain ?? 58) / 100);
    const bleed = clamp(Number(options.bleed ?? 24) / 100);
    const pressure = clamp(Number(options.pressure ?? 70) / 100);
    const threshold = clamp(Number(options.threshold ?? 52) / 100);
    const blockSize = Number(options.blockSize || 9);
    const localSeed = seed + Number(options.seed || 0) * 997;

    if (isType(input, "Shape") && input.kind === "text" && (mode === "Photocopy" || mode === "Block Print" || mode === "Pixel Stamp")) {
      return inkTextArtifact(input, { mode, distress, grain, bleed, pressure, threshold, blockSize }, localSeed);
    }

    const sourceStroke = input.stroke || {};
    const sourceParts = inkPartsFromData(input, localSeed);
    const paths = [];
    const pathColors = [];
    const pathWidths = [];
    const pathOpacities = [];
    const marks = inkMarks(sourceParts.marks, { mode, distress, grain, pressure }, localSeed);
    const fills = inkFills(sourceParts.fills, { mode, distress, grain, bleed, pressure }, localSeed);

    sourceParts.paths.forEach((path, pathIndex) => {
      const color = sourceStroke.pathColors?.[pathIndex] || sourceStroke.color || "#20231f";
      const chunks = inkPathChunks(path, pathIndex, { mode, distress, grain }, localSeed);
      chunks.forEach((chunk, chunkIndex) => {
        const globalIndex = paths.length;
        paths.push(chunk);
        pathColors.push(color);
        pathWidths.push(inkPathWidth(sourceStroke, mode, bleed, pressure, localSeed, globalIndex));
        pathOpacities.push(inkPathOpacity(sourceStroke, mode, distress, pressure, localSeed, globalIndex));
        appendInkSpeckles(marks, chunk, globalIndex, { mode, grain, distress, pressure, color }, localSeed);

        if (bleed > 0.03 && noise(localSeed + 19, globalIndex * 37 + chunkIndex) < bleed * (mode === "Dry" ? 0.4 : 0.9)) {
          const bleedPath = inkBleedPath(chunk, globalIndex, { mode, bleed, grain }, localSeed);
          if (bleedPath.length > 1) {
            paths.push(bleedPath);
            pathColors.push(color);
            pathWidths.push(inkPathWidth(sourceStroke, mode, bleed, pressure, localSeed, globalIndex + 17) * (1.2 + bleed));
            pathOpacities.push((0.09 + bleed * 0.22) * (0.55 + pressure * 0.45));
          }
        }
      });
    });

    if ((mode === "Riso" || mode === "Cheap Print") && paths.length) {
      const duplicateCount = Math.min(120, Math.round(paths.length * (mode === "Riso" ? 0.34 : 0.18)));
      for (let index = 0; index < duplicateCount; index += 1) {
        const sourceIndex = Math.floor(noise(localSeed + 71, index * 29 + 5) * paths.length) % paths.length;
        const ghost = inkRegistrationPath(paths[sourceIndex], index, mode, localSeed);
        paths.push(ghost);
        pathColors.push(pathColors[sourceIndex] || sourceStroke.color || "#20231f");
        pathWidths.push((pathWidths[sourceIndex] || 0.9) * 0.95);
        pathOpacities.push(mode === "Riso" ? 0.18 : 0.12);
      }
    }

    return {
      ngType: "Artifact",
      label: `${input.label || input.ngType} / Ink Distress`,
      sourceShape: input.sourceShape || sourceGhost(input),
      fills,
      paths,
      marks,
      labels: (sourceParts.labels || []).map((label) => ({ ...label, a: (label.a ?? 0.8) * (0.72 + pressure * 0.28) })),
      stroke: {
        color: sourceStroke.color || "#20231f",
        opacity: sourceStroke.opacity ?? (0.42 + pressure * 0.34),
        width: sourceStroke.width || 0.85,
        pathColors,
        pathWidths,
        pathOpacities
      },
      history: (input.history || [input.label || input.ngType]).concat([`Ink Distress(${mode})`]),
      stats: {
        source: input.ngType,
        mode,
        paths: paths.length,
        marks: marks.length,
        distress: Math.round(distress * 100),
        grain: Math.round(grain * 100),
        bleed: Math.round(bleed * 100),
        pressure: Math.round(pressure * 100)
      }
    };
  }

  function inkTextArtifact(shape, options, seed) {
    const fill = shape.fill || [];
    if (!fill.length) return null;
    const mode = options.mode || "Block Print";
    const bounds = shape.bounds || boundsFromPoints(fill);
    const block = inkBlockStep(options);
    const cells = new Map();
    fill.forEach((pt) => {
      const ix = Math.floor((pt.x - bounds.minX) / block);
      const iy = Math.floor((pt.y - bounds.minY) / block);
      const key = `${ix},${iy}`;
      cells.set(key, (cells.get(key) || 0) + 1);
    });

    const fills = [];
    const marks = [];
    const paths = [];
    const pathColors = [];
    const pathWidths = [];
    const pathOpacities = [];
    const pressure = options.pressure || 0;
    const distress = options.distress || 0;
    const grain = options.grain || 0;
    const bleed = options.bleed || 0;
    const threshold = options.threshold ?? 0.52;
    const minHits = Math.max(1, Math.round((block / 3) * threshold * 0.28));

    cells.forEach((count, key) => {
      if (count < minHits) return;
      const [ix, iy] = key.split(",").map(Number);
      const index = iy * 997 + ix;
      if (noise(seed + 241, index) < distress * grain * 0.18) return;
      const x = bounds.minX + ix * block + block / 2;
      const y = bounds.minY + iy * block + block / 2;
      const rough = mode === "Pixel Stamp" ? grain * 0.8 : 0.8 + grain * 2.6 + distress * 3.5;
      const opacity = clamp((0.62 + pressure * 0.36) * (0.78 + noise(seed + 251, index) * 0.28), 0.12, 1);
      fills.push({
        color: "#20231f",
        opacity,
        contours: [inkRectContour(x, y, block + bleed * 2, block + bleed * 2, rough, seed, index)]
      });
      if (noise(seed + 257, index) < distress * 0.18 + grain * 0.08) {
        marks.push({
          x: x + (noise(seed + 263, index) - 0.5) * block,
          y: y + (noise(seed + 269, index) - 0.5) * block,
          r: 0.8 + noise(seed + 271, index) * (block * 0.26),
          a: clamp(0.16 + distress * 0.46, 0.08, 0.78),
          color: "#f8f5eb"
        });
      }
    });

    addInkPaperWear(paths, pathColors, pathWidths, pathOpacities, marks, padBounds(bounds, 22), options, seed + 277);
    return {
      ngType: "Artifact",
      label: `${shape.label || "Text"} / Ink Distress`,
      sourceShape: null,
      fills,
      paths,
      marks,
      labels: [],
      stroke: {
        color: "#20231f",
        opacity: 0.35,
        width: 0.75,
        pathColors,
        pathWidths,
        pathOpacities
      },
      history: (shape.history || ["Text Shape"]).concat([`Ink Distress(${mode})`]),
      stats: {
        source: "Text",
        mode,
        cells: fills.length,
        marks: marks.length,
        block: Math.round(block)
      }
    };
  }

  function randomStrokeColor(input, options = {}, seed = 0) {
    if (!input) return null;
    const palette = options.palette || "Survey";
    const target = options.target || "Both";
    const colorStroke = target !== "Fill";
    const colorFill = target !== "Stroke";
    const opacity = clamp(Number(options.opacity || 68) / 100);
    const title = `Random Color(${palette})`;

    if (isType(input, "LayerSet")) {
      const layers = (input.layers || []).map((layer, index) => ({
        data: randomStrokeColor(layer.data, options, seed + index * 47) || layer.data,
        opacity: layer.opacity
      }));
      return {
        ...input,
        label: `${input.label || "Layer Set"} / Random Color`,
        layers,
        history: (input.history || [input.label || "Layer Set"]).concat([title]),
        stats: {
          ...(input.stats || {}),
          randomStrokePalette: palette,
          layers: layers.length
        }
      };
    }

    if (isType(input, "Shape")) {
      const contourCount = Math.max(1, input.contours?.length || (input.boundary?.length ? 1 : 0));
      const strokeColors = colorStroke
        ? pathColorsFor(Array.from({ length: contourCount }), options, seed)
        : input.shapeStyle?.strokeColors;
      const fillColor = colorFill
        ? colorForRandomStroke(contourCount + 7, options, seed + 23)
        : input.shapeStyle?.fillColor;
      return {
        ...input,
        label: `${input.label} / Random Color`,
        shapeStyle: {
          ...(input.shapeStyle || {}),
          ...(colorStroke ? {
            strokeColor: strokeColors[0] || input.shapeStyle?.strokeColor || "#536b57",
            strokeColors,
            strokeOpacity: opacity
          } : {}),
          ...(colorFill ? {
            fillColor,
            fillOpacity: opacity
          } : {})
        },
        history: (input.history || [input.label || "Shape"]).concat([title]),
        stats: {
          ...(input.stats || {}),
          randomColorPalette: palette,
          randomColorTarget: target
        }
      };
    }

    if (isType(input, "TraceSet")) {
      if (!colorStroke) return {
        ...input,
        history: (input.history || [input.label || "TraceSet"]).concat([title]),
        stats: { ...(input.stats || {}), randomColorTarget: target }
      };
      const pathColors = pathColorsFor(input.paths || [], options, seed);
      return {
        ...input,
        label: `${input.label} / Random Color`,
        stroke: {
          ...(input.stroke || {}),
          color: pathColors[0] || input.stroke?.color || "#536b57",
          pathColors,
          opacity,
          width: input.stroke?.width || 0.8
        },
        history: (input.history || [input.label || "TraceSet"]).concat([title]),
        stats: {
          ...(input.stats || {}),
          randomStrokePalette: palette,
          randomStrokeColors: new Set(pathColors).size
        }
      };
    }

    if (isType(input, "Artifact")) {
      const paths = input.paths || [];
      const pathColors = colorStroke ? pathColorsFor(paths, options, seed) : input.stroke?.pathColors || [];
      const marks = (input.marks || []).map((mark, index) => ({
        ...mark,
        ...(colorStroke ? { color: colorForRandomStroke(index, options, seed + 13) } : {})
      }));
      const labels = (input.labels || []).map((label, index) => ({
        ...label,
        ...(colorStroke ? { color: colorForRandomStroke(index, options, seed + 17), a: opacity } : {})
      }));
      const fills = (input.fills || []).map((fill, index) => ({
        ...fill,
        ...(colorFill ? {
          color: colorForRandomStroke(index + paths.length + 11, options, seed + 29),
          opacity
        } : {})
      }));
      return {
        ...input,
        label: `${input.label} / Random Color`,
        fills,
        marks,
        labels,
        stroke: colorStroke ? {
          ...(input.stroke || {}),
          color: pathColors[0] || input.stroke?.color || "#536b57",
          pathColors,
          opacity,
          width: input.stroke?.width || 0.8
        } : input.stroke,
        history: (input.history || [input.label || "Artifact"]).concat([title]),
        stats: {
          ...(input.stats || {}),
          randomStrokePalette: palette,
          randomStrokeColors: new Set(pathColors.concat(marks.map((mark) => mark.color).filter(Boolean), labels.map((label) => label.color).filter(Boolean), fills.map((fill) => fill.color).filter(Boolean))).size
        }
      };
    }

    return null;
  }

  function randomSize(data, options = {}, seed = 0) {
    if (!data) return null;
    let min = Number(options.min || 45) / 100;
    let max = Number(options.max || 140) / 100;
    if (max < min) [min, max] = [max, min];
    const localSeed = seed + Number(options.seed || 0) * 1009;
    const factorFor = (index) => lerp(min, max, noise(localSeed, index * 79 + 23));

    if (isType(data, "PointSet")) {
      const points = (data.points || []).map((pt, index) => ({
        ...pt,
        scale: (pt.scale || 1) * factorFor(index)
      }));
      return {
        ...data,
        label: `${data.label || "PointSet"} / Random Size`,
        points,
        history: (data.history || ["PointSet"]).concat(["Random Size"]),
        stats: {
          ...(data.stats || {}),
          randomSizeMin: Math.round(min * 100),
          randomSizeMax: Math.round(max * 100)
        }
      };
    }

    if (isType(data, "LayerSet")) {
      const layers = (data.layers || []).map((layer, index) => {
        const factor = factorFor(index);
        return {
          ...layer,
          data: scaleDataAround(layer.data, contentCenter(layer.data), factor),
          scale: (layer.scale || 1) * factor
        };
      });
      return {
        ...data,
        label: `${data.label || "Layer Set"} / Random Size`,
        layers,
        history: (data.history || ["Layer Set"]).concat(["Random Size"]),
        stats: {
          ...(data.stats || {}),
          randomSizeMin: Math.round(min * 100),
          randomSizeMax: Math.round(max * 100)
        }
      };
    }

    const factor = factorFor(0);
    const scaled = scaleDataAround(data, contentCenter(data), factor);
    return {
      ...scaled,
      label: `${data.label || data.ngType} / Random Size`,
      history: (data.history || [data.label || data.ngType]).concat(["Random Size"]),
      stats: {
        ...(scaled.stats || data.stats || {}),
        randomSize: Math.round(factor * 100)
      }
    };
  }

  function pointLabels(pointSet, arrayData, options = {}, seed = 0) {
    if (!isType(pointSet, "PointSet")) return null;
    const limit = Math.max(1, Math.round(Number(options.limit || 900)));
    const size = Math.max(2, Number(options.size || 9));
    const offset = Number(options.offset || 8);
    const opacity = clamp(Number(options.opacity || 80) / 100);
    const color = resolveColor(options.color, "#20231f", opacity);
    const values = isType(arrayData, "Array") && arrayData.values?.length ? arrayData.values : null;
    const points = decimate(pointSet.points || [], limit);
    const labels = points.map((pt, index) => {
      const normal = normalize(pt.nx || noise(seed, index + 3) - 0.5, pt.ny || noise(seed, index + 7) - 0.5);
      return {
        x: pt.x + normal.x * offset,
        y: pt.y + normal.y * offset,
        text: values ? values[index % values.length] : String(index).padStart(3, "0"),
        size,
        color: color.color,
        a: opacity
      };
    });

    return {
      ngType: "Artifact",
      label: `${pointSet.label || "PointSet"} / Point Labels`,
      sourceShape: null,
      fills: [],
      paths: [],
      marks: [],
      labels,
      stroke: { color: color.color, opacity, width: 0.8 },
      history: (pointSet.history || ["PointSet"]).concat(values ? arrayData.history || ["Array"] : ["Index"], ["Point Labels"]),
      stats: {
        labels: labels.length,
        size: Math.round(size),
        array: values ? arrayData.label || "Array" : "Index"
      }
    };
  }

  function sineWave(data, options = {}) {
    if (!data) return null;
    const axis = options.axis || "Horizontal";
    const amplitude = Number(options.amplitude || 0);
    const wavelength = Math.max(1, Number(options.wavelength || 180));
    const phase = (Number(options.phase || 0) / 360) * TAU;
    const mapped = mapGeometryData(data, (pt) => sineWavePoint(pt, axis, amplitude, wavelength, phase));
    return {
      ...mapped,
      label: `${data.label || data.ngType} / Sine Wave`,
      history: (data.history || [data.label || data.ngType]).concat([`Sine Wave(${axis})`]),
      stats: {
        ...(mapped.stats || data.stats || {}),
        waveAxis: axis,
        amplitude: Math.round(amplitude),
        wavelength: Math.round(wavelength)
      }
    };
  }

  function repeatData(data, options = {}) {
    if (!data) return null;
    const count = Math.max(1, Math.round(Number(options.count || 5)));
    const stepX = Number(options.stepX || 0);
    const stepY = Number(options.stepY || 0);
    const scale = Number(options.scale || 1);
    const fade = clamp(Number(options.fade || 0) / 100, 0, 0.95);
    const layers = [];

    for (let index = 0; index < count; index += 1) {
      const factor = Math.pow(scale, index);
      const opacity = count <= 1 ? 1 : clamp(1 - fade * (index / (count - 1)), 0.05, 1);
      layers.push({
        data: transformData(data, stepX * index, stepY * index, factor),
        opacity
      });
    }

    return {
      ngType: "LayerSet",
      label: `${data.label || data.ngType} / Repeat`,
      layers,
      history: (data.history || [data.label || data.ngType]).concat([`Repeat(${count})`]),
      stats: {
        copies: layers.length,
        stepX: Math.round(stepX),
        stepY: Math.round(stepY),
        scale: round(scale),
        fade: Math.round(fade * 100)
      }
    };
  }

  function matrixRepeatData(data, options = {}, seed = 0) {
    if (!data) return null;
    const columns = Math.max(1, Math.round(Number(options.columns || 4)));
    const rows = Math.max(1, Math.round(Number(options.rows || 3)));
    const stepX = Number(options.stepX || 180);
    const stepY = Number(options.stepY || 140);
    const scale = clamp(Number(options.scale || 1), 0.05, 5);
    const jitter = Math.max(0, Number(options.jitter || 0));
    const fade = clamp(Number(options.fade || 0) / 100, 0, 0.95);
    const midCol = (columns - 1) / 2;
    const midRow = (rows - 1) / 2;
    const maxDistance = Math.max(1, midCol + midRow);
    const layers = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const index = row * columns + col;
        const distance = Math.abs(col - midCol) + Math.abs(row - midRow);
        const opacity = clamp(1 - fade * (distance / maxDistance), 0.05, 1);
        const jitterX = jitter ? (noise(seed + 5, index * 37 + 3) - 0.5) * jitter : 0;
        const jitterY = jitter ? (noise(seed + 9, index * 41 + 7) - 0.5) * jitter : 0;
        layers.push({
          data: transformData(data, (col - midCol) * stepX + jitterX, (row - midRow) * stepY + jitterY, scale),
          opacity
        });
      }
    }

    return {
      ngType: "LayerSet",
      label: `${data.label || data.ngType} / Matrix Repeat`,
      layers,
      history: (data.history || [data.label || data.ngType]).concat([`Matrix Repeat(${columns}x${rows})`]),
      stats: {
        copies: layers.length,
        columns,
        rows,
        stepX: Math.round(stepX),
        stepY: Math.round(stepY),
        scale: round(scale),
        jitter: Math.round(jitter)
      }
    };
  }

  function layerStack(a, b, options) {
    if (!a || !b) return null;
    const blendB = options.blendB && options.blendB !== "Source" ? options.blendB : b.blendMode || "Normal";
    const layers = [
      { data: a, opacity: clamp(Number(options.opacityA || 100) / 100) },
      { data: b, opacity: clamp(Number(options.opacityB || 78) / 100), blendMode: blendB }
    ];

    return {
      ngType: "LayerSet",
      label: "Layer Stack",
      layers,
      history: ["Layer Stack"],
      stats: {
        layers: layers.length,
        opacityA: Math.round(layers[0].opacity * 100),
        opacityB: Math.round(layers[1].opacity * 100),
        blendB
      }
    };
  }

  function flattenLayers(layerSet) {
    if (!isType(layerSet, "LayerSet")) return null;
    const parts = emptyArtifactParts();
    (layerSet.layers || []).forEach((layer, index) => {
      mergeArtifactParts(parts, artifactPartsFromData(layer.data, layer.opacity ?? 1, index));
    });
    return {
      ngType: "Artifact",
      label: `${layerSet.label || "Layer Set"} / Flatten Layers`,
      sourceShape: null,
      fills: parts.fills,
      paths: parts.paths,
      marks: parts.marks,
      labels: parts.labels,
      stroke: { color: "#536b57", opacity: 0.62, width: 0.9 },
      history: (layerSet.history || ["Layer Stack"]).concat(["Flatten Layers"]),
      stats: {
        layers: (layerSet.layers || []).length,
        fills: parts.fills.reduce((sum, fill) => sum + (fill.contours || []).length, 0),
        paths: parts.paths.length,
        marks: parts.marks.length,
        labels: parts.labels.length
      }
    };
  }

  function layersToTraceSet(layerSet, options = {}) {
    if (!isType(layerSet, "LayerSet")) return null;
    const paths = [];
    collectLayerPaths(layerSet, paths, options);
    return {
      ngType: "TraceSet",
      label: `${layerSet.label || "Layer Set"} / Layers To TraceSet`,
      sourceShape: null,
      paths,
      style: "layers",
      history: (layerSet.history || ["Layer Stack"]).concat(["Layers To TraceSet"]),
      stats: {
        layers: (layerSet.layers || []).length,
        paths: paths.length,
        fieldLevels: Math.round(Number(options.fieldLevels || 7))
      }
    };
  }

  function rasterizeLayers(layerSet, options = {}) {
    if (!isType(layerSet, "LayerSet")) return null;
    const cols = Math.max(24, Math.round(Number(options.detail || 72)));
    const rows = Math.max(18, Math.round(cols * (HEIGHT / WIDTH)));
    const sensitivity = Number(options.sensitivity || 46);
    const gain = 0.7 + sensitivity / 70;
    const values = [];

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const pt = {
          x: (x / (cols - 1)) * WIDTH,
          y: (y / (rows - 1)) * HEIGHT
        };
        values.push(clamp(layerDensity(layerSet, pt) * gain));
      }
    }

    return {
      ngType: "Field",
      label: `${layerSet.label || "Layer Set"} / Rasterize Layers`,
      sourceShape: null,
      cols,
      rows,
      width: WIDTH,
      height: HEIGHT,
      originX: 0,
      originY: 0,
      values,
      history: (layerSet.history || ["Layer Stack"]).concat(["Rasterize Layers"]),
      stats: {
        layers: (layerSet.layers || []).length,
        cells: cols * rows,
        detail: cols,
        sensitivity: Math.round(sensitivity)
      }
    };
  }

  function wind(traceSet, options, seed) {
    if (!isType(traceSet, "TraceSet")) return null;
    const force = Number(options.force || 52);
    const angle = ((Number(options.angle || 0) - 50) / 50) * Math.PI;
    const strength = force / 100;
    const dx = Math.cos(angle) * strength * 130;
    const dy = Math.sin(angle) * strength * 80;

    const paths = traceSet.paths.map((path, pathIndex) => path.map((point, pointIndex) => {
      const t = pointIndex / Math.max(1, path.length - 1);
      const wave = Math.sin(point.y * 0.025 + pathIndex * 0.2 + seed) * strength * 28;
      return {
        x: point.x + dx * (0.25 + t) + wave,
        y: point.y + dy * (0.25 + t) + Math.cos(point.x * 0.018 + seed) * strength * 16
      };
    }));

    return {
      ngType: "TraceSet",
      label: `${traceSet.label} / Wind`,
      sourceShape: traceSet.sourceShape,
      paths,
      style: "wind",
      history: traceSet.history.concat(["Wind"]),
      stats: {
        paths: paths.length,
        force: Math.round(force)
      }
    };
  }

  function erode(traceSet, options, seed) {
    if (!isType(traceSet, "TraceSet")) return null;
    const amount = Number(options.amount || 42) / 100;
    const paths = [];

    traceSet.paths.forEach((path, pathIndex) => {
      let current = [];
      path.forEach((pt, pointIndex) => {
        const skip = pointIndex > 0 && pointIndex < path.length - 1 && noise(seed, pathIndex * 97 + pointIndex) < amount * 0.42;
        if (skip) {
          if (current.length > 1) paths.push(current);
          current = [];
          return;
        }
        current.push({
          x: pt.x + (noise(seed, pathIndex * 131 + pointIndex) - 0.5) * amount * 18,
          y: pt.y + (noise(seed, pathIndex * 151 + pointIndex) - 0.5) * amount * 18
        });
      });
      if (current.length > 1) paths.push(current);
    });

    return {
      ngType: "TraceSet",
      label: `${traceSet.label} / Erode`,
      sourceShape: traceSet.sourceShape,
      paths,
      style: "erode",
      history: traceSet.history.concat(["Erode"]),
      stats: {
        paths: paths.length,
        erosion: Math.round(amount * 100)
      }
    };
  }

  function dither(input, options, seed) {
    if (!input) return null;
    if (isType(input, "LayerSet")) {
      return mapLayerSet(input, (layerData, index) => dither(layerData, options, seed + index * 43), "Dither");
    }
    const amount = Number(options.amount || 48);
    const candidates = candidatesForDither(input);
    const count = Math.min(1600, Math.max(120, Math.round(amount * 16)));
    const marks = [];

    for (let index = 0; index < count && candidates.length; index += 1) {
      const base = candidates[Math.floor(noise(seed, index + 222) * candidates.length)];
      const cell = 5 + Math.round((100 - amount) / 18);
      marks.push({
        x: Math.round((base.x + (noise(seed, index + 31) - 0.5) * 7) / cell) * cell,
        y: Math.round((base.y + (noise(seed, index + 73) - 0.5) * 7) / cell) * cell,
        r: 1.1 + noise(seed, index + 83) * (amount / 24),
        a: 0.35 + noise(seed, index + 39) * 0.5
      });
    }

    return {
      ngType: "Artifact",
      label: `${input.label || input.ngType} / Dither`,
      sourceShape: input.sourceShape || sourceGhost(input),
      fills: [],
      paths: [],
      marks,
      history: (input.history || []).concat(["Dither"]),
      stats: {
        marks: marks.length,
        source: input.ngType,
        density: Math.round(amount)
      }
    };
  }

  function candidatesForDither(input) {
    if (isType(input, "Shape")) return decimate(input.fill.concat(input.boundary), 2200);
    if (isType(input, "TraceSet")) {
      const points = [];
      input.paths.forEach((path) => {
        for (let i = 0; i < path.length - 1; i += 1) {
          const a = path[i];
          const b = path[i + 1];
          const steps = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 8));
          for (let step = 0; step <= steps; step += 1) {
            const t = step / steps;
            points.push(point(lerp(a.x, b.x, t), lerp(a.y, b.y, t), 0, -1, "trace"));
          }
        }
      });
      return decimate(points, 2600);
    }
    if (isType(input, "Field")) {
      const points = [];
      for (let y = 0; y < input.rows; y += 1) {
        for (let x = 0; x < input.cols; x += 1) {
          const value = fieldValue(input, x, y);
          if (value > 0.15) {
            const p = gridPoint(input, x, y);
            const repeats = Math.max(1, Math.round(value * 4));
            for (let i = 0; i < repeats; i += 1) points.push(point(p.x, p.y, 0, -1, "field"));
          }
        }
      }
      return points;
    }
    return [];
  }

  function draw(ctx, data, options = {}) {
    const x = options.x || 0;
    const y = options.y || 0;
    const width = options.width || WIDTH;
    const height = options.height || HEIGHT;
    const scale = Math.min(width / WIDTH, height / HEIGHT);
    const offsetX = x + (width - WIDTH * scale) / 2;
    const offsetY = y + (height - HEIGHT * scale) / 2;

    ctx.save();
    ctx.clearRect(x, y, width, height);
    if (data && !isType(data, "Value") && usesContentFrame(data)) {
      drawContentFrame(ctx, data, x, y, width, height, options);
      ctx.restore();
      return;
    }
    drawPaper(ctx, x, y, width, height, options);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    if (!data) {
      drawEmpty(ctx);
    } else if (isType(data, "Value")) {
      drawValue(ctx, data);
    } else {
      const fit = contentFit(data);
      ctx.save();
      ctx.translate(fit.x, fit.y);
      ctx.scale(fit.scale, fit.scale);
      drawContent(ctx, data);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawContentFrame(ctx, data, x, y, width, height, options) {
    const frame = padBounds(contentBounds(data), 46);
    const frameWidth = Math.max(1, frame.maxX - frame.minX);
    const frameHeight = Math.max(1, frame.maxY - frame.minY);
    const scale = Math.min(width / frameWidth, height / frameHeight);
    const paperWidth = frameWidth * scale;
    const paperHeight = frameHeight * scale;
    const paperX = x + (width - paperWidth) / 2;
    const paperY = y + (height - paperHeight) / 2;

    drawPaper(ctx, paperX, paperY, paperWidth, paperHeight, options);
    ctx.save();
    ctx.beginPath();
    ctx.rect(paperX, paperY, paperWidth, paperHeight);
    ctx.clip();
    ctx.translate(paperX - frame.minX * scale, paperY - frame.minY * scale);
    ctx.scale(scale, scale);
    drawContent(ctx, data);
    ctx.restore();
  }

  function drawContent(ctx, data) {
    if (isType(data, "LayerSet")) {
      data.layers.forEach((layer) => {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = canvasBlendMode(layer.blendMode || layer.data?.blendMode);
        drawContent(ctx, layer.data);
        ctx.restore();
      });
    } else if (isType(data, "Image")) {
      drawImageLayer(ctx, data);
    } else if (isType(data, "Shape")) {
      drawShape(ctx, data, 0.82);
    } else if (isType(data, "PointSet")) {
      drawShape(ctx, data.sourceShape, 0.16);
      drawPoints(ctx, data.points);
    } else if (isType(data, "Field")) {
      drawShape(ctx, data.sourceShape, 0.08);
      drawField(ctx, data);
    } else if (isType(data, "TraceSet")) {
      drawShape(ctx, data.sourceShape, 0.12);
      drawPaths(ctx, data.paths, data.style, data.stroke);
    } else if (isType(data, "Artifact")) {
      drawShape(ctx, data.sourceShape, 0.08);
      drawFills(ctx, data.fills || []);
      drawPaths(ctx, data.paths || [], "scanline", data.stroke);
      drawMarks(ctx, data.marks || []);
      drawLabels(ctx, data.labels || []);
    }
  }

  function drawPaper(ctx, x, y, width, height, options = {}) {
    ctx.save();
    const background = options.background || "Paper";
    if (background !== "Transparent") {
      ctx.fillStyle = backgroundColor(background, options.backgroundColor || options.background_color);
      ctx.fillRect(x, y, width, height);
    }
    if (options.grid === "Off") {
      ctx.strokeStyle = "rgba(32, 35, 31, 0.18)";
      ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
      ctx.restore();
      return;
    }
    ctx.strokeStyle = "rgba(69, 108, 124, 0.14)";
    ctx.lineWidth = 1;
    const step = Math.max(18, Math.min(width, height) / 18);
    for (let gx = x + step; gx < x + width; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + height);
      ctx.stroke();
    }
    for (let gy = y + step; gy < y + height; gy += step) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + width, gy);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(32, 35, 31, 0.18)";
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    ctx.restore();
  }

  function drawEmpty(ctx) {
    ctx.fillStyle = "rgba(32, 35, 31, 0.55)";
    ctx.font = `700 30px ${UI_FONT}`;
    ctx.fillText("Connect typed geometry", 92, 130);
    ctx.font = `18px ${UI_FONT}`;
    ctx.fillText("Preview accepts Image, Shape, PointSet, Field, TraceSet, Artifact, or LayerSet.", 92, 164);
  }

  function drawValue(ctx, data) {
    ctx.save();
    ctx.fillStyle = "rgba(32, 35, 31, 0.72)";
    ctx.font = `700 72px ${UI_FONT}`;
    ctx.fillText(round(data.value), 86, 210);
    ctx.font = `16px ${UI_FONT}`;
    ctx.fillText((data.history || ["Value"]).join(" / "), 92, 250);
    ctx.restore();
  }

  function drawShape(ctx, shape, alpha = 0.45) {
    if (!shape || shape.showBody === false) return;
    ctx.save();
    ctx.lineWidth = shapeStrokeWidth(shape);
    if (shape.kind === "text") {
      ctx.globalAlpha = shape.shapeStyle?.fillColor ? shapeFillOpacity(shape, alpha) : alpha;
      ctx.fillStyle = shape.shapeStyle?.fillColor || shapeStrokeColor(shape, 0);
      ctx.font = `800 ${shape.layout.size}px ${shape.layout.font}, Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(shape.text, shape.layout.x, shape.layout.y);
    }
    if (shape.kind === "circle") {
      if (shape.shapeStyle?.fillColor) {
        ctx.globalAlpha = shapeFillOpacity(shape, alpha);
        ctx.fillStyle = shapeFillColor(shape);
        ctx.beginPath();
        ctx.arc(CX, CY, shape.radius, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = shapeStrokeOpacity(shape, alpha);
      ctx.strokeStyle = shapeStrokeColor(shape, 0);
      ctx.beginPath();
      ctx.arc(CX, CY, shape.radius, 0, TAU);
      ctx.stroke();
    }
    if (shape.kind !== "text" && shape.kind !== "circle" && shape.contours?.length) {
      if (shape.shapeStyle?.fillColor) {
        ctx.beginPath();
        shape.contours.forEach((contour) => {
          if (!contour.length) return;
          contour.forEach((pt, index) => {
            if (index === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.closePath();
        });
        ctx.globalAlpha = shapeFillOpacity(shape, alpha);
        ctx.fillStyle = shapeFillColor(shape);
        ctx.fill(shape.fillRule === "evenodd" ? "evenodd" : "nonzero");
      }
      shape.contours.forEach((contour, contourIndex) => {
        if (!contour.length) return;
        ctx.beginPath();
        contour.forEach((pt, index) => {
          if (index === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.globalAlpha = shapeStrokeOpacity(shape, alpha);
        ctx.strokeStyle = shapeStrokeColor(shape, contourIndex);
        ctx.stroke();
      });
    }
    if (shape.kind !== "text" && shape.kind !== "circle" && !shape.contours?.length && shape.boundary?.length) {
      const samples = decimate(shape.boundary, 1200);
      samples.forEach((pt) => {
        ctx.globalAlpha = shapeStrokeOpacity(shape, alpha);
        ctx.fillStyle = shapeStrokeColor(shape, 0);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.5, 0, TAU);
        ctx.fill();
      });
    }
    ctx.restore();
  }

  function drawPoints(ctx, points) {
    ctx.save();
    points.forEach((p, index) => {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = index % 8 === 0 ? "#9b6048" : "#20231f";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, TAU);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawImageLayer(ctx, image) {
    if (!image) return;
    const cached = cachedRasterImage(image.dataUrl);
    ctx.save();
    ctx.globalAlpha = image.opacity ?? 1;
    ctx.globalCompositeOperation = canvasBlendMode(image.blendMode);
    if (cached?.complete && cached.naturalWidth) {
      ctx.drawImage(cached, image.originX, image.originY, image.width, image.height);
    } else if (image.pixels?.length && image.cols && image.rows && typeof document !== "undefined") {
      const canvas = rasterCanvasFromPixels(image);
      if (canvas) ctx.drawImage(canvas, image.originX, image.originY, image.width, image.height);
    } else {
      ctx.fillStyle = "rgba(69, 108, 124, 0.16)";
      ctx.fillRect(image.originX, image.originY, image.width, image.height);
    }
    ctx.restore();
  }

  function drawField(ctx, field) {
    ctx.save();
    const originX = fieldOriginX(field);
    const originY = fieldOriginY(field);
    const cellW = fieldWidth(field) / (field.cols - 1);
    const cellH = fieldHeight(field) / (field.rows - 1);
    for (let y = 0; y < field.rows; y += 1) {
      for (let x = 0; x < field.cols; x += 1) {
        const value = fieldValue(field, x, y);
        if (value <= 0.02) continue;
        ctx.fillStyle = `rgba(69, 108, 124, ${value * 0.42})`;
        ctx.fillRect(originX + x * cellW, originY + y * cellH, cellW + 1, cellH + 1);
      }
    }
    ctx.restore();
  }

  function drawFills(ctx, fills) {
    ctx.save();
    fills.forEach((fill) => {
      ctx.fillStyle = fill.color || "#536b57";
      ctx.globalAlpha = fill.opacity ?? 0.48;
      (fill.contours || []).forEach((contour) => {
        if (!contour.length) return;
        ctx.beginPath();
        contour.forEach((pt, index) => {
          if (index === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.fill();
      });
    });
    ctx.restore();
  }

  function drawPaths(ctx, paths, style, stroke = null) {
    ctx.save();
    paths.forEach((path, index) => {
      if (path.length < 2) return;
      ctx.beginPath();
      path.forEach((p, pointIndex) => {
        if (pointIndex === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = strokeColorForPath(stroke, style, index);
      ctx.globalAlpha = strokeOpacityForPath(stroke, style, index);
      ctx.lineWidth = strokeWidthForPath(stroke, style, index);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawMarks(ctx, marks) {
    ctx.save();
    marks.forEach((mark, index) => {
      ctx.globalAlpha = mark.a;
      ctx.fillStyle = mark.color || (index % 9 === 0 ? "#9b6048" : index % 5 === 0 ? "#456c7c" : "#20231f");
      ctx.beginPath();
      ctx.arc(mark.x, mark.y, mark.r, 0, TAU);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawLabels(ctx, labels) {
    ctx.save();
    labels.forEach((label) => {
      ctx.globalAlpha = label.a ?? 0.8;
      ctx.fillStyle = label.color || "#20231f";
      ctx.font = `700 ${label.size || 9}px ${UI_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(label.text || ""), label.x, label.y);
    });
    ctx.restore();
  }

  function toSvg(data, options = {}) {
    const background = options.background || "Paper";
    const parts = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">`,
      background === "Transparent" ? "" : `<rect width="${WIDTH}" height="${HEIGHT}" fill="${backgroundColor(background, options.backgroundColor || options.background_color)}"/>`,
      options.grid === "Off" ? "" : svgGrid()
    ];

    if (data && !isType(data, "Value")) {
      const fit = contentFit(data);
      parts.push(`<g transform="translate(${round(fit.x)} ${round(fit.y)}) scale(${round(fit.scale)})">${svgContent(data)}</g>`);
    } else {
      parts.push(svgContent(data));
    }
    parts.push("</svg>");
    return parts.join("");
  }

  function svgContent(data) {
    if (!data) return "";
    if (isType(data, "LayerSet")) {
      return data.layers.map((layer) => `<g opacity="${round(layer.opacity)}"${svgBlendAttr(layer.blendMode || layer.data?.blendMode)}>${svgContent(layer.data)}</g>`).join("");
    }
    if (isType(data, "Image")) return svgImage(data);
    if (isType(data, "Shape")) return svgShape(data, 0.72);
    if (isType(data, "PointSet")) {
      return [
        svgShape(data.sourceShape, 0.12),
        ...data.points.map((p, i) => `<circle cx="${round(p.x)}" cy="${round(p.y)}" r="2" fill="${i % 8 === 0 ? "#9b6048" : "#20231f"}" opacity="0.55"/>`)
      ].join("");
    }
    if (isType(data, "Field")) return [svgShape(data.sourceShape, 0.08), svgField(data)].join("");
    if (isType(data, "TraceSet")) {
      return [
        svgShape(data.sourceShape, 0.1),
        ...data.paths.map((path, i) => svgPath(path, data.style, i, data.stroke))
      ].join("");
    }
    if (isType(data, "Artifact")) {
      return [
        svgShape(data.sourceShape, 0.08),
        svgFills(data.fills || []),
        ...(data.paths || []).map((path, i) => svgPath(path, "scanline", i, data.stroke)),
        ...(data.marks || []).map((m, i) => `<circle cx="${round(m.x)}" cy="${round(m.y)}" r="${round(m.r)}" fill="${m.color || (i % 9 === 0 ? "#9b6048" : i % 5 === 0 ? "#456c7c" : "#20231f")}" opacity="${round(m.a)}"/>`),
        ...(data.labels || []).map((label) => `<text x="${round(label.x)}" y="${round(label.y)}" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace" font-size="${round(label.size || 9)}" font-weight="700" fill="${label.color || "#20231f"}" opacity="${round(label.a ?? 0.8)}">${escapeText(label.text || "")}</text>`)
      ].join("");
    }
    return "";
  }

  function svgGrid() {
    const lines = [];
    for (let x = 60; x < WIDTH; x += 40) lines.push(`<path d="M${x} 0V${HEIGHT}" stroke="#456c7c" stroke-opacity="0.08"/>`);
    for (let y = 40; y < HEIGHT; y += 40) lines.push(`<path d="M0 ${y}H${WIDTH}" stroke="#456c7c" stroke-opacity="0.08"/>`);
    return `<g>${lines.join("")}</g>`;
  }

  function svgShape(shape, opacity) {
    if (!shape || shape.showBody === false) return "";
    const strokeOpacity = round(shapeStrokeOpacity(shape, opacity));
    const fillColor = shapeFillColor(shape);
    const fillOpacity = round(shapeFillOpacity(shape, opacity));
    const strokeWidth = round(shapeStrokeWidth(shape));
    if (shape.kind === "text") {
      return `<text x="${shape.layout.x}" y="${shape.layout.y}" text-anchor="middle" dominant-baseline="middle" font-family="${escapeAttr(shape.layout.font)}, Georgia, serif" font-size="${round(shape.layout.size)}" font-weight="800" fill="${fillColor || shapeStrokeColor(shape, 0)}" opacity="${fillColor ? fillOpacity : round(opacity)}">${escapeText(shape.text)}</text>`;
    }
    if (shape.kind === "circle") {
      return `<circle cx="${CX}" cy="${CY}" r="${round(shape.radius)}" fill="${fillColor || "none"}" fill-opacity="${fillColor ? fillOpacity : 0}" stroke="${shapeStrokeColor(shape, 0)}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}"/>`;
    }
    if (shape.contours?.length) {
      const fillPath = fillColor
        ? `<path d="${shape.contours.map((contour) => closePath(contour).map((p, i) => `${i ? "L" : "M"}${round(p.x)} ${round(p.y)}`).join("")).join("")}" fill="${fillColor}" fill-opacity="${fillOpacity}" fill-rule="${shape.fillRule || "nonzero"}"/>`
        : "";
      const paths = shape.contours.map((contour, index) => {
        const closed = closePath(contour);
        const d = closed.map((p, i) => `${i ? "L" : "M"}${round(p.x)} ${round(p.y)}`).join("");
        return `<path d="${d}" fill="none" stroke="${shapeStrokeColor(shape, index)}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}"/>`;
      });
      return `<g>${fillPath}${paths.join("")}</g>`;
    }
    return "";
  }

  function svgImage(image) {
    const href = image?.dataUrl || rasterDataUrlFromPixels(image);
    if (!href) return "";
    return `<image href="${escapeAttr(href)}" x="${round(image.originX)}" y="${round(image.originY)}" width="${round(image.width)}" height="${round(image.height)}" opacity="${round(image.opacity ?? 1)}"${svgBlendAttr(image.blendMode)} preserveAspectRatio="none"/>`;
  }

  function svgField(field) {
    const originX = fieldOriginX(field);
    const originY = fieldOriginY(field);
    const cellW = fieldWidth(field) / (field.cols - 1);
    const cellH = fieldHeight(field) / (field.rows - 1);
    const rects = [];
    for (let y = 0; y < field.rows; y += 1) {
      for (let x = 0; x < field.cols; x += 1) {
        const value = fieldValue(field, x, y);
        if (value > 0.08) {
          rects.push(`<rect x="${round(originX + x * cellW)}" y="${round(originY + y * cellH)}" width="${round(cellW + 1)}" height="${round(cellH + 1)}" fill="#456c7c" opacity="${round(value * 0.4)}"/>`);
        }
      }
    }
    return `<g>${rects.join("")}</g>`;
  }

  function svgFills(fills) {
    return fills.map((fill) => (fill.contours || []).map((contour) => {
      const closed = closePath(contour);
      const d = closed.map((p, i) => `${i ? "L" : "M"}${round(p.x)} ${round(p.y)}`).join("");
      return `<path d="${d}" fill="${fill.color || "#536b57"}" opacity="${round(fill.opacity ?? 0.48)}"/>`;
    }).join("")).join("");
  }

  function svgPath(path, style, index, stroke = null) {
    if (!path || path.length < 2) return "";
    const d = path.map((p, i) => `${i ? "L" : "M"}${round(p.x)} ${round(p.y)}`).join("");
    const color = strokeColorForPath(stroke, style, index);
    const opacity = strokeOpacityForPath(stroke, style, index);
    const width = strokeWidthForPath(stroke, style, index);
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
  }

  function sourceGhost(shape) {
    if (!shape || !shape.ngType) return null;
    if (shape.ngType === "Shape" && shape.kind === "text") {
      return {
        ngType: "Shape",
        kind: "text",
        label: shape.label,
        text: shape.text,
        font: shape.font,
        size: shape.size,
        showBody: shape.showBody,
        layout: shape.layout,
        bounds: shape.bounds,
        guides: shape.guides || []
      };
    }
    if (shape.ngType === "Shape" && shape.kind === "circle") {
      return {
        ngType: "Shape",
        kind: "circle",
        label: shape.label,
        radius: shape.radius,
        showBody: shape.showBody,
        bounds: shape.bounds
      };
    }
    if (shape.ngType === "Shape") {
      return {
        ngType: "Shape",
        kind: shape.kind,
        label: shape.label,
        showBody: shape.showBody,
        bounds: shape.bounds,
        width: shape.width,
        height: shape.height,
        radius: shape.radius,
        sides: shape.sides,
        contours: shape.contours || []
      };
    }
    return shape.sourceShape || null;
  }

  function extractSvgPathData(text) {
    const source = String(text || "");
    const matches = [...source.matchAll(/\sd=(["'])(.*?)\1/gi)].map((match) => match[2]);
    return matches.length ? matches.join(" ") : source;
  }

  function parseSvgPathData(data) {
    const tokens = String(data || "").match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/g) || [];
    const paths = [];
    let index = 0;
    let command = "";
    let x = 0;
    let y = 0;
    let startX = 0;
    let startY = 0;
    let current = [];

    const read = () => Number(tokens[index++]);
    const hasNumber = () => index < tokens.length && !isSvgCommand(tokens[index]);
    const pushCurrent = () => {
      if (current.length > 1) paths.push(current);
      current = [];
    };
    const pointFor = (px, py, relative) => ({
      x: relative ? x + px : px,
      y: relative ? y + py : py
    });

    while (index < tokens.length) {
      if (isSvgCommand(tokens[index])) command = tokens[index++];
      if (!command) break;
      const op = command.toUpperCase();
      const relative = command !== op;

      if (op === "M") {
        if (current.length) pushCurrent();
        if (!hasNumber()) continue;
        const first = pointFor(read(), read(), relative);
        x = first.x;
        y = first.y;
        startX = x;
        startY = y;
        current.push({ x, y });
        while (hasNumber()) {
          const next = pointFor(read(), read(), relative);
          x = next.x;
          y = next.y;
          current.push({ x, y });
        }
        command = relative ? "l" : "L";
        continue;
      }

      if (op === "L") {
        while (hasNumber()) {
          const next = pointFor(read(), read(), relative);
          x = next.x;
          y = next.y;
          current.push({ x, y });
        }
        continue;
      }

      if (op === "H") {
        while (hasNumber()) {
          const nextX = read();
          x = relative ? x + nextX : nextX;
          current.push({ x, y });
        }
        continue;
      }

      if (op === "V") {
        while (hasNumber()) {
          const nextY = read();
          y = relative ? y + nextY : nextY;
          current.push({ x, y });
        }
        continue;
      }

      if (op === "C") {
        while (hasNumber() && index + 5 < tokens.length) {
          const c1 = pointFor(read(), read(), relative);
          const c2 = pointFor(read(), read(), relative);
          const end = pointFor(read(), read(), relative);
          sampleCubic({ x, y }, c1, c2, end).forEach((pt) => current.push(pt));
          x = end.x;
          y = end.y;
        }
        continue;
      }

      if (op === "Q") {
        while (hasNumber() && index + 3 < tokens.length) {
          const c = pointFor(read(), read(), relative);
          const end = pointFor(read(), read(), relative);
          sampleQuadratic({ x, y }, c, end).forEach((pt) => current.push(pt));
          x = end.x;
          y = end.y;
        }
        continue;
      }

      if (op === "Z") {
        current.push({ x: startX, y: startY });
        x = startX;
        y = startY;
        pushCurrent();
        continue;
      }

      while (hasNumber()) index += 1;
    }

    if (current.length) pushCurrent();
    return paths;
  }

  function isSvgCommand(token) {
    return /^[a-zA-Z]$/.test(token);
  }

  function sampleCubic(start, c1, c2, end) {
    const points = [];
    for (let step = 1; step <= 16; step += 1) {
      const t = step / 16;
      const mt = 1 - t;
      points.push({
        x: mt ** 3 * start.x + 3 * mt ** 2 * t * c1.x + 3 * mt * t ** 2 * c2.x + t ** 3 * end.x,
        y: mt ** 3 * start.y + 3 * mt ** 2 * t * c1.y + 3 * mt * t ** 2 * c2.y + t ** 3 * end.y
      });
    }
    return points;
  }

  function sampleQuadratic(start, c, end) {
    const points = [];
    for (let step = 1; step <= 12; step += 1) {
      const t = step / 12;
      const mt = 1 - t;
      points.push({
        x: mt * mt * start.x + 2 * mt * t * c.x + t * t * end.x,
        y: mt * mt * start.y + 2 * mt * t * c.y + t * t * end.y
      });
    }
    return points;
  }

  function normalizeSvgPaths(paths) {
    const valid = paths.filter((path) => path.length > 1);
    if (!valid.length) return [];
    const bounds = boundsFromPaths(valid);
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const scale = Math.min((WIDTH - 180) / width, (HEIGHT - 180) / height);
    const sourceCenter = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
    return valid.map((path) => path.map((pt) => ({
      x: CX + (pt.x - sourceCenter.x) * scale,
      y: CY + (pt.y - sourceCenter.y) * scale
    })));
  }

  function shapeFromContours(rawContours, label, kind, showBody, history) {
    const contours = rawContours.map((contour) => closePath(contour).map((pt) => {
      const normal = normalize(pt.x - CX, pt.y - CY);
      return point(pt.x, pt.y, normal.x, normal.y, "boundary");
    }));
    const bounds = boundsFromPaths(contours);
    const fill = sampleFillFromContours(contours, bounds, 8);
    return {
      ngType: "Shape",
      kind,
      label,
      showBody,
      bounds,
      fill,
      boundary: contours.flat(),
      contours,
      history,
      stats: {
        contours: contours.length,
        boundary: contours.flat().length,
        fill: fill.length
      }
    };
  }

  function sampleClosedPolyline(vertices, spacing) {
    const points = [];
    vertices.forEach((start, index) => {
      const end = vertices[(index + 1) % vertices.length];
      const length = Math.hypot(end.x - start.x, end.y - start.y);
      const steps = Math.max(1, Math.round(length / spacing));
      for (let step = 0; step < steps; step += 1) {
        const t = step / steps;
        points.push({ x: lerp(start.x, end.x, t), y: lerp(start.y, end.y, t) });
      }
    });
    return points;
  }

  function closePath(path) {
    if (!path.length) return [];
    const first = path[0];
    const last = path[path.length - 1];
    if (Math.abs(first.x - last.x) < 0.01 && Math.abs(first.y - last.y) < 0.01) return path;
    return path.concat([{ ...first }]);
  }

  function pointInPolygon(pt, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
      const a = vertices[i];
      const b = vertices[j];
      const intersects = (a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / ((b.y - a.y) || 1) + a.x;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function boundsFromPoints(points) {
    if (!points || !points.length) return { minX: CX - 1, minY: CY - 1, maxX: CX + 1, maxY: CY + 1 };
    return {
      minX: Math.min(...points.map((pt) => pt.x)),
      minY: Math.min(...points.map((pt) => pt.y)),
      maxX: Math.max(...points.map((pt) => pt.x)),
      maxY: Math.max(...points.map((pt) => pt.y))
    };
  }

  function transformBounds(bounds, center, factor) {
    return boundsFromPoints([
      { x: CX + (bounds.minX - center.x) * factor, y: CY + (bounds.minY - center.y) * factor },
      { x: CX + (bounds.maxX - center.x) * factor, y: CY + (bounds.minY - center.y) * factor },
      { x: CX + (bounds.maxX - center.x) * factor, y: CY + (bounds.maxY - center.y) * factor },
      { x: CX + (bounds.minX - center.x) * factor, y: CY + (bounds.maxY - center.y) * factor }
    ]);
  }

  function contentFit(data) {
    const bounds = contentBounds(data);
    const margin = 70;
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const inside = bounds.minX >= 0 && bounds.minY >= 0 && bounds.maxX <= WIDTH && bounds.maxY <= HEIGHT;
    if (inside) return { x: 0, y: 0, scale: 1 };
    const scale = Math.min((WIDTH - margin * 2) / width, (HEIGHT - margin * 2) / height, 1);
    const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
    return {
      x: CX - center.x * scale,
      y: CY - center.y * scale,
      scale
    };
  }

  function usesContentFrame(data) {
    if (!data) return false;
    if (isType(data, "Image")) return true;
    if ((data.history || []).join(" / ").includes("Image Input")) return true;
    if (isType(data, "LayerSet")) return (data.layers || []).some((layer) => usesContentFrame(layer.data));
    return false;
  }

  function padBounds(bounds, margin) {
    return {
      minX: bounds.minX - margin,
      minY: bounds.minY - margin,
      maxX: bounds.maxX + margin,
      maxY: bounds.maxY + margin
    };
  }

  function contentBounds(data) {
    if (!data) return null;
    if (isType(data, "LayerSet")) return unionBounds(data.layers.map((layer) => contentBounds(layer.data)));
    if (isType(data, "Image")) return {
      minX: data.originX,
      minY: data.originY,
      maxX: data.originX + data.width,
      maxY: data.originY + data.height
    };
    if (isType(data, "Shape")) return data.bounds || boundsFromPoints((data.boundary || []).concat(data.fill || []));
    if (isType(data, "PointSet")) return unionBounds([boundsFromPoints(data.points || []), contentBounds(data.sourceShape)]);
    if (isType(data, "Field")) return fieldBounds(data);
    if (isType(data, "TraceSet")) return unionBounds([boundsFromPaths(data.paths || []), contentBounds(data.sourceShape)]);
    if (isType(data, "Artifact")) return artifactBounds(data);
    return { minX: 0, minY: 0, maxX: WIDTH, maxY: HEIGHT };
  }

  function unionBounds(boundsList) {
    const valid = boundsList.filter((bounds) => bounds && Number.isFinite(bounds.minX));
    if (!valid.length) return { minX: 0, minY: 0, maxX: WIDTH, maxY: HEIGHT };
    return {
      minX: Math.min(...valid.map((bounds) => bounds.minX)),
      minY: Math.min(...valid.map((bounds) => bounds.minY)),
      maxX: Math.max(...valid.map((bounds) => bounds.maxX)),
      maxY: Math.max(...valid.map((bounds) => bounds.maxY))
    };
  }

  function boundsFromPaths(paths) {
    return boundsFromPoints(paths.flat());
  }

  function stitchSegments(segments) {
    const edges = (segments || [])
      .filter((segment) => segment && segment.length >= 2)
      .map((segment) => {
        const a = segment[0];
        const b = segment[segment.length - 1];
        return { a, b, ak: pointKey(a), bk: pointKey(b), used: false };
      });
    const byKey = new Map();
    edges.forEach((edge, index) => {
      addEndpoint(byKey, edge.ak, index);
      addEndpoint(byKey, edge.bk, index);
    });

    const paths = [];
    edges.forEach((edge) => {
      if (edge.used) return;
      edge.used = true;
      const path = [edge.a, edge.b];
      extendStitchedPath(path, edge.bk, byKey, edges, false);
      extendStitchedPath(path, edge.ak, byKey, edges, true);
      if (path.length > 1) paths.push(path);
    });
    return paths;
  }

  function addEndpoint(map, key, index) {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(index);
  }

  function extendStitchedPath(path, key, byKey, edges, prepend) {
    let currentKey = key;
    for (let guard = 0; guard < 8000; guard += 1) {
      const edgeIndex = (byKey.get(currentKey) || []).find((index) => !edges[index].used);
      if (edgeIndex === undefined) return;
      const edge = edges[edgeIndex];
      edge.used = true;
      if (edge.ak === currentKey) {
        if (prepend) path.unshift(edge.b);
        else path.push(edge.b);
        currentKey = edge.bk;
      } else {
        if (prepend) path.unshift(edge.a);
        else path.push(edge.a);
        currentKey = edge.ak;
      }
    }
  }

  function pointKey(pt) {
    return `${Math.round(pt.x * 10) / 10}:${Math.round(pt.y * 10) / 10}`;
  }

  function sampleFillFromContours(contours, bounds, spacing) {
    if (!contours.length) return [];
    const fill = [];
    const minX = Math.max(0, bounds.minX);
    const minY = Math.max(0, bounds.minY);
    const maxX = Math.min(WIDTH, bounds.maxX);
    const maxY = Math.min(HEIGHT, bounds.maxY);
    for (let y = minY; y <= maxY; y += spacing) {
      for (let x = minX; x <= maxX; x += spacing) {
        if (!contours.some((contour) => pointInPolygon({ x, y }, contour))) continue;
        const normal = normalize(x - CX, y - CY);
        fill.push(point(x, y, normal.x, normal.y, "interior"));
      }
    }
    return fill;
  }

  function fieldMaskCells(field, threshold) {
    const originX = fieldOriginX(field);
    const originY = fieldOriginY(field);
    const cellW = fieldWidth(field) / (field.cols - 1);
    const cellH = fieldHeight(field) / (field.rows - 1);
    const contours = [];
    for (let y = 0; y < field.rows - 1; y += 1) {
      for (let x = 0; x < field.cols - 1; x += 1) {
        const average = (
          fieldValue(field, x, y) +
          fieldValue(field, x + 1, y) +
          fieldValue(field, x + 1, y + 1) +
          fieldValue(field, x, y + 1)
        ) / 4;
        if (average < threshold) continue;
        const x0 = originX + x * cellW;
        const y0 = originY + y * cellH;
        contours.push([
          { x: x0, y: y0 },
          { x: x0 + cellW, y: y0 },
          { x: x0 + cellW, y: y0 + cellH },
          { x: x0, y: y0 + cellH },
          { x: x0, y: y0 }
        ]);
      }
    }
    return contours;
  }

  function fieldMaskHatches(field, threshold, density, seed) {
    const spacing = Math.max(5, 28 - density * 0.2);
    const step = Math.max(4, spacing * 0.8);
    const bounds = fieldBounds(field);
    const raw = [];
    for (let y = bounds.minY; y <= bounds.maxY; y += spacing) {
      let run = [];
      for (let x = bounds.minX; x <= bounds.maxX; x += step) {
        if (fieldValueAtPoint(field, { x, y }) >= threshold) {
          run.push({ x, y });
          continue;
        }
        if (run.length > 1) raw.push(run);
        run = [];
      }
      if (run.length > 1) raw.push(run);
    }
    return applyScanlineTreatment(raw, "Horizontal", 1.2, 0.04, seed + 97);
  }

  function fieldValueAtPoint(field, pt) {
    const rx = (pt.x - fieldOriginX(field)) / fieldWidth(field);
    const ry = (pt.y - fieldOriginY(field)) / fieldHeight(field);
    if (rx < 0 || rx > 1 || ry < 0 || ry > 1) return 0;
    const x = clamp(Math.round(rx * (field.cols - 1)), 0, field.cols - 1);
    const y = clamp(Math.round(ry * (field.rows - 1)), 0, field.rows - 1);
    return fieldValue(field, x, y);
  }

  function shapeTester(shape, step) {
    if (shape.sampledBoolean) {
      const occupied = new Set((shape.fill || []).map((pt) => shapeCellKey(pt.x, pt.y, step)));
      return (x, y) => {
        const gx = Math.round(x / step);
        const gy = Math.round(y / step);
        for (let yy = -1; yy <= 1; yy += 1) {
          for (let xx = -1; xx <= 1; xx += 1) {
            if (occupied.has(`${gx + xx}:${gy + yy}`)) return true;
          }
        }
        return false;
      };
    }

    const contours = (shape.contours || []).filter((contour) => contour.length > 2);
    if (contours.length) {
      return (x, y) => contours.some((contour) => pointInPolygon({ x, y }, contour));
    }

    const occupied = new Set((shape.fill || []).concat(shape.boundary || []).map((pt) => shapeCellKey(pt.x, pt.y, step)));
    return (x, y) => {
      const gx = Math.round(x / step);
      const gy = Math.round(y / step);
      for (let yy = -1; yy <= 1; yy += 1) {
        for (let xx = -1; xx <= 1; xx += 1) {
          if (occupied.has(`${gx + xx}:${gy + yy}`)) return true;
        }
      }
      return false;
    };
  }

  function shapeCellKey(x, y, step) {
    return `${Math.round(x / step)}:${Math.round(y / step)}`;
  }

  function booleanSampleBounds(a, b, mode, step) {
    const aBounds = a.bounds || boundsFromPoints((a.fill || []).concat(a.boundary || []));
    const bBounds = b.bounds || boundsFromPoints((b.fill || []).concat(b.boundary || []));
    const base = mode === "Intersect"
      ? {
          minX: Math.max(aBounds.minX, bBounds.minX),
          minY: Math.max(aBounds.minY, bBounds.minY),
          maxX: Math.min(aBounds.maxX, bBounds.maxX),
          maxY: Math.min(aBounds.maxY, bBounds.maxY)
        }
      : unionBounds([aBounds, bBounds]);
    const fallback = unionBounds([aBounds, bBounds]);
    const bounds = base.minX > base.maxX || base.minY > base.maxY ? fallback : base;
    return {
      minX: clamp(bounds.minX - step, 0, WIDTH),
      minY: clamp(bounds.minY - step, 0, HEIGHT),
      maxX: clamp(bounds.maxX + step, 0, WIDTH),
      maxY: clamp(bounds.maxY + step, 0, HEIGHT)
    };
  }

  function booleanModeIncludes(mode, a, b) {
    if (mode === "Union") return a || b;
    if (mode === "Intersect") return a && b;
    if (mode === "Difference") return Boolean(a) !== Boolean(b);
    return a && !b;
  }

  function cellContour(x, y, step) {
    const half = step / 2;
    return [
      point(x - half, y - half, -1, -1, "boundary"),
      point(x + half, y - half, 1, -1, "boundary"),
      point(x + half, y + half, 1, 1, "boundary"),
      point(x - half, y + half, -1, 1, "boundary"),
      point(x - half, y - half, -1, -1, "boundary")
    ];
  }

  function circleContour(radius, segments, reverse = false) {
    const contour = Array.from({ length: segments }, (_, index) => {
      const angle = (index / segments) * TAU;
      return point(CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius, Math.cos(angle), Math.sin(angle), "boundary");
    });
    const closed = closePath(contour);
    return reverse ? closed.slice().reverse() : closed;
  }

  function circleFillBetween(inner, outer, step) {
    const fill = [];
    if (outer <= inner) return fill;
    const sampleStep = Math.max(5, step || 8);
    for (let y = CY - outer; y <= CY + outer; y += sampleStep) {
      for (let x = CX - outer; x <= CX + outer; x += sampleStep) {
        const distance = Math.hypot(x - CX, y - CY);
        if (distance > outer || distance < inner) continue;
        const normal = normalize(x - CX, y - CY);
        fill.push(point(x, y, normal.x, normal.y, "interior"));
      }
    }
    return fill;
  }

  function sampleFieldValue(field, x, y, cols, rows) {
    const fx = clamp(Math.round((x / Math.max(1, cols - 1)) * (field.cols - 1)), 0, field.cols - 1);
    const fy = clamp(Math.round((y / Math.max(1, rows - 1)) * (field.rows - 1)), 0, field.rows - 1);
    return fieldValue(field, fx, fy);
  }

  function fieldBooleanValue(mode, a, b) {
    if (mode === "Min") return Math.min(a, b);
    if (mode === "Subtract") return clamp(a - b);
    if (mode === "Difference") return Math.abs(a - b);
    return Math.max(a, b);
  }

  function smoothPath(path, amount, passes) {
    if (!path || path.length < 3 || amount <= 0) return path || [];
    let current = path.map((pt) => ({ ...pt }));
    for (let pass = 0; pass < passes; pass += 1) {
      current = current.map((pt, index) => {
        if (index === 0 || index === current.length - 1) return pt;
        const prev = current[index - 1];
        const next = current[index + 1];
        return {
          ...pt,
          x: lerp(pt.x, (prev.x + pt.x + next.x) / 3, amount),
          y: lerp(pt.y, (prev.y + pt.y + next.y) / 3, amount)
        };
      });
    }
    return current;
  }

  function curvePath(path, tension) {
    if (!path || path.length < 3) return path || [];
    const bend = 1 - tension;
    const output = [{ ...path[0] }];
    for (let index = 0; index < path.length - 1; index += 1) {
      const p0 = path[Math.max(0, index - 1)];
      const p1 = path[index];
      const p2 = path[index + 1];
      const p3 = path[Math.min(path.length - 1, index + 2)];
      for (let step = 1; step <= 5; step += 1) {
        const t = step / 5;
        const t2 = t * t;
        const t3 = t2 * t;
        output.push({
          x: catmullRom(p0.x, p1.x, p2.x, p3.x, t, t2, t3, bend),
          y: catmullRom(p0.y, p1.y, p2.y, p3.y, t, t2, t3, bend)
        });
      }
    }
    return output;
  }

  function catmullRom(a, b, c, d, t, t2, t3, bend) {
    const curved = 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    const straight = lerp(b, c, t);
    return lerp(straight, curved, bend);
  }

  function mapLayerSet(layerSet, mapper, title) {
    const layers = (layerSet.layers || [])
      .map((layer, index) => ({
        data: mapper(layer.data, index),
        opacity: layer.opacity
      }))
      .filter((layer) => layer.data);

    return {
      ngType: "LayerSet",
      label: `${layerSet.label || "Layer Set"} / ${title}`,
      layers,
      history: (layerSet.history || [layerSet.label || "Layer Set"]).concat([title]),
      stats: {
        layers: layers.length,
        process: title
      }
    };
  }

  function emptyArtifactParts() {
    return { fills: [], paths: [], marks: [], labels: [] };
  }

  function mergeArtifactParts(target, source) {
    target.fills.push(...source.fills);
    target.paths.push(...source.paths);
    target.marks.push(...source.marks);
    target.labels.push(...(source.labels || []));
    return target;
  }

  function artifactPartsFromData(data, opacity = 1, seed = 0) {
    const parts = emptyArtifactParts();
    if (!data) return parts;

    if (isType(data, "LayerSet")) {
      (data.layers || []).forEach((layer, index) => {
        mergeArtifactParts(parts, artifactPartsFromData(layer.data, opacity * (layer.opacity ?? 1), seed + index));
      });
      return parts;
    }

    if (isType(data, "Artifact")) {
      parts.fills.push(...(data.fills || []).map((fill) => ({
        ...fill,
        opacity: (fill.opacity ?? 0.48) * opacity,
        contours: (fill.contours || []).map(clonePath)
      })));
      parts.paths.push(...(data.paths || []).map(clonePath));
      parts.marks.push(...(data.marks || []).map((mark) => ({ ...mark, a: (mark.a ?? 0.55) * opacity })));
      parts.labels.push(...(data.labels || []).map((label) => ({ ...label, a: (label.a ?? 0.8) * opacity })));
      return parts;
    }

    if (isType(data, "TraceSet")) {
      parts.paths.push(...(data.paths || []).map(clonePath));
      return parts;
    }

    if (isType(data, "Shape")) {
      const traces = shapeToTraceSet(data, { mode: data.kind === "text" ? "Guides" : "Boundary", density: 62 }, seed);
      if (traces) parts.paths.push(...(traces.paths || []).map(clonePath));
      if (data.kind === "text") {
        parts.marks.push(...decimate(data.fill || [], 900).map((pt) => ({ x: pt.x, y: pt.y, r: 1.2, a: 0.22 * opacity })));
      }
      return parts;
    }

    if (isType(data, "PointSet")) {
      parts.marks.push(...(data.points || []).map((pt) => ({ x: pt.x, y: pt.y, r: 1.8, a: 0.48 * opacity })));
      return parts;
    }

    if (isType(data, "Field")) {
      const mask = fieldMask(data, { mode: "Solid", threshold: 35, density: 46 }, seed);
      if (mask) mergeArtifactParts(parts, artifactPartsFromData(mask, opacity, seed));
    }

    return parts;
  }

  function inkPartsFromData(data, seed = 0) {
    const parts = artifactPartsFromData(data, 1, seed);
    if (isType(data, "Shape") && data.shapeStyle?.fillColor && data.contours?.length) {
      parts.fills.push({
        color: data.shapeStyle.fillColor,
        opacity: data.shapeStyle.fillOpacity ?? 0.36,
        contours: data.contours.map(clonePath)
      });
    }
    return parts;
  }

  function inkPathChunks(path, pathIndex, options, seed) {
    if (!path || path.length < 2) return [];
    const mode = options.mode || "Dry";
    const distress = options.distress || 0;
    const grain = options.grain || 0;
    const breakScale = mode === "Wet" ? 0.16 : mode === "Riso" ? 0.24 : mode === "Cheap Print" ? 0.34 : 0.48;
    const chunks = [];
    let current = [];

    path.forEach((pt, pointIndex) => {
      const shouldBreak =
        pointIndex > 0 &&
        pointIndex < path.length - 1 &&
        noise(seed + 41, pathIndex * 211 + pointIndex * 13) < distress * breakScale * 0.18;

      if (shouldBreak) {
        if (current.length > 1) chunks.push(current);
        current = [];
        return;
      }

      current.push(inkPoint(pt, path, pointIndex, pathIndex, { mode, distress, grain }, seed));

      const dryGap = mode === "Dry" && noise(seed + 47, pathIndex * 173 + pointIndex * 17) < distress * grain * 0.035;
      if (dryGap) {
        if (current.length > 1) chunks.push(current);
        current = [];
      }
    });

    if (current.length > 1) chunks.push(current);
    return chunks.filter((chunk) => chunk.length > 1);
  }

  function inkPoint(pt, path, pointIndex, pathIndex, options, seed) {
    const prev = path[Math.max(0, pointIndex - 1)] || pt;
    const next = path[Math.min(path.length - 1, pointIndex + 1)] || pt;
    const tangent = normalize(next.x - prev.x, next.y - prev.y);
    const normal = { x: -tangent.y, y: tangent.x };
    const distress = options.distress || 0;
    const grain = options.grain || 0;
    const mode = options.mode || "Dry";
    const edge = (noise(seed + 53, pathIndex * 97 + pointIndex * 19) - 0.5) * (1.4 + grain * 9 + distress * 7);
    const drag = (noise(seed + 59, pathIndex * 89 + pointIndex * 23) - 0.5) * (mode === "Wet" ? 4.8 : 2.2) * distress;
    const chatter = (noise(seed + 61, Math.round(pt.x * 0.7 + pt.y * 1.3)) - 0.5) * grain * (mode === "Cheap Print" ? 6 : 2.8);
    let x = pt.x + normal.x * edge + tangent.x * drag + chatter;
    let y = pt.y + normal.y * edge + tangent.y * drag - chatter * 0.42;

    if (mode === "Cheap Print") {
      const cell = 1.5 + distress * 5.5;
      x = Math.round(x / cell) * cell;
      y = Math.round(y / cell) * cell;
    }

    return { ...pt, x, y };
  }

  function inkPathWidth(stroke, mode, bleed, pressure, seed, index) {
    const base = stroke?.width || 0.85;
    const modeScale = mode === "Wet" ? 1.45 : mode === "Cheap Print" ? 1.16 : mode === "Riso" ? 1.08 : 0.92;
    const variation = 0.72 + pressure * 0.58 + noise(seed + 67, index * 31 + 5) * (0.5 + pressure * 0.55);
    return Math.max(0.16, base * modeScale * variation + bleed * 1.3);
  }

  function inkPathOpacity(stroke, mode, distress, pressure, seed, index) {
    const base = stroke?.opacity ?? 0.66;
    const dryLoss = mode === "Dry" ? distress * 0.36 : distress * 0.14;
    const pressureGain = 0.42 + pressure * 0.72;
    const variation = 0.62 + noise(seed + 71, index * 37 + 9) * 0.5;
    return clamp(base * pressureGain * variation - dryLoss, 0.07, 1);
  }

  function inkBleedPath(path, index, options, seed) {
    const bleed = options.bleed || 0;
    const grain = options.grain || 0;
    const mode = options.mode || "Dry";
    const spread = (mode === "Wet" ? 9 : 4) * bleed + grain * 2;
    return path.map((pt, pointIndex) => ({
      ...pt,
      x: pt.x + (noise(seed + 79, index * 47 + pointIndex * 5) - 0.5) * spread,
      y: pt.y + (noise(seed + 83, index * 53 + pointIndex * 7) - 0.5) * spread
    }));
  }

  function inkRegistrationPath(path, index, mode, seed) {
    const offset = mode === "Riso" ? 4.8 : 2.4;
    const dx = (noise(seed + 89, index * 23 + 3) - 0.5) * offset;
    const dy = (noise(seed + 97, index * 29 + 7) - 0.5) * offset;
    return path.map((pt) => ({ ...pt, x: pt.x + dx, y: pt.y + dy }));
  }

  function inkFills(fills, options, seed) {
    const mode = options.mode || "Dry";
    const pressure = options.pressure || 0;
    const bleed = options.bleed || 0;
    const grain = options.grain || 0;
    return (fills || []).map((fill, fillIndex) => ({
      ...fill,
      opacity: clamp((fill.opacity ?? 0.36) * (0.52 + pressure * 0.52), 0.04, 0.86),
      contours: (fill.contours || []).map((contour, contourIndex) => {
        const rough = contour.map((pt, pointIndex) => inkPoint(pt, contour, pointIndex, fillIndex * 23 + contourIndex, {
          mode,
          distress: bleed,
          grain
        }, seed + 107));
        return mode === "Cheap Print" ? decimate(rough, Math.max(12, Math.round(rough.length * 0.66))) : rough;
      })
    }));
  }

  function inkMarks(marks, options, seed) {
    const grain = options.grain || 0;
    const pressure = options.pressure || 0;
    return (marks || []).map((mark, index) => ({
      ...mark,
      x: mark.x + (noise(seed + 113, index * 13 + 5) - 0.5) * grain * 5,
      y: mark.y + (noise(seed + 127, index * 17 + 7) - 0.5) * grain * 5,
      r: Math.max(0.25, (mark.r || 1.2) * (0.62 + pressure * 0.82 + noise(seed + 131, index * 19 + 11) * grain)),
      a: clamp((mark.a ?? 0.46) * (0.42 + pressure * 0.76 + noise(seed + 137, index * 23 + 13) * 0.25), 0.03, 1)
    }));
  }

  function appendInkSpeckles(marks, path, index, options, seed) {
    if (!path || marks.length > 3600) return;
    const grain = options.grain || 0;
    const distress = options.distress || 0;
    const pressure = options.pressure || 0;
    const color = options.color || "#20231f";
    const stride = Math.max(1, Math.round(9 - grain * 6));
    for (let pointIndex = 0; pointIndex < path.length && marks.length < 3600; pointIndex += stride) {
      if (noise(seed + 149, index * 101 + pointIndex * 7) > grain * 0.13 + distress * 0.06) continue;
      const pt = path[pointIndex];
      const radius = 0.35 + noise(seed + 151, index * 47 + pointIndex) * (0.7 + grain * 1.9);
      const scatter = 3 + grain * 12;
      marks.push({
        x: pt.x + (noise(seed + 157, index * 59 + pointIndex) - 0.5) * scatter,
        y: pt.y + (noise(seed + 163, index * 61 + pointIndex) - 0.5) * scatter,
        r: radius,
        a: clamp(0.06 + pressure * 0.28 + noise(seed + 167, index * 67 + pointIndex) * 0.24, 0.04, 0.7),
        color
      });
    }
  }

  function inkBlockStep(options) {
    const base = Math.max(2, Number(options.blockSize || 9));
    if (options.mode === "Pixel Stamp") return base * 1.85;
    if (options.mode === "Block Print") return base * 1.28;
    if (options.mode === "Photocopy") return Math.max(2.5, base * 0.72);
    return base;
  }

  function inkRectContour(x, y, width, height, roughness, seed, index) {
    const halfW = width / 2;
    const halfH = height / 2;
    return [
      roughRectPoint(x - halfW, y - halfH, -1, -1, roughness, seed, index, 1),
      roughRectPoint(x + halfW, y - halfH, 1, -1, roughness, seed, index, 2),
      roughRectPoint(x + halfW, y + halfH, 1, 1, roughness, seed, index, 3),
      roughRectPoint(x - halfW, y + halfH, -1, 1, roughness, seed, index, 4),
      roughRectPoint(x - halfW, y - halfH, -1, -1, roughness, seed, index, 1)
    ];
  }

  function roughRectPoint(x, y, nx, ny, roughness, seed, index, corner) {
    return point(
      x + (noise(seed + 281, index * 37 + corner * 7) - 0.5) * roughness,
      y + (noise(seed + 283, index * 41 + corner * 11) - 0.5) * roughness,
      nx,
      ny,
      "ink-block"
    );
  }

  function addInkPaperWear(paths, pathColors, pathWidths, pathOpacities, marks, bounds, options, seed) {
    if (!bounds) return;
    const grain = options.grain || 0;
    const distress = options.distress || 0;
    const pressure = options.pressure || 0;
    const count = Math.round(8 + grain * 18 + distress * 22);
    for (let index = 0; index < count; index += 1) {
      const x = lerp(bounds.minX, bounds.maxX, noise(seed + 291, index * 13));
      const y = lerp(bounds.minY, bounds.maxY, noise(seed + 293, index * 17));
      if (noise(seed + 307, index) < 0.58) {
        const length = 18 + noise(seed + 311, index) * (80 + grain * 120);
        const angle = noise(seed + 313, index) * TAU;
        paths.push([
          point(x, y, 0, -1, "scratch"),
          point(x + Math.cos(angle) * length, y + Math.sin(angle) * length, 0, -1, "scratch")
        ]);
        pathColors.push(noise(seed + 317, index) < 0.65 ? "#f8f5eb" : "#20231f");
        pathWidths.push(0.18 + noise(seed + 319, index) * (0.8 + grain));
        pathOpacities.push(clamp(0.06 + distress * 0.18 + noise(seed + 323, index) * 0.16, 0.03, 0.42));
      } else {
        marks.push({
          x,
          y,
          r: 0.35 + noise(seed + 331, index) * (1.8 + grain * 4.5),
          a: clamp(0.04 + distress * 0.24 + pressure * 0.08, 0.03, 0.42),
          color: noise(seed + 337, index) < 0.55 ? "#20231f" : "#f8f5eb"
        });
      }
    }
  }

  function collectLayerPaths(data, paths, options = {}) {
    if (!data) return;
    if (isType(data, "LayerSet")) {
      (data.layers || []).forEach((layer) => collectLayerPaths(layer.data, paths, options));
      return;
    }
    if (isType(data, "TraceSet")) {
      paths.push(...(data.paths || []).map(clonePath));
      return;
    }
    if (isType(data, "Shape")) {
      const traces = shapeToTraceSet(data, { mode: "Boundary", density: 62 }, 0);
      if (traces) paths.push(...(traces.paths || []).map(clonePath));
      return;
    }
    if (isType(data, "Field")) {
      const traces = contourField(data, { levels: options.fieldLevels || 7 });
      if (traces) paths.push(...(traces.paths || []).map(clonePath));
      return;
    }
    if (isType(data, "Artifact")) {
      paths.push(...(data.paths || []).map(clonePath));
      (data.fills || []).forEach((fill) => paths.push(...(fill.contours || []).map(clonePath)));
      paths.push(...pointsToTinyPaths(data.marks || [], 3));
      return;
    }
    if (isType(data, "PointSet")) {
      paths.push(...pointsToTinyPaths(data.points || [], 3));
    }
  }

  function layerDensity(data, pt) {
    if (!data) return 0;
    if (isType(data, "LayerSet")) {
      return clamp((data.layers || []).reduce((sum, layer) => sum + layerDensity(layer.data, pt) * (layer.opacity ?? 1), 0));
    }
    if (isType(data, "Field")) return fieldValueAtPoint(data, pt);
    if (isType(data, "Shape")) return shapeDensity(data, pt);
    if (isType(data, "PointSet")) return pointCloudDensity(data.points || [], pt, 10);
    if (isType(data, "TraceSet")) return pathsDensity(data.paths || [], pt, 7);
    if (isType(data, "Artifact")) return artifactDensity(data, pt);
    return 0;
  }

  function artifactDensity(artifact, pt) {
    const fillDensity = (artifact.fills || []).some((fill) => (fill.contours || []).some((contour) => pointInPolygon(pt, contour))) ? 0.72 : 0;
    return Math.max(
      fillDensity,
      pathsDensity(artifact.paths || [], pt, 7),
      pointCloudDensity(artifact.marks || [], pt, 9)
    );
  }

  function shapeDensity(shape, pt) {
    const inside = (shape.contours || []).some((contour) => pointInPolygon(pt, contour));
    const edge = pathsDensity(shape.contours || [], pt, 7);
    const fill = pointCloudDensity(shape.fill || [], pt, 8);
    const boundary = pointCloudDensity(shape.boundary || [], pt, 7);
    return Math.max(inside ? 0.68 : 0, edge, fill, boundary);
  }

  function pointCloudDensity(points, pt, radius) {
    if (!points || !points.length) return 0;
    const stride = Math.max(1, Math.floor(points.length / 1400));
    let best = 0;
    for (let index = 0; index < points.length; index += stride) {
      const point = points[index];
      const distance = Math.hypot(point.x - pt.x, point.y - pt.y);
      if (distance < radius) {
        best = Math.max(best, 1 - distance / radius);
        if (best > 0.9) return best;
      }
    }
    return best;
  }

  function pathsDensity(paths, pt, radius) {
    if (!paths || !paths.length) return 0;
    const total = paths.reduce((sum, path) => sum + Math.max(0, path.length - 1), 0);
    const stride = Math.max(1, Math.floor(total / 2800));
    let segmentIndex = 0;
    let best = 0;
    for (const path of paths) {
      for (let index = 0; index < path.length - 1; index += 1) {
        if (segmentIndex % stride === 0) {
          const distance = pointToSegmentDistance(pt, path[index], path[index + 1]);
          if (distance < radius) {
            best = Math.max(best, 1 - distance / radius);
            if (best > 0.92) return best;
          }
        }
        segmentIndex += 1;
      }
    }
    return best;
  }

  function pointToSegmentDistance(pt, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy || 1;
    const t = clamp(((pt.x - a.x) * dx + (pt.y - a.y) * dy) / lengthSq);
    return Math.hypot(pt.x - (a.x + dx * t), pt.y - (a.y + dy * t));
  }

  function pointsToTinyPaths(points, radius) {
    return decimate(points || [], 1200).map((pt) => [
      { x: pt.x - radius, y: pt.y },
      { x: pt.x + radius, y: pt.y }
    ]);
  }

  function clonePath(path) {
    return (path || []).map((pt) => ({ ...pt }));
  }

  function mirrorField(field, axis) {
    const values = [];
    for (let y = 0; y < field.rows; y += 1) {
      for (let x = 0; x < field.cols; x += 1) {
        const sx = axis === "Horizontal" || axis === "Both" ? field.cols - 1 - x : x;
        const sy = axis === "Vertical" || axis === "Both" ? field.rows - 1 - y : y;
        values.push(fieldValue(field, sx, sy));
      }
    }
    return {
      ...field,
      label: `${field.label} / Mirror`,
      sourceShape: mirrorData(field.sourceShape, { axis }),
      values,
      history: field.history.concat([`Mirror(${axis})`]),
      stats: { ...(field.stats || {}), mirror: axis }
    };
  }

  function mirrorPoint(pt, axis) {
    return {
      ...pt,
      x: axis === "Horizontal" || axis === "Both" ? WIDTH - pt.x : pt.x,
      y: axis === "Vertical" || axis === "Both" ? HEIGHT - pt.y : pt.y,
      nx: axis === "Horizontal" || axis === "Both" ? -(pt.nx || 0) : pt.nx,
      ny: axis === "Vertical" || axis === "Both" ? -(pt.ny || 0) : pt.ny
    };
  }

  function rotatePoint(pt, degrees) {
    const angle = (degrees / 180) * Math.PI;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = pt.x - CX;
    const y = pt.y - CY;
    const nx = pt.nx || 0;
    const ny = pt.ny || 0;
    return {
      ...pt,
      x: CX + x * cos - y * sin,
      y: CY + x * sin + y * cos,
      nx: nx * cos - ny * sin,
      ny: nx * sin + ny * cos
    };
  }

  function mapGeometryData(data, mapper) {
    if (!data) return null;
    if (isType(data, "Shape")) return mapShapeData(data, mapper);
    if (isType(data, "PointSet")) {
      const points = (data.points || []).map(mapper);
      return {
        ...data,
        sourceShape: mapGeometryData(data.sourceShape, mapper),
        points,
        bounds: boundsFromPoints(points)
      };
    }
    if (isType(data, "TraceSet")) {
      return {
        ...data,
        sourceShape: mapGeometryData(data.sourceShape, mapper),
        paths: (data.paths || []).map((path) => path.map(mapper))
      };
    }
    if (isType(data, "Artifact")) {
      return {
        ...data,
        sourceShape: mapGeometryData(data.sourceShape, mapper),
        fills: (data.fills || []).map((fill) => ({
          ...fill,
          contours: (fill.contours || []).map((contour) => contour.map(mapper))
        })),
        paths: (data.paths || []).map((path) => path.map(mapper)),
        marks: (data.marks || []).map(mapper)
      };
    }
    if (isType(data, "Image")) {
      return { ...data };
    }
    if (isType(data, "LayerSet")) {
      return {
        ...data,
        layers: (data.layers || []).map((layer) => ({
          ...layer,
          data: mapGeometryData(layer.data, mapper)
        }))
      };
    }
    return JSON.parse(JSON.stringify(data));
  }

  function mapShapeData(shape, mapper) {
    const fill = (shape.fill || []).map(mapper);
    const boundary = (shape.boundary || []).map(mapper);
    const contours = (shape.contours || []).map((contour) => contour.map(mapper));
    const guides = (shape.guides || []).map((guide) => guide.map(mapper));
    const output = {
      ...shape,
      kind: shape.kind === "text" ? "mapped" : shape.kind,
      fill,
      boundary,
      contours,
      guides,
      bounds: boundsFromPoints(fill.concat(boundary))
    };
    if (shape.layout) {
      const layoutPoint = mapper({ x: shape.layout.x, y: shape.layout.y, nx: 0, ny: -1 });
      output.layout = { ...shape.layout, x: layoutPoint.x, y: layoutPoint.y };
    }
    return output;
  }

  function transformData(data, dx, dy, factor) {
    if (isType(data, "Shape")) return transformShapeData(data, dx, dy, factor);
    if (isType(data, "PointSet")) {
      return {
        ...data,
        sourceShape: transformData(data.sourceShape, dx, dy, factor),
        points: (data.points || []).map((pt) => transformPointData(pt, dx, dy, factor)),
        bounds: transformedBounds(data.bounds || boundsFromPoints(data.points || []), dx, dy, factor)
      };
    }
    if (isType(data, "TraceSet")) {
      return {
        ...data,
        sourceShape: transformData(data.sourceShape, dx, dy, factor),
        paths: (data.paths || []).map((path) => transformPathData(path, dx, dy, factor)),
        stroke: data.stroke ? { ...data.stroke, width: data.stroke.width ? data.stroke.width * factor : data.stroke.width } : data.stroke
      };
    }
    if (isType(data, "Artifact")) {
      return {
        ...data,
        sourceShape: transformData(data.sourceShape, dx, dy, factor),
        fills: (data.fills || []).map((fill) => ({
          ...fill,
          contours: (fill.contours || []).map((contour) => transformPathData(contour, dx, dy, factor))
        })),
        paths: (data.paths || []).map((path) => transformPathData(path, dx, dy, factor)),
        marks: (data.marks || []).map((mark) => ({
          ...transformPointData(mark, dx, dy, factor),
          r: (mark.r || 1) * factor,
          a: mark.a
        })),
        labels: (data.labels || []).map((label) => ({
          ...transformPointData(label, dx, dy, factor),
          text: label.text,
          size: (label.size || 9) * factor,
          color: label.color,
          a: label.a
        })),
        stroke: data.stroke ? { ...data.stroke, width: data.stroke.width ? data.stroke.width * factor : data.stroke.width } : data.stroke
      };
    }
    if (isType(data, "Image")) return transformImageData(data, dx, dy, factor);
    if (isType(data, "LayerSet")) {
      return {
        ...data,
        layers: (data.layers || []).map((layer) => ({
          ...layer,
          data: transformData(layer.data, dx, dy, factor)
        }))
      };
    }
    return data ? JSON.parse(JSON.stringify(data)) : data;
  }

  function transformImageData(image, dx, dy, factor) {
    const width = image.width * factor;
    const height = image.height * factor;
    return {
      ...image,
      width,
      height,
      originX: CX + (image.originX - CX) * factor + dx,
      originY: CY + (image.originY - CY) * factor + dy,
      scale: (image.scale || 100) * factor,
      stats: {
        ...(image.stats || {}),
        scale: Math.round((image.scale || 100) * factor)
      }
    };
  }

  function scaleDataAround(data, center, factor) {
    if (!data) return null;
    if (isType(data, "Shape")) return scaleShapeAround(data, center, factor);
    if (isType(data, "PointSet")) {
      const points = (data.points || []).map((pt) => scalePointAround(pt, center, factor));
      return {
        ...data,
        sourceShape: scaleDataAround(data.sourceShape, center, factor),
        points,
        bounds: boundsFromPoints(points)
      };
    }
    if (isType(data, "TraceSet")) {
      return {
        ...data,
        sourceShape: scaleDataAround(data.sourceShape, center, factor),
        paths: (data.paths || []).map((path) => path.map((pt) => scalePointAround(pt, center, factor))),
        stroke: data.stroke ? { ...data.stroke, width: data.stroke.width ? data.stroke.width * factor : data.stroke.width } : data.stroke
      };
    }
    if (isType(data, "Artifact")) {
      return {
        ...data,
        sourceShape: scaleDataAround(data.sourceShape, center, factor),
        fills: (data.fills || []).map((fill) => ({
          ...fill,
          contours: (fill.contours || []).map((contour) => contour.map((pt) => scalePointAround(pt, center, factor)))
        })),
        paths: (data.paths || []).map((path) => path.map((pt) => scalePointAround(pt, center, factor))),
        marks: (data.marks || []).map((mark) => ({
          ...scalePointAround(mark, center, factor),
          r: (mark.r || 1) * factor,
          a: mark.a
        })),
        labels: (data.labels || []).map((label) => ({
          ...scalePointAround(label, center, factor),
          text: label.text,
          size: (label.size || 9) * factor,
          color: label.color,
          a: label.a
        })),
        stroke: data.stroke ? { ...data.stroke, width: data.stroke.width ? data.stroke.width * factor : data.stroke.width } : data.stroke
      };
    }
    if (isType(data, "Image")) {
      return {
        ...data,
        originX: center.x + (data.originX - center.x) * factor,
        originY: center.y + (data.originY - center.y) * factor,
        width: data.width * factor,
        height: data.height * factor,
        scale: (data.scale || 100) * factor
      };
    }
    if (isType(data, "LayerSet")) {
      return {
        ...data,
        layers: (data.layers || []).map((layer) => ({
          ...layer,
          data: scaleDataAround(layer.data, center, factor)
        }))
      };
    }
    return JSON.parse(JSON.stringify(data));
  }

  function scaleShapeAround(shape, center, factor) {
    const fill = (shape.fill || []).map((pt) => scalePointAround(pt, center, factor));
    const boundary = (shape.boundary || []).map((pt) => scalePointAround(pt, center, factor));
    const output = {
      ...shape,
      fill,
      boundary,
      contours: (shape.contours || []).map((contour) => contour.map((pt) => scalePointAround(pt, center, factor))),
      guides: (shape.guides || []).map((guide) => guide.map((pt) => scalePointAround(pt, center, factor))),
      bounds: boundsFromPoints(fill.concat(boundary))
    };
    if (shape.layout) {
      const layoutPoint = scalePointAround({ x: shape.layout.x, y: shape.layout.y }, center, factor);
      output.layout = {
        ...shape.layout,
        x: layoutPoint.x,
        y: layoutPoint.y,
        size: shape.layout.size * factor
      };
      output.size = (shape.size || shape.layout.size) * factor;
    }
    if (shape.radius) output.radius = shape.radius * factor;
    if (shape.width) output.width = shape.width * factor;
    if (shape.height) output.height = shape.height * factor;
    return output;
  }

  function scalePointAround(pt, center, factor) {
    return {
      ...pt,
      x: center.x + (pt.x - center.x) * factor,
      y: center.y + (pt.y - center.y) * factor
    };
  }

  function contentCenter(data) {
    const bounds = contentBounds(data);
    if (!bounds) return { x: CX, y: CY };
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2
    };
  }

  function transformShapeData(shape, dx, dy, factor) {
    const output = {
      ...shape,
      kind: shape.kind === "text" ? "text" : "repeat",
      fill: (shape.fill || []).map((pt) => transformPointData(pt, dx, dy, factor)),
      boundary: (shape.boundary || []).map((pt) => transformPointData(pt, dx, dy, factor)),
      contours: (shape.contours || []).map((contour) => transformPathData(contour, dx, dy, factor)),
      guides: (shape.guides || []).map((guide) => transformPathData(guide, dx, dy, factor)),
      bounds: transformedBounds(shape.bounds || boundsFromPoints((shape.fill || []).concat(shape.boundary || [])), dx, dy, factor)
    };
    if (shape.kind === "text" && shape.layout) {
      const layoutPoint = transformPointData({ x: shape.layout.x, y: shape.layout.y }, dx, dy, factor);
      output.layout = {
        ...shape.layout,
        x: layoutPoint.x,
        y: layoutPoint.y,
        size: shape.layout.size * factor
      };
      output.size = shape.size * factor;
    }
    return output;
  }

  function transformPathData(path, dx, dy, factor) {
    return (path || []).map((pt) => transformPointData(pt, dx, dy, factor));
  }

  function transformPointData(pt, dx, dy, factor) {
    return {
      ...pt,
      x: CX + (pt.x - CX) * factor + dx,
      y: CY + (pt.y - CY) * factor + dy
    };
  }

  function sineWavePoint(pt, axis, amplitude, wavelength, phase) {
    const alongX = Math.sin(((pt.x - CX) / wavelength) * TAU + phase) * amplitude;
    const alongY = Math.sin(((pt.y - CY) / wavelength) * TAU + phase) * amplitude;
    if (axis === "Vertical") return { ...pt, x: pt.x + alongY };
    if (axis === "Both") return { ...pt, x: pt.x + alongY * 0.7, y: pt.y + alongX * 0.7 };
    return { ...pt, y: pt.y + alongX };
  }

  function transformedBounds(bounds, dx, dy, factor) {
    return boundsFromPoints([
      transformPointData({ x: bounds.minX, y: bounds.minY }, dx, dy, factor),
      transformPointData({ x: bounds.maxX, y: bounds.minY }, dx, dy, factor),
      transformPointData({ x: bounds.maxX, y: bounds.maxY }, dx, dy, factor),
      transformPointData({ x: bounds.minX, y: bounds.maxY }, dx, dy, factor)
    ]);
  }

  function artifactBounds(data) {
    return unionBounds([
      boundsFromPoints(data.marks || []),
      boundsFromPoints(data.labels || []),
      boundsFromPaths(data.paths || []),
      boundsFromPaths((data.fills || []).flatMap((fill) => fill.contours || [])),
      contentBounds(data.sourceShape)
    ]);
  }

  function cachedRasterImage(dataUrl) {
    if (!dataUrl || typeof Image === "undefined") return null;
    if (imageCache.has(dataUrl)) return imageCache.get(dataUrl);
    const image = new Image();
    image.src = dataUrl;
    cacheSetLimited(imageCache, dataUrl, image);
    return image;
  }

  function rasterCanvasFromPixels(image) {
    if (!image?.pixels?.length || !image.cols || !image.rows || typeof document === "undefined") return null;
    const key = rasterImageKey(image);
    if (rasterCanvasCache.has(key)) return rasterCanvasCache.get(key);
    const canvas = document.createElement("canvas");
    canvas.width = image.cols;
    canvas.height = image.rows;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(image.cols, image.rows);
    imageData.data.set(image.pixels.slice(0, image.cols * image.rows * 4));
    ctx.putImageData(imageData, 0, 0);
    cacheSetLimited(rasterCanvasCache, key, canvas);
    return canvas;
  }

  function rasterDataUrlFromPixels(image) {
    if (!image?.pixels?.length || !image.cols || !image.rows || typeof document === "undefined") return "";
    const key = rasterImageKey(image);
    if (rasterDataUrlCache.has(key)) return rasterDataUrlCache.get(key);
    const canvas = rasterCanvasFromPixels(image);
    if (!canvas) return "";
    const dataUrl = canvas.toDataURL("image/png");
    cacheSetLimited(rasterDataUrlCache, key, dataUrl);
    return dataUrl;
  }

  function rasterImageKey(image) {
    return image.rasterKey || `pixels:${image.cols}x${image.rows}:${pixelFingerprint(image.pixels)}`;
  }

  function pixelFingerprint(pixels) {
    if (!pixels?.length) return "empty";
    let hash = 2166136261;
    const stride = Math.max(4, Math.floor(pixels.length / 160));
    for (let index = 0; index < pixels.length; index += stride) {
      hash ^= pixels[index] || 0;
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    hash ^= pixels.length;
    return hash.toString(36);
  }

  function cacheSetLimited(cache, key, value) {
    if (cache.size >= CACHE_LIMIT && !cache.has(key)) {
      cache.delete(cache.keys().next().value);
    }
    cache.set(key, value);
  }

  function backgroundColor(name, customColor) {
    if (name === "Custom" && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(customColor || ""))) return customColor;
    return {
      Paper: "#f8f5eb",
      White: "#ffffff",
      Dark: "#20231f",
      Transparent: "transparent"
    }[name] || "#f8f5eb";
  }

  function canvasBlendMode(name) {
    return {
      Multiply: "multiply",
      Screen: "screen",
      Overlay: "overlay",
      Darken: "darken",
      Lighten: "lighten"
    }[name] || "source-over";
  }

  function svgBlendAttr(name) {
    const mode = canvasBlendMode(name);
    return mode === "source-over" ? "" : ` style="mix-blend-mode:${mode}"`;
  }

  function safeOffsetStep(bounds, rings) {
    if (!bounds || !rings) return 14;
    const safe = Math.min(bounds.minX, bounds.minY, WIDTH - bounds.maxX, HEIGHT - bounds.maxY) - 30;
    return Math.max(2, safe / rings);
  }

  function scalarValue(data, fallback) {
    return isType(data, "Value") ? Number(data.value || 0) : fallback;
  }

  function resolveColor(colorData, fallbackColor, fallbackOpacity) {
    if (isType(colorData, "Color")) {
      return {
        color: colorData.color || fallbackColor,
        opacity: colorData.opacity ?? fallbackOpacity
      };
    }
    return { color: fallbackColor, opacity: fallbackOpacity };
  }

  function strokeColorForPath(stroke, style, index) {
    return stroke?.pathColors?.[index] || stroke?.color || defaultPathColor(style, index);
  }

  function strokeOpacityForPath(stroke, style, index) {
    return stroke?.pathOpacities?.[index] ?? stroke?.opacity ?? (style === "contour" ? 0.48 : style === "scanline" ? 0.54 : style === "erode" ? 0.58 : 0.68);
  }

  function strokeWidthForPath(stroke, style, index) {
    return (stroke?.pathWidths?.[index] ?? stroke?.width) || (style === "contour" || style === "scanline" ? 0.8 : 0.75 + noise(4, index) * 1.3);
  }

  function shapeStrokeColor(shape, index = 0) {
    return shape?.shapeStyle?.strokeColors?.[index] || shape?.shapeStyle?.strokeColor || "#20231f";
  }

  function shapeFillColor(shape) {
    return shape?.shapeStyle?.fillColor || null;
  }

  function shapeStrokeOpacity(shape, fallback) {
    return shape?.shapeStyle?.strokeOpacity ?? fallback;
  }

  function shapeFillOpacity(shape, fallback) {
    return shape?.shapeStyle?.fillOpacity ?? Math.min(fallback * 0.38, 0.38);
  }

  function shapeStrokeWidth(shape) {
    return shape?.shapeStyle?.strokeWidth || 2.2;
  }

  function defaultPathColor(style, index) {
    if (style === "wind") return "#456c7c";
    if (style === "scanline") return "#536b57";
    return index % 7 === 0 ? "#9b6048" : "#536b57";
  }

  function pathColorsFor(paths, options, seed) {
    return (paths || []).map((_, index) => colorForRandomStroke(index, options, seed));
  }

  function colorForRandomStroke(index, options = {}, seed = 0) {
    const palette = randomStrokePalette(options.palette || "Survey", seed + Number(options.seed || 0) * 97);
    const variation = clamp(Number(options.variation || 76) / 100);
    const ordered = palette[index % palette.length];
    const randomIndex = Math.floor(noise(seed + Number(options.seed || 0) * 31 + 11, index * 43 + 9) * palette.length) % palette.length;
    return noise(seed + 7, index * 19 + 3) < variation ? palette[randomIndex] : ordered;
  }

  function randomStrokePalette(name, seed) {
    const palettes = {
      Survey: ["#536b57", "#456c7c", "#9b6048", "#20231f", "#7d8d82"],
      Warm: ["#9b6048", "#b06f55", "#75684d", "#c2a66b", "#20231f"],
      Cool: ["#456c7c", "#5f7f8d", "#536b57", "#7d8d82", "#20231f"],
      Ink: ["#20231f", "#3f4640", "#536b57", "#456c7c"]
    };
    if (name === "Random") {
      return Array.from({ length: 7 }, (_, index) => randomPaletteColor(seed, index + 1));
    }
    return palettes[name] || palettes.Survey;
  }

  function randomPaletteColor(seed, offset) {
    const hue = Math.round(noise(seed + 17, offset * 101 + 3) * 360);
    const saturation = 28 + Math.round(noise(seed + 23, offset * 67 + 9) * 36);
    const lightness = 26 + Math.round(noise(seed + 31, offset * 53 + 11) * 26);
    return hslToHex(hue, saturation, lightness);
  }

  function hslToHex(h, s, l) {
    const saturation = s / 100;
    const lightness = l / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = chroma * (1 - Math.abs((h / 60) % 2 - 1));
    const m = lightness - chroma / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) [r, g, b] = [chroma, x, 0];
    else if (h < 120) [r, g, b] = [x, chroma, 0];
    else if (h < 180) [r, g, b] = [0, chroma, x];
    else if (h < 240) [r, g, b] = [0, x, chroma];
    else if (h < 300) [r, g, b] = [x, 0, chroma];
    else [r, g, b] = [chroma, 0, x];
    return `#${hexByte((r + m) * 255)}${hexByte((g + m) * 255)}${hexByte((b + m) * 255)}`;
  }

  function hexByte(value) {
    return Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0");
  }

  function fractalNoise(x, y, seed, type) {
    const octaves = type === "Simple" ? 1 : 4;
    let value = 0;
    let amplitude = 1;
    let total = 0;

    for (let octave = 0; octave < octaves; octave += 1) {
      let sample = valueNoise(x * (1 << octave), y * (1 << octave), seed + octave * 19);
      if (type === "Ridged") sample = 1 - Math.abs(sample * 2 - 1);
      if (type === "Turbulent") sample = Math.abs(sample * 2 - 1);
      value += sample * amplitude;
      total += amplitude;
      amplitude *= 0.52;
    }
    return clamp(value / total);
  }

  function valueNoise(x, y, seed) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = smoothStep(x - x0);
    const ty = smoothStep(y - y0);
    const a = hashGrid(x0, y0, seed);
    const b = hashGrid(x0 + 1, y0, seed);
    const c = hashGrid(x0, y0 + 1, seed);
    const d = hashGrid(x0 + 1, y0 + 1, seed);
    return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
  }

  function hashGrid(x, y, seed) {
    return noise(seed, x * 374.761 + y * 668.265);
  }

  function smoothStep(t) {
    return t * t * (3 - 2 * t);
  }

  function point(x, y, nx, ny, role) {
    const normal = normalize(nx, ny);
    return { x, y, nx: normal.x, ny: normal.y, role };
  }

  function normalizeBounds(bounds) {
    if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) {
      return { minX: 160, minY: 260, maxX: WIDTH - 160, maxY: HEIGHT - 260 };
    }
    return bounds;
  }

  function decimate(points, maxCount) {
    if (!points || points.length <= maxCount) return points || [];
    const stride = points.length / maxCount;
    return Array.from({ length: maxCount }, (_, index) => points[Math.floor(index * stride)]);
  }

  function nearestDistance(x, y, points) {
    let best = Infinity;
    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const distance = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (distance < best) best = distance;
    }
    return Math.sqrt(best);
  }

  function fieldValue(field, x, y) {
    return field.values[y * field.cols + x] || 0;
  }

  function gridPoint(field, x, y) {
    return {
      x: fieldOriginX(field) + (x / (field.cols - 1)) * fieldWidth(field),
      y: fieldOriginY(field) + (y / (field.rows - 1)) * fieldHeight(field)
    };
  }

  function fieldBounds(field) {
    const minX = fieldOriginX(field);
    const minY = fieldOriginY(field);
    return {
      minX,
      minY,
      maxX: minX + fieldWidth(field),
      maxY: minY + fieldHeight(field)
    };
  }

  function fieldOriginX(field) {
    return Number(field.originX ?? 0);
  }

  function fieldOriginY(field) {
    return Number(field.originY ?? 0);
  }

  function fieldWidth(field) {
    return Number(field.width || WIDTH);
  }

  function fieldHeight(field) {
    return Number(field.height || HEIGHT);
  }

  function edgeHit(hits, threshold, va, vb, a, b) {
    if ((va < threshold && vb >= threshold) || (vb < threshold && va >= threshold)) {
      const t = clamp((threshold - va) / ((vb - va) || 1));
      hits.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
    }
  }

  function isType(data, type) {
    return data && data.ngType === type;
  }

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  function escapeText(value) {
    return String(value).replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));
  }

  function escapeAttr(value) {
    return escapeText(value).replace(/"/g, "&quot;");
  }

  window.NomadicGeometry = {
    WIDTH,
    HEIGHT,
    createTextShape,
    createCircleShape,
    createRectangleShape,
    createPolygonShape,
    createSvgShape,
    createRandomPoints,
    createImageLayer,
    createImageField,
    imageToField,
    imageWeathering,
    createNoiseField,
    createValue,
    createRandomArray,
    createColor,
    mathValue,
    scaleShape,
    mirrorData,
    rotateMirror,
    sampleShape,
    instanceOnPoints,
    scanlineField,
    distanceField,
    contourField,
    offsetContour,
    traceToShape,
    traceToPoints,
    shapeToTraceSet,
    fieldMask,
    invertField,
    shapeBoolean,
    fieldBoolean,
    grow,
    noiseDisplace,
    sineWave,
    smoothTrace,
    curveTension,
    wind,
    erode,
    dither,
    repeatData,
    matrixRepeatData,
    flattenLayers,
    layersToTraceSet,
    rasterizeLayers,
    fillArea,
    strokeStyle,
    inkDistress,
    randomStrokeColor,
    randomSize,
    pointLabels,
    layerStack,
    draw,
    toSvg
  };
})();
