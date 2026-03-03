// register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

const form = document.getElementById("surveyForm");

form.addEventListener("submit", e => {
  e.preventDefault();

  const entry = {
    observer: observer.value,
    date: date.value,
    time: time.value,
    weather: weather.value,
    temp: temp.value,
    erd_adult: erd_adult.value,
    erd_juv: erd_juv.value,
    erd_paare: erd_paare.value,
    notes: notes.value
  };

  const data = JSON.parse(localStorage.getItem("surveys") || "[]");
  data.push(entry);
  localStorage.setItem("surveys", JSON.stringify(data));

  alert("Gespeichert!");
  form.reset();
});

// CSV export
exportBtn.addEventListener("click", () => {
  const data = JSON.parse(localStorage.getItem("surveys") || "[]");

  let csv = "observer,date,time,temp,notes\n";

  data.forEach(r => {
    csv += `${r.observer},${r.date},${r.time},${r.temp},${r.notes}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "amphibien.csv";
  a.click();
});