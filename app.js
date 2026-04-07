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

// ================= VIBRATION =================
function vibrate(ms = 20) {
    if ("vibrate" in navigator) {
        navigator.vibrate(ms);
    }
}


if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js");
    });
}

const species = [
    { name: "Erdkröte", type: "toad" },

    { name: "Knoblauchkröte", type: "simple" },
    { name: "Grasfrosch", type: "simple" },
    { name: "Moorfrosch", type: "simple" },
    { name: "Grünfrosch", type: "simple" },

    { name: "Teichmolch", type: "simple" },
    { name: "Kammmolch", type: "simple" }
];

const container = document.getElementById("speciesContainer");
const deadContainer = document.getElementById("deadContainer");
const locationSelect = document.getElementById("locationSelect");
const customLocation = document.getElementById("customLocation");
const deadSpeciesSelect = document.getElementById("deadSpecies");
const deadCounterContainer = document.getElementById("deadCounter");

if (!container) {
    console.error("Cannot find #speciesContainer in the DOM. Species cards will not render.");
}

if (!deadContainer) {
    console.error("Cannot find #deadContainer in the DOM. Dead counter will not render.");
}

function createSpeciesCard(speciesObj) {

    const card = document.createElement("div");
    card.className = "species-card";

    const title = document.createElement("h3");
    title.textContent = speciesObj.name;
    card.appendChild(title);

    if (speciesObj.name === "Erdkröte") {

        ["weibchen", "männchen", "paare"].forEach(type => {
            card.appendChild(createCounterRow(speciesObj.name, type));
        });

    } else {

        card.appendChild(createCounterRow(speciesObj.name, "anzahl"));

    }

    return card;
}

// build UI
if (container) {
    species.forEach(s => {
        container.appendChild(createSpeciesCard(s));
    });
}

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

if (deadContainer) {
    deadContainer.appendChild(createDeadCounter());
}

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

function buildSessionMeta() {
    const location =
        locationSelect?.value === "custom"
            ? customLocation?.value
            : locationSelect?.value || "";

    return {
        observer: document.getElementById("observer")?.value || "",
        date: document.getElementById("date")?.value || "",
        time: document.getElementById("time")?.value || "",
        location: location,
        bucketNr: document.getElementById("bucketNr")?.value || "",
        temperature: document.getElementById("temperature")?.value || "",
        weather: document.getElementById("weather")?.value || "",
        notes: document.getElementById("notes")?.value || ""
    };
}

function buildCurrentEntry() {
    return {
        ...buildSessionMeta(),
        counts: { ...state },
        savedAt: new Date().toISOString()
    };
}

function autoSave() {

    const payload = {
        counts: state,
        meta: buildSessionMeta(),
        updatedAt: Date.now()
    };

    saveCurrentBucket();
    saveSession(payload);
}


