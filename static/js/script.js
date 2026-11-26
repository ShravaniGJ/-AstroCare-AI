// ==================================================
// ASTROCARE AI - COMPLETE FRONTEND JAVASCRIPT
// Replace the entire contents of static/js/script.js with this file.
// ==================================================

"use strict";

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
            value === null || value === undefined ? "N/A" : value;
    }
}

function getNumber(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number = parseFloat(String(value).replace(/,/g, "").trim());
    return Number.isFinite(number) ? number : null;
}

function formatValue(value) {
    if (value === null || value === undefined || value === "") {
        return "Not recorded";
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return value.toLocaleString("en-IN", {
            maximumFractionDigits: 2
        });
    }

    return String(value);
}

function formatWithUnit(value, unit) {
    return value === null || value === undefined || value === ""
        ? "Not recorded"
        : `${formatValue(value)} ${unit}`;
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
    if (!value) return "Date unavailable";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString("en-IN", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

async function readJsonResponse(response) {
    const text = await response.text();

    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok) {
        throw new Error(
            data.error || data.message || `Request failed (${response.status})`
        );
    }

    return data;
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
    const navLinks = document.querySelectorAll(".nav-link");
    const pages = document.querySelectorAll(".page-section");

    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            const targetPage = this.dataset.page;
            if (!targetPage) return;

            const selectedPage =
                document.getElementById("page-" + targetPage);

            if (!selectedPage) return;

            pages.forEach(page => page.classList.remove("active"));
            navLinks.forEach(nav => nav.classList.remove("active"));

            selectedPage.classList.add("active");
            this.classList.add("active");

            setText("page-title", pageTitles[targetPage] || targetPage);

            if (targetPage === "vitals" || targetPage === "radiation") {
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
            `${API_BASE}/api/health/${ASTRONAUT_ID}`,
            { cache: "no-store" }
        );

        const data = await readJsonResponse(response);

        if (!Array.isArray(data)) {
            throw new Error("Invalid health records received.");
        }

        latestHealthData = data;

        updateHealthDashboard(data);
        updateHealthReports(data);
        updateHistory(data);
        updateHealthCharts(data);

        return data;
    } catch (error) {
        console.error("Health Data Error:", error);
        setText("health-status", "Health Data Unavailable");
        throw error;
    }
}

// ==================================================
// 5. UPDATE DASHBOARD
// ==================================================

function updateHealthDashboard(data) {
    if (!Array.isArray(data) || data.length === 0) {
        ["heart-rate", "oxygen", "temperature", "blood-pressure", "radiation",
         "radiation-detail", "sleep", "sleep-detail", "exercise-minutes",
         "bone-density", "bone-loss-risk", "muscle-strength", "muscle-mass",
         "wbc-count", "inflammation-level", "vital-heart-rate", "vital-oxygen",
         "vital-temperature", "vital-blood-pressure", "stress-level"]
            .forEach(id => setText(id, "No reading yet"));
        setText("vital-recorded-at", "Enter a reading or add one demo sample.");
        setText("reading-source", "No health readings have been recorded yet.");
        return;
    }

    const latest = data[0];
    const radiation =
        latest.radiation_level ?? latest.radiation_msv;
    const sourceLabel = latest.data_source === "demo"
        ? "Latest reading: synthetic demo sample."
        : latest.data_source === "manual"
            ? "Latest reading: manually entered sample."
            : "Latest reading source: legacy record (not labeled).";
    setText("reading-source", sourceLabel);

    setText("heart-rate", formatWithUnit(latest.heart_rate, "BPM"));
    setText("oxygen", formatWithUnit(latest.spo2, "%"));
    setText("temperature", formatWithUnit(latest.temperature, "°C"));
    setText("blood-pressure", formatValue(latest.blood_pressure));

    setText("radiation", formatWithUnit(radiation, "mSv"));
    setText("radiation-detail", formatWithUnit(radiation, "mSv"));

    setText("sleep", formatWithUnit(latest.sleep_hours, "hours"));
    setText("sleep-detail", formatWithUnit(latest.sleep_hours, "hours"));
    setText("exercise-minutes", formatWithUnit(latest.exercise_minutes, "min"));

    setText("bone-density", formatValue(latest.bone_density));
    setText("bone-loss-risk", formatWithUnit(latest.bone_loss_risk, "%"));

    setText("muscle-strength", formatValue(latest.muscle_strength));
    setText("muscle-mass", formatValue(latest.muscle_mass));

    setText("wbc-count", formatValue(latest.wbc_count));
    setText("inflammation-level", formatValue(latest.inflammation_level));

    setText("vital-heart-rate", formatWithUnit(latest.heart_rate, "BPM"));
    setText("vital-oxygen", formatWithUnit(latest.spo2, "%"));
    setText("vital-temperature", formatWithUnit(latest.temperature, "°C"));
    setText("vital-blood-pressure", formatValue(latest.blood_pressure));
    setText(
        "vital-recorded-at",
        "Last recorded: " + formatDate(latest.recorded_at)
    );

    setText("stress-level", formatWithUnit(latest.stress_level, "/ 10"));

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
            duration: 350
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
                    maxTicksLimit: 8,
                    maxRotation: 0
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
// 7. CREATE AND UPDATE CHARTS
// ==================================================

function createHealthChart(canvasId, label, color) {
    const canvas = document.getElementById(canvasId);

    if (!canvas || typeof Chart === "undefined") {
        console.warn("Chart canvas or Chart.js not found:", canvasId);
        return null;
    }

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
        delete chartInstances[canvasId];
    }

    const context = canvas.getContext("2d");

    chartInstances[canvasId] = new Chart(context, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
                borderColor: color,
                backgroundColor: color + "22",
                borderWidth: 2,
                fill: true,
                tension: 0.35,
                pointRadius: 2,
                pointHoverRadius: 5
            }]
        },
        options: getChartOptions()
    });

    return chartInstances[canvasId];
}

