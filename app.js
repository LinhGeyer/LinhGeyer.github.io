// ================= STORAGE =================
const SESSION_KEY = "amphi_current_session";

// load saved session safely
function loadSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
        return null;
    }
}

function saveSession(payload) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

// ================= INITIAL STATE =================
const saved = loadSession();

let state = saved?.counts || {};
let sessionMeta = saved?.meta || {
    observer: "",
    date: "",
    time: "",
    notes: ""
};


if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js");
    });
}

const species = [
    { name: "Erdkröte", type: "frog" },
    { name: "Knoblauchkröte", type: "frog" },
    { name: "Grasfrosch", type: "frog" },
    { name: "Moorfrosch", type: "frog" },
    { name: "Teichfrosch", type: "frog" },

    { name: "Teichmolch", type: "newt" },
    { name: "Kammmolch", type: "newt" },

    { name: "Andere", type: "frog" }
];

function createSpeciesCard(speciesObj) {

    const card = document.createElement("div");
    card.className = "species-card";

    const title = document.createElement("h3");
    title.textContent = speciesObj.name;
    card.appendChild(title);

    if (speciesObj.type === "frog") {

        ["einzeln", "paare"].forEach(type => {
            card.appendChild(createCounterRow(speciesObj.name, type));
        });

    } else if (speciesObj.type === "newt") {

        card.appendChild(createCounterRow(speciesObj.name, "tiere"));

    }

    return card;
}

// build UI
species.forEach(s => {
    container.appendChild(createSpeciesCard(s));
});

const deadContainer = document.getElementById("deadContainer");

function createDeadCounter() {

    const row = createCounterRow("Tot", "tiere");

    const card = document.createElement("div");
    card.className = "species-card";

    const title = document.createElement("h3");
    title.textContent = "Tote Tiere";

    card.appendChild(title);
    card.appendChild(row);

    return card;
}

deadContainer.appendChild(createDeadCounter());

// ================= VIBRATION =================
function vibrate(ms = 20) {
    if ("vibrate" in navigator) {
        navigator.vibrate(ms);
    }
}

const container = document.getElementById("speciesContainer");

function createCounterRow(speciesName, type) {
    const key = `${speciesName}_${type}`;

    if (state[key] == null) {
        state[key] = 0;
    }

    const row = document.createElement("div");
    row.className = "counter-row";

    row.innerHTML = `
    <span>${type}</span>
    <div class="counter-controls">
      <button class="minus">−</button>
      <span class="count">0</span>
      <button class="plus">+</button>
    </div>
  `;

    const minus = row.querySelector(".minus");
    const plus = row.querySelector(".plus");
    const countEl = row.querySelector(".count");

    countEl.textContent = state[key];

    minus.onclick = () => {
        if (state[key] > 0) {
            state[key]--;
            countEl.textContent = state[key];
            vibrate(15); //short tick
            autoSave();
        }
    };

    plus.onclick = () => {
        state[key]++;
        countEl.textContent = state[key];
        vibrate(15); //short tick
        autoSave();
    };

    return row;
}

function autoSave() {

    const location =
        locationSelect.value === "custom"
            ? customLocation.value
            : locationSelect.value;

    const payload = {
        counts: state,
        meta: {
            observer: document.getElementById("observer")?.value || "",
            date: document.getElementById("date")?.value || "",
            time: document.getElementById("time")?.value || "",
            notes: document.getElementById("notes")?.value || "",
            location: location,
            bucketNr: document.getElementById("bucketNr")?.value || "",
            temperature: document.getElementById("temperature")?.value || "",
            weather: document.getElementById("weather")?.value || ""
        },
        updatedAt: Date.now()
    };

    saveSession(payload);
}


// save
document.getElementById("saveBtn").addEventListener("click", () => {
    const location =
        locationSelect.value === "custom"
            ? customLocation.value
            : locationSelect.value;

    const entry = {
        observer: document.getElementById("observer").value,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        location: location,
        bucketNr: document.getElementById("bucketNr").value,
        temperature: document.getElementById("temperature").value,
        weather: document.getElementById("weather").value,
        notes: document.getElementById("notes").value,
        counts: { ...state },
        savedAt: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem("surveys") || "[]");
    existing.push(entry);
    localStorage.setItem("surveys", JSON.stringify(existing));

    alert("Gespeichert! (" + existing.length + " Einträge)");
});

