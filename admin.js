const adminLogin = document.getElementById("adminLogin");
const adminContent = document.getElementById("adminContent");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const adminLoginMessage = document.getElementById("adminLoginMessage");
const adminLogout = document.getElementById("adminLogout");
const pendingReviewsList = document.getElementById("pendingReviewsList");
const approvedReviewsList = document.getElementById("approvedReviewsList");
const pendingCount = document.getElementById("pendingCount");
const approvedCount = document.getElementById("approvedCount");
const pendingTabBadge = document.getElementById("pendingTabBadge");
const approvedTabBadge = document.getElementById("approvedTabBadge");
const adminTabs = document.querySelectorAll(".admin-tab");
const adminPanels = document.querySelectorAll(".admin-review-group");
const adminSummary = document.getElementById("adminSummary");
const refreshButton = document.getElementById("refreshReviews");
let activeAdminTab = "pending";
let hasLoadedReviews = false;
const adminLoginDomain = "admin.local";

const formatDate = (timestamp) => {
  if (!timestamp?.toDate) {
    return "No date";
  }

  return timestamp.toDate().toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const setLoginMessage = (message, type = "") => {
  adminLoginMessage.textContent = message;
  adminLoginMessage.dataset.type = type;
};

const getAuthEmail = (login) => {
  const normalizedLogin = login.trim();

  if (normalizedLogin.includes("@")) {
    return normalizedLogin;
  }

  return `${normalizedLogin}@${adminLoginDomain}`;
};

const createButton = (label, className, onClick) => {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
};

const setLoading = (isLoading) => {
  refreshButton.disabled = isLoading;
  refreshButton.textContent = isLoading ? "Loading..." : "Refresh";
};

const setCardBusy = (card, isBusy) => {
  card.querySelectorAll("button").forEach((button) => {
    button.disabled = isBusy;
  });
};

const setActiveTab = (tabName) => {
  activeAdminTab = tabName;

  adminTabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  adminPanels.forEach((panel) => {
    const isActive = panel.dataset.panel === tabName;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
};

const setAdminVisibility = (isSignedIn) => {
  adminLogin.hidden = isSignedIn;
  adminContent.hidden = !isSignedIn;
};

const renderReviewGroup = (list, reviews, emptyText) => {
  list.innerHTML = "";

  if (!reviews.length) {
    list.innerHTML = `<p class="admin-empty">${emptyText}</p>`;
    return;
  }

  reviews.forEach((review) => {
    const card = document.createElement("article");
    const meta = document.createElement("div");
    const status = document.createElement("span");
    const stars = document.createElement("div");
    const name = document.createElement("h2");
    const text = document.createElement("p");
    const date = document.createElement("span");
    const actions = document.createElement("div");
    const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));

    card.className = "admin-review-card";
    card.dataset.status = review.status;
    meta.className = "admin-review-meta";
    status.className = "admin-status";
    status.textContent = review.status === "approved" ? "Visible" : "Hidden";
    stars.className = "testimonial-stars";
    stars.textContent = "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);
    name.textContent = review.name || "No name";
    text.textContent = review.text || "";
    date.className = "admin-review-date";
    date.textContent = formatDate(review.createdAt);
    actions.className = "admin-review-actions";

    actions.append(
      createButton("Approve", "admin-action-btn approve", async () => {
        setCardBusy(card, true);

        try {
          await window.updateReviewStatus(review.id, "approved");
          await loadAndRenderReviews();
        } catch (error) {
          console.error(error);
          setCardBusy(card, false);
        }
      }),
      createButton("Pending", "admin-action-btn pending", async () => {
        setCardBusy(card, true);

        try {
          await window.updateReviewStatus(review.id, "pending");
          await loadAndRenderReviews();
        } catch (error) {
          console.error(error);
          setCardBusy(card, false);
        }
      }),
      createButton("Delete", "admin-action-btn delete", async () => {
        const confirmed = window.confirm("Delete this review?");
        if (!confirmed) {
          return;
        }

        setCardBusy(card, true);

        try {
          await window.deleteReview(review.id);
          await loadAndRenderReviews();
        } catch (error) {
          console.error(error);
          setCardBusy(card, false);
        }
      })
    );

    meta.append(status, date);
    card.append(meta, stars, name, text, actions);
    list.appendChild(card);
  });
};

const renderReviews = (reviews) => {
  const pendingReviews = reviews.filter((review) => review.status !== "approved");
  const approvedReviews = reviews.filter((review) => review.status === "approved");

  pendingCount.textContent = String(pendingReviews.length);
  approvedCount.textContent = String(approvedReviews.length);
  pendingTabBadge.textContent = String(pendingReviews.length);
  pendingTabBadge.hidden = pendingReviews.length === 0;
  approvedTabBadge.textContent = String(approvedReviews.length);
  adminSummary.textContent = `${reviews.length} reviews total`;

  renderReviewGroup(pendingReviewsList, pendingReviews, "No new reviews.");
  renderReviewGroup(approvedReviewsList, approvedReviews, "No published reviews yet.");

  if (activeAdminTab === "pending" && pendingReviews.length > 0) {
    setActiveTab("pending");
  } else if (activeAdminTab === "approved" && approvedReviews.length > 0) {
    setActiveTab("approved");
  } else if (pendingReviews.length > 0) {
    setActiveTab("pending");
  } else {
    setActiveTab("approved");
  }
};

const loadAndRenderReviews = async () => {
  setLoading(true);
  adminSummary.textContent = "Loading reviews...";

  try {
    const reviews = await window.loadAllReviews();
    hasLoadedReviews = true;
    renderReviews(reviews);
  } catch (error) {
    console.error(error);
    adminSummary.textContent = "Could not load reviews.";
    pendingReviewsList.innerHTML = '<p class="admin-empty">Check Firebase connection and Firestore permissions.</p>';
    approvedReviewsList.innerHTML = "";
  } finally {
    setLoading(false);
  }
};

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = adminLoginForm.querySelector("button");
  submitButton.disabled = true;
  submitButton.textContent = "Signing in...";
  setLoginMessage("");

  try {
    await window.signInAdmin(getAuthEmail(adminEmail.value), adminPassword.value);
    adminLoginForm.reset();
  } catch (error) {
    console.error(error);
    setLoginMessage("Wrong email or password.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Sign in";
  }
});

adminLogout.addEventListener("click", async () => {
  await window.signOutAdmin();
});

refreshButton.addEventListener("click", loadAndRenderReviews);

adminTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveTab(tab.dataset.tab);
  });
});

window.watchAdminAuth(async (user) => {
  hasLoadedReviews = false;
  setAdminVisibility(Boolean(user));

  if (!user) {
    setLoginMessage("");
    adminSummary.textContent = "Loading reviews...";
    pendingReviewsList.innerHTML = "";
    approvedReviewsList.innerHTML = "";
    return;
  }

  setLoginMessage("");

  if (!hasLoadedReviews) {
    await loadAndRenderReviews();
  }
});
