// ==================================================
// ASTROCARE AI
// COMPLETE FRONTEND JAVASCRIPT
// ==================================================

// CONFIGURATION

const ASTRONAUT_ID = "ASTRO-001";

const API_BASE = "";

let latestHealthData = [];

let latestAIData = null;

const chartInstances = {};

let refreshInProgress = false;

// ==================================================
// 1. HELPER FUNCTIONS
// ==================================================

function setText(id, value) {

const element = document.getElementById(id);
if (element) {
    element.textContent =
        value === null || value === undefined
            ? "N/A"
            : value;
}

}

function getNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number = parseFloat(
        String(value).replace(/,/g, "").trim()
    );

    return Number.isFinite(number)
        ? number
        : null;
}


function formatValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "N/A";
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return value.toLocaleString("en-IN", {
            maximumFractionDigits: 2
        });
    }

    return String(value);
}

function escapeHTML(value) {

return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

function formatDate(value) {

if (!value) {
    return "Date unavailable";
}
const date = new Date(value);
if (Number.isNaN(date.getTime())) {
    return String(value);
}
return date.toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "short"
});

}

// ==================================================
// 2. DATE AND TIME
// ==================================================

function updateDateTime() {

const now = new Date();
setText(
    "date-time",
    "🕒 " + now.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "medium"
    })
);

}

// ==================================================
// 3. NAVIGATION
// ==================================================

const pageTitles = {

dashboard: "Astronaut Health Dashboard",
entry: "Enter Health Data",
vitals: "Vital Signs Monitoring",
radiation: "Radiation Monitoring",
sleep: "Sleep Monitoring",
mental: "Mental Health Monitoring",
ai: "AI Health Analysis",
reports: "Health Reports",
settings: "Settings"

};

function initializeNavigation() {

const navLinks =
    document.querySelectorAll(".nav-link");
const pages =
    document.querySelectorAll(".page-section");
navLinks.forEach(link => {
    link.addEventListener("click", function(event) {
        event.preventDefault();
        const targetPage = this.dataset.page;
        if (!targetPage) return;
        const selectedPage =
            document.getElementById("page-" + targetPage);
        if (!selectedPage) return;
        pages.forEach(page => {
            page.classList.remove("active");
        });
        navLinks.forEach(nav => {
            nav.classList.remove("active");
        });
        selectedPage.classList.add("active");
        this.classList.add("active");
        setText(
            "page-title",
            pageTitles[targetPage]
        );
        if (
            targetPage === "vitals" ||
            targetPage === "radiation"
        ) {
            setTimeout(resizeAllCharts, 250);
        }
    });
});

}

// ==================================================
// 4. FETCH HEALTH HISTORY
// ==================================================

async function fetchHealthData() {

try {
    const response = await fetch(
        `${API_BASE}/api/health/${ASTRONAUT_ID}`
    );
    if (!response.ok) {
        throw new Error(
            "Health API error: " + response.status
        );
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error(
            "Invalid health records received."
        );
    }
    latestHealthData = data;
    updateHealthDashboard(data);
    updateHealthReports(data);
    updateHistory(data);
    updateHealthCharts(data);
}
catch (error) {
    console.error(
        "Health Data Error:",
        error
    );
    setText(
        "health-status",
        "Health Data Unavailable"
    );
}

}

// ==================================================
// 5. UPDATE DASHBOARD
// ==================================================