function getTypes(speciesName) {

    const frogSpecies = [
        "Erdkröte",
        "Knoblauchkröte",
        "Grasfrosch",
        "Moorfrosch",
        "Teichfrosch",
        "Andere"
    ];

    const newtSpecies = [
        "Teichmolch",
        "Kammmolch"
    ];

    if (frogSpecies.includes(speciesName)) return ["einzeln", "paare"];
    if (newtSpecies.includes(speciesName)) return ["tiere"];

    return [];
}

// export
document.getElementById("exportBtn").onclick = async () => {

    const data = JSON.parse(localStorage.getItem("surveys") || "[]");

    const species = [
        "Erdkröte",
        "Knoblauchkröte",
        "Grasfrosch",
        "Moorfrosch",
        "Teichfrosch",
        "Teichmolch",
        "Kammmolch",
        "Andere"
    ];

    //const types = ["adult", "juv", "paare"];

    // ---- header ----
    let header = [
        "Datum",
        "Uhrzeit",
        "Bearbeiter",
        "Ort",
        "Eimer-Nr",
        "Temperatur",
        "Wetter",
        "Bemerkungen"
    ];

    species.forEach(s => {

        const types = getTypes(s.name);

        types.forEach(t => {
            header.push(`${s.name} ${t}`);
        });

    });

    let csv = header.join(",") + "\n";

    // ---- rows ----
    data.forEach(entry => {

        let row = [
            entry.date,
            entry.time,
            entry.observer,
            entry.location || "",
            entry.bucketNr || "",
            entry.temperature || "",
            entry.weather || "",
            entry.notes || ""
        ];

        species.forEach(s => {
            types.forEach(t => {
                const key = `${s}_${t}`;
                row.push(entry.counts?.[key] ?? 0);
            });
        });

        csv += row.join(",") + "\n";

    });

    const file = new File(
        [csv],
        "amphibien_zaehlung.csv",
        { type: "text/csv" }
    );

    // ---- share if supported ----
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {

        try {
            await navigator.share({
                title: "Amphibien Zählung",
                text: "Export der Amphibienzählung",
                files: [file]
            });
        } catch (err) {
            console.log("Share cancelled");
        }

    } else {

        // fallback: download
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = "amphibien_zaehlung.csv";
        a.click();

    }

};

document.getElementById("resetBtn").onclick = () => {

    if (!confirm("Alle aktuellen Zählwerte wirklich zurücksetzen?")) {
        return;
    }

    // reset state values
    Object.keys(state).forEach(key => {
        state[key] = 0;
    });

    // update all counters visually
    document.querySelectorAll(".count").forEach(el => {
        el.textContent = "0";
    });

    // clear form fields
    ["observer", "date", "time", "notes"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    // remove autosaved session
    localStorage.removeItem(SESSION_KEY);

};

const locationSelect = document.getElementById("locationSelect");
const customLocation = document.getElementById("customLocation");

locationSelect.addEventListener("change", () => {

    if (locationSelect.value === "custom") {
        customLocation.style.display = "block";
    } else {
        customLocation.style.display = "none";
        customLocation.value = "";
    }

    autoSave();
});

document.getElementById("nextBucketBtn").onclick = () => {

    const bucketInput = document.getElementById("bucketNr");

    let bucket = parseInt(bucketInput.value || "0", 10);

    bucket++;
    bucketInput.value = bucket;

    // reset counters
    Object.keys(state).forEach(key => {
        state[key] = 0;
    });

    document.querySelectorAll(".count").forEach(el => {
        el.textContent = "0";
    });

    vibrate(40); // stronger feedback for bucket change

    autoSave();
};

["observer", "date", "time", "notes", "bucketNr"].forEach(id => {
    const el = document.getElementById(id); if (sessionMeta.location) {

        if ([...locationSelect.options].some(o => o.value === sessionMeta.location)) {
            locationSelect.value = sessionMeta.location;
        } else {
            locationSelect.value = "custom";
            customLocation.style.display = "block";
            customLocation.value = sessionMeta.location;
        }

    }

    if (!el) return;

    // restore saved value
    if (sessionMeta[id]) el.value = sessionMeta[id];

    el.addEventListener("change", autoSave);
    el.addEventListener("input", autoSave);
});