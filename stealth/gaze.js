// gaze.js
(async () => {
  // 1) Grab elements
  const video  = document.getElementById('webcam');
  const cursor = document.getElementById('overlayCursor');

  // 2) Calibration storage
  let calib    = { mx: 1, bx: 0, my: 1, by: 0 };
  const calPts = [];
  let lastNorm = null;

  // 3) Create the FaceMesh detector (v1.x API)
  const modelType = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
    refineLandmarks: true,  // enables iris detection
    maxFaces: 1
  };
  const detector = await faceLandmarksDetection.createDetector(modelType, detectorConfig);

  // 4) Start the webcam feed
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise(resolve => video.onloadedmetadata = resolve);

  // 5) Calibration on click (collect 9 points, then fit)
  document.addEventListener('click', e => {
    if (!lastNorm) return;
    calPts.push([ lastNorm.x, lastNorm.y, e.clientX, e.clientY ]);
    if (calPts.length >= 9) fitCalib();
  });

  // 6) Main render loop
  async function render() {
    // estimateFaces takes the video element directly
    const faces = await detector.estimateFaces(video, { flipHorizontal: false });
    if (faces.length > 0) {
      const keypoints = faces[0].scaledMesh;  // [ [x,y,z], … ]

      // pick right‐eye landmarks by index
      const iris   = keypoints[468];
      const inner  = keypoints[133];
      const outer  = keypoints[33];
      const topLid = keypoints[159];
      const botLid = keypoints[145];

      // normalize into [0,1]
      const nx = (iris[0] - inner[0]) / (outer[0] - inner[0]);
      const ny = (iris[1] - topLid[1]) / (botLid[1]  - topLid[1]);
      lastNorm = { x: nx, y: ny };

      // apply linear calibration
      const sx = nx * calib.mx + calib.bx;
      const sy = ny * calib.my + calib.by;

      // move the red dot
      cursor.style.left = `${sx}px`;
      cursor.style.top  = `${sy}px`;
    }

    requestAnimationFrame(render);
  }
  render();

  // 7) Simple least‐squares fit for calibration
  function fitCalib() {
    const A  = calPts.map(p => [p[0], 1]);
    const bx = calPts.map(p => p[2]);
    const by = calPts.map(p => p[3]);

    const solve = (M, b) => {
      let [a00, a01, a11, b0, b1] = [0, 0, 0, 0, 0];
      for (let i = 0; i < M.length; i++) {
        const [x, c] = M[i];
        a00 += x*x; a01 += x*c; a11 += c*c;
        b0  += x*b[i]; b1  += c*b[i];
      }
      const det = a00*a11 - a01*a01;
      return [
        ( b0*a11 - a01*b1 ) / det,
        ( a00*b1 - b0*a01 ) / det
      ];
    };

    [calib.mx, calib.bx] = solve(A, bx);
    [calib.my, calib.by] = solve(A, by);
    console.log('Calibration complete:', calib);
    calPts.length = 0;
  }
})();