function updateHealthDashboard(data) {

if (!Array.isArray(data) || data.length === 0) {
    return;
}
// Latest record
const latest = data[0];
// BASIC VITALS
setText(
    "heart-rate",
    formatValue(latest.heart_rate) + " BPM"
);
setText(
    "oxygen",
    formatValue(latest.spo2) + "%"
);
setText(
    "temperature",
    formatValue(latest.temperature) + " °C"
);
setText(
    "blood-pressure",
    formatValue(latest.blood_pressure)
);
// RADIATION
setText(
    "radiation",
    formatValue(latest.radiation_level) + " mSv"
);
setText(
    "radiation-detail",
    formatValue(latest.radiation_level) + " mSv"
);
// SLEEP
setText(
    "sleep",
    formatValue(latest.sleep_hours) + " Hours"
);
setText(
    "sleep-detail",
    formatValue(latest.sleep_hours) + " Hours"
);
// EXERCISE
setText(
    "exercise-minutes",
    formatValue(latest.exercise_minutes) + " min"
);
// BONE HEALTH
setText(
    "bone-density",
    formatValue(latest.bone_density)
);
setText(
    "bone-loss-risk",
    formatValue(latest.bone_loss_risk) + " %"
);
// MUSCLE HEALTH
setText(
    "muscle-strength",
    formatValue(latest.muscle_strength)
);
setText(
    "muscle-mass",
    formatValue(latest.muscle_mass)
);
// IMMUNE HEALTH
setText(
    "wbc-count",
    formatValue(latest.wbc_count)
);
setText(
    "inflammation-level",
    formatValue(latest.inflammation_level)
);
// VITALS PAGE
setText(
    "vital-heart-rate",
    formatValue(latest.heart_rate) + " BPM"
);
setText(
    "vital-oxygen",
    formatValue(latest.spo2) + "%"
);
setText(
    "vital-temperature",
    formatValue(latest.temperature) + " °C"
);
setText(
    "vital-blood-pressure",
    formatValue(latest.blood_pressure)
);
setText(
    "vital-recorded-at",
    "Last recorded: " + formatDate(latest.recorded_at)
);
// MENTAL HEALTH
setText(
    "stress-level",
    formatValue(latest.stress_level) + " / 10"
);
// VISUAL INDICATORS
updateVisualHealthIndicators();

}

// ==================================================
// 6. CHART OPTIONS
// ==================================================

function getChartOptions() {

return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: "index"
    },
    animation: {
        duration: 400
    },
    plugins: {
        legend: {
            display: true,
            position: "top",
            labels: {
                color: "#cbd5e1",
                usePointStyle: true,
                padding: 15
            }
        },
        tooltip: {
            enabled: true,
            backgroundColor: "#0b192d",
            titleColor: "#38bdf8",
            bodyColor: "#ffffff",
            borderColor: "#38bdf8",
            borderWidth: 1
        }
    },
    scales: {
        x: {
            grid: {
                color: "rgba(148,163,184,0.08)"
            },
            ticks: {
                color: "#94a3b8",
                maxTicksLimit: 8
            }
        },
        y: {
            beginAtZero: false,
            grid: {
                color: "rgba(148,163,184,0.12)"
            },
            ticks: {
                color: "#94a3b8"
            }
        }
    }
};

}

// ==================================================
// 7. CREATE OR UPDATE CHART
// ==================================================

function createOrUpdateChart(

canvasId,
labels,
values,
chartTitle,
chartColor

) {

const canvas = document.getElementById(canvasId);
if (!canvas || typeof Chart === "undefined") {
    return;
}
const dataset = {
    label: chartTitle,
    data: values,
    borderColor: chartColor,
    backgroundColor: chartColor + "22",
    borderWidth: 3,
    tension: 0.35,
    fill: true,
    pointRadius: 3,
    pointHoverRadius: 7,
    pointBackgroundColor: chartColor,
    pointBorderColor: "#0b1120",
    pointBorderWidth: 2
};
if (chartInstances[canvasId]) {
    const chart = chartInstances[canvasId];
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.data.datasets[0].label = chartTitle;
    chart.update("none");
    return;
}
chartInstances[canvasId] = new Chart(canvas, {
    type: "line",
    data: {
        labels: labels,
        datasets: [dataset]
    },
    options: getChartOptions()
});

}

// ==================================================
// 8. UPDATE ALL CHARTS
// ==================================================

function updateHealthCharts(data) {

if (typeof Chart === "undefined") {
    console.error("Chart.js not loaded.");
    return;
}
if (!Array.isArray(data) || data.length === 0) {
    return;
}
const records = [...data]
    .slice(0, 50)
    .reverse();
const labels = records.map(record =>
    formatDate(record.recorded_at)
);
const chartDefinitions = [
    {
        id: "heartRateChart",
        field: "heart_rate",
        title: "Heart Rate (BPM)",
        color: "#38bdf8"
    },
    {
        id: "oxygenChart",
        field: "spo2",
        title: "Blood Oxygen (%)",
        color: "#818cf8"
    },
    {
        id: "radiationChart",
        field: "radiation_level",
        title: "Radiation Exposure (mSv)",
        color: "#c084fc"
    },
    {
        id: "boneDensityChart",
        field: "bone_density",
        title: "Bone Density",
        color: "#4ade80"
    },
    {
        id: "muscleStrengthChart",
        field: "muscle_strength",
        title: "Muscle Strength",
        color: "#fb923c"
    },
    {
        id: "wbcChart",
        field: "wbc_count",
        title: "WBC Count",
        color: "#22d3ee"
    },
    {
        id: "inflammationChart",
        field: "inflammation_level",
        title: "Inflammation Level",
        color: "#fb7185"
    },
    {
        id: "exerciseChart",
        field: "exercise_minutes",
        title: "Exercise Minutes",
        color: "#60a5fa"
    }
];
chartDefinitions.forEach(definition => {
    const values = records.map(record =>
        getNumber(record[definition.field])
    );
    createOrUpdateChart(
        definition.id,
        labels,
        values,
        definition.title,
        definition.color
    );
});

}

