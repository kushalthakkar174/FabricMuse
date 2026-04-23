// Animated Counters
document.addEventListener("DOMContentLoaded", () => {
  const counters = document.querySelectorAll(".counter");

  counters.forEach(counter => {
    const target = +counter.getAttribute("data-target");
    let count = 0;
    const speed = 20;

    const update = () => {
      const increment = target / 100;
      if (count < target) {
        count += increment;
        counter.innerText = Math.floor(count);
        setTimeout(update, speed);
      } else {
        counter.innerText = target;
      }
    };

    update();
  });
});