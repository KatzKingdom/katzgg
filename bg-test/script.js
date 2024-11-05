const gradientBackground = document.getElementById("gradient-background");

document.addEventListener("mousemove", (e) => {
  const { clientX: x, clientY: y } = e;
  
  // Create a radial gradient centered on the cursor
  gradientBackground.style.background = `
    radial-gradient(circle at ${x}px ${y}px, 
    rgba(255, 255, 255, 0.1),
    #111 50%)`;
});