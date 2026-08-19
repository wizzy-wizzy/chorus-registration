import gsap from "gsap";
import { supabase } from "../lib/supabase.js";
import "./dashboard.css";


/* =========================================================
   CHORUS 2026 — ADMIN DASHBOARD
========================================================= */


/* =========================================================
   DOM ELEMENTS
========================================================= */

const tableBody =
  document.querySelector("#registrations-table");

const emptyState =
  document.querySelector("#empty-state");

const searchInput =
  document.querySelector("#search-input");

const clearSearch =
  document.querySelector("#clear-search");

const refreshButton =
  document.querySelector("#refresh-button");

const exportButton =
  document.querySelector("#export-button");

const logoutButton =
  document.querySelector("#logout-button");


const totalRegistrations =
  document.querySelector("#total-registrations");

const todayRegistrations =
  document.querySelector("#today-registrations");

const totalAttendees =
  document.querySelector("#total-attendees");

const groupRegistrations =
  document.querySelector("#group-registrations");


/* =========================================================
   MODAL
========================================================= */

const modal =
  document.querySelector("#attendee-modal");

const modalOverlay =
  document.querySelector("#modal-overlay");

const closeModal =
  document.querySelector("#close-modal");


/* =========================================================
   DATA
========================================================= */

let registrations = [];

let filteredRegistrations = [];


/* =========================================================
   AUTH CHECK
========================================================= */

async function checkAdminSession() {

  const {
    data: {
      session
    }
  } = await supabase.auth.getSession();


  if (!session) {

    window.location.href =
      "/src/admin/admin.html";

    return false;

  }


  return true;

}


/* =========================================================
   LOAD REGISTRATIONS
========================================================= */

async function loadRegistrations() {

  tableBody.innerHTML = `
    <tr>
      <td colspan="7" class="loading-cell">
        Loading registrations...
      </td>
    </tr>
  `;


  emptyState.classList.add("hidden");


  try {

    const {
      data,
      error
    } = await supabase

      .from("registrations")

      .select("*")

      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {

      throw error;

    }


    registrations =
      data || [];


    filteredRegistrations =
      [...registrations];


    updateStatistics();

    renderTable();


  } catch (error) {

    console.error(
      "Could not load registrations:",
      error
    );


    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell">
          Unable to load registrations.
        </td>
      </tr>
    `;

  }

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

  const total =
    registrations.length;


  const today =
    getTodayRegistrations();


  const people =
    registrations.reduce(
      (sum, registration) => {

        return sum +
          Number(
            registration.group_size || 1
          );

      },
      0
    );


  const groups =
    registrations.filter(
      (registration) =>
        registration.attendance === "group"
    ).length;


  animateNumber(
    totalRegistrations,
    total
  );


  animateNumber(
    todayRegistrations,
    today
  );


  animateNumber(
    totalAttendees,
    people
  );


  animateNumber(
    groupRegistrations,
    groups
  );

}


/* =========================================================
   TODAY
========================================================= */

function getTodayRegistrations() {

  const now =
    new Date();


  return registrations.filter(
    (registration) => {

      if (!registration.created_at) {

        return false;

      }


      const date =
        new Date(
          registration.created_at
        );


      return (
        date.getFullYear() ===
          now.getFullYear() &&

        date.getMonth() ===
          now.getMonth() &&

        date.getDate() ===
          now.getDate()
      );

    }
  ).length;

}


/* =========================================================
   NUMBER ANIMATION
========================================================= */

function animateNumber(
  element,
  value
) {

  const current =
    Number(
      element.textContent
        .replace(/\D/g, "")
    ) || 0;


  const object = {
    value: current
  };


  gsap.to(
    object,
    {

      value,

      duration: .8,

      ease: "power2.out",

      onUpdate: () => {

        element.textContent =
          Math.round(
            object.value
          );

      }

    }
  );

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderTable() {

  tableBody.innerHTML = "";


  if (
    filteredRegistrations.length === 0
  ) {

    emptyState.classList.remove(
      "hidden"
    );

    return;

  }


  emptyState.classList.add(
    "hidden"
  );


  filteredRegistrations.forEach(
    (registration) => {

      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td class="id-cell">
          ${escapeHTML(
            registration.registration_id ||
            "—"
          )}
        </td>

        <td class="name-cell">
          ${escapeHTML(
            registration.full_name ||
            "—"
          )}
        </td>

        <td>
          ${escapeHTML(
            registration.phone ||
            "—"
          )}
        </td>

        <td>
          ${escapeHTML(
            registration.city ||
            "—"
          )}
        </td>

        <td>
          ${registration.attendance === "group"
            ? `Group · ${registration.group_size || 1}`
            : "Alone"
          }
        </td>

        <td>
          ${formatDate(
            registration.created_at
          )}
        </td>

        <td>

          <button
            class="view-button"
            data-id="${escapeHTML(
              registration.registration_id
            )}"
          >
            View
          </button>

        </td>

      `;


      tableBody.appendChild(row);

    }
  );


  gsap.from(
    "#registrations-table tr",
    {

      opacity: 0,

      y: 10,

      duration: .35,

      stagger: .03,

      ease: "power2.out"

    }
  );

}


