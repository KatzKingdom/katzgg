const gradientBackground = document.getElementById("gradient-background");
const pageContent = document.getElementById("page-content");
const contentContainer = document.getElementById("content-container");

const projects = [
    {
        image: "/assets/portfolio/iNeedThisClass.png",
        title: "iNeedThisClass",
        description: "A webscraper email alert system I created and used to notify myself of a class becoming available during add-drop period.",
        page: "iNeedThisClass",
    },
];

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
        if(page == "portfolio") {
            pageContent.innerHTML = `<h1 class="text">Portfolio</h1>` + projects
            .map(
                (project) => `
                <div class="project-tab">
                    <img src="${project.image}" alt="${project.title}" class="project-image">
                    <div class="project-details">
                        <h2 class="project-title">${project.title}</h2>
                        <p class="project-description">${project.description}</p>
                    </div>
                    <div class="project-learn-more">
                        <a href="#" data-page="${project.page}" class="learn-more-link">Learn More ➡</a>
                    </div>
                </div>
            `
            )
            .join("");
            document.querySelectorAll(".learn-more-link").forEach(link => {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    const page2 = e.target.getAttribute("data-page");
                    fetch(`pages/${page2}.html`)
                    .then((res) => res.text())
                    .then((text) => {
                        pageContent.innerHTML = text;
                    })
                    .catch((e) => console.error(e));
                });
            });
        } else {
            fetch(`pages/${page}.html`)
            .then((res) => res.text())
            .then((text) => {
                pageContent.innerHTML = text;
            })
            .catch((e) => console.error(e));
        }
    });
});

// Initialize with the Home page content
fetch(`pages/home.html`)
    .then((res) => res.text())
    .then((text) => {
        pageContent.innerHTML = text;
    })
    .catch((e) => console.error(e));