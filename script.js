
// ==================================
// FIND COOKIES - STOREFRONT GENERATOR
// ==================================

const CSV_FILE = "./links.csv";

const button = document.getElementById("randomButton");
const result = document.getElementById("result");

const linkName = document.getElementById("linkName");
const linkURL = document.getElementById("linkURL");

const status = document.getElementById("status");

let links = [];


// ==================================
// CSV PARSER
// ==================================

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


// ==================================
// LOAD STOREFRONTS FROM CSV
// ==================================

async function loadLinks() {

    try {

        status.textContent = "Loading storefronts...";

        const response = await fetch(
            CSV_FILE + "?t=" + Date.now()
        );

        if (!response.ok) {
            throw new Error("Unable to load storefronts.");
        }

        const csvText = await response.text();

        const rows = parseCSV(csvText);

        if (rows.length < 2) {
            throw new Error("No storefronts found.");
        }

        // Identify CSV columns
        const headers = rows[0].map(header =>
            header.replace(/^\uFEFF/, "").toLowerCase().trim()
        );

        const nameIndex = headers.indexOf("name");
        const urlIndex = headers.indexOf("url");

        if (nameIndex === -1 || urlIndex === -1) {
            throw new Error(
                "CSV needs columns named name and url."
            );
        }

        // Build storefront list
        links = rows.slice(1)

            .map(row => ({

                name: row[nameIndex]?.trim(),
                url: row[urlIndex]?.trim()

            }))

            .filter(link => {

                if (!link.name || !link.url) {
                    return false;
                }

                try {

                    const parsed = new URL(link.url);

                    return (
                        parsed.protocol === "https:" ||
                        parsed.protocol === "http:"
                    );

                } catch {

                    return false;

                }

            });

        if (links.length === 0) {
            throw new Error("No valid storefronts found.");
        }

        status.textContent = "";

        button.disabled = false;

    } catch (error) {

        console.error(error);

        status.textContent = error.message;

        button.disabled = true;

    }

}


// ==================================
// GENERATE RANDOM STOREFRONT
// ==================================

function generateStorefront() {

    if (links.length === 0) {
        status.textContent = "No storefronts available.";
        return;
    }

    const randomIndex = Math.floor(
        Math.random() * links.length
    );

    const selected = links[randomIndex];

    // Display personalized message
    linkName.textContent =
        `Buy from ${selected.name}'s digital storefront`;

    // Display corresponding URL
    linkURL.textContent = selected.url;
    linkURL.href = selected.url;

    // Show result
    result.classList.remove("hidden");

    status.textContent = "";

}


// ==================================
// BUTTON EVENT
// ==================================

button.addEventListener("click", generateStorefront);


// ==================================
// INITIALIZE
// ==================================

loadLinks();
