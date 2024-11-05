const gradientBackground = document.getElementById("gradient-background");
const pageContent = document.getElementById("page-content");
const contentContainer = document.getElementById("content-container");

document.addEventListener("mousemove", (e) => {
    const { clientX: x, clientY: y } = e;
  
    // Create a radial gradient centered on the cursor
    gradientBackground.style.background = `
    radial-gradient(circle at ${x}px ${y}px, 
    rgba(5, 5, 5, 0.8),
    #000 15%)`;

    contentContainer.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.15)';
});
  
// Handle navigation and dynamic content update
document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = e.target.getAttribute("data-page");
        fetch(`pages/${page}.html`)
        .then((res) => res.text())
        .then((text) => {
            pageContent.innerHTML = text;
        })
        .catch((e) => console.error(e));
    });
});
  
// Initialize with the About Me page content
fetch(`pages/home.html`)
    .then((res) => res.text())
    .then((text) => {
        pageContent.innerHTML = text;
    })
    .catch((e) => console.error(e));