function initializeCharts() {
    createHealthChart("heartRateChart", "Heart Rate (BPM)", "#ef4444");
    createHealthChart("oxygenChart", "Oxygen Level (%)", "#3b82f6");
    createHealthChart("radiationChart", "Radiation (mSv)", "#a855f7");
    createHealthChart("boneDensityChart", "Bone Density", "#14b8a6");
    createHealthChart("muscleStrengthChart", "Muscle Strength", "#f59e0b");
    createHealthChart("wbcChart", "WBC Count", "#22c55e");
    createHealthChart("inflammationChart", "Inflammation", "#ec4899");
    createHealthChart("exerciseChart", "Exercise (Minutes)", "#06b6d4");
}

function getChartValue(record, key) {
    if (!record) return null;

    if (key === "radiation_level") {
        return getNumber(
            record.radiation_level ?? record.radiation_msv
        );
    }

    return getNumber(record[key]);
}

function updateSingleChart(canvasId, records, key) {
    const chart = chartInstances[canvasId];

    if (!chart || !Array.isArray(records)) return;

    // API is expected to return newest record first.
    // Reverse the records to display old-to-new on the chart.
    const orderedRecords = records.slice(0, 50).reverse();

    chart.data.labels = orderedRecords.map((record, index) => {
        if (record.recorded_at) {
            const date = new Date(record.recorded_at);

            if (!Number.isNaN(date.getTime())) {
                return date.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                });
            }
        }

        return `Reading ${index + 1}`;
    });

    chart.data.datasets[0].data = orderedRecords.map(record =>
        getChartValue(record, key)
    );

    chart.update("none");
}

function updateHealthCharts(records) {
    if (!Array.isArray(records)) return;

    updateSingleChart("heartRateChart", records, "heart_rate");
    updateSingleChart("oxygenChart", records, "spo2");
    updateSingleChart("radiationChart", records, "radiation_level");
    updateSingleChart("boneDensityChart", records, "bone_density");
    updateSingleChart("muscleStrengthChart", records, "muscle_strength");
    updateSingleChart("wbcChart", records, "wbc_count");
    updateSingleChart("inflammationChart", records, "inflammation_level");
    updateSingleChart("exerciseChart", records, "exercise_minutes");
}

function resizeAllCharts() {
    Object.values(chartInstances).forEach(chart => {
        if (chart) {
            chart.resize();
            chart.update("none");
        }
    });
}

// ==================================================
// 8. HEALTH REPORTS
// ==================================================

function updateHealthReports(records) {
    if (!Array.isArray(records) || records.length === 0) return;

    const latest = records[0];

    setText("report-heart-rate", formatValue(latest.heart_rate));
    setText("report-spo2", formatValue(latest.spo2));
    setText("report-temperature", formatValue(latest.temperature));
    setText(
        "report-radiation",
        formatValue(latest.radiation_level ?? latest.radiation_msv)
    );
    setText("report-bone-density", formatValue(latest.bone_density));
    setText("report-muscle-strength", formatValue(latest.muscle_strength));
    setText("report-wbc", formatValue(latest.wbc_count));
    setText("report-inflammation", formatValue(latest.inflammation_level));
    setText("report-exercise", formatValue(latest.exercise_minutes));
    setText("report-sleep", formatValue(latest.sleep_hours));
    setText("report-date", formatDate(latest.recorded_at));
}

