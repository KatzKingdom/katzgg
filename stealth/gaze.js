// gaze.js
(async () => {
  // ──────────────── 1) Grab DOM references ────────────────
  const video  = document.getElementById('webcam');
  const cursor = document.getElementById('overlayCursor');
  const body   = document.body;

  // ──────────────── 2) Calibration, smoothing & detection state ────────────────
  const calib = {
    ax: window.innerWidth, bx: 0, cx: 0, dx: 0, ex: 0, fx: 0,
    ay: 0, by: window.innerHeight, cy: 0, dy: 0, ey: 0, fy: 0
  };
  const calPts = [];
  let lastNorm = null;

  // smoothing
  let smoothX = 0, smoothY = 0;
  const alpha = 0.2;

  // away/zoned detection
  const AWAY_TIMEOUT_MS     = 2000;  // no gaze for 2s → away
  const ZONE_WINDOW_MS      = 3000;  // look at last 3s
  const ZONE_MOVE_THRESHOLD = 0.02;  // normalized units
  let lastValidGazeTime = performance.now();
  const gazeHistory = []; // { x: normX, y: normY, t: timestamp }

  console.log('[Init] Starting gaze.js');

  // ──────────────── 3) Load MediaPipe FaceMesh detector ────────────────
  const modelType = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4',
    refineLandmarks: true,
    maxFaces: 1
  };
  const detector = await faceLandmarksDetection.createDetector(modelType, detectorConfig);
  console.log('[Init] Detector ready');

  // ──────────────── 4) Start webcam ────────────────
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise(r => video.onloadedmetadata = r);
  console.log('[Init] Webcam started');

  // ──────────────── 5) Auto-harvest clicks for calibration ────────────────
  document.addEventListener('click', e => {
    if (!lastNorm) return;
    calPts.push([ lastNorm.x, lastNorm.y, e.clientX, e.clientY ]);
    if (calPts.length >= 6) {
      fitPolyCalib();
      calPts.length = 0;
    }
  });

  // ──────────────── 6) Main render loop ────────────────
  async function render() {
    const faces = await detector.estimateFaces(video, { flipHorizontal: false });
    if (faces.length > 0) {
      // unify mesh format
      let mesh;
      if (faces[0].keypoints) {
        mesh = faces[0].keypoints;
      } else if (faces[0].scaledMesh) {
        mesh = faces[0].scaledMesh.map(p => ({ x: p[0], y: p[1], z: p[2] }));
      } else {
        requestAnimationFrame(render);
        return;
      }

      // check for iris points
      if (mesh.length >= 478) {
        const iris   = mesh[468];
        const inner  = mesh[133];
        const outer  = mesh[33];
        const topLid = mesh[159];
        const botLid = mesh[145];

        // normalized gaze in eye-box
        const nx = (iris.x - inner.x) / (outer.x - inner.x);
        const ny = (iris.y - topLid.y)  / (botLid.y  - topLid.y);
        lastNorm = { x: nx, y: ny };

        // record valid gaze time & history
        const now = performance.now();
        lastValidGazeTime = now;
        gazeHistory.push({ x: nx, y: ny, t: now });
        // drop old history
        while (gazeHistory.length && gazeHistory[0].t < now - ZONE_WINDOW_MS) {
          gazeHistory.shift();
        }

        // polynomial mapping → raw coords
        const rawX =
          calib.ax * nx +
          calib.bx * ny +
          calib.cx * nx*nx +
          calib.dx * nx*ny +
          calib.ex * ny*ny +
          calib.fx;
        const rawY =
          calib.ay * nx +
          calib.by * ny +
          calib.cy * nx*nx +
          calib.dy * nx*ny +
          calib.ey * ny*ny +
          calib.fy;

        // smoothing
        smoothX = alpha * rawX + (1 - alpha) * smoothX;
        smoothY = alpha * rawY + (1 - alpha) * smoothY;

        // move the dot
        cursor.style.left = `${smoothX}px`;
        cursor.style.top  = `${smoothY}px`;
      }
    }

    // ────────── 7) Away & zoned detection ──────────
    const now = performance.now();
    const away  = (now - lastValidGazeTime) > AWAY_TIMEOUT_MS;

    let zoned = false;
    if (gazeHistory.length > 1) {
      let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
      for (const p of gazeHistory) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      const dx = maxX - minX;
      const dy = maxY - minY;
      zoned = (dx < ZONE_MOVE_THRESHOLD && dy < ZONE_MOVE_THRESHOLD);
    }

    body.style.backgroundColor = (away || zoned) ? '#fcc' : '#fff';

    requestAnimationFrame(render);
  }
  render();

  // ──────────────── 8) Fit the 2nd-order polynomial ────────────────
  async function fitPolyCalib() {
    const M  = calPts.map(([nx, ny, sx, sy]) => [nx, ny, nx*nx, nx*ny, ny*ny, 1]);
    const bX = calPts.map(p => p[2]);
    const bY = calPts.map(p => p[3]);

    // solve via tf.js pseudoinverse
    const M_t  = tf.tensor2d(M);
    const bX_t = tf.tensor2d(bX, [bX.length, 1]);
    const bY_t = tf.tensor2d(bY, [bY.length, 1]);
    const pinv = tf.linalg.pinv(M_t);

    const coeffX = await pinv.matMul(bX_t).array(); // [[ax],[bx],…]
    const coeffY = await pinv.matMul(bY_t).array();

    [calib.ax, calib.bx, calib.cx, calib.dx, calib.ex, calib.fx] = coeffX.map(r => r[0]);
    [calib.ay, calib.by, calib.cy, calib.dy, calib.ey, calib.fy] = coeffY.map(r => r[0]);

    tf.dispose([M_t, bX_t, bY_t, pinv]);
  }
})();
