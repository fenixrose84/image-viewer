window.addEventListener("error", (event) => {
  const error = `${event.type}: ${event.message}`;
  console.error(error);
  Toast.show(error);
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wrap(value, min, max) {
  const range = max - min + 1;
  return ((((value - min) % range) + range) % range) + min;
}

function hide(element) {
  element.classList.add("hidden");
}

function show(element) {
  element.classList.remove("hidden");
}

function blink(element) {
  element.classList.add("hidden");

  setTimeout(() => element.classList.remove("hidden"), 100);
}

function save(key, value) {
  localStorage.setItem(`${projectName}_${key}`, JSON.stringify(value));
}

function load(key, defaultValue) {
  const savedValue = localStorage.getItem(`${projectName}_${key}`);
  if (savedValue == null) return defaultValue;
  return JSON.parse(savedValue);
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

function getFileName(file) {
  const encoded = file.name;
  const decoded = decodeURIComponent(encoded);
  const fileName = decoded.split("/").pop();

  return fileName;
}

function getFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function changeScreen(screenName) {
  document.querySelectorAll(".screen").forEach((element) => {
    element.classList.add("hidden");
  });

  document.querySelector(`.screen.${screenName}`).classList.remove("hidden");
}

function toggleFullscreen(force) {
  if (document.fullscreenElement && force !== true) {
    document.exitFullscreen();
  } else if (force !== false) {
    document.documentElement.requestFullscreen();
  }
}

function setImageSrc(imageEl, src) {
  return new Promise((resolve, reject) => {
    imageEl.onload = () => resolve(imageEl);
    imageEl.onerror = reject;
    imageEl.src = src;
  });
}

function shuffle(array) {
  const arr = [...array]; // don't modify the original

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}
