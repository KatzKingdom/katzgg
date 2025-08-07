// gaze.js
(async () => {
  const video  = document.getElementById('webcam');
  const cursor = document.getElementById('overlayCursor');

  // calibration storage
  let calib    = { mx: 1, bx: 0, my: 1, by: 0 };
  const calPts = [];
  let lastNorm = null;

  // 1) Create FaceMesh detector (MediaPipe runtime)
  const modelType = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4',
    refineLandmarks: true,  // loads the iris submodel (adds 10 points)
    maxFaces: 1
  };
  const detector = await faceLandmarksDetection.createDetector(modelType, detectorConfig);

  // 2) Start webcam
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise(r => video.onloadedmetadata = r);

  // 3) Calibrate on click (collect 9 points)
  document.addEventListener('click', e => {
    if (!lastNorm) return;
    calPts.push([ lastNorm.x, lastNorm.y, e.clientX, e.clientY ]);
    if (calPts.length >= 9) fitCalib();
  });

  // 4) Main render loop
  async function render() {
    const faces = await detector.estimateFaces(video, { flipHorizontal: false });
    if (faces.length > 0) {
      // switch to keypoints (pixel coords), not scaledMesh
      const keypoints = faces[0].keypoints;

      // wait until iris points are present (478 total)
      if (keypoints.length < 478) {
        console.warn('Waiting for iris model to load; got', keypoints.length, 'points');
      } else {
        // pick right‐eye landmarks by index
        const iris   = keypoints[468];  // first iris point
        const inner  = keypoints[133];  // eye inner corner
        const outer  = keypoints[33];   // eye outer corner
        const topLid = keypoints[159];  // upper eyelid
        const botLid = keypoints[145];  // lower eyelid

        // normalize into [0,1] within the eye box
        const nx = (iris.x - inner.x) / (outer.x - inner.x);
        const ny = (iris.y - topLid.y)  / (botLid.y  - topLid.y);
        lastNorm = { x: nx, y: ny };

        // apply linear calibration
        const sx = nx * calib.mx + calib.bx;
        const sy = ny * calib.my + calib.by;

        // move the red dot
        cursor.style.left = `${sx}px`;
        cursor.style.top  = `${sy}px`;
      }
    }
    requestAnimationFrame(render);
  }
  render();

  // 5) Simple least‐squares calibration
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
    console.log('Calibration complete:', calib);
    calPts.length = 0;
  }
})();
