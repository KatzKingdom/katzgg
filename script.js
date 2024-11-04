const closeButtonAM = document.getElementById("closeButtonAM");
const aboutMe = document.getElementById("aboutMe");
const aboutMePopUp = document.getElementById("aboutMePopUp");
const aboutMeOverlay = document.getElementById("aboutMeOverlay");
const closeButtonC = document.getElementById("closeButtonC");
const commissions = document.getElementById("commissions");
const commissionsPopUp = document.getElementById("commissionsPopUp");
const commissionsOverlay = document.getElementById("commissionsOverlay");
const closeButtonP = document.getElementById("closeButtonP");
const portfolio = document.getElementById("portfolio");
const portfolioPopUp = document.getElementById("portfolioPopUp");
const portfolioOverlay = document.getElementById("portfolioOverlay");
const closeButtonPr = document.getElementById("closeButtonPr");
const projects = document.getElementById("projects");
const projectsPopUp = document.getElementById("projectsPopUp");
const projectsOverlay = document.getElementById("projectsOverlay");

closeButtonAM.addEventListener("click", async function(event) {
  aboutMePopUp.classList.toggle("active");
});

aboutMe.addEventListener("click", async function(event) {
  aboutMePopUp.classList.toggle("active");
});

aboutMeOverlay.addEventListener("click", async function(event) {
  aboutMePopUp.classList.toggle("active");
});

closeButtonC.addEventListener("click", async function(event) {
  commissionsPopUp.classList.toggle("active");
});

commissions.addEventListener("click", async function(event) {
  commissionsPopUp.classList.toggle("active");
});

commissionsOverlay.addEventListener("click", async function(event) {
  commissionsPopUp.classList.toggle("active");
});

closeButtonP.addEventListener("click", async function(event) {
  portfolioPopUp.classList.toggle("active");
});

portfolio.addEventListener("click", async function(event) {
  portfolioPopUp.classList.toggle("active");
});

portfolioOverlay.addEventListener("click", async function(event) {
  portfolioPopUp.classList.toggle("active");
});

closeButtonPr.addEventListener("click", async function(event) {
  projectsPopUp.classList.toggle("active");
});

projects.addEventListener("click", async function(event) {
  projectsPopUp.classList.toggle("active");
});

projectsOverlay.addEventListener("click", async function(event) {
  projectsPopUp.classList.toggle("active");
});
