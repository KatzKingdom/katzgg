// gaze.js
(async () => {
  // 1) Grab elements
  const video  = document.getElementById('webcam');
  const cursor = document.getElementById('overlayCursor');

  // 2) Calibration storage
  // – Start with a “default” mapping: full window width/height
  let calib    = {
    mx: window.innerWidth,  // normalized 0→1 → 0→innerWidth
    bx: 0,
    my: window.innerHeight, // normalized 0→1 → 0→innerHeight
    by: 0
  };
  const calPts = [];
  let lastNorm = null;

  // 3) Create the FaceMesh detector (MediaPipe runtime)
  console.log('[Init] Creating detector...');
  const modelType = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4',
    refineLandmarks: true,
    maxFaces: 1
  };
  const detector = await faceLandmarksDetection.createDetector(modelType, detectorConfig);
  console.log('[Init] Detector ready.');

  // 4) Start the webcam feed
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise(r => video.onloadedmetadata = r);
  console.log('[Init] Webcam started.');

  // 5) Calibration on click (collect 9 points, then fit)
  document.addEventListener('click', e => {
    if (!lastNorm) return;
    console.log(
      `[Cal] Click #${calPts.length+1}: ` +
      `norm=(${lastNorm.x.toFixed(3)},${lastNorm.y.toFixed(3)}) ` +
      `→ screen=(${e.clientX},${e.clientY})`
    );
    calPts.push([ lastNorm.x, lastNorm.y, e.clientX, e.clientY ]);
    if (calPts.length >= 9) {
      console.log('[Cal] Running fitCalib() with points:', calPts);
      fitCalib();
    }
  });

  // 6) Main render loop
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
        console.warn('[Render] No landmarks array found on face object');
        requestAnimationFrame(render);
        return;
      }

      // iris points come in at indices 468–472 if loaded
      if (mesh.length < 478) {
        console.warn(`[Render] Iris not ready, only got ${mesh.length} pts`);
      } else {
        // pick your landmarks
        const iris   = mesh[468];
        const inner  = mesh[133];
        const outer  = mesh[33];
        const topLid = mesh[159];
        const botLid = mesh[145];

        // normalize 0→1 within the eye box
        const nx = (iris.x - inner.x) / (outer.x - inner.x);
        const ny = (iris.y - topLid.y)  / (botLid.y  - topLid.y);
        lastNorm = { x: nx, y: ny };

        // apply mapping
        const sx = nx * calib.mx + calib.bx;
        const sy = ny * calib.my + calib.by;

        // logging for debugging
        console.log(
          `[Render] meshPts=${mesh.length} ` +
          `norm=(${nx.toFixed(3)},${ny.toFixed(3)}) ` +
          `→ screen=(${sx.toFixed(1)},${sy.toFixed(1)}) ` +
          `calib={mx:${calib.mx.toFixed(1)},bx:${calib.bx.toFixed(1)},` +
                 `my:${calib.my.toFixed(1)},by:${calib.by.toFixed(1)}}`
        );

        // move the red dot
        cursor.style.left = `${sx}px`;
        cursor.style.top  = `${sy}px`;
      }
    }

    requestAnimationFrame(render);
  }
  render();

  // 7) Least‐squares calibration
  function fitCalib() {
    const A  = calPts.map(p => [p[0], 1]);
    const bx = calPts.map(p => p[2]);
    const by = calPts.map(p => p[3]);

    const solve = (M, b) => {
      let [a00,a01,a11,b0,b1] = [0,0,0,0,0];
      for (let i=0; i<M.length; i++) {
        const [x,c] = M[i];
        a00 += x*x; a01 += x*c; a11 += c*c;
        b0  += x*b[i]; b1  += c*b[i];
      }
      const det = a00*a11 - a01*a01;
      return [
        ( b0*a11 - a01*b1 ) / det,
        ( a00*b1   - b0*a01 ) / det
      ];
    };

    [calib.mx, calib.bx] = solve(A, bx);
    [calib.my, calib.by] = solve(A, by);
    console.log('[Cal] New calibration:', calib);
    // clear points so you can re-calibrate if you want
    calPts.length = 0;
  }
})();