// ==================================================
// 9. RESIZE CHARTS
// ==================================================

function resizeAllCharts() {

Object.values(chartInstances).forEach(chart => {
    if (chart) {
        chart.resize();
    }
});

}

// ==================================================
// 10. HISTORY LISTS
// ==================================================

function createHistoryList(data, field, unit) {

if (!data.length) {
    return "<p>No records available.</p>";
}
return `
    <h3 class="history-heading">
        Recent Records
    </h3>
    <div class="history-list">
        ${data.slice(0, 10).map(record => `
            <div class="history-item">
                <span>
                    ${escapeHTML(formatDate(record.recorded_at))}
                </span>
                <strong>
                    ${escapeHTML(formatValue(record[field]))}
                    ${escapeHTML(unit)}
                </strong>
            </div>
        `).join("")}
    </div>
`;

}

function updateHistory(data) {

const radiationHistory =
    document.getElementById("radiation-history");
const sleepHistory =
    document.getElementById("sleep-history");
const stressHistory =
    document.getElementById("stress-history");
if (radiationHistory) {
    radiationHistory.innerHTML = createHistoryList(
        data,
        "radiation_level",
        "mSv"
    );
}
if (sleepHistory) {
    sleepHistory.innerHTML = createHistoryList(
        data,
        "sleep_hours",
        "Hours"
    );
}
if (stressHistory) {
    stressHistory.innerHTML = createHistoryList(
        data,
        "stress_level",
        "/ 10"
    );
}

}

// ==================================================
// 11. HEALTH REPORTS
// ==================================================

function updateHealthReports(data) {

const container =
    document.getElementById("health-records");
if (!container) return;
if (!data.length) {
    container.textContent = "No health records available.";
    return;
}
const columns = [
    ["recorded_at", "Date"],
    ["heart_rate", "Heart Rate"],
    ["blood_pressure", "Blood Pressure"],
    ["spo2", "SpO2"],
    ["temperature", "Temperature"],
    ["radiation_level", "Radiation"],
    ["sleep_hours", "Sleep"],
    ["stress_level", "Stress"],
    ["bone_density", "Bone Density"],
    ["bone_loss_risk", "Bone Loss Risk"],
    ["muscle_strength", "Muscle Strength"],
    ["muscle_mass", "Muscle Mass"],
    ["exercise_minutes", "Exercise"],
    ["wbc_count", "WBC Count"],
    ["inflammation_level", "Inflammation"]
];
const table = document.createElement("div");
table.className = "table-wrapper";
const tableElement = document.createElement("table");
const thead = document.createElement("thead");
const headerRow = document.createElement("tr");
columns.forEach(column => {
    const th = document.createElement("th");
    th.textContent = column[1];
    headerRow.appendChild(th);
});
thead.appendChild(headerRow);
tableElement.appendChild(thead);
const tbody = document.createElement("tbody");
data.slice(0, 100).forEach(record => {
    const row = document.createElement("tr");
    columns.forEach(column => {
        const td = document.createElement("td");
        let value = record[column[0]];
        if (column[0] === "recorded_at") {
            value = formatDate(value);
        }
        td.textContent = formatValue(value);
        row.appendChild(td);
    });
    tbody.appendChild(row);
});
tableElement.appendChild(tbody);
table.appendChild(tableElement);
container.replaceChildren(table);

}

// ==================================================
// 12. FETCH AI ANALYSIS
// ==================================================

async function fetchAIAnalysis() {

try {
    const response = await fetch(
        `${API_BASE}/api/alerts/${ASTRONAUT_ID}`
    );
    if (!response.ok) {
        throw new Error(
            "AI API error: " + response.status
        );
    }
    const data = await response.json();
    latestAIData = data;
    updateAIAnalysis(data);
    updateVisualHealthIndicators();
}
catch (error) {
    console.error(
        "AI Analysis Error:",
        error
    );
    setText(
        "health-status",
        "AI Analysis Unavailable"
    );
    setText(
        "ai-detail-status",
        "AI Analysis Unavailable"
    );
}

}

