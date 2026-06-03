const stars = document.querySelectorAll(".rating span");
const ratingInput = document.getElementById("ratingValue");
const reviewForm = document.querySelector(".review-form");
const pageLanguage = document.documentElement.lang === "cs" ? "cs" : "uk";
const reviewMessages = {
  uk: {
    ratingRequired: "Оберіть оцінку перед відправкою.",
    sending: "Відправляємо відгук...",
    success: "Дякуємо! Відгук надіслано на перевірку.",
    error: "Не вдалося надіслати відгук. Спробуйте ще раз.",
  },
  cs: {
    ratingRequired: "Vyberte hodnocení před odesláním.",
    sending: "Odesíláme recenzi...",
    success: "Děkujeme! Recenze byla odeslána ke kontrole.",
    error: "Recenzi se nepodařilo odeslat. Zkuste to prosím znovu.",
  },
};
const labels = reviewMessages[pageLanguage];

stars.forEach((star) => {
  star.addEventListener("click", () => {
    const value = Number(star.dataset.value);

    ratingInput.value = value;

    stars.forEach((s) => {
      if (Number(s.dataset.value) <= value) {
        s.classList.add("active");
      } else {
        s.classList.remove("active");
      }
    });
  });
});

const setReviewFormMessage = (message, type = "info") => {
  if (!reviewForm) {
    return;
  }

  let messageElement = reviewForm.querySelector(".review-form-message");

  if (!messageElement) {
    messageElement = document.createElement("p");
    messageElement.className = "review-form-message";
    reviewForm.appendChild(messageElement);
  }

  messageElement.textContent = message;
  messageElement.dataset.type = type;
};

const resetRating = () => {
  if (ratingInput) {
    ratingInput.value = "0";
  }

  stars.forEach((star) => {
    star.classList.remove("active");
  });
};