// save (kept for backwards compatibility, but hidden in UI)
const saveBtn = document.getElementById("saveBtn");
if (saveBtn) {
    saveBtn.style.display = "none";
    saveBtn.disabled = true;

    saveBtn.addEventListener("click", () => {
        const location =
            locationSelect?.value === "custom"
                ? customLocation?.value
                : locationSelect?.value || "";

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
}

function saveCurrentBucket() {

    const location =
        locationSelect.value === "custom"
            ? customLocation.value
            : locationSelect.value;

    const entry = {
        observer: document.getElementById("observer").value,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        location,
        bucketNr: document.getElementById("bucketNr").value,
        temperature: document.getElementById("temperature").value,
        weather: document.getElementById("weather").value,
        notes: document.getElementById("notes").value,
        counts: { ...state },
        id: Date.now()
    };

    const entries = JSON.parse(localStorage.getItem("entries") || "[]");

    entries.push(entry);

    localStorage.setItem("entries", JSON.stringify(entries));

}

function formatDateForCsv(iso) {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function formatDateForDisplay(iso) {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function resetCountersOnly() {

  Object.keys(state).forEach(key => {
    state[key] = 0;
  });

  document.querySelectorAll(".count").forEach(el => {
    el.textContent = "0";
  });

}

function getLatestBucketEntries(entries) {
  const latestByBucket = new Map();

  entries.forEach(entry => {
    if (!entry.bucketNr) return;

    const existing = latestByBucket.get(entry.bucketNr);
    if (!existing || entry.id > existing.id) {
      latestByBucket.set(entry.bucketNr, entry);
    }
  });

  return [...latestByBucket.values()].sort((a, b) => {
    const aNr = Number(a.bucketNr) || 0;
    const bNr = Number(b.bucketNr) || 0;
    return aNr - bNr;
  });
}

function loadBucketByNumber(bucketNum) {
  const entries = JSON.parse(localStorage.getItem("entries") || "[]");
  const latestByBucket = new Map();

  entries.forEach(entry => {
    if (!entry.bucketNr) return;
    const existing = latestByBucket.get(entry.bucketNr);
    if (!existing || entry.id > existing.id) {
      latestByBucket.set(entry.bucketNr, entry);
    }
  });

  const entry = latestByBucket.get(String(bucketNum));
  
  if (entry) {
    loadEntry(entry.id);
  } else {
    // no saved entry for this bucket - reset and set date/time
    resetCountersOnly();
    updateUIFromState();
    
    const now = new Date();
    const dateEl = document.getElementById("date");
    const timeEl = document.getElementById("time");
    if (dateEl) {
      dateEl.value = now.toISOString().split("T")[0];
    }
    if (timeEl) {
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      timeEl.value = `${hours}:${minutes}`;
    }
  }
  
  autoSave();
}

function renderEntryList() {

  const container = document.getElementById("entryList");

  container.innerHTML = "";

  const entries = JSON.parse(localStorage.getItem("entries") || "[]");
  const latestEntries = getLatestBucketEntries(entries);

  latestEntries.forEach(entry => {

    const row = document.createElement("div");

    row.className = "entry-row";

    row.innerHTML = `
      Eimer ${entry.bucketNr} – ${formatDateForDisplay(entry.date)}
      <button data-id="${entry.id}">Bearbeiten</button>
    `;

    row.querySelector("button").onclick = () => {
      loadEntry(entry.id);
    };

    container.appendChild(row);

  });

}

function loadEntry(id) {

  const entries = JSON.parse(localStorage.getItem("entries") || "[]");

  const entry = entries.find(e => e.id === id);

  if (!entry) return;

  state = { ...entry.counts };

  document.getElementById("observer").value = entry.observer;
  document.getElementById("date").value = entry.date;
  document.getElementById("time").value = entry.time;
  document.getElementById("bucketNr").value = entry.bucketNr;
  document.getElementById("temperature").value = entry.temperature;
  document.getElementById("weather").value = entry.weather;
  document.getElementById("notes").value = entry.notes;

  updateUIFromState();

}

function updateUIFromState() {

  document.querySelectorAll(".counter-row").forEach(row => {

    const label = row.parentElement.querySelector("h3").textContent;

    const type = row.querySelector("span").textContent;

    const key = `${label}_${type}`;

    if (state[key] != null) {
      row.querySelector(".count").textContent = state[key];
    }

  });

}

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

let currentDeadKey = null;

// populate dropdown
species.forEach(s => {
    const option = document.createElement("option");
    option.value = s.name;
    option.textContent = s.name;
    deadSpeciesSelect.appendChild(option);
});

// update counter when species changes
deadSpeciesSelect.addEventListener("change", () => {

    deadCounterContainer.innerHTML = "";

    if (!deadSpeciesSelect.value) return;

    const speciesName = deadSpeciesSelect.value;

    currentDeadKey = `Tot_${speciesName}`;

    if (state[currentDeadKey] == null) {
        state[currentDeadKey] = 0;
    }

    const row = createCounterRow("Tot", speciesName);

    deadCounterContainer.appendChild(row);

    // persist the choice + counter updates
    autoSave();
});

// export (autosaves first)
document.getElementById("exportBtn").onclick = async () => {

    // ensure latest state is persisted before exporting
    autoSave();

    const entries = JSON.parse(localStorage.getItem("entries") || "[]");
    const exportEntries = getLatestBucketEntries(entries);

    const separator = ";";

    const escapeCsv = value => {
        const str = value == null ? "" : String(value);
        if (/["\n\r;]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    // reuse global date formatting helpers
    // (defined in top-level scope)


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

        if (s.name === "Erdkröte") {
            ["weibchen", "männchen", "paare"].forEach(t => {
                header.push(`${s.name} ${t}`);
            });
        } else {
            header.push(`${s.name} Anzahl`);
        }

    });
    species.forEach(s => {
        header.push(`Tot ${s.name}`);
    });

    let csv = header.map(escapeCsv).join(separator) + "\n";

    // ---- rows ----
    exportEntries.forEach(entry => {

        let row = [
            formatDateForCsv(entry.date),
            entry.time,
            entry.observer,
            entry.location || "",
            entry.bucketNr || "",
            entry.temperature || "",
            entry.weather || "",
            entry.notes || ""
        ];

        species.forEach(s => {

            if (s.name === "Erdkröte") {

                ["weibchen", "männchen", "paare"].forEach(t => {
                    const key = `${s.name}_${t}`;
                    row.push(entry.counts?.[key] ?? 0);
                });

            } else {

                const key = `${s.name}_anzahl`;
                row.push(entry.counts?.[key] ?? 0);

            }

        });

        species.forEach(s => {
            const key = `Tot_${s.name}`;
            row.push(entry.counts?.[key] ?? 0);
        });

        csv += row.map(escapeCsv).join(separator) + "\n";

    });

    const now = new Date();
    const fileDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const observerName = (document.getElementById("observer")?.value || "").trim();
    const safeObserver = observerName
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_-]/g, "")
        .slice(0, 32) || "observer";

    const file = new File(
        [csv],
        `amphibien_zaehlung_${fileDate}_${safeObserver}.csv`,
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
        a.download = `amphibien_zaehlung_${fileDate}.csv`;
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
    ["observer", "date", "time", "notes", "bucketNr"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    // clear all saved bucket entries
    localStorage.removeItem("entries");

    // remove autosaved session
    localStorage.removeItem(SESSION_KEY);

    // re-render the bucket list
    renderEntryList();

};

if (locationSelect && customLocation) {
    locationSelect.addEventListener("change", () => {

        if (locationSelect.value === "custom") {
            customLocation.style.display = "block";
        } else {
            customLocation.style.display = "none";
            customLocation.value = "";
        }

        autoSave();
    });

    customLocation.addEventListener("input", autoSave);
    customLocation.addEventListener("change", autoSave);
}

document.getElementById("nextBucketBtn").onclick = () => {

    saveCurrentBucket();

    // autofill date/time for new bucket run
    const now = new Date();
    const dateEl = document.getElementById("date");
    const timeEl = document.getElementById("time");
    if (dateEl) {
        dateEl.value = now.toISOString().split("T")[0];
    }
    if (timeEl) {
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        timeEl.value = `${hours}:${minutes}`;
    }

    const bucketInput = document.getElementById("bucketNr");

    let bucket = parseInt(bucketInput.value || "0", 10);

    bucket++;
    bucketInput.value = bucket;

    resetCountersOnly();

    autoSave();

};

["observer", "date", "time", "notes", "temperature", "weather"].forEach(id => {
    const el = document.getElementById(id);

    if (sessionMeta.location && locationSelect && customLocation) {

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

// special handler for manual bucket number changes
const bucketNrInput = document.getElementById("bucketNr");
if (bucketNrInput) {
    bucketNrInput.addEventListener("change", (e) => {
        const newBucketNum = e.target.value;
        if (newBucketNum) {
            saveCurrentBucket();
            loadBucketByNumber(newBucketNum);
            renderEntryList();
        }
    });

    bucketNrInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            // autofill date/time for new bucket run, like the +1 button
            const now = new Date();
            const dateEl = document.getElementById("date");
            const timeEl = document.getElementById("time");
            if (dateEl) {
                dateEl.value = now.toISOString().split("T")[0];
            }
            if (timeEl) {
                const hours = String(now.getHours()).padStart(2, "0");
                const minutes = String(now.getMinutes()).padStart(2, "0");
                timeEl.value = `${hours}:${minutes}`;
            }
            autoSave();
        }
    });

    // For mobile devices where Enter might not be available, set date/time on blur
    bucketNrInput.addEventListener("blur", () => {
        if (bucketNrInput.value && !document.getElementById("date").value) {
            const now = new Date();
            const dateEl = document.getElementById("date");
            const timeEl = document.getElementById("time");
            if (dateEl) {
                dateEl.value = now.toISOString().split("T")[0];
            }
            if (timeEl) {
                const hours = String(now.getHours()).padStart(2, "0");
                const minutes = String(now.getMinutes()).padStart(2, "0");
                timeEl.value = `${hours}:${minutes}`;
            }
            autoSave();
        }
    });
}

renderEntryList();