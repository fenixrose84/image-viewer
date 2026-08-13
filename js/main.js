const dropArea = document.getElementById("drop-area");
const inputScreen = document.querySelector(".input-screen");
const imageInput = inputScreen.querySelector(".image-input input");
const imageScreen = document.querySelector(".image-screen");
const panzoomArea = document.getElementById("panzoom-area");
const imageContainer = document.getElementById("image-container");
const imageEl = imageContainer.querySelector("img");
const controlBar = document.querySelector(".control-bar");

let currentFiles = [];
let currentFile = -1;
let isImageDisplayed = false;
let jitterInterval = null;
let isJittering = false;
let animationDuration = 0;
let carouselMode = false;
let carouselInterval = null;
let isCoverMode = true;

const panzoom = Panzoom(imageEl, {
  minScale: 0.5,
  maxScale: 5,
  contain: false,
  cursor: "grab",
});

imageEl.addEventListener("wheel", panzoom.zoomWithWheel);

function toggleImageFit() {
  if (!isImageDisplayed) return;

  imageEl.style.transform = null;

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const imgW = imageEl.getBoundingClientRect().width;
  const imgH = imageEl.getBoundingClientRect().height;

  const scaleX = screenW / imgW;
  const scaleY = screenH / imgH;

  const scale = isCoverMode ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);

  panzoom.pan(0, 0);
  panzoom.zoom(scale);

  isCoverMode = !isCoverMode;
}

function handleDrop(event) {
  event.preventDefault();

  const files = event.dataTransfer.files;
  handleFiles(files);
}

function handleFiles(files) {
  if (files.length <= 0) return;

  files = Array.from(files);
  currentFiles = files.filter((file) => file.type.startsWith("image/"));

  displayImage(0);
}

async function displayImage(direction = 0, shouldStopAnimation = true) {
  if (shouldStopAnimation) {
    if (animationDuration) stopAnimation();
    if (isJittering) toggleJitter();
  }

  direction = Math.sign(direction);

  let fileIndex = 0;
  if (direction) {
    fileIndex = wrap(currentFile + direction, 0, currentFiles.length - 1);
  }

  currentFile = fileIndex;
  const file = currentFiles[currentFile];
  imageInput.value = "";
  imageEl.src = await getFileDataUrl(file);
  changeScreen("image-screen");
  isImageDisplayed = true;
  isCoverMode = true;
  toggleImageFit();
}

function goHome() {
  if (animationDuration) stopAnimation();
  if (isJittering) toggleJitter();

  changeScreen("input-screen");
  imageEl.src = "";
  isImageDisplayed = false;
}

function toggleCarouselMode() {
  if (!isImageDisplayed) return;
  if (currentFiles.length <= 1) return;

  carouselMode = !carouselMode;

  clearInterval(carouselInterval);

  if (carouselMode) carouselInterval = setInterval(() => displayImage(currentFile + 1, false), 60000);
}

function changeAnimation() {
  if (!isImageDisplayed) return;

  let duration = parseFloat((animationDuration - 0.2).toFixed(1));
  if (duration < 0) duration = 0.8;
  animationDuration = duration;

  const shouldAnimate = animationDuration > 0;
  !isJittering && shouldAnimate ? toggleJitter(true) : toggleJitter(false);
  imageContainer.style.animation = shouldAnimate ? `shaking ${animationDuration}s ease-in-out infinite` : null;
}

function stopAnimation() {
  animationDuration = 0;
  imageContainer.style.animation = null;
}

function toggleJitter(force) {
  if (!isImageDisplayed) return;
  if (!isJittering && force === false) return;
  if (isJittering && force === true) return;

  if (isJittering) {
    isJittering = false;
    clearInterval(jitterInterval);
    imageContainer.style.transform = null;
    return;
  }

  isJittering = true;

  clearInterval(jitterInterval);
  jitterInterval = setInterval(jitter, 500);
}

function jitter() {
  const x = Math.random() * 10;
  const y = Math.random() * 10;
  const scale = 1 + Math.random() * 0.02;

  imageContainer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
}

function moveImage(x, y) {
  panzoom.pan(x, y, { relative: true });
}

const keyActions = {
  Space: () => displayImage(currentFile + 1),
  KeyF: toggleFullscreen,
  KeyC: toggleImageFit,
  KeyA: changeAnimation,
  KeyJ: toggleJitter,
  Equal: () => zoom(-1),
  BracketRight: () => zoom(-1),
  Minus: () => zoom(1),
  BracketLeft: () => zoom(1),
  ArrowUp: () => moveImage(0, -10),
  ArrowDown: () => moveImage(0, 10),
  ArrowLeft: () => moveImage(-10, 0),
  ArrowRight: () => moveImage(10, 0),
};

document.addEventListener("keydown", (event) => {
  const action = keyActions[event.code];
  if (action) {
    event.preventDefault();
    action();
  }
});

document.addEventListener("click", function (e) {
  if (!controlBar.contains(e.target)) {
    const isCBHidden = controlBar.classList.contains("hidden-sm");

    if (animationDuration !== 0 && isCBHidden) changeAnimation();

    if (animationDuration === 0 || !isCBHidden) controlBar.classList.toggle("hidden-sm");
  }
});