if (reviewForm) {
  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameInput = reviewForm.querySelector('input[type="text"]');
    const textInput = reviewForm.querySelector("textarea");
    const submitButton = reviewForm.querySelector('button[type="submit"]');
    const rating = Number(ratingInput?.value || 0);

    if (!rating) {
      setReviewFormMessage(labels.ratingRequired, "error");
      return;
    }

    const review = {
      name: nameInput.value.trim(),
      rating,
      text: textInput.value.trim(),
      pageLanguage,
    };

    submitButton.disabled = true;
    setReviewFormMessage(labels.sending, "info");

    try {
      await window.saveReview(review);
      reviewForm.reset();
      resetRating();
      setReviewFormMessage(labels.success, "success");
    } catch (error) {
      console.error(error);
      setReviewFormMessage(labels.error, "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

const copyButtons = document.querySelectorAll(".copy-btn");

const testimonialLists = document.querySelectorAll(".testimonials-list");
let siteReviews = Array.isArray(window.reviewsData) ? window.reviewsData : [];

const renderReviews = (list, reviews) => {
  if (!reviews.length) {
    list.innerHTML = `<p class="testimonials-empty">${list.dataset.emptyLabel || "Reviews will appear soon."}</p>`;
    return;
  }

  list.innerHTML = "";

  reviews.forEach((review) => {
    const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
    const card = document.createElement("article");
    const stars = document.createElement("div");
    const name = document.createElement("h3");
    const text = document.createElement("p");
    card.className = "testimonial-card";
    card.dataset.reviewLanguage = review.language || "";
    stars.className = "testimonial-stars";
    stars.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);
    name.textContent = review.name;
    text.textContent = review.text || "";

    card.append(stars, name, text);
    list.appendChild(card);
  });
};

const setupTestimonialsList = (list) => {
  const cards = Array.from(list.querySelectorAll(".testimonial-card"));
  const section = list.closest(".testimonials-section");
  const showMoreLabel = list.dataset.showMoreLabel || "Show more reviews";
  const hideLabel = list.dataset.hideLabel || "Hide reviews";
  const initialVisibleCount = 3;
  const pageSize = 10;
  let pagination = null;
  let currentVisibleCards = cards.slice(0, initialVisibleCount);

  if (cards.length <= initialVisibleCount) {
    return;
  }

  const applyVisibleCards = (visibleCards) => {
    cards.forEach((card) => {
      const isVisible = visibleCards.includes(card);
      card.hidden = !isVisible;
    });
  };

  const setVisibleCards = (visibleCards) => {
    currentVisibleCards = visibleCards;
    applyVisibleCards(visibleCards);
  };

  const scrollToTestimonials = () => {
    if (!section) {
      return;
    }

    window.setTimeout(() => {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const measureListHeight = (visibleCards) => {
    const previousHeight = list.style.height;
    const previousOverflow = list.style.overflow;
    const previousTransition = list.style.transition;
    const previousVisibility = list.style.visibility;

    list.style.height = "auto";
    list.style.overflow = "visible";
    list.style.transition = "none";
    list.style.visibility = "hidden";
    applyVisibleCards(visibleCards);

    const height = list.scrollHeight;

    applyVisibleCards(currentVisibleCards);
    list.style.height = previousHeight;
    list.style.overflow = previousOverflow;
    list.style.transition = previousTransition;
    list.style.visibility = previousVisibility;

    return height;
  };

  const animateToCards = (visibleCards, options = {}) => {
    const shouldScroll = options.scroll || false;
    const afterUpdate = options.afterUpdate;
    const startHeight = list.offsetHeight;
    const endHeight = measureListHeight(visibleCards);
    const isShrinking = endHeight < startHeight;

    list.style.height = `${startHeight}px`;
    list.style.overflow = "hidden";

    if (!isShrinking) {
      setVisibleCards(visibleCards);
      if (afterUpdate) {
        afterUpdate();
      }
    }

    if (shouldScroll) {
      scrollToTestimonials();
    }

    requestAnimationFrame(() => {
      list.style.transition = "height 0.35s ease";
      list.style.height = `${endHeight}px`;
    });

    window.setTimeout(() => {
      if (isShrinking) {
        setVisibleCards(visibleCards);
        if (afterUpdate) {
          afterUpdate();
        }
      }

      list.style.height = "";
      list.style.overflow = "";
      list.style.transition = "";
    }, 380);
  };

  setVisibleCards(cards.slice(0, initialVisibleCount));

  const action = document.createElement("div");
  action.className = "testimonials-action";

  const button = document.createElement("button");
  button.className = "show-more-reviews";
  button.type = "button";
  button.textContent = showMoreLabel;

  const collapseReviews = () => {
    animateToCards(cards.slice(0, initialVisibleCount), {
      scroll: true,
      afterUpdate: () => {
        if (pagination) {
          pagination.remove();
          pagination = null;
        }

        button.textContent = showMoreLabel;
        button.classList.remove("expanded");
      },
    });
  };

  button.addEventListener("click", () => {
    const isExpanded = button.classList.contains("expanded");

    if (isExpanded) {
      collapseReviews();
      return;
    }

    if (cards.length <= pageSize) {
      animateToCards(cards, {
        afterUpdate: () => {
          button.textContent = hideLabel;
          button.classList.add("expanded");
        },
      });
      return;
    }

    button.textContent = hideLabel;
    button.classList.add("expanded");

    const totalPages = Math.ceil(cards.length / pageSize);
    pagination = document.createElement("div");
    pagination.className = "testimonials-pagination";

    const setActivePage = (page) => {
      pagination.querySelectorAll(".pagination-btn").forEach((pageButton) => {
        const isActive = Number(pageButton.dataset.page) === page;
        pageButton.classList.toggle("active", isActive);
        pageButton.setAttribute("aria-current", isActive ? "page" : "false");
      });
    };

    const getPageCards = (page) => {
      const start = (page - 1) * pageSize;
      return cards.slice(start, start + pageSize);
    };

    for (let page = 1; page <= totalPages; page += 1) {
      const pageButton = document.createElement("button");
      pageButton.className = "pagination-btn";
      pageButton.type = "button";
      pageButton.dataset.page = String(page);
      pageButton.textContent = String(page);

      pageButton.addEventListener("click", () => {
        animateToCards(getPageCards(page), {
          scroll: true,
          afterUpdate: () => {
            setActivePage(page);
          },
        });
      });

      pagination.appendChild(pageButton);
    }

    list.after(pagination);
    animateToCards(getPageCards(1), {
      afterUpdate: () => {
        setActivePage(1);
      },
    });
  });

  action.appendChild(button);
  list.after(action);
};

const initTestimonials = async () => {
  if (!testimonialLists.length) {
    return;
  }

  try {
    if (window.loadReviews) {
      siteReviews = await window.loadReviews();
    }
  } catch (error) {
    console.error(error);
  }

  testimonialLists.forEach((list) => {
    renderReviews(list, siteReviews);
    setupTestimonialsList(list);
  });
};

initTestimonials();

const copyToClipboard = async (value) => {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch (error) {
      // Fall back for local file previews or browsers that block clipboard access.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    const originalTitle = button.getAttribute("title");
    const doneText = button.dataset.done || "Copied";

    try {
      await copyToClipboard(value);
      button.setAttribute("title", doneText);
      button.classList.add("copied");

      setTimeout(() => {
        button.setAttribute("title", originalTitle);
        button.classList.remove("copied");
      }, 1600);
    } catch (error) {
      button.setAttribute("title", originalTitle);
    }
  });
});
