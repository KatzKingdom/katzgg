(async () => {
  // 1) grab elements
  const video    = document.getElementById('webcam');
  const cursor   = document.getElementById('overlayCursor');
  const body     = document.body;
  // calibration storage
  let calib      = { mx:1, bx:0, my:1, by:0 };
  const calPts   = [];
  let lastNorm   = null;

  // 2) load the face-landmarks model with iris
  const model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
    { maxFaces: 1, refineLandmarks: true }
  );

  // 3) start webcam
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise(r => video.onloadedmetadata = r);

  // 4) calibration on click
  document.addEventListener('click', e => {
    if (!lastNorm) return;
    calPts.push([ lastNorm.x, lastNorm.y, e.clientX, e.clientY ]);
    if (calPts.length === 9) fitCalib();
  });

  // 5) main render + gaze loop
  async function render() {
    const faces = await model.estimateFaces({ input: video });
    if (faces.length) {
      const keypoints = faces[0].scaledMesh;
      // pick right-eye landmarks
      const iris   = keypoints[468];
      const inner  = keypoints[133];
      const outer  = keypoints[33];
      const topLid = keypoints[159];
      const botLid = keypoints[145];

      // normalize into [0,1]
      const nx = (iris[0] - inner[0]) / (outer[0] - inner[0]);
      const ny = (iris[1] - topLid[1])  / (botLid[1]  - topLid[1]);
      lastNorm   = { x: nx, y: ny };

      // apply linear calibration
      const sx = nx * calib.mx + calib.bx;
      const sy = ny * calib.my + calib.by;
      cursor.style.left = sx + 'px';
      cursor.style.top  = sy + 'px';
    }
    requestAnimationFrame(render);
  }
  render();

  // 6) simple least-squares fit
  function fitCalib() {
    const A = calPts.map(p => [p[0], 1]);
    const bx= calPts.map(p => p[2]);
    const by= calPts.map(p => p[3]);
    const solve = (A,b) => {
      let [a00,a01,a11,b0,b1] = [0,0,0,0,0];
      for (let i=0;i<A.length;i++) {
        const [x,c] = A[i], y=b[i];
        a00 += x*x; a01 += x*c; a11 += c*c;
        b0  += x*y; b1  += c*y;
      }
      const det = a00*a11 - a01*a01;
      return [
        ( b0*a11 - a01*b1)/det,
        (-b0*a01 + a00*b1)/det
      ];
    };
    [calib.mx,calib.bx] = solve(A,bx);
    [calib.my,calib.by] = solve(A,by);
    console.log('Calibration complete:', calib);
    calPts.length = 0;
  }
})();