// ==================================================
// 9. HISTORY TABLE
// ==================================================

function updateHistory(records) {
    const tableBody =
        document.getElementById("history-table-body") ||
        document.getElementById("historyTableBody");

    if (!tableBody || !Array.isArray(records)) return;

    if (records.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10">No health records available.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = records.slice(0, 50).map(record => `
        <tr>
            <td>${escapeHTML(formatDate(record.recorded_at))}</td>
            <td>${escapeHTML(formatValue(record.heart_rate))}</td>
            <td>${escapeHTML(formatValue(record.spo2))}</td>
            <td>${escapeHTML(formatValue(record.temperature))}</td>
            <td>${escapeHTML(formatValue(
                record.radiation_level ?? record.radiation_msv
            ))}</td>
            <td>${escapeHTML(formatValue(record.bone_density))}</td>
            <td>${escapeHTML(formatValue(record.muscle_strength))}</td>
            <td>${escapeHTML(formatValue(record.wbc_count))}</td>
            <td>${escapeHTML(formatValue(record.inflammation_level))}</td>
            <td>${escapeHTML(formatValue(record.exercise_minutes))}</td>
        </tr>
    `).join("");
}

// ==================================================
// 10. AI HEALTH ANALYSIS
// ==================================================

async function fetchAIAnalysis() {
    try {
        const response = await fetch(
            `${API_BASE}/api/alerts/${ASTRONAUT_ID}`,
            { cache: "no-store" }
        );

        if (response.status === 404) {
            latestAIData = null;
            setText("health-status", "Awaiting first reading");
            setText("ai-result", "Enter health data or add one demo sample to see the educational analysis.");
            setText("ai-detail-result", "Enter health data or add one demo sample to see the educational analysis.");
            setText("anomaly-score", "No model score until a reading is available.");
            setText("ai-detail-score", "No model score until a reading is available.");
            return null;
        }
        const data = await readJsonResponse(response);
        latestAIData = data;

        updateAIAnalysis(data);
        return data;
    } catch (error) {
        console.error("AI Analysis Error:", error);
        setText("ai-status", "AI analysis unavailable");
        throw error;
    }
}

function updateAIAnalysis(data) {
    if (!data) return;

    const analysis = data.analysis || data;
    latestAIData = { analysis };
    const alerts = Array.isArray(analysis.alerts) ? analysis.alerts : [];
    const recommendations = Array.isArray(analysis.recommendations)
        ? analysis.recommendations : [];

    const setList = (id, items, emptyMessage) => {
        const container = document.getElementById(id);
        if (!container) return;
        container.innerHTML = items.length
            ? items.map(item => `<p class="alert-item">${escapeHTML(item)}</p>`).join("")
            : `<p>${escapeHTML(emptyMessage)}</p>`;
    };

    const status = analysis.status || "Status unavailable";
    const result = analysis.ai_result || "Analysis unavailable";
    ["health-status", "ai-detail-status"].forEach(id => setText(id, status));
    ["ai-result", "ai-detail-result"].forEach(id => setText(id, result));
    setList("ai-alerts", alerts, "No threshold alerts in this sample.");
    setList("ai-detail-alerts", alerts, "No threshold alerts in this sample.");
    setList("ai-detail-recommendations", recommendations, "No follow-up suggestions.");

    const score = getNumber(analysis.anomaly_score);
    const scoreText = score !== null
        ? `Model anomaly score: ${score.toFixed(3)}. Negative values indicate the model flagged an unusual pattern; this is not a probability.`
        : "Model anomaly score unavailable.";
    setText("anomaly-score", scoreText);
    setText("ai-detail-score", scoreText);

    const missing = analysis.missing_optional_fields || [];
    const qualityText = missing.length
        ? `Data quality: ${missing.length} optional reading${missing.length === 1 ? " is" : "s are"} missing; the model used demonstration defaults for its estimate.`
        : "Data quality: all supported readings were provided.";
    setText("ai-data-quality", qualityText);
    setText("ai-disclaimer", analysis.disclaimer || "Educational simulation only; not a medical diagnosis.");
    setText("ai-detail-disclaimer", analysis.disclaimer || "Educational simulation only; not a medical diagnosis.");
    setText("ai-status", "Analysis updated");
    updateHealthStatusBadges();
}
// ==================================================
// 15. DASHBOARD REFRESH
// ==================================================

async function initializeDashboard() {
    if (refreshInProgress) return;

    refreshInProgress = true;

    try {
        const results = await Promise.allSettled([
            fetchHealthData(),
            fetchAIAnalysis()
        ]);

        results.forEach((result, index) => {
            if (result.status === "rejected") {
                console.error(
                    index === 0
                        ? "Health refresh failed:"
                        : "AI refresh failed:",
                    result.reason
                );
            }
        });

        setText("last-updated", "Last updated: " + new Date().toLocaleTimeString());
    } finally {
        refreshInProgress = false;
    }
}

// ==================================================
// 17. MANUAL REFRESH BUTTON
// ==================================================

function initializeRefreshButton() {
    const refreshButton =
        document.getElementById("refresh-button") ||
        document.getElementById("refreshButton");

    if (!refreshButton) return;

    refreshButton.addEventListener("click", async function () {
        this.disabled = true;

        try {
            await initializeDashboard();
        } finally {
            this.disabled = false;
        }
    });
}

// ==================================================
// 18. DOWNLOAD REPORT
// ==================================================

function initializeReportDownload() {
    const downloadButton =
        document.getElementById("download-report") ||
        document.getElementById("downloadReport");

    if (!downloadButton) return;

    downloadButton.addEventListener("click", function () {
        if (!latestHealthData.length) {
            alert("No health records available to download.");
            return;
        }

        const headers = [
            "Recorded At",
            "Data Source",
            "Heart Rate",
            "SpO2",
            "Temperature",
            "Radiation",
            "Sleep Hours",
            "Exercise Minutes",
            "Bone Density",
            "Muscle Strength",
            "WBC Count",
            "Inflammation Level"
        ];

        const rows = latestHealthData.map(record => [
            record.recorded_at,
            record.data_source || "legacy",
            record.heart_rate,
            record.spo2,
            record.temperature,
            record.radiation_level ?? record.radiation_msv,
            record.sleep_hours,
            record.exercise_minutes,
            record.bone_density,
            record.muscle_strength,
            record.wbc_count,
            record.inflammation_level
        ]);

        const csv = [
            headers,
            ...rows
        ].map(row =>
            row.map(value =>
                `"${String(value ?? "").replace(/"/g, '""')}"`
            ).join(",")
        ).join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "astrocare-health-report.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });
}
function updateHealthStatusBadges() {
    const ids = ["health-status", "ai-detail-status"];
    const status = String(
        latestAIData?.analysis?.status || ""
    ).toLowerCase();

    let category = "unknown";
    let label = "Status unavailable";
    let icon = "⚪";

    if (status.includes("critical") || status.includes("high risk")) {
        category = "critical";
        label = "Critical Health Alert";
        icon = "🔴";
    } else if (status.includes("warning") || status.includes("moderate")) {
        category = "warning";
        label = "Health Warning";
        icon = "🟡";
    } else if (
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

        let badge = document.getElementById(id + "-badge");

        if (!badge) {
            badge = document.createElement("div");
            badge.id = id + "-badge";
            heading.insertAdjacentElement("afterend", badge);
        }

        badge.className = "health-status-badge " + category;
        badge.textContent = icon + " " + label;
    });
}

