// gaze.js
(async () => {
  // 1) Grab DOM
  const video  = document.getElementById('webcam');
  const cursor = document.getElementById('overlayCursor');
  const body   = document.body;

  // 2) State: calibration, smoothing, detection
  const calib = {
    ax: window.innerWidth, bx: 0, cx: 0, dx: 0, ex: 0, fx: 0,
    ay: 0, by: window.innerHeight, cy: 0, dy: 0, ey: 0, fy: 0
  };
  const calPts = [];
  let lastNorm = null;

  let smoothX = 0, smoothY = 0, alpha = 0.2;

  const AWAY_TIMEOUT_MS     = 2000;
  const ZONE_WINDOW_MS      = 3000;
  const ZONE_MOVE_THRESHOLD = 0.02;
  let lastValidGazeTime = performance.now();
  const gazeHistory = [];

  // 3) Load FaceMesh (MediaPipe runtime)
  const detector = await faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
    {
      runtime: 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4',
      refineLandmarks: true,
      maxFaces: 1
    }
  );

  // 4) Start webcam
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise(r => video.onloadedmetadata = r);

  // 5) Harvest clicks for auto‐calib
  document.addEventListener('click', e => {
    if (!lastNorm) return;
    calPts.push([ lastNorm.x, lastNorm.y, e.clientX, e.clientY ]);
    if (calPts.length >= 6) {
      fitPolyCalib();
      calPts.length = 0;
    }
  });

  // 6) Main loop
  async function render() {
    const faces = await detector.estimateFaces(video, { flipHorizontal: false });
    if (faces.length > 0) {
      // unify mesh
      let mesh;
      if (faces[0].keypoints) {
        mesh = faces[0].keypoints;
      } else if (faces[0].scaledMesh) {
        mesh = faces[0].scaledMesh.map(p => ({ x:p[0], y:p[1], z:p[2] }));
      }

      if (mesh && mesh.length >= 478) {
        // pick landmarks
        const iris   = mesh[468],
              inner  = mesh[133],
              outer  = mesh[33],
              topLid = mesh[159],
              botLid = mesh[145];

        // normalized gaze in eye‐box
        const nx = (iris.x - inner.x) / (outer.x - inner.x);
        const ny = (iris.y - topLid.y)  / (botLid.y  - topLid.y);
        lastNorm = { x: nx, y: ny };

        // record for away/zoned
        const now = performance.now();
        lastValidGazeTime = now;
        gazeHistory.push({ x: nx, y: ny, t: now });
        while (gazeHistory.length && gazeHistory[0].t < now - ZONE_WINDOW_MS) {
          gazeHistory.shift();
        }

        // polynomial mapping
        const rawX =
          calib.ax*nx + calib.bx*ny +
          calib.cx*nx*nx + calib.dx*nx*ny +
          calib.ex*ny*ny + calib.fx;
        const rawY =
          calib.ay*nx + calib.by*ny +
          calib.cy*nx*nx + calib.dy*nx*ny +
          calib.ey*ny*ny + calib.fy;

        // smooth & move
        smoothX = alpha*rawX + (1-alpha)*smoothX;
        smoothY = alpha*rawY + (1-alpha)*smoothY;
        cursor.style.left = `${smoothX}px`;
        cursor.style.top  = `${smoothY}px`;
      }
    }

    // 7) Detect away / zoned
    const now = performance.now();
    const away = (now - lastValidGazeTime) > AWAY_TIMEOUT_MS;

    let zoned = false;
    if (gazeHistory.length > 1) {
      let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
      for (const p of gazeHistory) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      zoned = (maxX-minX < ZONE_MOVE_THRESHOLD && maxY-minY < ZONE_MOVE_THRESHOLD);
    }

    // 8) Detect eyes looking away
    const eyeAway = lastNorm
      ? (lastNorm.x < -0.1 || lastNorm.x > 1.1 || lastNorm.y < -0.1 || lastNorm.y > 1.1)
      : false;

    // 9) Set background
    body.style.backgroundColor = (away || zoned || eyeAway) ? '#fcc' : '#fff';

    requestAnimationFrame(render);
  }
  render();

  // ─────────────── Fit 2nd-order polynomial ───────────────
  async function fitPolyCalib() {
    const M  = calPts.map(([nx, ny, sx, sy]) => [nx, ny, nx*nx, nx*ny, ny*ny, 1]);
    const bX = calPts.map(p => p[2]);
    const bY = calPts.map(p => p[3]);

    const M_t  = tf.tensor2d(M);
    const bX_t = tf.tensor2d(bX, [bX.length,1]);
    const bY_t = tf.tensor2d(bY, [bY.length,1]);
    const pinv = tf.linalg.pinv(M_t);

    const coeffX = await pinv.matMul(bX_t).array();
    const coeffY = await pinv.matMul(bY_t).array();

    [calib.ax,calib.bx,calib.cx,calib.dx,calib.ex,calib.fx] = coeffX.map(r=>r[0]);
    [calib.ay,calib.by,calib.cy,calib.dy,calib.ey,calib.fy] = coeffY.map(r=>r[0]);

    tf.dispose([M_t,bX_t,bY_t,pinv]);
  }
})();
