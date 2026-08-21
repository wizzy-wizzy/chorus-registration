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

const eventModeButton =
  document.querySelector("#event-mode-button");

const dashboardPage =
  document.querySelector(".dashboard-page");


const totalRegistrations =
  document.querySelector("#total-registrations");

const todayRegistrations =
  document.querySelector("#today-registrations");

const totalAttendees =
  document.querySelector("#total-attendees");

const groupRegistrations =
  document.querySelector("#group-registrations");

const remindersDue =
  document.querySelector("#reminders-due");

const checkedInRegistrations =
  document.querySelector("#checked-in-registrations");

const remainingRegistrations =
  document.querySelector("#remaining-registrations");

const eventDayLabel =
  document.querySelector("#event-day-label");

const eventDayDescription =
  document.querySelector("#event-day-description");

const eventDayTitle =
  document.querySelector(".event-day-title");

const checkInProgressLabel =
  document.querySelector("#check-in-progress-label");

const checkInProgressPercent =
  document.querySelector("#check-in-progress-percent");

const checkInProgressBar =
  document.querySelector("#check-in-progress-bar");

const filterButtons =
  document.querySelectorAll("[data-check-in-filter]");


/* =========================================================
   MODAL
========================================================= */

const modal =
  document.querySelector("#attendee-modal");

const modalOverlay =
  document.querySelector("#modal-overlay");

const closeModal =
  document.querySelector("#close-modal");

const reminderConfirmation =
  document.querySelector("#reminder-confirmation");

const reminderConfirmationOverlay =
  document.querySelector("#reminder-confirmation-overlay");

const markRemindedButton =
  document.querySelector("#mark-reminded-button");

const cancelReminderButton =
  document.querySelector("#cancel-reminder-button");


/* =========================================================
   DATA
========================================================= */

let registrations = [];

let filteredRegistrations = [];

let pendingReminderRegistration = null;

let checkInFilter = "all";

let searchTerm = "";

let eventModeEnabled = false;

let refreshTimer = null;

let isRefreshing = false;

let hasRenderedTable = false;

let previousRegistrationSignature = "";

