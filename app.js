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

const state = {};

function createCounterRow(speciesName, type) {
  const key = `${speciesName}_${type}`;
  state[key] = 0;

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

  minus.onclick = () => {
    if (state[key] > 0) {
      state[key]--;
      countEl.textContent = state[key];
    }
  };

  plus.onclick = () => {
    state[key]++;
    countEl.textContent = state[key];
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

// build UI
species.forEach(s => {
  container.appendChild(createSpeciesCard(s));
});

// save
saveBtn.onclick = () => {
  const entry = {
    observer: observer.value,
    date: date.value,
    time: time.value,
    notes: notes.value,
    counts: state
  };

  const data = JSON.parse(localStorage.getItem("surveys") || "[]");
  data.push(entry);
  localStorage.setItem("surveys", JSON.stringify(data));

  alert("Gespeichert!");
};

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