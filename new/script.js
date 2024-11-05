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

const pages = {
    about: `<h1 class="text">About Me</h1><p class="text">About Me!</p>`,
    portfolio: "<p>Portfolio!</p>",
    contact: "<p>Contact!</p>"
};
  
// Handle navigation and dynamic content update
document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = e.target.getAttribute("data-page");
        pageContent.innerHTML = pages[page];
    });
});
  
// Initialize with the About Me page content
pageContent.innerHTML = pages.about;