let isCheckingIn = false;


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

  if (isRefreshing || isCheckingIn) {

    return;

  }

  isRefreshing = true;

  const previousCheckInState =
    new Map(
      registrations.map(
        (registration) => [
          registration.registration_id,
          registration.checked_in_at
        ]
      )
    );

  if (registrations.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="loading-cell">
          Loading registrations...
        </td>
      </tr>
    `;
  }


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


    const nextRegistrations = data || [];
    const nextRegistrationSignature = JSON.stringify(
      nextRegistrations.map(
        (registration) => [
          registration.registration_id,
          registration.full_name,
          registration.phone,
          registration.checked_in_at
        ]
      )
    );

    const shouldRender =
      !hasRenderedTable ||
      nextRegistrationSignature !== previousRegistrationSignature;

    registrations = nextRegistrations;
    filteredRegistrations = filterRegistrations(
      registrations,
      searchTerm
    );
    previousRegistrationSignature =
      nextRegistrationSignature;


    updateStatistics();

    updateEventDayStatus();

    if (shouldRender) {

      renderTable(previousCheckInState);

    }


  } catch (error) {

    console.error(
      "Could not load registrations:",
      error
    );

    hasRenderedTable = false;


    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="loading-cell">
          Unable to load registrations.
        </td>
      </tr>
    `;

  } finally {

    isRefreshing = false;

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

  const dueReminders =
    registrations.filter(
      (registration) =>
        getReminderStatus(registration).isDue
    ).length;

  const checkedIn =
    registrations.filter(
      (registration) =>
        Boolean(registration.checked_in_at)
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


  animateNumber(
    remindersDue,
    dueReminders
  );

  animateNumber(
    checkedInRegistrations,
    checkedIn
  );

  animateNumber(
    remainingRegistrations,
    total - checkedIn
  );

  checkInProgressLabel.textContent =
    `${checkedIn} / ${total} checked in`;

  const progress =
    total === 0 ? 0 : Math.round((checkedIn / total) * 100);

  checkInProgressPercent.textContent = `${progress}%`;
  checkInProgressBar.style.width = `${progress}%`;

}


function getLagosDate() {

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Africa/Lagos",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(new Date());

  return parts.reduce(
    (dateParts, part) => {
      if (part.type !== "literal") {
        dateParts[part.type] = part.value;
      }

      return dateParts;
    },
    {}
  );

}


function isCheckInOpen() {

  const date = getLagosDate();

  return `${date.year}-${date.month}-${date.day}` === "2026-09-13";

}


function getEventDayState() {

  const date = getLagosDate();
  const today = `${date.year}-${date.month}-${date.day}`;

  if (today < "2026-09-13") {

    return "before";

  }

  if (today === "2026-09-13") {

    return "event";

  }

  return "after";

}


function updateEventDayStatus() {

  const eventDayState = getEventDayState();

  const eventModeIsActive =
    eventModeEnabled || eventDayState === "event";

  dashboardPage.classList.toggle(
    "event-mode-active",
    eventModeIsActive
  );

  eventDayTitle.textContent =
    eventModeIsActive
      ? "CHORUS 2026 · EVENT DAY"
      : "CHORUS 2026";

  eventModeButton.textContent =
    eventModeIsActive
      ? "Normal Dashboard"
      : "Event Day Mode";

  if (eventDayState === "event") {

    eventDayLabel.textContent = "🟢 CHECK-IN OPEN";
    eventDayDescription.textContent = "Event Day";

  } else if (eventDayState === "after") {

    eventDayLabel.textContent = "🔴 CHECK-IN CLOSED";
    eventDayDescription.textContent = "Event check-in has ended.";

  } else {

    eventDayLabel.textContent = "🔒 CHECK-IN CLOSED";
    eventDayDescription.textContent = "Opens September 13, 2026";

  }

}


function filterRegistrations(
  source,
  query
) {

  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {

    return [...source];

  }

  return source.filter(
    (registration) =>
      [
        registration.full_name,
        registration.registration_id,
        registration.phone
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
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

  if (current === value) {

    element.textContent = value;

    return;

  }


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

function renderTable(
  previousCheckInState = null
) {

  tableBody.innerHTML = "";

  const visibleRegistrations =
    filteredRegistrations.filter(
      (registration) =>
        checkInFilter === "all" ||
        (checkInFilter === "checked-in" &&
          registration.checked_in_at) ||
        (checkInFilter === "not-checked-in" &&
          !registration.checked_in_at)
    );


  if (
    visibleRegistrations.length === 0
  ) {

    emptyState.classList.remove(
      "hidden"
    );

    return;

  }


  emptyState.classList.add(
    "hidden"
  );


  visibleRegistrations.forEach(
    (registration) => {

      const row =
        document.createElement("tr");

      const reminderStatus =
        getReminderStatus(registration);

      const checkedIn =
        Boolean(registration.checked_in_at);

      const checkInChanged =
        previousCheckInState &&
        previousCheckInState.has(registration.registration_id) &&
        previousCheckInState.get(registration.registration_id) !==
          registration.checked_in_at;

      const checkInButton =
        checkedIn
          ? `<button class="check-in-button check-in-complete" disabled>
              Already checked in
            </button>`
          : getEventDayState() === "event"
            ? `<button
                class="check-in-button"
                data-check-in-id="${escapeHTML(
                  registration.registration_id || ""
                )}"
              >
                ✅ Check In
              </button>`
            : `<button class="check-in-button check-in-locked" disabled>
                ${getEventDayState() === "before"
                  ? "Check-in opens September 13, 2026"
                  : "Event check-in has ended."
                }
              </button>`;


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
          <span class="reminder-status ${
            reminderStatus.isDue
              ? "reminder-status-due"
              : ""
          }">
            ${escapeHTML(reminderStatus.label)}
          </span>
        </td>

        <td>
          <span class="check-in-status ${
            checkedIn ? "check-in-status-complete" : ""
          }">
            ${checkedIn
              ? `Already checked in<br><small>${escapeHTML(
                  formatDateTime(registration.checked_in_at)
                )}</small>`
              : "Not checked in"
            }
          </span>
        </td>

        <td class="actions-cell">

          <button
            class="view-button"
            data-id="${escapeHTML(
              registration.registration_id || ""
            )}"
          >
            View
          </button>

          ${
            registration.phone
              ? `
                <button
                  class="whatsapp-button"
                  data-whatsapp-id="${escapeHTML(
                    registration.registration_id || ""
                  )}"
                  title="Contact ${
                    escapeHTML(
                      registration.full_name || "attendee"
                    )
                  } on WhatsApp"
                >
                  💬 WhatsApp
                </button>
              `
              : `
                <button
                  class="whatsapp-button whatsapp-disabled"
                  disabled
                  title="No WhatsApp number available"
                >
                  💬 WhatsApp
                </button>
              `
          }

          ${registration.phone
            ? `
              <button
                class="reminder-button ${
                  reminderStatus.isDue
                    ? "reminder-button-due"
                    : ""
                }"
                data-reminder-id="${escapeHTML(
                  registration.registration_id || ""
                )}"
              >
                💬 Reminder
              </button>
            `
            : `
              <button
                class="reminder-button reminder-disabled"
                disabled
                title="No WhatsApp number available"
              >
                💬 Reminder
              </button>
            `
          }

          ${checkInButton}

        </td>

      `;


      tableBody.appendChild(row);

      if (checkInChanged) {

        row.classList.add("check-in-updated");

      }

    }
  );


  if (!hasRenderedTable) {

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

    hasRenderedTable = true;

  } else {

    gsap.from(
      ".check-in-updated",
      {
        backgroundColor: "rgba(140,255,155,.22)",
        duration: .6,
        ease: "power2.out"
      }
    );

  }

}


/* =========================================================
   REMINDER STATUS
========================================================= */

function getReminderStatus(
  registration
) {

  const referenceDate =
    registration.last_reminded_at
      ? new Date(registration.last_reminded_at)
      : new Date(registration.created_at);

  if (Number.isNaN(referenceDate.getTime())) {

    return {
      isDue: false,
      label: "Reminder date unavailable"
    };

  }

  const now = new Date();
  const reminderInterval = 5 * 24 * 60 * 60 * 1000;
  const elapsed = now.getTime() - referenceDate.getTime();

  if (elapsed >= reminderInterval) {

    return {
      isDue: true,
      label: "Reminder Due"
    };

  }

  if (registration.last_reminded_at &&
      referenceDate.toDateString() === now.toDateString()) {

    return {
      isDue: false,
      label: "Reminded today"
    };

  }

  return {
    isDue: false,
    label: `Next reminder in ${Math.max(
      1,
      Math.ceil((reminderInterval - elapsed) / (24 * 60 * 60 * 1000))
    )} days`
  };

}


/* =========================================================
   SEARCH
========================================================= */

function searchRegistrations(
  inputValue
) {

  searchTerm = inputValue.trim();
  const query = searchTerm.toLowerCase();

  filteredRegistrations = filterRegistrations(
    registrations,
    query
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
   WHATSAPP CONTACT
========================================================= */

function normalizeNigerianPhone(
  phone
) {

  if (!phone) {

    return null;

  }


  let cleaned =
    String(phone)
      .trim()
      .replace(/\D/g, "");


  if (!cleaned) {

    return null;

  }


  if (/^0[789]\d{9}$/.test(cleaned)) {

    cleaned = cleaned.slice(1);

  } else if (!/^[789]\d{9}$/.test(cleaned) &&
             !/^234[789]\d{9}$/.test(cleaned)) {

    return null;

  }

  if (cleaned.startsWith("234")) {

    return cleaned;

  }

  return `234${cleaned}`;

}


function openWhatsApp(
  registration
) {

  if (!registration) {

    showToast(
      "Registration not found."
    );

    return;

  }


  const phone =
    normalizeNigerianPhone(
      registration.phone
    );


  if (!phone) {

    showToast(
      "This attendee does not have a valid WhatsApp number."
    );

    return;

  }


  const name =
    registration.full_name ||
    "there";


  const registrationId =
    registration.registration_id ||
    "—";


  const attendance =
    registration.attendance === "group"
      ? `You registered as part of a group of ${
          registration.group_size || 1
        } people.`
      : "You registered to attend alone.";


  const message =
`Hello ${name} 👋

This is the CHORUS 2026 team 🎶

We’re reaching out regarding your registration for CHORUS 2026.

✅ Registration ID: ${registrationId}
📅 Event Date: 13 September 2026
📍 Location: Zion City of God Church, Behind Shell Location, Aluu Link Rd, Rukpokwu, Port Harcourt

${attendance}

Thank you for registering with us. We’re excited to have you join us for this special gathering.

Please keep your registration ID for reference.

With warmth,
The CHORUS 2026 / Echoverse Team`;


  const whatsappURL =
    `https://wa.me/${phone}?text=${
      encodeURIComponent(message)
    }`;


  window.open(
    whatsappURL,
    "_blank",
    "noopener,noreferrer"
  );

}


/* =========================================================
   WHATSAPP REMINDERS
========================================================= */

function openReminderWhatsApp(
  registration
) {

  const phone =
    normalizeNigerianPhone(
      registration.phone
    );

  if (!phone) {

    showToast(
      "This attendee does not have a valid WhatsApp number."
    );

    return;

  }

  const name =
    registration.full_name ||
    "there";

  const registrationId =
    registration.registration_id ||
    "—";

  const message =
`Hello ${name} 👋

Just a friendly reminder from the CHORUS 2026 team 🎶

You registered for CHORUS 2026, happening on 13 September 2026.

Registration ID: ${registrationId}

We're getting closer, and we're excited to worship with you! ❤️🔥

Please keep your registration ID safe.

— Echoverse / CHORUS 2026`;

  const whatsappURL =
    `https://wa.me/${phone}?text=${
      encodeURIComponent(message)
    }`;

  window.open(
    whatsappURL,
    "_blank",
    "noopener,noreferrer"
  );

  pendingReminderRegistration = registration;

  reminderConfirmation.classList.add("active");
  reminderConfirmation.setAttribute("aria-hidden", "false");

  gsap.fromTo(
    ".reminder-confirmation-card",
    {
      opacity: 0,
      y: 20,
      scale: .98
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: .3,
      ease: "power2.out"
    }
  );

}


/* =========================================================
   CHECK-IN
========================================================= */

async function checkInRegistration(
  registration
) {

  if (isCheckingIn) {

    return;

  }

  isCheckingIn = true;

  try {

  if (!isCheckInOpen()) {

    showToast(
      "Check-in opens September 13, 2026."
    );

    return;

  }

  const {
    data: {
      session
    }
  } = await supabase.auth.getSession();

  if (!session) {

    window.location.href = "/src/admin/admin.html";

    return;

  }

  const { data, error } =
    await supabase.rpc(
      "check_in_registration",
      {
        target_registration_id:
          registration.registration_id
      }
    );

  if (error) {

    console.error(
      "Could not check in registration:",
      error
    );

    showToast(
      error.message === "Check-in is not open"
        ? "Check-in opens September 13, 2026."
        : "Could not check in this attendee. Try again."
    );

    return;

  }

  if (data?.already_checked_in) {

    registration.checked_in_at =
      data.checked_in_at || registration.checked_in_at;

    renderTable();

    showToast("Already checked in.");

    return;

  }

  if (!data?.checked_in_at) {

    showToast(
      "Could not confirm the check-in. Try again."
    );

    return;

  }

  registration.checked_in_at =
    data.checked_in_at;

  updateStatistics();
  renderTable();

  showToast(
    `${registration.full_name || "Attendee"} checked in ✓`
  );

  } finally {

    isCheckingIn = false;

  }

}


function closeReminderConfirmation() {

  pendingReminderRegistration = null;
  reminderConfirmation.classList.remove("active");
  reminderConfirmation.setAttribute("aria-hidden", "true");

}


async function markReminderAsSent() {

  if (!pendingReminderRegistration) {

    return;

  }

  const registration =
    pendingReminderRegistration;

  markRemindedButton.disabled = true;
  markRemindedButton.textContent = "Saving...";

  const timestamp =
    new Date().toISOString();

  let updateError;

  try {

    const { error } =
      await supabase
        .from("registrations")
        .update({
          last_reminded_at: timestamp
        })
        .eq(
          "registration_id",
          registration.registration_id
        );

    updateError = error;

  } catch (error) {

    updateError = error;

  }

  if (updateError) {

    console.error(
      "Could not mark reminder as sent:",
      updateError
    );

    markRemindedButton.disabled = false;
    markRemindedButton.textContent = "Yes, Mark as Reminded";

    showToast(
      "Could not save the reminder status. Try again."
    );

    return;

  }

  registration.last_reminded_at = timestamp;
  filteredRegistrations =
    filteredRegistrations.map(
      (item) =>
        String(item.registration_id) ===
          String(registration.registration_id)
          ? registration
          : item
    );

  updateStatistics();
  renderTable();
  closeReminderConfirmation();

  markRemindedButton.disabled = false;
  markRemindedButton.textContent = "Yes, Mark as Reminded";

  showToast(
    "Reminder marked as sent ✓"
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
    "created_at",
    "checked_in_at"

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


eventModeButton.addEventListener(
  "click",
  () => {

    eventModeEnabled = !eventModeEnabled;
    updateEventDayStatus();

  }
);


exportButton.addEventListener(
  "click",
  exportCSV
);


filterButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        checkInFilter =
          button.dataset.checkInFilter;

        filterButtons.forEach(
          (filterButton) =>
            filterButton.classList.toggle(
              "active",
              filterButton === button
            )
        );

        renderTable();

      }
    );

  }
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


markRemindedButton.addEventListener(
  "click",
  markReminderAsSent
);


cancelReminderButton.addEventListener(
  "click",
  closeReminderConfirmation
);


reminderConfirmationOverlay.addEventListener(
  "click",
  closeReminderConfirmation
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

    if (
      event.key === "Escape" &&
      reminderConfirmation.classList.contains("active")
    ) {

      closeReminderConfirmation();

    }

  }
);


/* =========================================================
   TABLE ACTION BUTTONS
========================================================= */

tableBody.addEventListener(
  "click",
  (event) => {

    /* VIEW BUTTON */

    const viewButton =
      event.target.closest(
        ".view-button"
      );


    if (viewButton) {

      const id =
        viewButton.dataset.id;


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

      return;

    }


    /* WHATSAPP BUTTON */

    const whatsappButton =
      event.target.closest(
        ".whatsapp-button"
      );


    if (whatsappButton) {

      if (
        whatsappButton.disabled
      ) {

        showToast(
          "No WhatsApp number is available for this attendee."
        );

        return;

      }


      const id =
        whatsappButton.dataset.whatsappId;


      const registration =
        registrations.find(
          item =>
            String(
              item.registration_id
            ) === String(id)
        );


      if (registration) {

        openWhatsApp(
          registration
        );

      }

    }


    /* REMINDER BUTTON */

    const reminderButton =
      event.target.closest(
        ".reminder-button"
      );

    if (reminderButton) {

      if (reminderButton.disabled) {

        showToast(
          "No WhatsApp number is available for this attendee."
        );

        return;

      }

      const id =
        reminderButton.dataset.reminderId;

      const registration =
        registrations.find(
          item =>
            String(item.registration_id) === String(id)
        );

      if (registration) {

        openReminderWhatsApp(registration);

      }

    }


    /* CHECK-IN BUTTON */

    const checkInButton =
      event.target.closest(
        ".check-in-button"
      );

    if (checkInButton) {

      if (checkInButton.disabled) {

        return;

      }

      const id =
        checkInButton.dataset.checkInId;

      const registration =
        registrations.find(
          item =>
            String(item.registration_id) === String(id)
        );

      if (registration) {

        checkInRegistration(registration);

      }

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

  refreshTimer = window.setInterval(
    () => {

      updateEventDayStatus();
      loadRegistrations();

    },
    5000
  );

  window.addEventListener(
    "pagehide",
    () => {

      if (refreshTimer) {

        window.clearInterval(refreshTimer);
        refreshTimer = null;

      }

    },
    { once: true }
  );


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