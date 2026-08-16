const dropArea = document.getElementById("drop-area");
const inputScreen = document.querySelector(".input-screen");
const imageInput = inputScreen.querySelector(".image-input input");
const imageScreen = document.querySelector(".image-screen");
const panzoomArea = document.getElementById("panzoom-area");
const imageOuter = document.querySelector(".image-outer")
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
let coverScale = 1;

const panzoom = Panzoom(imageContainer, {
  minScale: 0.5,
  maxScale: 5,
  contain: false,
  cursor: "grab",
});

imageContainer.addEventListener("wheel", panzoom.zoomWithWheel);

window.addEventListener("resize", () => {
  updateCoverScale();
});

function updateCoverScale() {
  const containerWidth = imageContainer.clientWidth;
  const containerHeight = imageContainer.clientHeight;

  const imageRatio = imageEl.naturalWidth / imageEl.naturalHeight;
  const containerRatio = containerWidth / containerHeight;

  let displayedWidth;
  let displayedHeight;

  if (imageRatio > containerRatio) {
    displayedWidth = containerWidth;
    displayedHeight = containerWidth / imageRatio;
  } else {
    displayedHeight = containerHeight;
    displayedWidth = containerHeight * imageRatio;
  }

  coverScale = Math.max(containerWidth / displayedWidth, containerHeight / displayedHeight);
}

function toggleImageFit(forceCover = false) {
  if (!isImageDisplayed) return;

  isCoverMode = forceCover ? true : !isCoverMode;

  panzoom.pan(0, 0);
  panzoom.zoom(isCoverMode ? coverScale : 1);
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
  currentFiles = shuffle(currentFiles);

  displayImage(0);
  toggleFullscreen(true);
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
  const imageUrl = await getFileDataUrl(file);
  await setImageSrc(imageEl, imageUrl);
  changeScreen("image-screen");
  isImageDisplayed = true;
  isCoverMode = true;
  updateCoverScale();
  toggleImageFit();
}

function goHome() {
  if (animationDuration) stopAnimation();
  if (isJittering) toggleJitter();

  changeScreen("input-screen");
  imageEl.src = "";
  isImageDisplayed = false;
  toggleFullscreen(false);
}

function toggleCarouselMode() {
  if (!isImageDisplayed) return;
  if (currentFiles.length <= 1) return;

  carouselMode = !carouselMode;

  clearInterval(carouselInterval);

  if (carouselMode) carouselInterval = setInterval(() => displayImage(currentFile + 1, false), 60000);
}

function changeAnimation() {
  if (!isImageDisplayed || isJittering) return;

  let duration = parseFloat((animationDuration - 0.2).toFixed(1));
  if (duration < 0) duration = 0.8;
  animationDuration = duration;

  const shouldAnimate = animationDuration > 0;
  !isJittering && shouldAnimate ? toggleJitter(true, { x: 2, y: 5 }) : toggleJitter(false);
  imageOuter.style.animation = shouldAnimate ? `shaking ${animationDuration}s ease-in-out infinite` : null;
  if (shouldAnimate) toggleControlBar(false);
}

function stopAnimation() {
  animationDuration = 0;
  imageOuter.style.animation = null;
}

function toggleJitter(force, transform = {}) {
  if (!isImageDisplayed || animationDuration > 0) return;
  if (!isJittering && force === false) return;
  if (isJittering && force === true) return;

  const { x, y, scale } = transform;

  isJittering = force != null ? force : !isJittering;
  if (!isJittering) {
    clearInterval(jitterInterval);
    imageEl.style.transform = null;
  } else {
    clearInterval(jitterInterval);
    jitterInterval = setInterval(() => jitter(x, y, scale), 500);
  }

  imageEl.style.transition = isJittering ? "1s" : "";
}

function jitter(strengthX = 10, strengthY = 10, scale = 1) {
  const x = Math.random() * strengthX;
  const y = Math.random() * strengthY;
  const newScale = scale + Math.random() * 0.02;

  imageEl.style.transform = `translate(${x}px, ${y}px) scale(${newScale})`;
}

function moveImage(x, y) {
  panzoom.pan(x, y, { relative: true });
}

function toggleControlBar(force) {
  controlBar.classList.toggle("sm-hidden", force != null ? !force : undefined);
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
  if (!controlBar.contains(e.target) && animationDuration > 0) changeAnimation();

  if (!controlBar.contains(e.target) && isImageDisplayed && animationDuration === 0) toggleControlBar();
});
