
// ======================================
// RANDOM LINK GENERATOR
// ======================================

// CSV location
const CSV_FILE = "./links.csv";

// HTML elements
const randomButton = document.getElementById("randomButton");
const openButton = document.getElementById("openButton");

const result = document.getElementById("result");

const linkName = document.getElementById("linkName");
const linkURL = document.getElementById("linkURL");

const status = document.getElementById("status");

const totalLinks = document.getElementById("totalLinks");
const totalGenerated = document.getElementById("totalGenerated");

const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistory");


// Application data
let links = [];
let selectedLink = null;
let generatedCount = 0;


// ======================================
// CSV PARSER
// ======================================

function parseCSV(text) {

    const rows = [];

    let row = [];
    let field = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {

        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && insideQuotes && next === '"') {

            field += '"';
            i++;

        } else if (char === '"') {

            insideQuotes = !insideQuotes;

        } else if (char === "," && !insideQuotes) {

            row.push(field.trim());
            field = "";

        } else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (char === "\r" && next === "\n") {
                i++;
            }

            row.push(field.trim());

            if (row.some(value => value !== "")) {
                rows.push(row);
            }

            row = [];
            field = "";

        } else {

            field += char;

        }

    }

    if (field || row.length > 0) {

        row.push(field.trim());

        if (row.some(value => value !== "")) {
            rows.push(row);
        }

    }

    return rows;
}


// ======================================
// LOAD CSV
// ======================================

async function loadLinks() {

    try {

        status.textContent = "Loading your links...";

        const response = await fetch(
            CSV_FILE + "?t=" + Date.now()
        );

        if (!response.ok) {
            throw new Error("Could not load links.csv");
        }

        const csvText = await response.text();

        const rows = parseCSV(csvText);

        if (rows.length < 2) {
            throw new Error("Your CSV file has no links.");
        }

        // Find columns by header name
        const headers = rows[0].map(header =>
            header.replace(/^\uFEFF/, "").toLowerCase().trim()
        );

        const nameIndex = headers.indexOf("name");
        const urlIndex = headers.indexOf("url");

        if (nameIndex === -1 || urlIndex === -1) {
            throw new Error(
                "CSV must contain name and url columns."
            );
        }

        // Extract valid links
        links = rows.slice(1)

            .map(row => {

                const name = row[nameIndex]?.trim();
                const url = row[urlIndex]?.trim();

                return { name, url };

            })

            .filter(link => {

                if (!link.name || !link.url) {
                    return false;
                }

                try {

                    const parsedURL = new URL(link.url);

                    return (
                        parsedURL.protocol === "https:" ||
                        parsedURL.protocol === "http:"
                    );

                } catch {

                    return false;

                }

            });

        if (links.length === 0) {
            throw new Error("No valid links found.");
        }

        // Update statistics
        totalLinks.textContent = links.length;

        status.textContent = "Ready to discover something! ✨";

        randomButton.disabled = false;

    } catch (error) {

        console.error(error);

        status.textContent = error.message;

        randomButton.disabled = true;

    }

}


// ======================================
// RANDOM LINK GENERATOR
// ======================================

function generateRandomLink() {

    if (links.length === 0) {
        status.textContent = "No links available.";
        return;
    }

    // Select random link
    const randomIndex = Math.floor(
        Math.random() * links.length
    );

    selectedLink = links[randomIndex];

    // Display selected link
    linkName.textContent = selectedLink.name;

    linkURL.textContent = selectedLink.url;
    linkURL.href = selectedLink.url;

    // Display result
    result.classList.remove("hidden");

    status.textContent = "Your next destination is ready! 🎉";

    // Update generated count
    generatedCount++;

    totalGenerated.textContent = generatedCount;

    // Save to history
    saveToHistory(selectedLink);

}


// ======================================
// OPEN SELECTED WEBSITE
// ======================================

openButton.addEventListener("click", function() {

    if (!selectedLink) {
        return;
    }

    const url = new URL(selectedLink.url);

    if (
        url.protocol === "http:" ||
        url.protocol === "https:"
    ) {

        window.open(
            url.href,
            "_blank",
            "noopener,noreferrer"
        );

    }

});


// ======================================
// GENERATE BUTTON
// ======================================

randomButton.addEventListener(
    "click",
    generateRandomLink
);


// ======================================
// HISTORY MANAGEMENT
// ======================================

function getHistory() {

    try {

        return JSON.parse(
            localStorage.getItem("randomLinkHistory")
        ) || [];

    } catch {

        return [];

    }

}


function saveToHistory(link) {

    let history = getHistory();

    const historyEntry = {

        name: link.name,

        url: link.url,

        date: new Date().toLocaleString()

    };

    history.unshift(historyEntry);

    // Keep latest 20 entries
    history = history.slice(0, 20);

    localStorage.setItem(
        "randomLinkHistory",
        JSON.stringify(history)
    );

    displayHistory();

}


// ======================================
// DISPLAY HISTORY
// ======================================

function displayHistory() {

    const history = getHistory();

    historyList.innerHTML = "";

    if (history.length === 0) {

        const empty = document.createElement("p");

        empty.className = "empty-history";

        empty.textContent =
            "Your discoveries will appear here!";

        historyList.appendChild(empty);

        return;

    }

    history.forEach(item => {

        const container = document.createElement("div");

        container.className = "history-item";

        const anchor = document.createElement("a");

        anchor.textContent = item.name;
        anchor.href = item.url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";

        const date = document.createElement("small");

        date.textContent = item.date;

        container.appendChild(anchor);
        container.appendChild(date);

        historyList.appendChild(container);

    });

}


// ======================================
// CLEAR HISTORY
// ======================================

clearHistoryButton.addEventListener("click", function() {

    localStorage.removeItem("randomLinkHistory");

    displayHistory();

});


// ======================================
// INITIALIZE APPLICATION
// ======================================

// Restore previous history
displayHistory();

// Load CSV
loadLinks();