// ==================================================
// 13. UPDATE AI ANALYSIS
// ==================================================

function updateAIAnalysis(data) {

const analysis = data?.analysis;
if (!analysis) {
    setText(
        "health-status",
        "No AI Analysis Available"
    );
    return;
}
// DASHBOARD
setText(
    "health-status",
    "Overall Health Status: " + formatValue(analysis.status)
);
setText(
    "ai-result",
    formatValue(analysis.ai_result)
);
renderList(
    "ai-alerts",
    analysis.alerts
);
renderList(
    "ai-recommendations",
    analysis.recommendations
);
setText(
    "anomaly-score",
    "Anomaly Score: " + formatValue(analysis.anomaly_score)
);
setText(
    "ai-disclaimer",
    formatValue(analysis.disclaimer)
);
// AI PAGE
setText(
    "ai-detail-status",
    "Overall Health Status: " + formatValue(analysis.status)
);
setText(
    "ai-detail-result",
    formatValue(analysis.ai_result)
);
renderList(
    "ai-detail-alerts",
    analysis.alerts
);
renderList(
    "ai-detail-recommendations",
    analysis.recommendations
);
setText(
    "ai-detail-score",
    "Anomaly Score: " + formatValue(analysis.anomaly_score)
);
setText(
    "ai-detail-disclaimer",
    formatValue(analysis.disclaimer)
);

}

// ==================================================
// 14. RENDER AI LISTS
// ==================================================

function renderList(elementId, items) {

const container =
    document.getElementById(elementId);
if (!container) return;
container.replaceChildren();
if (!Array.isArray(items) || items.length === 0) {
    const paragraph = document.createElement("p");
    paragraph.textContent = "No items available.";
    container.appendChild(paragraph);
    return;
}
const heading = document.createElement("ul");
items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = String(item);
    heading.appendChild(li);
});
container.appendChild(heading);

}

// ==================================================
// 15. HEALTH STATUS BADGES
// ==================================================

function updateHealthStatusBadges() {

const ids = [
    "health-status",
    "ai-detail-status"
];
const status = String(
    latestAIData?.analysis?.status || ""
).toLowerCase();
let category = "unknown";
let label = "Status unavailable";
let icon = "⚪";
if (
    status.includes("critical") ||
    status.includes("high risk")
) {
    category = "critical";
    label = "Critical Health Alert";
    icon = "🔴";
}
else if (
    status.includes("warning") ||
    status.includes("moderate")
) {
    category = "warning";
    label = "Health Warning";
    icon = "🟡";
}
else if (
    status.includes("normal") ||
    status.includes("healthy") ||
    status.includes("low risk")
) {
    category = "normal";
    label = "Health Status Normal";
    icon = "🟢";
}
ids.forEach(id => {
    const heading = document.getElementById(id);
    if (!heading) return;
    let badge = document.getElementById(
        id + "-badge"
    );
    if (!badge) {
        badge = document.createElement("div");
        badge.id = id + "-badge";
        heading.insertAdjacentElement(
            "afterend",
            badge
        );
    }
    badge.className =
        "health-status-badge " + category;
    badge.textContent = icon + " " + label;
});

}

// ==================================================
// 16. HEALTH PROGRESS INDICATORS
// ==================================================

function createHealthProgress(

elementId,
title,
maximum,
unit,
note

) {

const element = document.getElementById(elementId);
if (!element) return;
const card = element.closest(".stat-card");
if (!card) return;
const progressId = elementId + "-progress";
let container = document.getElementById(progressId);
if (!container) {
    container = document.createElement("div");
    container.id = progressId;
    container.className = "health-progress";
    card.appendChild(container);
}
const value = getNumber(
    element.textContent
);
if (value === null) {
    container.textContent = title + ": Data unavailable";
    return;
}
const percentage = Math.min(
    100,
    Math.max(0, (value / maximum) * 100)
);
let level = "low";
if (percentage >= 70) {
    level = "high";
}
else if (percentage >= 40) {
    level = "medium";
}
container.innerHTML = `
    <div class="health-progress-header">
        <span>${escapeHTML(title)}</span>
        <strong>${escapeHTML(value)}${escapeHTML(unit)}</strong>
    </div>
    <div class="health-progress-track">
        <div
            class="health-progress-fill ${level}"
            style="width: ${percentage}%">
        </div>
    </div>
    <small class="health-progress-note">
        ${escapeHTML(note)}
    </small>
`;

}

