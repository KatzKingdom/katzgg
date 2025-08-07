// gaze.js
(async () => {
  // ──────────────── 1) Grab DOM references ────────────────
  const video  = document.getElementById('webcam');
  const cursor = document.getElementById('overlayCursor');

  // ──────────────── 2) Calibration & smoothing state ────────────────
  const calib = {
    //   ax*nx + bx*ny + cx*nx² + dx*nx*ny + ex*ny² + fx
    ax: window.innerWidth, bx: 0, cx: 0, dx: 0, ex: 0, fx: 0,
    //   ay*nx + by*ny + cy*nx² + dy*nx*ny + ey*ny² + fy
    ay: 0, by: window.innerHeight, cy: 0, dy: 0, ey: 0, fy: 0
  };
  const calPts = [];
  let lastNorm = null;

  // smoothing
  let smoothX = 0, smoothY = 0;
  const alpha = 0.2;  // EMA factor

  console.log('[Init] Starting up gaze.js');

  // ──────────────── 3) Load the MediaPipe FaceMesh detector ────────────────
  const modelType = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig = {
    runtime: 'mediapipe',                          // use MediaPipe for iris
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4',
    refineLandmarks: true,                        // get the 10 iris points
    maxFaces: 1
  };
  const detector = await faceLandmarksDetection.createDetector(modelType, detectorConfig);
  console.log('[Init] Detector ready');

  // ──────────────── 4) Start the webcam ────────────────
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise(r => video.onloadedmetadata = r);
  console.log('[Init] Webcam started');

  // ──────────────── 5) Auto-harvest clicks for calibration ────────────────
  document.addEventListener('click', async e => {
    if (!lastNorm) return;
    console.log(
      `[Cal] Harvest: norm=(${lastNorm.x.toFixed(3)},${lastNorm.y.toFixed(3)}) ` +
      `→ screen=(${e.clientX},${e.clientY})`
    );
    calPts.push([ lastNorm.x, lastNorm.y, e.clientX, e.clientY ]);
    // once we have ≥6 points, solve the 6-term polynomial
    if (calPts.length >= 6) {
      await fitPolyCalib();
      calPts.length = 0;  // clear for next batch
    }
  });

  // ──────────────── 6) Main rendering loop ────────────────
  async function render() {
    const faces = await detector.estimateFaces(video, { flipHorizontal: false });
    if (faces.length > 0) {
      // unify the mesh: either .keypoints or .scaledMesh
      let mesh;
      if (faces[0].keypoints) {
        mesh = faces[0].keypoints;
      } else if (faces[0].scaledMesh) {
        mesh = faces[0].scaledMesh.map(p => ({ x: p[0], y: p[1], z: p[2] }));
      } else {
        requestAnimationFrame(render);
        return;
      }

      // wait for the iris points (478 total with refineLandmarks)
      if (mesh.length >= 478) {
        // pick out the right eye corners & first iris point
        const iris   = mesh[468];
        const inner  = mesh[133];
        const outer  = mesh[33];
        const topLid = mesh[159];
        const botLid = mesh[145];

        // normalized gaze within eye-box [0..1]
        const nx = (iris.x - inner.x) / (outer.x - inner.x);
        const ny = (iris.y - topLid.y)  / (botLid.y  - topLid.y);
        lastNorm = { x: nx, y: ny };

        // discard wild outliers
        if (nx < -0.2 || nx > 1.2 || ny < -0.2 || ny > 1.2) {
          console.warn('[Render] Outlier norm:', nx, ny);
        } else {
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

          // smooth it
          smoothX = alpha * rawX + (1 - alpha) * smoothX;
          smoothY = alpha * rawY + (1 - alpha) * smoothY;

          // move the dot
          cursor.style.left = `${smoothX}px`;
          cursor.style.top  = `${smoothY}px`;
        }
      }
    }

    requestAnimationFrame(render);
  }
  render();

  // ──────────────── 7) Fit the 2nd-order polynomial by least-squares ────────────────
  async function fitPolyCalib() {
    console.log('[Cal] Fitting polynomial with', calPts.length, 'points');

    // build design matrix M (N×6) and target vectors bX, bY
    const M    = calPts.map(([nx, ny, sx, sy]) => [nx, ny, nx*nx, nx*ny, ny*ny, 1]);
    const bX   = calPts.map(p => p[2]);
    const bY   = calPts.map(p => p[3]);

    // use tf.js pseudoinverse to solve: coeff = pinv(M) × b
    const M_t = tf.tensor2d(M);                  // shape [N,6]
    const bX_t = tf.tensor2d(bX, [bX.length, 1]);
    const bY_t = tf.tensor2d(bY, [bY.length, 1]);

    const pinv = tf.linalg.pinv(M_t);            // shape [6,N]
    const coeffX = await pinv.matMul(bX_t).array();  // [[ax],[bx],…,[fx]]
    const coeffY = await pinv.matMul(bY_t).array();  // [[ay],[by],…,[fy]]

    // unpack into calib
    [calib.ax, calib.bx, calib.cx, calib.dx, calib.ex, calib.fx] =
      coeffX.map(r => r[0]);
    [calib.ay, calib.by, calib.cy, calib.dy, calib.ey, calib.fy] =
      coeffY.map(r => r[0]);

    console.log('[Cal] New polynomial calib:', calib);

    // clean up tensors
    tf.dispose([M_t, bX_t, bY_t, pinv]);
  }
})();