/* =========================================================
   SEARCH
========================================================= */

function searchRegistrations(
  searchTerm
) {

  const query =
    searchTerm
      .trim()
      .toLowerCase();


  if (!query) {

    filteredRegistrations =
      [...registrations];

    renderTable();

    return;

  }


  filteredRegistrations =
    registrations.filter(
      (registration) => {

        const searchableText = [

          registration.registration_id,

          registration.full_name,

          registration.phone,

          registration.email,

          registration.city,

          registration.church,

          registration.gender,

          registration.attendance,

          registration.source

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();


        return searchableText
          .includes(query);

      }
    );


  renderTable();

}


/* =========================================================
   VIEW ATTENDEE
========================================================= */

function openAttendee(
  registration
) {

  document.querySelector(
    "#modal-name"
  ).textContent =
    registration.full_name || "—";


  document.querySelector(
    "#modal-registration-id"
  ).textContent =
    registration.registration_id || "—";


  document.querySelector(
    "#modal-phone"
  ).textContent =
    registration.phone || "—";


  document.querySelector(
    "#modal-email"
  ).textContent =
    registration.email || "Not provided";


  document.querySelector(
    "#modal-gender"
  ).textContent =
    formatValue(
      registration.gender
    );


  document.querySelector(
    "#modal-city"
  ).textContent =
    registration.city || "—";


  document.querySelector(
    "#modal-church"
  ).textContent =
    registration.church || "Not provided";


  document.querySelector(
    "#modal-attendance"
  ).textContent =
    registration.attendance === "group"
      ? "Coming with a group"
      : "Coming alone";


  document.querySelector(
    "#modal-group-size"
  ).textContent =
    registration.group_size || "1";


  document.querySelector(
    "#modal-source"
  ).textContent =
    formatValue(
      registration.source
    );


  document.querySelector(
    "#modal-message"
  ).textContent =
    registration.message ||
    "No message provided.";


  document.querySelector(
    "#modal-date"
  ).textContent =
    formatDateTime(
      registration.created_at
    );


  modal.classList.add(
    "active"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  gsap.fromTo(

    ".modal-card",

    {
      opacity: 0,
      y: 30,
      scale: .97
    },

    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: .45,
      ease: "power3.out"
    }

  );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeAttendeeModal() {

  gsap.to(
    ".modal-card",
    {

      opacity: 0,

      y: 20,

      scale: .98,

      duration: .25,

      ease: "power2.in",

      onComplete: () => {

        modal.classList.remove(
          "active"
        );

        modal.setAttribute(
          "aria-hidden",
          "true"
        );

      }

    }
  );

}


/* =========================================================
   CSV EXPORT
========================================================= */

function exportCSV() {

  if (
    registrations.length === 0
  ) {

    showToast(
      "There are no registrations to export."
    );

    return;

  }


  const columns = [

    "registration_id",
    "full_name",
    "phone",
    "email",
    "gender",
    "city",
    "church",
    "attendance",
    "group_size",
    "source",
    "message",
    "created_at"

  ];


  const header =
    columns.join(",");


  const rows =
    registrations.map(
      (registration) => {

        return columns
          .map(
            (column) =>
              csvEscape(
                registration[column]
              )
          )
          .join(",");

      }
    );


  const csv =
    [header, ...rows]
      .join("\n");


  const blob =
    new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement("a");


  link.href = url;


  link.download =
    `chorus-2026-registrations-${getDateForFilename()}.csv`;


  document.body.appendChild(
    link
  );


  link.click();


  document.body.removeChild(
    link
  );


  URL.revokeObjectURL(
    url
  );


  showToast(
    "CSV exported successfully ✓"
  );

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  logoutButton.disabled =
    true;


  logoutButton.textContent =
    "Logging out...";


  try {

    const {
      error
    } =
      await supabase.auth.signOut();


    if (error) {

      throw error;

    }


    window.location.href =
      "/src/admin/admin.html";


  } catch (error) {

    console.error(
      "Logout failed:",
      error
    );


    logoutButton.disabled =
      false;

    logoutButton.textContent =
      "Logout";

    showToast(
      "Could not log out. Try again."
    );

  }

}


/* =========================================================
   REFRESH
========================================================= */

async function refreshDashboard() {

  refreshButton.disabled =
    true;


  gsap.to(
    refreshButton,
    {
      rotation: 360,
      duration: .6,
      ease: "power2.inOut"
    }
  );


  await loadRegistrations();


  gsap.set(
    refreshButton,
    {
      rotation: 0
    }
  );


  refreshButton.disabled =
    false;

}


/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  value
) {

  if (!value) {

    return "—";

  }


  const date =
    new Date(value);


  return date.toLocaleDateString(
    "en-NG",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


function formatDateTime(
  value
) {

  if (!value) {

    return "—";

  }


  const date =
    new Date(value);


  return date.toLocaleString(
    "en-NG",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

}


function formatValue(
  value
) {

  if (!value) {

    return "—";

  }


  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter =>
      letter.toUpperCase()
    );

}


function csvEscape(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  const stringValue =
    String(value);


  return `"${stringValue
    .replace(/"/g, '""')}"`;

}


function getDateForFilename() {

  const date =
    new Date();


  return date
    .toISOString()
    .slice(0, 10);

}


function escapeHTML(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message
) {

  const toast =
    document.querySelector("#toast");

  const toastMessage =
    document.querySelector(
      "#toast-message"
    );


  toastMessage.textContent =
    message;


  gsap.killTweensOf(toast);


  gsap.fromTo(

    toast,

    {
      opacity: 0,
      y: 15
    },

    {
      opacity: 1,
      y: 0,
      duration: .3,

      onComplete: () => {

        gsap.to(
          toast,
          {
            opacity: 0,
            y: 15,
            delay: 2,
            duration: .3
          }
        );

      }

    }

  );

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

searchInput.addEventListener(
  "input",
  () => {

    searchRegistrations(
      searchInput.value
    );

  }
);


clearSearch.addEventListener(
  "click",
  () => {

    searchInput.value = "";

    searchRegistrations("");

    searchInput.focus();

  }
);


refreshButton.addEventListener(
  "click",
  refreshDashboard
);


exportButton.addEventListener(
  "click",
  exportCSV
);


logoutButton.addEventListener(
  "click",
  logout
);


closeModal.addEventListener(
  "click",
  closeAttendeeModal
);


modalOverlay.addEventListener(
  "click",
  closeAttendeeModal
);


document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      modal.classList.contains("active")
    ) {

      closeAttendeeModal();

    }

  }
);


/* =========================================================
   TABLE VIEW BUTTON
========================================================= */

tableBody.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        ".view-button"
      );


    if (!button) return;


    const id =
      button.dataset.id;


    const registration =
      registrations.find(
        item =>
          String(
            item.registration_id
          ) === String(id)
      );


    if (registration) {

      openAttendee(
        registration
      );

    }

  }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initialize() {

  const authenticated =
    await checkAdminSession();


  if (!authenticated) {

    return;

  }


  await loadRegistrations();


  /* Page entrance */

  gsap.from(
    [
      ".dashboard-nav",
      ".dashboard-header",
      ".stat-card",
      ".section-header",
      ".search-container"
    ],
    {

      opacity: 0,

      y: 25,

      duration: .7,

      stagger: .08,

      ease: "power3.out"

    }
  );

}


initialize();