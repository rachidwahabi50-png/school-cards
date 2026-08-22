// ---------------------------------------------------------------
// school-cards — script.js
// Reads config.json (info about the school) and students.json
// (info about the students) and renders either:
//   - a single card:   index.html?id=001
//   - a print sheet:   print.html?print=001,002,003   or  ?print=all
// Nothing about a specific student is ever hardcoded here — everything
// comes from students.json, which is what makes the QR codes permanent:
// the QR only ever encodes "?id=001", never the student's data itself.
// ---------------------------------------------------------------

const QR_BASE = "https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=";

async function loadData() {
  const [config, students] = await Promise.all([
    fetch("config.json").then((r) => r.json()),
    fetch("students.json").then((r) => r.json()),
  ]);
  return { config, students };
}

function pageUrlFor(id) {
  const base = location.href.split("?")[0].replace(/print\.html$/, "index.html");
  return `${base}?id=${encodeURIComponent(id)}`;
}

function qrUrlFor(id) {
  return QR_BASE + encodeURIComponent(pageUrlFor(id));
}

function cardHTML(config, student) {
  return `
    <div class="card" data-id="${student.id}">
      <div class="card-band">
        <img class="school-logo" src="${config.logo}" alt="" onerror="this.style.visibility='hidden'">
        <div class="school-names">
          <div class="school-fr">${config.nomEcole}</div>
          <div class="school-ar">${config.nomEcoleAr}</div>
        </div>
        <div class="card-title">
          <div class="fr">Carte d'élève</div>
          <div class="ar">بطاقة التلميذ</div>
        </div>
      </div>
      <div class="card-body">
        <div class="photo-wrap">
          <img class="photo" src="${student.photo}" alt="" onerror="this.style.background='#eee'">
          <img class="qr" src="${qrUrlFor(student.id)}" alt="QR code">
          <div class="scan-label">Scan</div>
        </div>
        <div class="info">
          <div class="name-block">
            <div class="prenom">${student.prenom}</div>
            <div class="nom">${student.nom}</div>
          </div>
          <div class="meta-grid">
            <div class="meta-item">
              <div class="label">Classe</div>
              <div class="value">${student.classe}</div>
            </div>
            <div class="meta-item">
              <div class="label">Année scolaire</div>
              <div class="value">${config.anneeScolaire}</div>
            </div>
            <div class="meta-item">
              <div class="label">Expire</div>
              <div class="value">${config.dateExpiration}</div>
            </div>
          </div>
          <div class="id-row">
            <div class="label">N° d'inscription</div>
            <div class="value">${student.id}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// The extra fields (date de naissance, téléphone parent, adresse) never
// appear on the card itself — neither printed nor on first scan. They only
// show up after someone enters the PIN code from config.json ("codeAcces").
// NOTE: this is a simple deterrent, not real security — anyone who can read
// the site's source or fetch students.json directly can still see the data.
// A real access-control system would need a backend + login, which a free
// static GitHub Pages site cannot provide.
function adminPanelHTML() {
  return `
    <div class="admin-panel">
      <button type="button" class="admin-toggle">🔒 Informations complètes (Administration)</button>
      <div class="admin-body" hidden>
        <div class="pin-row">
          <input type="password" inputmode="numeric" class="pin-input" placeholder="Code PIN" maxlength="12">
          <button type="button" class="pin-submit">Valider</button>
        </div>
        <div class="pin-error" hidden>Code incorrect.</div>
        <div class="admin-details" hidden></div>
      </div>
    </div>
  `;
}

function adminDetailsHTML(student) {
  return `
    <div class="meta-item"><div class="label">Date de naissance</div><div class="value">${student.dateNaissance || "—"}</div></div>
    <div class="meta-item"><div class="label">Téléphone parent</div><div class="value">${student.telephoneParent || "—"}</div></div>
    <div class="meta-item"><div class="label">Adresse</div><div class="value">${student.adresse || "—"}</div></div>
  `;
}

function wireAdminPanel(root, student, config) {
  const panel = root.querySelector(".admin-panel");
  if (!panel) return;
  const toggle = panel.querySelector(".admin-toggle");
  const body = panel.querySelector(".admin-body");
  const pinInput = panel.querySelector(".pin-input");
  const pinRow = panel.querySelector(".pin-row");
  const pinSubmit = panel.querySelector(".pin-submit");
  const pinError = panel.querySelector(".pin-error");
  const details = panel.querySelector(".admin-details");

  toggle.addEventListener("click", () => {
    body.hidden = !body.hidden;
    if (!body.hidden) pinInput.focus();
  });

  const tryUnlock = () => {
    if (pinInput.value === String(config.codeAcces ?? "")) {
      details.innerHTML = adminDetailsHTML(student);
      details.hidden = false;
      pinError.hidden = true;
      pinRow.hidden = true;
    } else {
      pinError.hidden = false;
    }
  };

  pinSubmit.addEventListener("click", tryUnlock);
  pinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryUnlock();
  });
}

function notFoundHTML(id) {
  return `
    <div class="not-found">
      <div class="icon">⚠️</div>
      <h1>التلميذ غير موجود</h1>
      <p class="sub">Aucune carte ne correspond à l'identifiant « ${id ?? ""} ». Vérifiez le lien ou contactez l'administration de l'école.</p>
    </div>
  `;
}

async function renderSingleCard() {
  const root = document.getElementById("app");
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  if (!id) {
    root.innerHTML = notFoundHTML("");
    return;
  }

  try {
    const { config, students } = await loadData();
    const student = students.find((s) => s.id === id);
    document.title = `${config.nomEcole} — Carte d'élève`;

    if (!student) {
      root.innerHTML = notFoundHTML(id);
      return;
    }

    root.innerHTML = `
      <div class="stage-header">${config.nomEcole} · ${config.nomEcoleAr}</div>
      ${cardHTML(config, student)}
      ${adminPanelHTML()}
      <div class="stage-footer">
        Cette carte est générée automatiquement à partir de students.json.
      </div>
    `;
    wireAdminPanel(root, student, config);
  } catch (e) {
    root.innerHTML = notFoundHTML(id);
    console.error(e);
  }
}

async function renderPrintSheet() {
  const root = document.getElementById("app");
  const params = new URLSearchParams(location.search);
  const printParam = params.get("print") || "all";

  const { config, students } = await loadData();

  let selected;
  if (printParam === "all") {
    selected = students;
  } else {
    const ids = printParam.split(",").map((s) => s.trim()).filter(Boolean);
    selected = students.filter((s) => ids.includes(s.id));
  }

  const CARDS_PER_PAGE = 8;
  const pages = [];
  for (let i = 0; i < selected.length; i += CARDS_PER_PAGE) {
    pages.push(selected.slice(i, i + CARDS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  root.innerHTML = `
    <div class="print-toolbar">
      <span>${selected.length} carte(s) prête(s) à imprimer — format 9.8 × 6.9 cm, 8 par page A4</span>
      <button onclick="window.print()">Imprimer</button>
    </div>
    ${pages
      .map(
        (page) => `
      <div class="sheet">
        ${page.map((s) => cardHTML(config, s)).join("")}
      </div>`
      )
      .join("")}
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add(document.body.dataset.mode === "print" ? "mode-print" : "mode-card");
  if (document.body.dataset.mode === "print") {
    renderPrintSheet();
  } else {
    renderSingleCard();
  }
});
