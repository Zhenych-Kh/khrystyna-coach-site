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