// ==================================================
// 16. HEALTH PROGRESS INDICATORS
// ==================================================

function createHealthProgress(elementId, title, maximum, unit, note) {
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

    const value = getNumber(element.textContent);

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
    } else if (percentage >= 40) {
        level = "medium";
    }

    container.innerHTML = `
        <div class="health-progress-header">
            <span>${escapeHTML(title)}</span>
            <strong>${escapeHTML(value)}${escapeHTML(unit)}</strong>
        </div>
        <div class="health-progress-track">
            <div class="health-progress-fill ${level}"
                 style="width: ${percentage}%"></div>
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
    const form = document.getElementById("health-entry-form");
    if (!form || form.dataset.initialized === "true") return;

    form.dataset.initialized = "true";

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const button = document.getElementById("submit-health-data");
        const message = document.getElementById("form-message");

        if (!form.reportValidity()) return;

        const valueOf = id => {
            const element = document.getElementById(id);
            return element ? element.value : "";
        };

        const payload = {
            astronaut_id: ASTRONAUT_ID,
            data_source: "manual",
            heart_rate: Number(valueOf("input-heart-rate")),
            spo2: Number(valueOf("input-spo2")),
            temperature: Number(valueOf("input-temperature")),
            blood_pressure: valueOf("input-blood-pressure"),
            radiation_msv: Number(valueOf("input-radiation")),
            sleep_hours: Number(valueOf("input-sleep")),
            stress_level: Number(valueOf("input-stress")),
            bone_density: Number(valueOf("input-bone-density")),
            bone_loss_risk: Number(valueOf("input-bone-risk")),
            muscle_strength: Number(valueOf("input-muscle-strength")),
            muscle_mass: Number(valueOf("input-muscle-mass")),
            exercise_minutes: Number(valueOf("input-exercise")),
            wbc_count: Number(valueOf("input-wbc")),
            inflammation_level: Number(valueOf("input-inflammation"))
        };

        const numericValues = Object.entries(payload).filter(
            ([key]) =>
                key !== "astronaut_id" &&
                key !== "data_source" &&
                key !== "blood_pressure"
        );

        const invalidNumber = numericValues.some(
            ([, value]) => !Number.isFinite(value)
        );

        if (invalidNumber) {
            if (message) {
                message.textContent = "Please enter valid numeric values.";
            }
            return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = "Saving...";
        }

        if (message) message.textContent = "Submitting health data...";

        try {
            const response = await fetch(`${API_BASE}/api/health`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await readJsonResponse(response);

            if (message) {
                message.textContent =
                    "✅ " + (result.message || "Health data saved successfully");
                message.style.color = "#4ade80";
            }

            form.reset();
            await initializeDashboard();
        } catch (error) {
            console.error("Health Submission Error:", error);

            if (message) {
                message.textContent = "❌ " + error.message;
                message.style.color = "#fb7185";
            }
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "💾 Save Health Data";
            }
        }
    });
}

// ==================================================
// 19. EXPLICIT DEMO READING
// ==================================================

function initializeDemoReadingButton() {
    const button = document.getElementById("demo-reading-button");
    const message = document.getElementById("demo-reading-message");
    if (!button) return;

    button.addEventListener("click", async function () {
        button.disabled = true;
        button.textContent = "Creating sample…";
        if (message) message.textContent = "Saving one synthetic sample…";

        const vary = (base, spread, digits = 1) => Number(
            (base + (Math.random() * 2 - 1) * spread).toFixed(digits)
        );
        const payload = {
            astronaut_id: ASTRONAUT_ID,
            data_source: "demo",
            heart_rate: Math.round(vary(76, 5, 0)),
            spo2: vary(98, 0.8),
            temperature: vary(36.8, 0.25),
            blood_pressure: `${Math.round(vary(120, 5, 0))}/${Math.round(vary(80, 4, 0))}`,
            radiation_msv: vary(0.42, 0.08, 2),
            sleep_hours: vary(7.2, 0.4),
            stress_level: Math.round(vary(4, 1)),
            bone_density: vary(1.2, 0.025, 3),
            bone_loss_risk: vary(12, 2),
            muscle_strength: vary(85, 4),
            muscle_mass: vary(42, 1.5),
            exercise_minutes: Math.round(vary(35, 8, 0)),
            wbc_count: vary(7.2, 0.5),
            inflammation_level: vary(2.5, 0.6)
        };

        try {
            const response = await fetch(`${API_BASE}/api/health`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            await readJsonResponse(response);
            await initializeDashboard();
            if (message) message.textContent =
                "One synthetic sample was saved. It is labeled demo data.";
        } catch (error) {
            console.error("Demo reading error:", error);
            if (message) message.textContent =
                "Could not save sample: " + error.message;
        } finally {
            button.disabled = false;
            button.textContent = "＋ Add demo reading";
        }
    });
}

// ==================================================
// 20. START APPLICATION
// ==================================================

document.addEventListener("DOMContentLoaded", async function () {
    updateDateTime();
    initializeNavigation();
    initializeCharts();
    initializeHealthForm();
    initializeRefreshButton();
    initializeReportDownload();
    initializeDemoReadingButton();

    setInterval(updateDateTime, 1000);
    await initializeDashboard();
    // Refresh displays without creating or saving new readings.
    setInterval(initializeDashboard, 30000);
});
