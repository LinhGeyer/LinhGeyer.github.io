if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
}

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

const container = document.getElementById("speciesContainer");

// ---------- STORAGE KEY ----------
const SESSION_KEY = "amphi_current_session";

// ---------- LOAD EXISTING SESSION ----------
let state = {};
let sessionMeta = {
    observer: "",
    date: "",
    time: "",
    notes: ""
};

const savedSession = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");

if (savedSession) {
    state = savedSession.counts || {};
    sessionMeta = savedSession.meta || sessionMeta;
}

function createCounterRow(speciesName, type) {
    const key = `${speciesName}_${type}`;

    if (state[key] == null) state[key] = 0;

    const row = document.createElement("div");
    row.className = "counter-row";

    row.innerHTML = `
    <span>${type}</span>
    <div class="counter-controls">
      <button class="minus">−</button>
      <span class="count" id="${key}">0</span>
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
            autoSave();
        }
    };

    plus.onclick = () => {
        state[key]++;
        countEl.textContent = state[key];
        autoSave();
    };

    return row;
}

function createSpeciesCard(name) {
    const card = document.createElement("div");
    card.className = "species-card";

    const title = document.createElement("h3");
    title.textContent = name;
    card.appendChild(title);

    ["adult", "juv", "paare"].forEach(type => {
        card.appendChild(createCounterRow(name, type));
    });

    return card;
}

function autoSave() {
    const payload = {
        counts: state,
        meta: {
            observer: document.getElementById("observer").value,
            date: document.getElementById("date").value,
            time: document.getElementById("time").value,
            notes: document.getElementById("notes").value
        },
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

// build UI
species.forEach(s => {
    container.appendChild(createSpeciesCard(s));
});

// save
document.getElementById("saveBtn").addEventListener("click", () => {
    const entry = {
        observer: document.getElementById("observer").value,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        notes: document.getElementById("notes").value,
        counts: { ...state },
        savedAt: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem("surveys") || "[]");
    existing.push(entry);
    localStorage.setItem("surveys", JSON.stringify(existing));

    alert("Gespeichert! (" + existing.length + " Einträge)");
});

// export
exportBtn.onclick = () => {
    const data = JSON.parse(localStorage.getItem("surveys") || "[]");

    let csv = "observer,date,time,notes\n";

    data.forEach(r => {
        csv += `${r.observer},${r.date},${r.time},${r.notes}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "amphibien.csv";
    a.click();
};

["observer", "date", "time", "notes"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  // restore saved value
  if (sessionMeta[id]) el.value = sessionMeta[id];

  el.addEventListener("change", autoSave);
  el.addEventListener("input", autoSave);
});