// ==================================================
// 17. UPDATE VISUAL INDICATORS
// ==================================================

function updateVisualHealthIndicators() {

updateHealthStatusBadges();
createHealthProgress(
    "oxygen",
    "Blood Oxygen",
    100,
    "%",
    "Displayed relative to a 100% scale."
);
createHealthProgress(
    "bone-loss-risk",
    "Bone Loss Risk",
    100,
    "%",
    "Reported risk percentage."
);
createHealthProgress(
    "stress-level",
    "Stress Level",
    10,
    "/10",
    "Displayed relative to a 10-point scale."
);

}

// ==================================================
// 18. HEALTH DATA ENTRY FORM
// ==================================================

function initializeHealthForm() {

const form = document.getElementById(
    "health-entry-form"
);
if (!form) return;
form.addEventListener("submit", async function(event) {
    event.preventDefault();
    const button = document.getElementById(
        "submit-health-data"
    );
    const message = document.getElementById(
        "form-message"
    );
    if (!form.reportValidity()) {
        return;
    }
    const payload = {
        astronaut_id: ASTRONAUT_ID,
        heart_rate: Number(
            document.getElementById("input-heart-rate").value
        ),
        spo2: Number(
            document.getElementById("input-spo2").value
        ),
        temperature: Number(
            document.getElementById("input-temperature").value
        ),
        blood_pressure:
            document.getElementById("input-blood-pressure").value,
        radiation_msv: Number(
            document.getElementById("input-radiation").value
        ),
        sleep_hours: Number(
            document.getElementById("input-sleep").value
        ),
        stress_level: Number(
            document.getElementById("input-stress").value
        ),
        bone_density: Number(
            document.getElementById("input-bone-density").value
        ),
        bone_loss_risk: Number(
            document.getElementById("input-bone-risk").value
        ),
        muscle_strength: Number(
            document.getElementById("input-muscle-strength").value
        ),
        muscle_mass: Number(
            document.getElementById("input-muscle-mass").value
        ),
        exercise_minutes: Number(
            document.getElementById("input-exercise").value
        ),
        wbc_count: Number(
            document.getElementById("input-wbc").value
        ),
        inflammation_level: Number(
            document.getElementById("input-inflammation").value
        )
    };
    const numericValues = Object.entries(payload)
        .filter(([key]) => key !== "astronaut_id" && key !== "blood_pressure");
    const invalidNumber = numericValues.some(
        ([, value]) => !Number.isFinite(value)
    );
    if (invalidNumber) {
        message.textContent =
            "Please enter valid numeric values.";
        return;
    }
    button.disabled = true;
    button.textContent = "Saving...";
    message.textContent = "Submitting health data...";
    try {
        const response = await fetch(
            `${API_BASE}/api/health`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );
        const result = await response.json();
        if (!response.ok) {
            throw new Error(
                result.error || "Unable to save health data."
            );
        }
        message.textContent =
            "✅ " + result.message;
        message.style.color = "#4ade80";
        form.reset();
        await initializeDashboard();
    }
    catch (error) {
        console.error(
            "Health Submission Error:",
            error
        );
        message.textContent =
            "❌ " + error.message;
        message.style.color = "#fb7185";
    }
    finally {
        button.disabled = false;
        button.textContent = "💾 Save Health Data";
    }
});

}

// ==================================================
// 19. INITIALIZE DASHBOARD
// ==================================================

async function initializeDashboard() {

if (refreshInProgress) return;
refreshInProgress = true;
try {
    await Promise.all([
        fetchHealthData(),
        fetchAIAnalysis()
    ]);
}
finally {
    refreshInProgress = false;
}

}

// ==================================================
// 20. APPLICATION INITIALIZATION
// ==================================================

document.addEventListener("DOMContentLoaded", function() {

// DATE AND TIME
updateDateTime();
setInterval(
    updateDateTime,
    1000
);
// NAVIGATION
initializeNavigation();
// HEALTH FORM
initializeHealthForm();
// INITIAL DATA
initializeDashboard();
// AUTOMATIC REFRESH
setInterval(
    initializeDashboard,
    5000
);

});

// ==================================================
// END OF ASTROCARE AI
// ==================================================
