const stars = document.querySelectorAll(".rating span");
const ratingInput = document.getElementById("ratingValue");

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

const track = document.querySelector(".testimonials-track");
const prevBtn = document.querySelector(".slider-btn.prev");
const nextBtn = document.querySelector(".slider-btn.next");

if (track && prevBtn && nextBtn) {
  prevBtn.addEventListener("click", () => {
    track.scrollBy({
      left: -300,
      behavior: "smooth",
    });
  });

  nextBtn.addEventListener("click", () => {
    track.scrollBy({
      left: 300,
      behavior: "smooth",
    });
  });
}