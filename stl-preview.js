(function () {
  const FRAME_SIZE = 300;
  const FRAMES = 24;
  const COLUMNS = 6;

  function parseSTL(buffer) {
    const view = new DataView(buffer);
    const binaryCount = buffer.byteLength >= 84 ? view.getUint32(80, true) : 0;
    const isBinary = 84 + binaryCount * 50 === buffer.byteLength;
    const positions = [];
    const normals = [];

    if (isBinary) {
      for (let face = 0; face < binaryCount; face += 1) {
        const offset = 84 + face * 50;
        const normal = [view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true)];
        for (let vertex = 0; vertex < 3; vertex += 1) {
          const point = offset + 12 + vertex * 12;
          positions.push(view.getFloat32(point, true), view.getFloat32(point + 4, true), view.getFloat32(point + 8, true));
          normals.push(...normal);
        }
      }
    } else {
      const text = new TextDecoder().decode(buffer);
      let normal = [0, 0, 1];
      for (const line of text.split(/\r?\n/)) {
        const parts = line.trim().split(/\s+/);
        if (parts[0]?.toLowerCase() === "facet" && parts[1]?.toLowerCase() === "normal") normal = parts.slice(2, 5).map(Number);
        if (parts[0]?.toLowerCase() === "vertex") {
          positions.push(...parts.slice(1, 4).map(Number));
          normals.push(...normal);
        }
      }
    }

    if (positions.length < 9 || positions.some(value => !Number.isFinite(value))) throw new Error("STL inválido ou vazio.");
    return { positions: new Float32Array(positions), normals: new Float32Array(normals) };
  }

  function normalizeMesh(mesh) {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let index = 0; index < mesh.positions.length; index += 3) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], mesh.positions[index + axis]);
        max[axis] = Math.max(max[axis], mesh.positions[index + axis]);
      }
    }
    const center = min.map((value, axis) => (value + max[axis]) / 2);
    let radius = 0;
    for (let index = 0; index < mesh.positions.length; index += 3) {
      for (let axis = 0; axis < 3; axis += 1) mesh.positions[index + axis] -= center[axis];
      radius = Math.max(radius, Math.hypot(mesh.positions[index], mesh.positions[index + 1], mesh.positions[index + 2]));
    }
    const scale = 0.76 / Math.max(radius, 0.000001);
    for (let index = 0; index < mesh.positions.length; index += 1) mesh.positions[index] *= scale;
    return mesh;
  }

  function shader(gl, type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result) || "Falha ao preparar o renderizador.");
    return result;
  }

  function makeRenderer(mesh, color) {
    const canvas = document.createElement("canvas");
    canvas.width = FRAME_SIZE;
    canvas.height = FRAME_SIZE;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, preserveDrawingBuffer: true });
    if (!gl) throw new Error("Este navegador não oferece WebGL para gerar a prévia.");

    const vertexSource = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      uniform float uAngle;
      varying vec3 vNormal;
      void main() {
        float c = cos(uAngle), s = sin(uAngle);
        mat3 rotation = mat3(c,s,0.0,-s,c,0.0,0.0,0.0,1.0);
        vec3 p = rotation * aPosition;
        vec3 n = normalize(rotation * aNormal);
        float elevation = 0.46;
        float ce = cos(elevation), se = sin(elevation);
        vec3 viewPoint = vec3(p.x, p.z*ce-p.y*se, p.y*ce+p.z*se);
        vNormal = normalize(vec3(n.x, n.z*ce-n.y*se, n.y*ce+n.z*se));
        gl_Position = vec4(viewPoint.x, viewPoint.y, -viewPoint.z*0.35, 1.0);
      }`;
    const fragmentSource = `
      precision mediump float;
      uniform vec3 uColor;
      varying vec3 vNormal;
      void main() {
        vec3 n = normalize(vNormal);
        vec3 light = normalize(vec3(-0.55, 0.72, 0.85));
        vec3 fill = normalize(vec3(0.72, -0.20, 0.42));
        float diffuse = abs(dot(n, light));
        float fillValue = abs(dot(n, fill));
        float rim = pow(1.0-abs(n.z), 2.2);
        float shine = pow(max(abs(dot(n, normalize(light+vec3(0.0,0.0,1.0)))),0.0),18.0);
        float shade = 0.34 + diffuse*0.50 + fillValue*0.13;
        vec3 finalColor = uColor*shade + vec3(1.0,0.70,0.38)*shine*0.26 + vec3(1.0,0.22,0.02)*rim*0.07;
        gl_FragColor = vec4(finalColor, 1.0);
      }`;
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl, gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, shader(gl, gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Falha ao iniciar o renderizador.");
    gl.useProgram(program);

    function attach(name, data) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    }
    attach("aPosition", mesh.positions);
    attach("aNormal", mesh.normals);
    const rgb = color.match(/[a-f\d]{2}/gi)?.map(value => parseInt(value, 16) / 255) || [0.94, 0.27, 0];
    gl.uniform3fv(gl.getUniformLocation(program, "uColor"), rgb);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.viewport(0, 0, FRAME_SIZE, FRAME_SIZE);

    return angle => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(gl.getUniformLocation(program, "uAngle"), angle);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.positions.length / 3);
      return canvas;
    };
  }

  async function generate(file, color = "#f04400") {
    if (!file || !/\.stl$/i.test(file.name)) throw new Error("Selecione um arquivo .STL.");
    if (file.size > 80 * 1024 * 1024) throw new Error("O STL deve ter no máximo 80 MB.");
    const mesh = normalizeMesh(parseSTL(await file.arrayBuffer()));
    const render = makeRenderer(mesh, color);
    const rows = Math.ceil(FRAMES / COLUMNS);
    const sprite = document.createElement("canvas");
    sprite.width = COLUMNS * FRAME_SIZE;
    sprite.height = rows * FRAME_SIZE;
    const context = sprite.getContext("2d");
    for (let frame = 0; frame < FRAMES; frame += 1) {
      const x = (frame % COLUMNS) * FRAME_SIZE;
      const y = Math.floor(frame / COLUMNS) * FRAME_SIZE;
      context.save();
      context.filter = "blur(9px)";
      context.fillStyle = "rgba(42,24,14,.22)";
      context.beginPath();
      context.ellipse(x + FRAME_SIZE / 2, y + FRAME_SIZE * 0.79, FRAME_SIZE * 0.25, FRAME_SIZE * 0.035, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
      context.drawImage(render(-0.62 + frame * Math.PI * 2 / FRAMES), x, y);
      if (frame % 4 === 0) await new Promise(resolve => requestAnimationFrame(resolve));
    }
    const blob = await new Promise(resolve => sprite.toBlob(resolve, "image/webp", 0.78));
    if (!blob) throw new Error("Não foi possível criar a imagem WebP.");
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { dataUrl, frames: FRAMES, columns: COLUMNS, bytes: blob.size, triangles: mesh.positions.length / 9 };
  }

  window.StlPreview = { generate };
})();
