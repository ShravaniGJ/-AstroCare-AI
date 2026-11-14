// ===================================
// AstroCare AI - JavaScript
// ===================================


// 1. Display Current Date and Time

function updateDateTime() {

    const now = new Date();

    const dateTime = now.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium'
    });

    let clock = document.getElementById("date-time");

    if (!clock) {
        clock = document.createElement("p");
        clock.id = "date-time";

        const header = document.querySelector(".mission-info");

        if (header) {
            header.appendChild(clock);
        }
    }

    clock.textContent = "🕒 " + dateTime;
}

updateDateTime();

setInterval(updateDateTime, 1000);


// 2. Sidebar Navigation

const navigationLinks = document.querySelectorAll(".sidebar nav a");

navigationLinks.forEach(link => {

    link.addEventListener("click", function(event) {

        event.preventDefault();

        navigationLinks.forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");

    });

});


// 3. Welcome Message

console.log("Welcome to AstroCare AI!");

console.log("Astronaut Health Monitoring System Initialized.");


// 4. Dashboard Initialization

document.addEventListener("DOMContentLoaded", function() {

    console.log("Dashboard Loaded Successfully!");

});