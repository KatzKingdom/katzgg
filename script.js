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
const closeButtonCl = document.getElementById("closeButtonCl");
const clients = document.getElementById("clients");
const clientsPopUp = document.getElementById("clientsPopUp");
const clientsOverlay = document.getElementById("clientsOverlay");
const loginBtn = document.getElementById("loginBtn");
const username = document.getElementById("username");
const password = document.getElementById("password");
const errorTxt = document.getElementById("errorTxt");

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

closeButtonCl.addEventListener("click", async function(event) {
  clientsPopUp.classList.toggle("active");
});

clients.addEventListener("click", async function(event) {
  clientsPopUp.classList.toggle("active");
});

clientsOverlay.addEventListener("click", async function(event) {
  clientsPopUp.classList.toggle("active");
});

loginBtn.addEventListener("click", async function(event) {
  fetch('./config.json')
  .then(res => res.json())
  .then(async data => {

    var user = "";
    var account;
    data.accounts.forEach(acc => {
      if(username.value.toLowerCase() == acc.username.toLowerCase() && password.value == acc.password) {
        user = acc.username;
        account = acc;
      }
    })
    if(user == "") return errorTxt.innerHTML = "Invalid login credentials.";

    
    username.setAttribute("readonly", true);
    password.setAttribute("readonly", true);
    document.getElementById("clientTxt").innerHTML = "Loading Portal...";
    document.getElementById("clientHd").innerHTML = `${user}'s Portal`;

    var projList = `<b>${account.projects[0]}</b>`;
    account.projects.forEach(proj => {
      if(proj != account.projects[0]) projList += `, <b>${proj}</b>`;
    })
    
    let projects = "";
    if(account.projects.length != 1) projects = "s";
    let payStatus = '<span style="color: red;">Unpaid</span>';
    if(account.payStatus == "Paid") payStatus = '<span style="color: green;">Paid</span>';
    if(account.payStatus == "Waived") payStatus = '<span style="color: green;">Waived</span>';
    let monthlyPayStatus = '<span style="color: red;">Unpaid</span>';
    if(account.monthlyPayStatus == "Paid") monthlyPayStatus = '<span style="color: green;">Paid</span>';
    if(account.monthlyPayStatus == "Waived") monthlyPayStatus = '<span style="color: green;">Waived</span>';
    console.log(payStatus);
    var content = `Welcome to your portal, <b>${user}</b>! Please note that this information is updated manually and may be subject to slight delays. Need any help? Contact me on <a href="https://discord.com/users/480913404094054402" target="_blank">Discord</a>.<br><br>You have <b>${account.projects.length}</b> active project${projects}: ${projList}<br><br>Your invoice payment status is: <b>${payStatus}</b><br><br>Your monthly payment status is: <b>${monthlyPayStatus}</b><br>Your next payment is due on the: <b>${account.monthlyPayDate}</b><br>You can view your monthly payment form: <b><a href="${account.monthlyPayForm}" target="_blank">here</a></b><br><br>You have been a client since: <b>${account.clientSince}</b><br><br><br><br><br>Thank you for your support!<br><br>To logout, please click <a href="/">here</a>.`;

    document.getElementById("clientTxt").innerHTML = content;
    
  })
  
});
