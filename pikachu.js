// 21130506_Nguyễn_Ngọc_Quý_0931089737_DH21DTC
// Mảng chứa đường dẫn của các hình ảnh
const imagePaths = Array.from(
  { length: 42 },
  (_, i) => `./imgPikachu/${i + 1}.png`
);

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

function createPairedPieces(pairCount) {
  const pieces = [];
  for (let pairIndex = 0; pairIndex < pairCount; pairIndex++) {
    const imagePath = imagePaths[pairIndex % imagePaths.length];
    pieces.push(imagePath, imagePath);
  }
  return shuffle(pieces);
}

function createPairCounts(total) {
  const counts = Array(imagePaths.length).fill(0);
  for (let pairIndex = 0; pairIndex < total / 2; pairIndex++) {
    counts[pairIndex % imagePaths.length] += 2;
  }
  return counts;
}

function getBoardDimensions(level) {
  const pairCount = Math.min(160, 10 + Math.floor((level - 1) * 1.5));
  let totalCells = pairCount * 2;
  const maxColumns = window.innerWidth <= 900 ? 16 : 20;
  const possibleColumns = [];

  while (totalCells <= 320) {
    possibleColumns.length = 0;
    for (let columns = 4; columns <= maxColumns; columns++) {
      if (totalCells % columns === 0) possibleColumns.push(columns);
    }
    const widestColumns = possibleColumns[possibleColumns.length - 1];
    const widestRows = widestColumns ? totalCells / widestColumns : Infinity;
    if (possibleColumns.length > 0 && widestColumns / widestRows >= 0.75) {
      break;
    }
    totalCells += 2;
  }

  const columns = possibleColumns.reduce((best, candidate) => {
    const bestRows = totalCells / best;
    const candidateRows = totalCells / candidate;
    return Math.abs(candidate / candidateRows - 1.8) <
      Math.abs(best / bestRows - 1.8)
      ? candidate
      : best;
  }, possibleColumns[0] || 4);

  return { columns, rows: totalCells / columns };
}

// 100 level; mỗi kiểu chơi được dùng trong 15 level liên tiếp.
const TOTAL_LEVELS = 100;
const TOTAL_LEVEL_TYPES = 6;
const LEVELS_PER_TYPE = 15;
const LEVEL_TIME_SECONDS = 10 * 60;
const FULL_TIMELINE_WIDTH = 450;
const GAME_PROGRESS_STORAGE_KEY = "pikachuGameProgress";
const LEVEL_TYPES_STORAGE_KEY = "pikachuLevelTypes_v2";

function getStoredJson(key, fallbackValue) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallbackValue;
  } catch (error) {
    console.warn(`Không thể đọc localStorage: ${key}`, error);
    return fallbackValue;
  }
}

function setStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Không thể lưu localStorage: ${key}`, error);
  }
}

function createLevelTypes() {
  return Array.from({ length: TOTAL_LEVELS }, (_, index) =>
    Math.min(
      TOTAL_LEVEL_TYPES,
      Math.floor(index / LEVELS_PER_TYPE) + 1
    )
  );
}

const storedLevelTypes = getStoredJson(LEVEL_TYPES_STORAGE_KEY, null);
const levelTypes =
  Array.isArray(storedLevelTypes) && storedLevelTypes.length === TOTAL_LEVELS
    ? storedLevelTypes
    : createLevelTypes();
setStoredJson(LEVEL_TYPES_STORAGE_KEY, levelTypes);

function getSavedGameProgress() {
  const savedProgress = getStoredJson(GAME_PROGRESS_STORAGE_KEY, {});
  return {
    level: Math.min(
      TOTAL_LEVELS,
      Math.max(1, parseInt(savedProgress.level, 10) || 1)
    ),
    score: Math.max(0, parseInt(savedProgress.score, 10) || 0),
  };
}

function saveGameProgress() {
  if (!currentLevel || !score) return;
  setStoredJson(GAME_PROGRESS_STORAGE_KEY, {
    level: parseInt(currentLevel, 10),
    score: parseInt(score.textContent, 10) || 0,
  });
}

// số hàng và số cột qui định
const initialBoardDimensions = getBoardDimensions(getSavedGameProgress().level);
let numCols = initialBoardDimensions.columns;
let numRows = initialBoardDimensions.rows;

// Lấy ra board
const board = document.querySelector(".board");
const boardContainer = document.querySelector(".container");
let boardWidth = numCols * 48;
let boardHeight = numRows * 48;

// thiết lập lại kích thước của board khi biết số hàng và cột
board.style.width = boardWidth + "px";
board.style.height = boardHeight + "px";

function resizeBoard() {
  const forcedLandscape =
    window.innerWidth <= 1024 && window.innerHeight > window.innerWidth;
  const layoutWidth = forcedLandscape ? window.innerHeight : window.innerWidth;
  const availableWidth = Math.max(1, layoutWidth - 16);
  const scale = Math.min(1, availableWidth / boardWidth);

  board.style.transform = `scale(${scale})`;
  board.style.transformOrigin = "top left";
  board.style.marginLeft = `${Math.max(
    0,
    (boardContainer.clientWidth - boardWidth * scale) / 2
  )}px`;
  const containerPadding = window.innerWidth <= 1024 ? 16 : 40;
  boardContainer.style.height = `${boardHeight * scale + containerPadding}px`;
}

function rebuildBoardForLevel(level) {
  const dimensions = getBoardDimensions(level);
  numCols = dimensions.columns;
  numRows = dimensions.rows;
  boardWidth = numCols * 48;
  boardHeight = numRows * 48;

  board.querySelectorAll(".cell").forEach((cell) => cell.remove());
  board.style.width = boardWidth + "px";
  board.style.height = boardHeight + "px";

  for (let row = 1; row <= numRows; row++) {
    for (let col = 1; col <= numCols; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = ((row - 1) * numCols + col).toString();
      cell.textContent = "1";
      board.appendChild(cell);
    }
  }

  cells = document.querySelectorAll(".cell");
  initializeBoardUI();
  resizeBoard();
}

window.addEventListener("resize", resizeBoard);
resizeBoard();

for (let row = 1; row <= numRows; row++) {
  for (let col = 1; col <= numCols; col++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.id = ((row - 1) * numCols + col).toString();
    cell.textContent = "1";
    board.appendChild(cell);
  }
}

let cells = document.querySelectorAll(".cell");
function initializeBoardUI() {
  let leftOffset = 0;
  let topOffset = 0;
  let cellCount = 0;
  cells.forEach((cell) => {
    cell.style.left = leftOffset + "px";
    cell.style.top = topOffset + "px";
    leftOffset += 48;
    cellCount++;
    if (cellCount >= numCols) {
      topOffset += 48;
      leftOffset = 0;
      cellCount = 0;
    }
  });
}

function convertMatrixToCell(x, y) {
  return cells[numCols * (x - 1) + (y - 1)];
}

let matrix = [];
for (let row = 0; row < numRows + 2; row++) {
  matrix[row] = [];
  for (let col = 0; col < numCols + 2; col++) {
    matrix[row][col] =
      row === 0 || row === numRows + 1 || col === 0 || col === numCols + 1
        ? "0"
        : convertMatrixToCell(row, col).textContent;
  }
}

let soundButton = document.getElementById("soundButton");
let volumeIcon = document.getElementById("volumeIcon");
let isMuted = false;
let audioBackground = document.getElementById("myAudio");
const initialMusicSource = audioBackground.getAttribute("src") || "sound/dimejack0.mp3";
const backgroundMusicPlaylist = [
  initialMusicSource,
  "sound/dimejack1.mp3",
  "sound/dimejack2.mp3",
  "sound/dimejack3.mp3",
  "sound/dimejack4.mp3",
  "sound/dimejack5.mp3",
];
let currentMusicIndex = -1;

function playRandomBackgroundMusic() {
  let nextIndex = Math.floor(Math.random() * backgroundMusicPlaylist.length);
  if (backgroundMusicPlaylist.length > 1) {
    while (nextIndex === currentMusicIndex) {
      nextIndex = Math.floor(Math.random() * backgroundMusicPlaylist.length);
    }
  }
  currentMusicIndex = nextIndex;
  audioBackground.src = backgroundMusicPlaylist[currentMusicIndex];
  audioBackground.currentTime = 0;
  if (!isMuted) audioBackground.play().catch(() => {});
}

function requestLandscapeOrientation() {
  if (screen.orientation?.lock) {
    screen.orientation.lock("landscape").catch(() => {});
  }
}

soundButton.addEventListener("click", function () {
  isMuted = !isMuted;
  if (isMuted) {
    audioBackground.pause();
    volumeIcon.classList.add("muted");
  } else {
    audioBackground.play().catch(() => {});
    volumeIcon.classList.remove("muted");
  }
});
audioBackground.addEventListener("ended", playRandomBackgroundMusic);
audioBackground.volume = 0.3;

let soundBtn = document.querySelector(".soundBtn");
let soundCell = document.querySelector(".soundCell");
let soundWrongChoose = document.querySelector(".wrongChoose");
let soundTrueChoose = document.querySelector(".trueChoose");
let victory = document.querySelector(".victory");
soundTrueChoose.volume = 0.5;
soundWrongChoose.volume = 0.5;

let interface = document.querySelector(".interface");
let board_guide = document.querySelector(".board_guide");
let board_pause = document.querySelector(".board_pause");
let board_lose = document.querySelector(".board_lose");
let board_win = document.querySelector(".board_win");
let board_level_complete = document.querySelector(".board_level_complete");
let completedLevel = document.querySelector(".completedLevel");
let next_level_button = document.querySelector(".next_level_button");
let btnClose = board_guide.querySelector("button");
let opacity_bgk = document.querySelector(".opacity_bgk");
let opacity_bgk1 = document.querySelector(".opacity_bgk1");
let opacity_bgk2 = document.querySelector(".opacity_bgk2");
let btn_start = document.querySelector(".btn_start");
let btn_guide = document.querySelector(".btn_guide");
let board_guide_lv4 = document.querySelector(".board_guide_lv4");
let board_guide_lv5 = document.querySelector(".board_guide_lv5");
let board_guide_lv6 = document.querySelector(".board_guide_lv6");
let imgGuide = document.querySelector(".imgGuide");
let timeline = document.querySelector(".timeline");
let currentWidth = parseFloat(window.getComputedStyle(timeline).width);
let targetWidth = 0;

btn_start.addEventListener("click", function () {
  requestLandscapeOrientation();
  soundBtn.play().catch(() => {});
  if (currentMusicIndex === -1) playRandomBackgroundMusic();
  else audioBackground.play().catch(() => {});
  volumeIcon.classList.remove("muted");
  setTimeout(() => {
    interface.style.display = "none";
    initializeGame();
  }, 100);
});
btn_guide.addEventListener("click", function () {
  soundBtn.play().catch(() => {});
  board_guide.style.display = "block";
  opacity_bgk.style.display = "block";
});
btnClose.addEventListener("click", function () {
  soundBtn.play().catch(() => {});
  board_guide.style.display = "none";
  opacity_bgk.style.display = "none";
  if (interface.style.display === "none") board_pause.style.display = "block";
});

let infBoard = document.querySelector(".opacity_bgk0");
window.onclick = function (event) {
  if (event.target === infBoard) infBoard.style.display = "none";
  if (event.target === opacity_bgk) {
    board_guide.style.display = "none";
    opacity_bgk.style.display = "none";
  }
  if (event.target === imgGuide) imgGuide.style.display = "none";
};

// hàm ràng buộc điều kiện khi nào mới được reload nếu còn nhiều qá thì không reload
// function conditionReload() {
//   let reload = reloads[0];
//   //   let remainCell = 0;
//   //   // chạy lại để lấy số lượng thẻ còn lại (total phải luôn chẵn)
//   //   cells.forEach((cell) => {
//   //     if (cell.style.visibility !== "hidden") remainCell += 1;
//   //   });
//   //   if (remainCell > 80) {
//   //     reload.style.color = "rgba(0,0,0,0.5)";
//   //     reload.style.cursor = "auto";
//   //     reload.setAttribute("title", "không được thay đổi");
//   //     reload.removeEventListener("click", reRenderBoardIMG);
//   //   } else {
//   reRenderBoardIMG;
//   //   }
function help() {
  const remainingCells = Array.from(cells).filter(
    (cell) => cell.style.visibility !== "hidden"
  );
  for (let firstIndex = 0; firstIndex < remainingCells.length - 1; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < remainingCells.length; secondIndex++) {
      const firstCell = remainingCells[firstIndex];
      const secondCell = remainingCells[secondIndex];
      const firstId = parseInt(firstCell.getAttribute("id"), 10) - 1;
      const secondId = parseInt(secondCell.getAttribute("id"), 10) - 1;
      const firstPosition = [Math.floor(firstId / numCols) + 1, (firstId % numCols) + 1];
      const secondPosition = [Math.floor(secondId / numCols) + 1, (secondId % numCols) + 1];
      if (
        firstCell.style.backgroundImage === secondCell.style.backgroundImage &&
        findPath(...firstPosition, ...secondPosition) !== null
      ) {
        firstCell.style.opacity = "0.6";
        secondCell.style.opacity = "0.6";
        firstCell.style.outline = "5px solid rgba(96, 231, 84, 0.8)";
        secondCell.style.outline = "5px solid rgba(96, 231, 84, 0.8)";
        return;
      }
    }
  }
  reRenderBoardIMG();
}

function hasAvailableMove() {
  const remainingCells = Array.from(cells).filter(
    (cell) => cell.style.visibility !== "hidden"
  );

  for (let firstIndex = 0; firstIndex < remainingCells.length - 1; firstIndex++) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < remainingCells.length;
      secondIndex++
    ) {
      const firstCell = remainingCells[firstIndex];
      const secondCell = remainingCells[secondIndex];
      if (firstCell.style.backgroundImage !== secondCell.style.backgroundImage) {
        continue;
      }

      const firstId = parseInt(firstCell.getAttribute("id"), 10) - 1;
      const secondId = parseInt(secondCell.getAttribute("id"), 10) - 1;
      const firstPosition = [
        Math.floor(firstId / numCols) + 1,
        (firstId % numCols) + 1,
      ];
      const secondPosition = [
        Math.floor(secondId / numCols) + 1,
        (secondId % numCols) + 1,
      ];

      if (findPath(...firstPosition, ...secondPosition) !== null) {
        return true;
      }
    }
  }

  return false;
}

function shuffleIfNoAvailableMove() {
  const remainingCells = Array.from(cells).filter(
    (cell) => cell.style.visibility !== "hidden"
  );
  if (remainingCells.length > 0 && !hasAvailableMove()) {
    reRenderBoardIMG();
  }
}
// hàm thay đổi trạng thái khi click reload board khi đủ điều kiện
function canReload() {
  numHelp.textContent = "5";
  numReload.textContent = "5";
  board_lose.style.display = "none";
  opacity_bgk2.style.display = "none";
  board_win.style.display = "none";
  board_guide_lv4.style.display = "none";
  board_guide_lv5.style.display = "none";
  board_guide_lv6.style.display = "none";
  updateCellIds();
  initializeBoardIMG();
  initializeScore();
  restoreBoard();
  resetTimeline();
  resetButtonLevel();
  checkLevel();
  initializeTimeLine();
}

//header
let pause = document.querySelector(".fa-pause");
let houses = document.querySelectorAll(".fa-house");
let resume = document.querySelector(".fa-play");
let tip = document.querySelector(".fa-lightbulb");
let numHelp = document.querySelector(".numHelp");
let bookGuide = document.querySelector(".fa-book-tanakh");
let reloads = document.querySelectorAll(".fa-rotate-left");
let numReload = document.querySelector(".numReload");
tip.addEventListener("click", function () {
  numHelp.textContent = parseFloat(numHelp.textContent) - 1;
  if (parseFloat(numHelp.textContent) > 0) {
    help();
  } else {
    tip.style.cursor = "auto";
    tip.style.color = "rgba(0,0,0,0.5)";
    tip.setAttribute("title", "Hết lượt gợi ý");
    numHelp.textContent = 0;
  }
});
reloads.forEach((reload) => {
  if (
    reload.parentNode.className == "board_lose" ||
    reload.parentNode.className == "board_win"
  ) {
    reload.addEventListener("click", canReload);
  } else {
    reload.addEventListener("click", function () {
      numReload.textContent = parseFloat(numReload.textContent) - 1;
      if (parseFloat(numReload.textContent) > 0) {
        reRenderBoardIMG();
      } else {
        reload.style.cursor = "auto";
        reload.style.color = "rgba(0,0,0,0.5)";
        reload.setAttribute("title", "không được thay đổi");
        numReload.textContent = 0;
      }
    });
  }
});
pause.addEventListener("click", function () {
  soundBtn.play();
  board_pause.style.display = "block";
  stopTimeLine();
});
houses.forEach((house) => {
  house.addEventListener("click", function () {
    soundBtn.play();
    audioBackground.pause();
    opacity_bgk2.style.display = "none";
    board_pause.style.display = "none";
    board_win.style.display = "none";
    interface.style.display = "block";
    board_guide_lv4.style.display = "none";
    board_guide_lv5.style.display = "none";
    board_guide_lv6.style.display = "none";
  });
});
resume.addEventListener("click", function () {
  soundBtn.play();
  board_pause.style.display = "none";
  if (running == false) {
    running = true;
    initializeTimeLine();
  }
});
bookGuide.addEventListener("click", function () {
  soundBtn.play();
  board_pause.style.display = "none";
  board_guide.style.display = "block";
});

// sự kiện đổi level thủ công
function createLevelButtons() {
  const existingButtons = Array.from(document.querySelectorAll(".btn"));
  if (existingButtons.length === 0) return;

  const buttonTemplate = existingButtons[0];
  const buttonContainer = buttonTemplate.parentElement;

  for (let level = existingButtons.length + 1; level <= TOTAL_LEVELS; level++) {
    const button = buttonTemplate.cloneNode(true);
    buttonContainer.appendChild(button);
  }

  Array.from(document.querySelectorAll(".btn")).forEach((button, index) => {
    const level = index + 1;
    button.id = level.toString();
    button.dataset.level = level.toString();
    button.className = button.className.replace(/btn-level\d+/g, "").trim();
    button.classList.add(`btn-level${level}`);
    button.textContent = level.toString();
    button.title = `Level ${level} - kiểu chơi ${levelTypes[index]}`;
  });
}

createLevelButtons();
let listBtnLevel = document.querySelectorAll(".btn");

function getLevelType(level = currentLevel) {
  const levelNumber = Math.min(
    TOTAL_LEVELS,
    Math.max(1, parseInt(level || "1", 10))
  );
  return levelTypes[levelNumber - 1];
}

function hideAllLevelGuides() {
  board_guide_lv4.style.display = "none";
  board_guide_lv5.style.display = "none";
  board_guide_lv6.style.display = "none";
}

function initializeBoardForCurrentLevel() {
  rebuildBoardForLevel(parseInt(currentLevel, 10) || 1);
  const levelType = getLevelType();
  hideAllLevelGuides();
  countCheckTrue = 0;

  if (levelType === 4) {
    board_guide_lv4.style.display = "block";
    initializeBoardIMGOfLevel5(10);
  } else if (levelType === 5) {
    board_guide_lv5.style.display = "block";
    initializeBoardIMGOfLevel5(10);
  } else if (levelType === 6) {
    board_guide_lv6.style.display = "block";
    initializeBoardIMGOfLevel5(16);
  } else {
    initializeBoardIMG();
  }
}

// sự kiện click vào nút chọn level và chuyển tới level và mức chơi mới
function resetButtonLevel() {
  firstClicked = null;
  const selectedLevel = parseInt(currentLevel, 10) || getSavedGameProgress().level;
  listBtnLevel.forEach((btn) => {
    if (parseInt(btn.getAttribute("id"), 10) === selectedLevel) {
      btn.classList.add("choosed");
    } else {
      btn.classList.remove("choosed");
    }
    btn.addEventListener("click", function () {
      numHelp.textContent = "5";
      tip.style.cursor = "pointer";
      tip.style.color = "white";
      tip.setAttribute("title", "Gợi ý");
      numReload.textContent = "5";
      reloads[0].style.color = "white";
      reloads[0].style.cursor = "pointer";
      reloads[0].setAttribute("title", "Thay đổi");
      listBtnLevel.forEach((otherBtn) => {
        otherBtn.classList.remove("choosed");
      });
      btn.classList.add("choosed");
      currentLevel = btn.getAttribute("id");
      saveGameProgress();
      initializeBoardForCurrentLevel();
      initializeBoardUI();
      initializeScore();
      restoreBoard();
      resetTimeline();
      initializeTimeLine();
      checkLevel();
      updateCellIds();
    });
  });
}

// thiết lập lại các giá trị của thời gian, điểm, hình ảnh của trò chơi
function setUpNextLevel() {
  initializeBoardForCurrentLevel();
  initializeBoardUI();
  restoreBoard();
  resetTimeline();
  initializeTimeLine();
  checkLevel();
  updateCellIds();
}

// Điểm
let score = document.querySelector(".score");
let loseScore = document.querySelector(".loseScore");

// Mọi thay đổi điểm số đều được lưu tự động.
const scoreObserver = new MutationObserver(() => saveGameProgress());
scoreObserver.observe(score, {
  childList: true,
  characterData: true,
  subtree: true,
});

// check level ?
let currentLevel;
function checkLevel() {
  listBtnLevel.forEach((btn) => {
    if (btn.classList.contains("choosed")) {
      console.log("checklevel " + btn.getAttribute("id"));
      setListenerFromLevel(btn.getAttribute("id"));
      currentLevel = btn.getAttribute("id");
      saveGameProgress();
    } else {
      console.log("errrorrr !!");
    }
  });
}

// thiết lập tự động đổi level khi đã hoàn thành level hiện tại dựa vào điểm số
function autoIncreaseLevel() {
  const remainingCells = Array.from(cells).filter(
    (cell) => cell.style.visibility !== "hidden"
  );
  if (remainingCells.length > 0) return;

  const nextLevel = parseInt(currentLevel, 10) + 1;
  if (nextLevel > TOTAL_LEVELS) {
    checkWinEndGame();
    return;
  }

  running = false;
  completedLevel.textContent = currentLevel;
  board_level_complete.style.display = "block";
  opacity_bgk2.style.display = "block";
}

function advanceToNextLevel() {
  const nextLevel = parseInt(currentLevel, 10) + 1;
  listBtnLevel.forEach((btn) => btn.classList.remove("choosed"));
  const nextButton = Array.from(listBtnLevel).find(
    (btn) => parseInt(btn.getAttribute("id"), 10) === nextLevel
  );
  if (!nextButton) return;

  nextButton.classList.add("choosed");
  currentLevel = nextLevel.toString();
  saveGameProgress();
  numHelp.textContent = parseFloat(numHelp.textContent) + 5;
  numReload.textContent = parseFloat(numReload.textContent) + 5;
  setUpNextLevel();
  setListenerFromLevel(currentLevel);
}

next_level_button.addEventListener("click", function () {
  board_level_complete.style.display = "none";
  opacity_bgk2.style.display = "none";
  advanceToNextLevel();
});

function checkWinEndGame() {
  victory.play().catch(() => {});
  opacity_bgk2.style.display = "block";
  board_win.style.display = "block";
  board_win.classList.remove("win-show");
  void board_win.offsetWidth;
  board_win.classList.add("win-show");
}

function handleCellClick(event) {
  const clickedCell = event.target;
  const level = getLevelType();
  soundCell.play().catch(() => {});
  const cellId = parseInt(clickedCell.getAttribute("id"), 10);
  const row = Math.floor((cellId - 1) / numCols) + 1;
  const col = ((cellId - 1) % numCols) + 1;
  clickedCell.classList.toggle("clicked");

  if (firstClicked === null) {
    firstClicked = clickedCell;
    locateFirst = [row, col];
    return;
  }

  const secondClicked = clickedCell;
  const locateSecond = [row, col];
  if (
    firstClicked !== secondClicked &&
    firstClicked.style.backgroundImage === secondClicked.style.backgroundImage
  ) {
    switch (level) {
      case 1:
        checkTrue(firstClicked, secondClicked, locateFirst, locateSecond);
        break;
      case 2:
        checkTrueLv2(firstClicked, secondClicked, locateFirst, locateSecond);
        break;
      case 3:
        checkTrueLv3(firstClicked, secondClicked, locateFirst, locateSecond);
        break;
      case 4:
        checkTrueLv4(firstClicked, secondClicked, locateFirst, locateSecond);
        break;
      case 5:
        checkTrueLv5(firstClicked, secondClicked, locateFirst, locateSecond);
        break;
      case 6:
        checkTrueLv7(firstClicked, secondClicked, locateFirst, locateSecond);
        break;
      default:
        break;
    }
  } else {
    firstClicked.classList.toggle("clicked");
    secondClicked.classList.toggle("clicked");
    soundWrongChoose.play().catch(() => {});
    if (level === 4 || level === 5 || level === 6) decreaseWidth();
  }

  firstClicked = null;
  autoIncreaseLevel();
  shuffleIfNoAvailableMove();
}

// sự kiện click chọn các thẻ
let firstClicked = null;
let locateFirst = [2];
function setListenerFromLevel(level) {
  console.log("level : " + level);
  cells.forEach((cell) => {
    cell.removeEventListener("click", handleCellClick);
    cell.addEventListener("click", handleCellClick);
  });
}

// hàm khởi tạo board && fix khi mà reload sẽ bỏ các thẻ bị ẩn để tránh việc lẻ thẻ
function initializeBoardIMG() {
  // mảng tạm tạo dùng để xóa cái img đã đủ sl khi khởi tạo (tránh việc random lẻ hình)
  let imagePathsCopy = [];

  let a = createPairCounts(numRows * numCols);
  for (let i = 0; i < a.length; i++) {
    // chạy số phần tử trong mảng a (vì mảng a là mảng số lượng ảnh)
    for (let j = 0; j < a[i]; j++) {
      // lấy từng phần tử 1 bỏ vào mảng imagePathsCopy
      imagePathsCopy.push(imagePaths[i]);
    }
  }

  // random so cặp thẻ theo thứ tự (đảm bảo ko trùng khi reset)
  function randomNumImg() {
    let max = 3;
    let min = 2;
    if (numCols > 12) {
      // test cho thấy nếu vượt quá 12 cột 9 hàng sẽ thiếu thẻ phải tăng thêm số lượng random
      max = 5;
      min = 3;
    } else if (numCols < 5) {
      max = 2;
      min = 1;
    }
    return Math.floor(Math.random() * max) + min;
  }

  // Mảng random số lượng thẻ của từng hình xuất hiện trong board (vd : image1 xuất hiện ngẫu nhiên 4 lần ...)
  // thêm 1 điều kiện là các thẻ được random sẽ có giá trị là 1 nếu là 0 thì sẽ ko tính (chưa thực thi)
  function randomNumImgs() {
    let total = numRows * numCols;
    let arr = [];
    let count = 0;
    let numTest = 0;
    while (count !== total && numTest < 100) {
      // Thử nhiều lần để lấy đủ số thẻ trong board
      arr = [];
      count = 0;
      for (let i = 0; i < imagePaths.length; i++) {
        arr.push(randomNumImg() * 2);
        count += arr[i];
      }
      numTest++;
    }
    // console.log('numTest : ' + numTest)
    // console.log(count)
    return arr;
  }

  // trả về 1 thứ tự thẻ ngẫu nhiên trong mảng tạm vừa tạo
  function randomImg() {
    let i = Math.floor(Math.random() * imagePathsCopy.length);
    return i;
  }

  // chèn từng hình trong mảng tạm vào board và xóa nó để tránh random lại trùng
  // thêm 1 điều kiện là thẻ nào có textContext là 1 mới thêm còn 0 thì bỏ qua (phục vụ cho việc reloac lại board khi hết đường đi) (chưa thực thi)
  cells.forEach((cell) => {
    let randomNumber = randomImg(); // (1 / total ảnh)
    let imagePath = imagePathsCopy[randomNumber];
    cell.style.backgroundImage = `url('${imagePath}')`;
    imagePathsCopy.splice(randomNumber, 1);
  });
}

function initializeBoardIMGOfLevel5(numTimeTag) {
  const totalCells = numRows * numCols; // 20 * 16 = 320

  if (numTimeTag % 2 !== 0) {
    throw new Error("numTimeTag phải là số chẵn");
  }

  const normalCellCount = totalCells - numTimeTag;

  if (normalCellCount % 2 !== 0) {
    throw new Error("Số lượng Pokemon còn lại phải là số chẵn");
  }

  let pieces = createPairedPieces(normalCellCount / 2);

  // ==========================================
  // 3. Thêm các thẻ plusTime
  // ==========================================
  for (let i = 0; i < numTimeTag; i++) {
    pieces.push("./imgPikachu/plusTime.png");
  }

  shuffle(pieces);

  // Debug
  console.log("Total cells:", totalCells);
  console.log("Total pieces:", pieces.length);
  console.log("Pokemon:", normalCellCount);
  console.log("PlusTime:", numTimeTag);

  // ==========================================
  // 5. Gán đủ ảnh vào 320 cell
  // ==========================================
  cells.forEach((cell, index) => {
    cell.style.backgroundImage = `url('${pieces[index]}')`;
  });
}
// hàm này sẽ thay đổi các ảnh của các thẻ hiện đang mở (các thẻ ẩn sẽ không được gán ảnh vào)
function reRenderBoardIMG1() {
  // mảng tạm tạo dùng để xóa cái img đã đủ sl khi khởi tạo (tránh việc random lẻ hình)
  let imagePathsCopy = [];

  let a = createPairCounts(
    Array.from(cells).filter((cell) => cell.style.visibility !== "hidden").length
  );
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[i]; j++) {
      imagePathsCopy.push(imagePaths[i]);
    }
  }

  // random so cặp thẻ theo thứ tự (đảm bảo ko trùng khi reset)
  function randomNumImg() {
    let max = 3;
    let min = 1;
    return Math.floor(Math.random() * max) + min;
  }

  // Mảng random số lượng thẻ của từng hình xuất hiện trong board (vd : image1 xuất hiện ngẫu nhiên 4 lần ...)
  // thêm 1 điều kiện là các thẻ được random sẽ có giá trị là 1 nếu là 0 thì sẽ ko tính (chưa thực thi)
  function randomNumImgs() {
    let total = 0;
    // chạy lại để lấy số lượng thẻ còn lại (total phải luôn chẵn)
    cells.forEach((cell) => {
      if (cell.style.visibility !== "hidden") total += 1;
    });
    console.log("total : " + total);
    let arr = [];
    let count = 0;
    let numTest = 0;
    while (count !== total && numTest < 100) {
      // Thử nhiều lần để lấy đủ số thẻ trong board
      arr = [];
      count = 0;
      for (let i = 0; i < imagePaths.length; i++) {
        arr.push(randomNumImg() * 2);
        count += arr[i];
      }
      numTest++;
    }
    return arr;
  }

  // trả về 1 thứ tự thẻ ngẫu nhiên trong mảng tạm vừa tạo
  function randomImg() {
    let i = Math.floor(Math.random() * imagePathsCopy.length);
    return i;
  }

  // chèn từng hình trong mảng tạm vào board và xóa nó để tránh random lại trùng
  // thêm 1 điều kiện là thẻ nào có textContext là 1 mới thêm còn 0 thì bỏ qua (phục vụ cho việc reloac lại board khi hết đường đi) (chưa thực thi)
  cells.forEach((cell) => {
    if (cell.style.visibility !== "hidden") {
      let randomNumber = randomImg(); // (1 / total ảnh)
      let imagePath = imagePathsCopy[randomNumber];
      cell.style.backgroundImage = `url('${imagePath}')`;
      imagePathsCopy.splice(randomNumber, 1);
    }
  });
}

function reRenderBoardIMG() {
  //   numReload.textContent = parseFloat(numReload.textContent) - 1;
  // mảng tạm tạo dùng để xóa cái img đã đủ sl khi khởi tạo (tránh việc random lẻ hình)
  let remainCell = [];
  cells.forEach((cell) => {
    if (cell.style.visibility !== "hidden") {
      remainCell.push(
        cell.style.backgroundImage.substring(
          cell.style.backgroundImage.indexOf('"') + 1,
          cell.style.backgroundImage.lastIndexOf('"')
        )
      );
    }
  });
  console.log("remainCell : " + remainCell.length);
  // trả về 1 thứ tự thẻ ngẫu nhiên trong mảng tạm vừa tạo
  function randomImg() {
    let i = Math.floor(Math.random() * remainCell.length);
    return i;
  }

  cells.forEach((cell) => {
    if (cell.style.visibility !== "hidden") {
      let randomNumber = randomImg(); // (1 / total ảnh)
      let imagePath = remainCell[randomNumber];
      cell.style.backgroundImage = `url('${imagePath}')`;
      remainCell.splice(randomNumber, 1);
    }
  });
}

// hàm để css lại khi khởi tạo lại level
function restoreBoard() {
  // console.log("restore.....................")
  cells.forEach((item) => {
    item.style.visibility = "visible";
    item.style.outline = "none";
    item.style.transform = "none";
    item.style.opacity = 1; // opacity = 1 để tránh việc khi click thì opactity bị giảm
    item.classList.remove("clicked"); // xóa click để ko bị ghi đề opacity khi click lại thì sẽ thêm lại vào
  });
  for (let i = 0; i < numRows + 2; i++) {
    matrix[i] = [];
    for (let j = 0; j < numCols + 2; j++) {
      if (i === 0 || i === numRows + 1 || j === 0 || j === numCols + 1) {
        matrix[i][j] = "0";
      } else {
        matrix[i][j] = "1";
      }
    }
  }
}

// hàm khởi tạo lại điểm khi load lại từ level 1
function initializeScore(initialScore = 0) {
  score.textContent = Math.max(0, parseInt(initialScore, 10) || 0).toString();
}
// thuật toán tìm đường đi và check đúng sai
// Hàm tạo một node với các thuộc tính
function createNode(x, y, parent, turns) {
  return {
    x: x, // vị trí hàng
    y: y, // vị trí cột
    parent: parent, // node trước đó
    turns: turns, // số lần đổi hướng
  };
}

// hàm kiểm tra số lần đổi hướng cho tới node hiện tại (nếu đang là hàng mà trùng cột / ngược lại thì là đổi hướng)
function checkLanDoiHuong(node) {
  let rowO = false;
  let colO = false;
  let result = 0;
  if (node.x == node.parent.x) {
    rowO = true;
    colO = false;
  } else {
    colO = true;
    rowO = false;
  }
  do {
    if (result == 0) {
      result++;
    } else {
      if (rowO && node.y == node.parent.y) {
        colO = true;
        rowO = false;
        result++;
      } else if (colO && node.x == node.parent.x) {
        colO = false;
        rowO = true;
        result++;
      }
    }
    node = node.parent;
  } while (node.parent !== null);
  return result;
}

// sử dụng thuật toán BFS để tìm đường đi áp dụng số lần đổi hướng (nếu số lần đổi hướng = 4 thì sẽ ko duyệt qua node đó)
function findPath(startX, startY, endX, endY) {
  const frontier = []; // list đợi duyệt
  const visited = []; // list đã duyệt qua rồi

  // Thêm node đầu tiên vào frontier
  frontier.push(createNode(startX, startY, null, 0));

  while (frontier.length > 0) {
    let currentNode = frontier[0];
    frontier.splice(currentNode, 1);
    visited.push(currentNode);

    // Kết thúc khi có đường đi
    if (currentNode.x === endX && currentNode.y === endY) {
      const path = [];
      let current = currentNode;
      // console.log("checksolandoihuong : " + checkLanDoiHuong(current));
      while (current !== null) {
        path.push({ x: current.x, y: current.y, turns: current.turns });
        current = current.parent;
      }
      return path.reverse();
    }

    // Di chuyển sang các vị trí bên cạnh để duyệt
    const neighbors = [];
    const directions = [
      [-1, 0],
      [0, -1],
      [1, 0],
      [0, 1],
    ]; // Bên trái, phía trên, bên phải, phía dưới
    for (let direction of directions) {
      let newX = currentNode.x + direction[0];
      let newY = currentNode.y + direction[1];
      // console.log('--' + (matrix[newX][newY] == 0))
      if (
        (newX >= 0 &&
          newX < numRows + 2 &&
          newY >= 0 &&
          newY < numCols + 2 &&
          matrix[newX][newY] == 0) ||
        (newX === endX && newY === endY)
      ) {
        let newNeighbor = createNode(newX, newY, currentNode);
        newTurn = checkLanDoiHuong(newNeighbor);
        let newNeighbora = createNode(newX, newY, currentNode, newTurn);
        // console.log("newNeighbora : " + newNeighbora.turns);
        neighbors.push(newNeighbora);
      } else {
        // console.log("error !!!!!!!!!!!!!!!!!")
      }
    }

    // console.log(
    //     "x,y,parent,turns : " +
    //     currentNode.x +
    //     ", " +
    //     currentNode.y +
    //     ", " +
    //     currentNode.parent +
    //     ", " +
    //     currentNode.turns
    // );
    // console.log("----" + neighbors.length + "----------------------")
    // neighbors.forEach((i) => console.log(i.x + "-" + i.y));

    // Duyệt qua các ô lân cận
    for (let neighbor of neighbors) {
      // Nếu ô đã được duyệt, bỏ qua
      if (
        visited.find((node) => node.x === neighbor.x && node.y === neighbor.y)
      ) {
        continue;
      }

      // Nếu ô chưa được thăm hoặc có chi phí mới tốt hơn chi phí cũ, cập nhật hoặc thêm vào frontier
      let existingNode = frontier.find(
        (node) => node.x === neighbor.x && node.y === neighbor.y
      );
      // if (!existingNode || existingNode.turns > neighbor.turns) {
      // hoặc là có trong frontier nhưng có turn ít hơn
      existingNode = createNode(
        neighbor.x,
        neighbor.y,
        currentNode,
        neighbor.turns
      );
      // console.log("checksolandoihuongA : " + checkLanDoiHuong(existingNode));
      if (checkLanDoiHuong(existingNode) < 4) {
        frontier.push(existingNode);
      }
      // }
    }
    // console.log("frontier :");
    // frontier.forEach((i) => {
    //     if (i == null) {
    //         console.log("null");
    //     } else {
    //         console.log(i.x + "-" + i.y);
    //     }
    // });
  }
  return null;
}

// sự kiện kiểm tra đúng và tăng điểm cho level1
function checkTrue(firstClicked, secondClicked, locateFirst, locateSecond) {
  let path = findPath(
    locateFirst[0],
    locateFirst[1],
    locateSecond[0],
    locateSecond[1]
  );
  // console.log('path: ' + path)
  if (path !== null) {
    firstClicked.style.visibility = "hidden";
    secondClicked.style.visibility = "hidden";
    matrix[locateFirst[0]][locateFirst[1]] = "0";
    matrix[locateSecond[0]][locateSecond[1]] = "0";
    firstClicked.textContent = "0";
    secondClicked.textContent = "0";
    soundTrueChoose.play();
    score.textContent = parseInt(score.textContent) + 10;
    drawLine(path, locateFirst, locateSecond);
  } else {
    firstClicked.classList.toggle("clicked");
    secondClicked.classList.toggle("clicked");
    soundWrongChoose.play();
  }
  if (parseInt(score.textContent) >= 10 * 54) {
    console.log("+ + + + + + + + + + + + + + +level1 finish");
    autoIncreaseLevel();
  }
}

// sự kiện kiểm tra đúng và tăng điểm cho level2
function checkTrueLv2(firstClicked, secondClicked, locateFirst, locateSecond) {
  let path = findPath(
    locateFirst[0],
    locateFirst[1],
    locateSecond[0],
    locateSecond[1]
  );
  // console.log(locateFirst[0], locateFirst[1], locateSecond[0], locateSecond[1])
  console.log("path: " + path);
  if (path !== null) {
    firstClicked.style.visibility = "hidden";
    secondClicked.style.visibility = "hidden";
    matrix[locateFirst[0]][locateFirst[1]] = "0";
    matrix[locateSecond[0]][locateSecond[1]] = "0";
    firstClicked.textContent = "0";
    secondClicked.textContent = "0";
    soundTrueChoose.play();
    // console.log(matrix)
    score.textContent = parseInt(score.textContent) + 20;
    console.log("TRUEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    drawLine(path, locateFirst, locateSecond);
    treatLevel2(firstClicked, secondClicked, locateFirst, locateSecond);
  } else {
    console.log("FALSEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    firstClicked.classList.toggle("clicked");
    secondClicked.classList.toggle("clicked");
    soundWrongChoose.play();
  }
  let ramainCell = [];
  cells.forEach((cell) => {
    if (cell.style.visibility == "visible") {
      ramainCell.push(cell);
    }
  });
  if (parseInt(score.textContent) >= 20 * 54 + 540) {
    console.log("+ + + + + + + + + + + + + + +level2 finish");
    autoIncreaseLevel();
  } else if (parseInt(score.textContent) == 20 * 54 && ramainCell.length == 0) {
    loseGame();
  }
}

// sự kiện kiểm tra đúng và tăng điểm cho level3
function checkTrueLv3(firstClicked, secondClicked, locateFirst, locateSecond) {
  let path = findPath(
    locateFirst[0],
    locateFirst[1],
    locateSecond[0],
    locateSecond[1]
  );
  // console.log(locateFirst[0], locateFirst[1], locateSecond[0], locateSecond[1])
  console.log("path: " + path);
  if (path !== null) {
    firstClicked.style.visibility = "hidden";
    secondClicked.style.visibility = "hidden";
    matrix[locateFirst[0]][locateFirst[1]] = "0";
    matrix[locateSecond[0]][locateSecond[1]] = "0";
    firstClicked.textContent = "0";
    secondClicked.textContent = "0";
    soundTrueChoose.play();
    // console.log(matrix)
    score.textContent = parseInt(score.textContent) + 20;
    console.log("TRUEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    drawLine(path, locateFirst, locateSecond);
    treatLevel3(firstClicked, secondClicked, locateFirst, locateSecond);
  } else {
    console.log("FALSEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    firstClicked.classList.toggle("clicked");
    secondClicked.classList.toggle("clicked");
    soundWrongChoose.play();
  }
  let ramainCell = [];
  cells.forEach((cell) => {
    if (cell.style.visibility == "visible") {
      ramainCell.push(cell);
    }
  });
  if (parseInt(score.textContent) >= 20 * 54 * 2 + 540) {
    console.log("+ + + + + + + + + + + + + + +level3 finish");
    autoIncreaseLevel();
  } else if (parseInt(score.textContent) == 20 * 54 && remainCell.length == 0) {
    loseGame();
  }
}

// sự kiện kiểm tra đúng và tăng điểm cho level4 (chua hoan thien)
function checkTrueLv4(firstClicked, secondClicked, locateFirst, locateSecond) {
  let path = findPath(
    locateFirst[0],
    locateFirst[1],
    locateSecond[0],
    locateSecond[1]
  );
  // console.log(locateFirst[0], locateFirst[1], locateSecond[0], locateSecond[1])
  console.log("path: " + path);
  if (path !== null) {
    firstClicked.style.visibility = "hidden";
    secondClicked.style.visibility = "hidden";
    matrix[locateFirst[0]][locateFirst[1]] = "0";
    matrix[locateSecond[0]][locateSecond[1]] = "0";
    firstClicked.textContent = "0";
    secondClicked.textContent = "0";
    soundTrueChoose.play();
    // console.log(matrix)
    score.textContent = parseInt(score.textContent) + 30;
    console.log("TRUEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    drawLine(path, locateFirst, locateSecond);
    treatLevel4(firstClicked, secondClicked, locateFirst, locateSecond);
  } else {
    console.log("FALSEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    firstClicked.classList.toggle("clicked");
    secondClicked.classList.toggle("clicked");
    soundWrongChoose.play();
    decreaseWidth();
  }
  if (parseInt(score.textContent) >= 20 * 54 * 2 + 540) {
    console.log("+ + + + + + + + + + + + + + +level4 finish");
    autoIncreaseLevel();
  }
}

// sự kiện kiểm tra đúng và tăng điểm cho level5
function checkTrueLv5(firstClicked, secondClicked, locateFirst, locateSecond) {
  let path = findPath(
    locateFirst[0],
    locateFirst[1],
    locateSecond[0],
    locateSecond[1]
  );
  // console.log(locateFirst[0], locateFirst[1], locateSecond[0], locateSecond[1])
  console.log("path: " + path);
  if (path !== null) {
    firstClicked.style.visibility = "hidden";
    secondClicked.style.visibility = "hidden";
    matrix[locateFirst[0]][locateFirst[1]] = "0";
    matrix[locateSecond[0]][locateSecond[1]] = "0";
    firstClicked.textContent = "0";
    secondClicked.textContent = "0";
    soundTrueChoose.play();
    // console.log(matrix)
    score.textContent = parseInt(score.textContent) + 30;
    console.log("TRUEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    drawLine(path, locateFirst, locateSecond);
    treatLevel5(firstClicked, secondClicked, locateFirst, locateSecond);
    console.log(
      "firstClicked.style.backgroundImage : " +
        firstClicked.style.backgroundImage
    );
    console.log(
      "secondClicked.style.backgroundImage : " +
        secondClicked.style.backgroundImage
    );
    if (
      firstClicked.style.backgroundImage.includes(
        "./imgPikachu/plusTime.png"
      ) &&
      secondClicked.style.backgroundImage.includes("./imgPikachu/plusTime.png")
    ) {
      increaseWidth();
    }
  } else {
    console.log("FALSEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    firstClicked.classList.toggle("clicked");
    secondClicked.classList.toggle("clicked");
    soundWrongChoose.play();
    decreaseWidth();
  }
  let ramainCell = [];
  cells.forEach((cell) => {
    if (cell.style.visibility == "visible") {
      ramainCell.push(cell);
    }
  });
  if (parseInt(score.textContent) >= 30 * 54 + 20 * 54 * 2 + 540) {
    console.log("+ + + + + + + + + + + + + + +level5 finish");
    autoIncreaseLevel();
  } else if (parseInt(score.textContent) == 30 * 54 && remainCell.length == 0) {
    loseGame();
  }
}

// sự kiện kiểm tra đúng và tăng điểm cho level6
function checkTrueLv6(firstClicked, secondClicked, locateFirst, locateSecond) {
  let path = findPath(
    locateFirst[0],
    locateFirst[1],
    locateSecond[0],
    locateSecond[1]
  );
  // console.log(locateFirst[0], locateFirst[1], locateSecond[0], locateSecond[1])
  console.log("path: " + path);
  if (path !== null) {
    firstClicked.style.visibility = "hidden";
    secondClicked.style.visibility = "hidden";
    matrix[locateFirst[0]][locateFirst[1]] = "0";
    matrix[locateSecond[0]][locateSecond[1]] = "0";
    firstClicked.textContent = "0";
    secondClicked.textContent = "0";
    soundTrueChoose.play();
    // console.log(matrix)
    score.textContent = parseInt(score.textContent) + 35;
    console.log("TRUEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    drawLine(path, locateFirst, locateSecond);
    treatLevel6(firstClicked, secondClicked, locateFirst, locateSecond);
    if (
      firstClicked.style.backgroundImage.includes(
        "./imgPikachu/plusTime.png"
      ) &&
      secondClicked.style.backgroundImage.includes("./imgPikachu/plusTime.png")
    ) {
      increaseWidth();
    }
  } else {
    console.log("FALSEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    firstClicked.classList.toggle("clicked");
    secondClicked.classList.toggle("clicked");
    soundWrongChoose.play();
    decreaseWidth();
  }
  let remainCell = [];
  cells.forEach((cell) => {
    if (cell.style.visibility == "visible") {
      remainCell.push(cell);
    }
  });
  if (parseInt(score.textContent) >= 35 * 54 + 30 * 54 + 20 * 54 * 2 + 540) {
    console.log("+ + + + + + + + + + + + + + +level5 finish");
    autoIncreaseLevel();
  } else if (parseInt(score.textContent) == 35 * 54 && remainCell.length == 0) {
    loseGame();
  }
}

// sự kiện kiểm tra đúng và tăng điểm cho level7
let countCheckTrue = 0;
function checkTrueLv7(firstClicked, secondClicked, locateFirst, locateSecond) {
  let path = findPath(
    locateFirst[0],
    locateFirst[1],
    locateSecond[0],
    locateSecond[1]
  );
  // console.log(locateFirst[0], locateFirst[1], locateSecond[0], locateSecond[1])
  console.log("path: " + path);
  if (path !== null) {
    firstClicked.style.visibility = "hidden";
    secondClicked.style.visibility = "hidden";
    matrix[locateFirst[0]][locateFirst[1]] = "0";
    matrix[locateSecond[0]][locateSecond[1]] = "0";
    firstClicked.textContent = "0";
    secondClicked.textContent = "0";
    soundTrueChoose.play();
    // console.log(matrix)
    score.textContent = parseInt(score.textContent) + 40;
    console.log("TRUEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    drawLine(path, locateFirst, locateSecond);
    treatLevel7(firstClicked, secondClicked, locateFirst, locateSecond);
    countCheckTrue++;
    if (countCheckTrue % 5 == 0) {
      reRenderBoardIMG();
    }
    if (
      firstClicked.style.backgroundImage.includes(
        "./imgPikachu/plusTime.png"
      ) &&
      secondClicked.style.backgroundImage.includes("./imgPikachu/plusTime.png")
    ) {
      increaseWidth();
    }
  } else {
    console.log("FALSEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
    firstClicked.classList.toggle("clicked");
    secondClicked.classList.toggle("clicked");
    soundWrongChoose.play();
    decreaseWidth();
  }
  let remainCell = [];
  cells.forEach((cell) => {
    if (cell.style.visibility == "visible") {
      remainCell.push(cell);
    }
  });
  // Việc hoàn thành level được xử lý tập trung bởi autoIncreaseLevel().
}

// cập nhật lại id cho toàn bộ board theo thứ tự 1 -> lenght
function updateCellIds() {
  const cells = document.querySelectorAll(".cell");
  let idCounter = 1;
  // console.log('update textContent cell')
  cells.forEach((cell) => {
    cell.id = idCounter.toString();
    cell.textContent = "1";
    idCounter++;
  });
}

// lấy các mảng hàng / cột của có các thẻ bị ẩn và duyệt qua mảng set lại giá trị top & left cho các ô còn lại
// function treatLevel2(firstClicked, secondClicked, locateFirst, locateSecond) {
//     if (locateFirst[1] == locateSecond[1]) {
//         let arrCache1 = [];
//         let arrTemp = [];
//         // hoặc lấy danh sách các thẻ trong cột đó vì 2 thẻ cùng cột
//         // lấy danh sách các thẻ để dùng nó lặp hiển thị lại vị trí mới
//         for (let i = 0; i < numRows; i++) {
//             // console.log(convertMatrixToCell(i + 1, locateFirst[1]).getAttribute('id'))
//             const cell = convertMatrixToCell(i + 1, locateFirst[1]);
//             // const cell = cells[(i) * numCols + locateFirst[1] - 1];
//             if (matrix[i + 1][locateFirst[1]] === '1') {
//                 // console.log('=== 1 : ' + cell.getAttribute('id'))
//                 arrCache1.push(cell)
//             } else if (matrix[i + 1][locateFirst[1]] === '0') {
//                 // console.log('=== 0 : ' + cell.getAttribute('id'))
//                 cell.textContent = '0';
//                 arrTemp.push(cell)
//             }
//         }
//         // dùng để xét lại giá trị của cột trong ma trận
//         let count = 0;
//         while (count < numRows) { // < 9
//             if (count < arrCache1.length) {
//                 //xét lại giá trị trong ma trận đẩy các ô có giá trị 0 vừa xét lên phía trên
//                 matrix[numRows - count][locateFirst[1]] = '1';
//             } else {
//                 matrix[numRows - count][locateFirst[1]] = '0';
//             }
//             count++;
//         }
//         // arrCache1.forEach((item, i) => {
//         //     console.log('++++ : ' + item.getAttribute('id'))
//         // });
//         arrCache1.sort((a, b) => a.getAttribute('id') - b.getAttribute('id')).reverse().push(...arrTemp.reverse());
//         arrCache1.forEach((item, i) => { // reverse() để dễ hiểu hơn đúng kiểu level là hạ xuống
//             item.style.top = 'auto';
//             item.style.bottom = 3 + (i * 48) + "px";
//             // item.setAttribute('id', (numRows - i - 1) * 12 + locateFirst[1])
//         });
//         // arrCache1.forEach((item, i) => { // reverse() để dễ hiểu hơn đúng kiểu level là hạ xuống
//         //     if (matrix[i + 1][locateFirst[1]] === '1') {
//         //         console.log(item.getAttribute('id'))
//         //     }
//         // });
//     }else {
//         let arrCache1 = [];
//         let arrCache2 = [];
//         let arrTemp1 = [];
//         let arrTemp2 = [];
//         for (let i = 0; i < numRows; i++) {
//             if (convertMatrixToCell(i + 1, locateFirst[1]).textContent !== '0') {
//                 arrCache1.push(convertMatrixToCell(i + 1, locateFirst[1]))
//             } else {
//                 arrTemp1.push(convertMatrixToCell(i + 1, locateFirst[1]))
//             }
//         }
//         for (let i = 0; i < numRows; i++) {
//             if (convertMatrixToCell(i + 1, locateSecond[1]).textContent !== '0') {
//                 arrCache2.push(convertMatrixToCell(i + 1, locateSecond[1]))
//             } else {
//                 arrTemp2.push(convertMatrixToCell(i + 1, locateSecond[1]))
//             }
//         }
//         let count1 = 0
//         let count2 = 0
//         while (count1 < numRows && count2 < numRows) {
//             if (count1 < arrCache1.length) {
//                 matrix[numRows - count1][locateFirst[1]] = '1';
//             } else {
//                 matrix[numRows - count1][locateFirst[1]] = '0';
//             }
//             if (count2 < arrCache2.length) {
//                 matrix[numRows - count2][locateSecond[1]] = '1';
//             } else {
//                 matrix[numRows - count2][locateSecond[1]] = '0';
//             }
//             count1++;
//             count2++;
//         }
//         arrCache1.reverse().push(...arrTemp1.reverse());
//         arrCache1.forEach((item, i) => {
//             item.style.top = 'auto';
//             item.style.bottom = 3 + (i * 48) + "px";
//             item.setAttribute('id', (numRows - i - 1) * 12 + locateFirst[1]);
//         });
//         arrCache2.reverse().push(...arrTemp2.reverse());
//         arrCache2.forEach((item, i) => {
//             item.style.top = 'auto';
//             item.style.bottom = 3 + (i * 48) + "px";
//             item.setAttribute('id', (numRows - i - 1) * 12 + locateSecond[1]);
//         });
//     }
// }

function treatLevel2(firstClicked, secondClicked, locateFirst, locateSecond) {
  if (locateFirst[1] == locateSecond[1]) {
    let arrCache1 = [];
    let arrTemp = [];
    // hoặc lấy danh sách các thẻ trong cột đó vì 2 thẻ cùng cột
    // lấy danh sách các thẻ để dùng nó lặp hiển thị lại vị trí mới
    let temp = 0;
    for (let i = numRows; i > 0; i--) {
      // const cell = cells[(i - 1) * numCols + locateFirst[1] - 1];
      let cell = convertMatrixToCell(i, locateFirst[1]);
      if (cell.textContent === "1") {
        arrCache1.push(cell);
        cell.setAttribute("id", (i - 1 + temp) * numCols + locateFirst[1]);
      } else if (cell.textContent === "0") {
        arrTemp.push(cell);
        cell.setAttribute("id", temp * numCols + locateFirst[1]);
        temp++;
      }
    }
    console.log("=======================");
    arrTemp.forEach((cell) => {
      console.log(cell.getAttribute("id"));
    });
    // dùng để xét lại giá trị của cột trong ma trận
    let count = 0;
    while (count < numRows) {
      // < 9
      if (count < arrCache1.length) {
        //xét lại giá trị trong ma trận đẩy các ô có giá trị 0 vừa xét lên phía trên
        matrix[numRows - count][locateFirst[1]] = "1";
      } else {
        matrix[numRows - count][locateFirst[1]] = "0";
      }
      count++;
    }
    // arrCache1.sort((a, b) => a.getAttribute('id') - b.getAttribute('id')).reverse().push(...arrTemp.reverse());
    arrCache1.push(...arrTemp.reverse());
    arrCache1.forEach((item, i) => {
      // reverse() để dễ hiểu hơn đúng kiểu level là hạ xuống
      item.style.top = "auto";
      item.style.bottom = 3 + i * 48 + "px";
    });
  } else {
    let arrCache1 = [];
    let arrCache2 = [];
    let arrTemp1 = [];
    let arrTemp2 = [];
    let temp1 = 0;
    let temp2 = 0;
    for (let i = numRows; i > 0; i--) {
      // const cell = cells[(i - 1) * numCols + locateFirst[1] - 1];
      let cell = convertMatrixToCell(i, locateFirst[1]);
      if (cell.textContent === "1") {
        arrCache1.push(cell);
        cell.setAttribute("id", (i - 1 + temp1) * numCols + locateFirst[1]);
      } else if (cell.textContent === "0") {
        arrTemp1.push(cell);
        cell.setAttribute("id", temp1 * numCols + locateFirst[1]);
        temp1++;
      }
    }
    for (let i = numRows; i > 0; i--) {
      // const cell = cells[(i - 1) * numCols + locateSecond[1] - 1];
      let cell = convertMatrixToCell(i, locateSecond[1]);
      if (cell.textContent === "1") {
        arrCache2.push(cell);
        cell.setAttribute("id", (i - 1 + temp2) * numCols + locateSecond[1]);
      } else if (cell.textContent === "0") {
        arrTemp2.push(cell);
        cell.setAttribute("id", temp2 * numCols + locateSecond[1]);
        temp2++;
      }
    }
    let count1 = 0;
    let count2 = 0;
    while (count1 < numRows && count2 < numRows) {
      if (count1 < arrCache1.length) {
        matrix[numRows - count1][locateFirst[1]] = "1";
      } else {
        matrix[numRows - count1][locateFirst[1]] = "0";
      }
      if (count2 < arrCache2.length) {
        matrix[numRows - count2][locateSecond[1]] = "1";
      } else {
        matrix[numRows - count2][locateSecond[1]] = "0";
      }
      count1++;
      count2++;
    }
    arrCache1.push(...arrTemp1.reverse());
    arrCache1.forEach((item, i) => {
      item.style.top = "auto";
      item.style.bottom = 3 + i * 48 + "px";
      // item.setAttribute('id', (numRows - i - 1) * 12 + locateFirst[1]);
    });
    arrCache2.push(...arrTemp2.reverse());
    arrCache2.forEach((item, i) => {
      item.style.top = "auto";
      item.style.bottom = 3 + i * 48 + "px";
      // item.setAttribute('id', (numRows - i - 1) * 12 + locateSecond[1]);
    });
  }
}

function treatLevel3(firstClicked, secondClicked, locateFirst, locateSecond) {
  if (locateFirst[0] == locateSecond[0]) {
    let arrCache1 = [];
    let arrTemp = [];
    // hoặc lấy danh sách các thẻ trong cột đó vì 2 thẻ cùng cột
    // lấy danh sách các thẻ để dùng nó lặp hiển thị lại vị trí mới
    let temp = 0;
    for (let i = 1; i <= numCols; i++) {
      let cell = convertMatrixToCell(locateFirst[0], i);
      if (cell.textContent === "1") {
        arrCache1.push(cell);
        cell.setAttribute("id", (locateFirst[0] - 1) * numCols + (i - temp));
      } else if (cell.textContent === "0") {
        arrTemp.push(cell);
        temp++;
        cell.setAttribute("id", locateFirst[0] * numCols - temp);
      }
    }
    // dùng để xét lại giá trị của cột trong ma trận
    let count = 0;
    while (count < numCols) {
      // < 12
      if (count < arrTemp.length) {
        //xét lại giá trị trong ma trận đẩy các ô có giá trị 0 vừa xét lên phía trên
        matrix[locateFirst[0]][numCols - count] = "0";
      } else {
        matrix[locateFirst[0]][numCols - count] = "1";
      }
      count++;
    }
    arrCache1.push(...arrTemp.reverse());
    arrCache1.forEach((item, i) => {
      // reverse() để dễ hiểu hơn đúng kiểu level là hạ xuống
      item.style.right = "auto";
      item.style.left = i * 48 + "px";
    });
  } else {
    let arrCache1 = [];
    let arrCache2 = [];
    let arrTemp1 = [];
    let arrTemp2 = [];
    let temp1 = 0;
    let temp2 = 0;
    for (let i = 1; i <= numCols; i++) {
      // const cell = cells[(i - 1) * numCols + locateFirst[1] - 1];
      let cell = convertMatrixToCell(locateFirst[0], i);
      if (cell.textContent === "1") {
        cell.setAttribute("id", (locateFirst[0] - 1) * numCols + (i - temp1));
        arrCache1.push(cell);
      } else if (cell.textContent === "0") {
        cell.setAttribute("id", locateFirst[0] * numCols - temp1);
        arrTemp1.push(cell);
        temp1++;
      }
    }
    for (let i = 1; i <= numCols; i++) {
      // const cell = cells[(i - 1) * numCols + locateFirst[1] - 1];
      let cell = convertMatrixToCell(locateSecond[0], i);
      if (cell.textContent === "1") {
        cell.setAttribute("id", (locateSecond[0] - 1) * numCols + (i - temp2));
        arrCache2.push(cell);
      } else if (cell.textContent === "0") {
        cell.setAttribute("id", locateSecond[0] * numCols - temp2);
        arrTemp2.push(cell);
        temp2++;
      }
    }
    let count1 = 0;
    let count2 = 0;
    while (count1 < numCols && count2 < numCols) {
      if (count1 < arrTemp1.length) {
        matrix[locateFirst[0]][numCols - count1] = "0";
      } else {
        matrix[locateFirst[0]][numCols - count1] = "1";
      }
      if (count2 < arrTemp2.length) {
        matrix[locateSecond[0]][numCols - count2] = "0";
      } else {
        matrix[locateSecond[0]][numCols - count2] = "1";
      }
      count1++;
      count2++;
    }
    arrCache1.push(...arrTemp1.reverse());
    arrCache1.forEach((item, i) => {
      item.style.right = "auto";
      item.style.left = i * 48 + "px";
    });
    arrCache2.push(...arrTemp2.reverse());
    arrCache2.forEach((item, i) => {
      item.style.right = "auto";
      item.style.left = i * 48 + "px";
    });
  }
}

// chua hoan thien
function treatLevel4(firstClicked, secondClicked, locateFirst, locateSecond) {
  let center = Math.floor(numRows / 2);
  if (locateFirst[1] == locateSecond[1]) {
    let arrCache1 = [];
    let arrTemp = [];
    let temp = 0;
    for (let i = 1; i <= numRows; i++) {
      let cell = convertMatrixToCell(i, locateFirst[1]);
      if (cell.textContent === "0") {
        temp++;
      }
    }
    let temp1 = 0;
    for (let i = 1; i <= numRows; i++) {
      let cell = convertMatrixToCell(i, locateFirst[1]);
      if (cell.textContent === "1") {
        arrCache1.push(cell);
        cell.setAttribute(
          "id",
          (i + temp / 2 - temp1 - 1) * numCols + locateFirst[1]
        );
      } else if (cell.textContent === "0") {
        arrTemp.push(cell);
        cell.setAttribute(
          "id",
          (numRows - temp1 + 1) * numCols + locateFirst[1]
        ); // id khong can chinh xac
        temp1++;
      }
    }
    console.log("arrTemp : " + arrTemp.length);
    // dùng để xét lại giá trị của cột trong ma trận
    let count = 0;
    while (count < numRows) {
      if (count < arrTemp.length) {
        matrix[count / 2 + 1][locateFirst[1]] = "0";
        matrix[numRows - count / 2][locateFirst[1]] = "0";
        count++;
      } else {
        console.log(numRows - count + arrTemp.length / 2);
        matrix[numRows - count + arrTemp.length / 2][locateFirst[1]] = "1";
      }
      count++;
    }
    let sumArr = [];
    for (let i = 0; i < arrTemp.length; i++) {
      if (i === arrTemp.length / 2) {
        sumArr.push(...arrCache1);
      }
      sumArr.push(arrTemp[i]);
    }
    sumArr.forEach((item, i) => {
      item.style.bottom = "auto";
      item.style.top = i * 48 + "px";
    });
  } else {
    let arrCache1 = [];
    let arrCache2 = [];
    let arrTemp1 = [];
    let arrTemp2 = [];
    let temp1 = 0;
    let temp2 = 0;
    if (locateFirst[0] <= center) {
      //1
      for (let i = 1; i <= numRows; i++) {
        let cell = convertMatrixToCell(i, locateFirst[1]);
        if (cell.textContent === "0") {
          temp1++;
        }
      }
      let temp = 0;
      for (let i = numRows; i > 0; i--) {
        let cell = convertMatrixToCell(i, locateFirst[1]);
        if (cell.textContent === "1") {
          arrCache1.push(cell);
          cell.setAttribute(
            "id",
            (i + ~~(temp1 / 2) - temp - 1) * numCols + locateFirst[1]
          );
        } else if (cell.textContent === "0") {
          arrTemp1.push(cell);
          cell.setAttribute(
            "id",
            (numRows - temp + 1) * numCols + locateFirst[1]
          );
          temp++;
        }
      }
      //2
      for (let i = 1; i <= numRows; i++) {
        let cell = convertMatrixToCell(i, locateSecond[1]);
        if (cell.textContent === "0") {
          temp2++;
        }
      }
      let tempp = 0;
      for (let i = numRows; i > 0; i--) {
        let cell = convertMatrixToCell(i, locateSecond[1]);
        if (cell.textContent === "1") {
          arrCache2.push(cell);
          cell.setAttribute(
            "id",
            (i + ~~(temp2 / 2) - tempp - 1) * numCols + locateSecond[1]
          );
        } else if (cell.textContent === "0") {
          arrTemp2.push(cell);
          cell.setAttribute(
            "id",
            (numRows - tempp + 1) * numCols + locateSecond[1]
          );
          tempp++;
        }
      }
    } else {
      //1
      for (let i = 1; i <= numRows; i++) {
        let cell = convertMatrixToCell(i, locateFirst[1]);
        if (cell.textContent === "0") {
          temp1++;
        }
      }
      let temp = 0;
      for (let i = 1; i <= numRows; i++) {
        let cell = convertMatrixToCell(i, locateFirst[1]);
        if (cell.textContent === "1") {
          arrCache1.push(cell);
          cell.setAttribute(
            "id",
            (i + ~~(temp1 / 2) - temp - 1) * numCols + locateFirst[1]
          );
        } else if (cell.textContent === "0") {
          arrTemp1.push(cell);
          cell.setAttribute(
            "id",
            (numRows - temp + 1) * numCols + locateFirst[1]
          );
          temp++;
        }
      }
      //2
      for (let i = 1; i <= numRows; i++) {
        let cell = convertMatrixToCell(i, locateSecond[1]);
        if (cell.textContent === "0") {
          temp2++;
        }
      }
      let tempp = 0;
      for (let i = 1; i <= numRows; i++) {
        let cell = convertMatrixToCell(i, locateSecond[1]);
        if (cell.textContent === "1") {
          arrCache2.push(cell);
          cell.setAttribute(
            "id",
            (i + ~~(temp2 / 2) - tempp - 1) * numCols + locateSecond[1]
          );
        } else if (cell.textContent === "0") {
          arrTemp2.push(cell);
          cell.setAttribute(
            "id",
            (numRows - tempp + 1) * numCols + locateSecond[1]
          );
          tempp++;
        }
      }
    }
    console.log("arrTemp1.length : " + arrTemp1.length);
    console.log("arrTemp2.length : " + arrTemp2.length);
    let count1 = 0;
    let count2 = 0;
    if (locateFirst[0] <= center) {
      while (count1 < numRows && count2 < numRows) {
        if (count1 < arrTemp1.length) {
          if (arrTemp1.length > 1) {
            matrix[~~(count1 / 2) + 1][locateFirst[1]] = "0";
            matrix[numRows - ~~(count1 / 2)][locateFirst[1]] = "0";
            count1++;
          } else {
            matrix[~~(count1 / 2) + 1][locateFirst[1]] = "0";
          }
        } else {
          if (arrTemp1.length > 1) {
            matrix[count1 + ~~(arrTemp1.length / 2)][locateFirst[1]] = "1";
          } else {
            matrix[count1 + 1][locateFirst[1]] = "1";
          }
        }
        if (count2 < arrTemp2.length) {
          if (arrTemp2.length > 1) {
            matrix[~~(count2 / 2) + 1][locateSecond[1]] = "0";
            matrix[numRows - ~~(count2 / 2)][locateSecond[1]] = "0";
            count2++;
          } else {
            matrix[~~(count2 / 2) + 1][locateSecond[1]] = "0";
          }
        } else {
          if (arrTemp2.length > 1) {
            matrix[count2 + ~~(arrTemp2.length / 2)][locateSecond[1]] = "1";
          } else {
            matrix[count2 + 1][locateSecond[1]] = "1";
          }
        }
        count1++;
        count2++;
      }
    } else {
      while (count1 < numRows && count2 < numRows) {
        if (count1 < arrTemp1.length) {
          if (arrTemp1.length > 1) {
            matrix[count1 / 2 + 1][locateFirst[1]] = "0";
            matrix[numRows - count1 / 2][locateFirst[1]] = "0";
            count1++;
          } else {
            matrix[numRows - count1 / 2][locateFirst[1]] = "0";
          }
        } else {
          if (arrTemp1.length > 1) {
            matrix[numRows - count1 + ~~(arrTemp1.length / 2)][locateFirst[1]] =
              "1";
          } else {
            matrix[numRows - count1 + 1][locateFirst[1]] = "1";
          }
        }
        if (count2 < arrTemp2.length) {
          if (arrTemp2.length > 1) {
            matrix[~~(count2 / 2) + 1][locateSecond[1]] = "0";
            matrix[numRows - ~~(count2 / 2)][locateSecond[1]] = "0";
            count2++;
          } else {
            matrix[numRows - ~~(count2 / 2)][locateSecond[1]] = "0";
          }
        } else {
          if (arrTemp2.length > 1) {
            matrix[numRows - count2 + ~~(arrTemp2.length / 2)][
              locateSecond[1]
            ] = "1";
          } else {
            matrix[numRows - count2 + 1][locateSecond[1]] = "1";
          }
        }
        count1++;
        count2++;
      }
    }

    let sumArr1 = [];
    let sumArr2 = [];
    for (let i = 0; i < arrTemp1.length; i++) {
      if (i === arrTemp1.length / 2) {
        sumArr1.push(...arrCache1);
      }
      sumArr1.push(arrTemp1[i]);
    }
    for (let i = 0; i < arrTemp2.length; i++) {
      if (i === arrTemp2.length / 2) {
        sumArr2.push(...arrCache2);
      }
      sumArr2.push(arrTemp2[i]);
    }
    sumArr1.forEach((cell) => {
      console.log(cell);
    });
    sumArr1.forEach((item, i) => {
      item.style.bottom = "auto";
      item.style.top = i * 48 + "px";
    });
    sumArr2.forEach((item, i) => {
      item.style.bottom = "auto";
      item.style.top = i * 48 + "px";
    });

    // arrCache1.push(...arrTemp1.reverse());
    // arrCache1.forEach((item, i) => {
    //   item.style.top = "auto";
    //   item.style.bottom = 3 + i * 48 + "px";
    // });
    // arrCache2.push(...arrTemp2.reverse());
    // arrCache2.forEach((item, i) => {
    //   item.style.top = "auto";
    //   item.style.bottom = 3 + i * 48 + "px";
    // });
  }
}

function treatLevel5(firstClicked, secondClicked, locateFirst, locateSecond) {
  if (locateFirst[0] == locateSecond[0]) {
    let arrCache1 = [];
    let arrTemp = [];
    // hoặc lấy danh sách các thẻ trong cột đó vì 2 thẻ cùng cột
    // lấy danh sách các thẻ để dùng nó lặp hiển thị lại vị trí mới
    let temp = 0;
    for (let i = numCols; i > 0; i--) {
      let cell = convertMatrixToCell(locateFirst[0], i);
      if (cell.textContent === "1") {
        arrCache1.push(cell);
        cell.setAttribute("id", (locateFirst[0] - 1) * numCols + (i + temp));
      } else if (cell.textContent === "0") {
        arrTemp.push(cell);
        temp++;
        cell.setAttribute("id", (locateFirst[0] - 1) * numCols + temp);
      }
    }
    // dùng để xét lại giá trị của cột trong ma trận
    let count = 0;
    while (count < numCols) {
      // < 12
      if (count < arrTemp.length) {
        //xét lại giá trị trong ma trận đẩy các ô có giá trị 0 vừa xét lên phía trên
        matrix[locateFirst[0]][count + 1] = "0";
      } else {
        matrix[locateFirst[0]][count + 1] = "1";
      }
      count++;
    }
    arrCache1.push(...arrTemp.reverse());
    arrCache1.forEach((item, i) => {
      // reverse() để dễ hiểu hơn đúng kiểu level là hạ xuống
      item.style.right = 3 + i * 48 + "px";
      item.style.left = "auto";
    });
  } else {
    let arrCache1 = [];
    let arrCache2 = [];
    let arrTemp1 = [];
    let arrTemp2 = [];
    let temp1 = 0;
    let temp2 = 0;
    for (let i = numCols; i > 0; i--) {
      // const cell = cells[(i - 1) * numCols + locateFirst[1] - 1];
      let cell = convertMatrixToCell(locateFirst[0], i);
      if (cell.textContent === "1") {
        cell.setAttribute("id", (locateFirst[0] - 1) * numCols + (i + temp1));
        arrCache1.push(cell);
      } else if (cell.textContent === "0") {
        cell.setAttribute("id", (locateFirst[0] - 1) * numCols + temp1);
        arrTemp1.push(cell);
        temp1++;
      }
    }
    for (let i = numCols; i > 0; i--) {
      // const cell = cells[(i - 1) * numCols + locateFirst[1] - 1];
      let cell = convertMatrixToCell(locateSecond[0], i);
      if (cell.textContent === "1") {
        cell.setAttribute("id", (locateSecond[0] - 1) * numCols + (i + temp2));
        arrCache2.push(cell);
      } else if (cell.textContent === "0") {
        cell.setAttribute("id", (locateSecond[0] - 1) * numCols + temp2);
        arrTemp2.push(cell);
        temp2++;
      }
    }
    let count1 = 0;
    let count2 = 0;
    while (count1 < numCols && count2 < numCols) {
      if (count1 < arrTemp1.length) {
        matrix[locateFirst[0]][count1 + 1] = "0";
      } else {
        matrix[locateFirst[0]][count1 + 1] = "1";
      }
      if (count2 < arrTemp2.length) {
        matrix[locateSecond[0]][count2 + 1] = "0";
      } else {
        matrix[locateSecond[0]][count2 + 1] = "1";
      }
      count1++;
      count2++;
    }
    arrCache1.push(...arrTemp1.reverse());
    arrCache1.forEach((item, i) => {
      item.style.right = 3 + i * 48 + "px";
      item.style.left = "auto";
    });
    arrCache2.push(...arrTemp2.reverse());
    arrCache2.forEach((item, i) => {
      item.style.right = 3 + i * 48 + "px";
      item.style.left = "auto";
    });
  }
}

function treatLevel6(firstClicked, secondClicked, locateFirst, locateSecond) {
  let remainCell = [];
  cells.forEach((cell) => {
    if (cell.style.visibility !== "hidden") {
      remainCell.push(cell);
    }
  });
  let numRamdomRotate = Math.random() * 20 + 10;
  if (locateFirst[1] == locateSecond[1]) {
    let arrCache1 = [];
    let arrTemp = [];
    let temp = 0;
    for (let i = 1; i <= numRows; i++) {
      let cell = convertMatrixToCell(i, locateFirst[1]);
      if (cell.textContent === "1") {
        arrCache1.push(cell);
        cell.setAttribute("id", (i - 1 - temp) * numCols + locateFirst[1]);
      } else if (cell.textContent === "0") {
        arrTemp.push(cell);
        cell.setAttribute("id", (numRows - temp) * numCols + locateFirst[1]);
        temp++;
      }
    }
    let count = 0;
    while (count < numRows) {
      if (count < arrTemp.length) {
        matrix[numRows - count][locateFirst[1]] = "0";
      } else {
        matrix[numRows - count][locateFirst[1]] = "1";
      }
      count++;
    }
    arrCache1.push(...arrTemp.reverse());
    arrCache1.forEach((item, i) => {
      item.style.top = i * 48 + "px";
      item.style.bottom = "auto";
    });
  } else {
    let arrCache1 = [];
    let arrCache2 = [];
    let arrTemp1 = [];
    let arrTemp2 = [];
    let temp1 = 0;
    let temp2 = 0;
    for (let i = 1; i <= numRows; i++) {
      let cell = convertMatrixToCell(i, locateFirst[1]);
      if (cell.textContent === "1") {
        arrCache1.push(cell);
        cell.setAttribute("id", (i - 1 - temp1) * numCols + locateFirst[1]);
      } else if (cell.textContent === "0") {
        arrTemp1.push(cell);
        cell.setAttribute("id", (numRows - temp1) * numCols + locateFirst[1]);
        temp1++;
      }
    }
    for (let i = 1; i <= numRows; i++) {
      let cell = convertMatrixToCell(i, locateSecond[1]);
      if (cell.textContent === "1") {
        arrCache2.push(cell);
        cell.setAttribute("id", (i - 1 - temp2) * numCols + locateSecond[1]);
      } else if (cell.textContent === "0") {
        arrTemp2.push(cell);
        cell.setAttribute("id", (numRows - temp2) * numCols + locateSecond[1]);
        temp2++;
      }
    }
    let count1 = 0;
    let count2 = 0;
    while (count1 < numRows && count2 < numRows) {
      if (count1 < arrTemp1.length) {
        matrix[numRows - count1][locateFirst[1]] = "0";
      } else {
        matrix[numRows - count1][locateFirst[1]] = "1";
      }
      if (count2 < arrTemp2.length) {
        matrix[numRows - count2][locateSecond[1]] = "0";
      } else {
        matrix[numRows - count2][locateSecond[1]] = "1";
      }
      count1++;
      count2++;
    }
    arrCache1.push(...arrTemp1.reverse());
    arrCache1.forEach((item, i) => {
      item.style.top = i * 48 + "px";
      item.style.bottom = "auto";
    });
    arrCache2.push(...arrTemp2.reverse());
    arrCache2.forEach((item, i) => {
      item.style.top = i * 48 + "px";
      item.style.bottom = "auto";
    });
  }
  if (remainCell.length !== 0) {
    while (numRamdomRotate > 0) {
      if (Math.floor(Math.random() * 2 + 1) === 1) {
        remainCell[
          Math.floor(Math.random() * remainCell.length)
        ].style.transform = "rotate(90deg)";
      } else {
        remainCell[
          Math.floor(Math.random() * remainCell.length)
        ].style.transform = "rotate(180deg)";
      }
      numRamdomRotate--;
    }
  }
}

function treatLevel7(firstClicked, secondClicked, locateFirst, locateSecond) {
  let remainCell = [];
  cells.forEach((cell) => {
    if (cell.style.visibility !== "hidden") {
      remainCell.push(cell);
    }
  });
  let numRamdomRotate = Math.random() * 20 + 10;
  if (locateFirst[0] == locateSecond[0]) {
    let arrCache1 = [];
    let arrTemp = [];
    let temp = 0;
    for (let i = 1; i <= numCols; i++) {
      let cell = convertMatrixToCell(locateFirst[0], i);
      if (cell.textContent === "1") {
        cell.setAttribute("id", (locateFirst[0] - 1) * numCols + (i - temp));
        arrCache1.push(cell);
      } else if (cell.textContent === "0") {
        cell.setAttribute("id", locateFirst[0] * numCols - temp);
        arrTemp.push(cell);
        temp++;
      }
    }
    // dùng để xét lại giá trị của cột trong ma trận
    let count = 0;
    while (count < numCols) {
      // < 12
      if (count < arrTemp.length) {
        //xét lại giá trị trong ma trận đẩy các ô có giá trị 0 vừa xét lên phía trên
        matrix[locateFirst[0]][numCols - count] = "0";
      } else {
        matrix[locateFirst[0]][numCols - count] = "1";
      }
      count++;
    }
    arrCache1.push(...arrTemp.reverse());
    arrCache1.forEach((item, i) => {
      // reverse() để dễ hiểu hơn đúng kiểu level là hạ xuống
      item.style.right = "auto";
      item.style.left = i * 48 + "px";
    });
  } else {
    let arrCache1 = [];
    let arrCache2 = [];
    let arrTemp1 = [];
    let arrTemp2 = [];
    let temp1 = 0;
    let temp2 = 0;
    for (let i = 1; i <= numCols; i++) {
      // const cell = cells[(i - 1) * numCols + locateFirst[1] - 1];
      let cell = convertMatrixToCell(locateFirst[0], i);
      if (cell.textContent === "1") {
        cell.setAttribute("id", (locateFirst[0] - 1) * numCols + (i - temp1));
        arrCache1.push(cell);
      } else if (cell.textContent === "0") {
        cell.setAttribute("id", locateFirst[0] * numCols - temp1);
        arrTemp1.push(cell);
        temp1++;
      }
    }
    for (let i = 1; i <= numCols; i++) {
      // const cell = cells[(i - 1) * numCols + locateFirst[1] - 1];
      let cell = convertMatrixToCell(locateSecond[0], i);
      if (cell.textContent === "1") {
        cell.setAttribute("id", (locateSecond[0] - 1) * numCols + (i - temp2));
        arrCache2.push(cell);
      } else if (cell.textContent === "0") {
        cell.setAttribute("id", locateSecond[0] * numCols - temp2);
        arrTemp2.push(cell);
        temp2++;
      }
    }
    let count1 = 0;
    let count2 = 0;
    while (count1 < numCols && count2 < numCols) {
      if (count1 < arrTemp1.length) {
        matrix[locateFirst[0]][numCols - count1] = "0";
      } else {
        matrix[locateFirst[0]][numCols - count1] = "1";
      }
      if (count2 < arrTemp2.length) {
        matrix[locateSecond[0]][numCols - count2] = "0";
      } else {
        matrix[locateSecond[0]][numCols - count2] = "1";
      }
      count1++;
      count2++;
    }
    arrCache1.push(...arrTemp1.reverse());
    arrCache1.forEach((item, i) => {
      item.style.right = "auto";
      item.style.left = i * 48 + "px";
    });
    arrCache2.push(...arrTemp2.reverse());
    arrCache2.forEach((item, i) => {
      item.style.right = "auto";
      item.style.left = i * 48 + "px";
    });
  }
  if (remainCell.length !== 0) {
    while (numRamdomRotate > 0) {
      if (Math.floor(Math.random() * 2 + 1) === 1) {
        remainCell[
          Math.floor(Math.random() * remainCell.length)
        ].style.transform = "rotate(90deg)";
      } else {
        remainCell[
          Math.floor(Math.random() * remainCell.length)
        ].style.transform = "rotate(180deg)";
      }
      numRamdomRotate--;
    }
  }
}

// hàm set up lại ID cho cell khi đã thay đổi hàng và cột
function resetCellID() {
  cells.forEach((cell) => {
    cell.textContent = "1";
  });
}

// ve duong an khi chon dung the
let lines = document.querySelectorAll(".line");
function drawLine(path, locateFirst, locateSecond) {
  let ori = [];
  for (let i = 0; i < path.length - 1; i++) {
    if (path[i].x == path[i + 1].x) {
      if (path[i].y == path[i + 1].y - 1) {
        ori.push("r");
      } else {
        ori.push("l");
      }
    } else {
      if (path[i].x == path[i + 1].x - 1) {
        ori.push("d");
      } else {
        ori.push("u");
      }
    }
  }
  // console.log('ori: ' + ori)
  // let numOri = [];
  // let numR = 0;
  // let numL = 0;
  // let numU = 0;
  // let numD = 0;
  // ori.forEach(item => {
  //     switch (item) {
  //         case 'r': numR++; break;
  //         case 'l': numL++; break;
  //         case 'u': numU++; break;
  //         case 'd': numD++; break;
  //         default: break;
  //     }
  // })
  // numOri.push(numR);
  // numOri.push(numL);
  // numOri.push(numU);
  // numOri.push(numD);

  // tạo map để lưu hướng với số lần hướng đó xuất hiện
  // let numOri = new Map();
  // let currentElement = null;
  // let count = 0;
  // ori.forEach(item => {
  //     if (item === currentElement) {
  //         count++;
  //     } else {
  //         if (currentElement !== null) {
  //             numOri.set(currentElement, count);
  //         }
  //         currentElement = item;
  //         count = 1;
  //     }
  // });
  // // thêm phần tử cúi vào map vì nó ko được duyệt lại khi chạy hết foreach
  // if (currentElement !== null) {
  //     numOri.set(currentElement, count);
  // }

  // tạo mảng json để lưu hướng với số lần hướng đó xh thay cho map vì map ko lưu được các key nhìu lần
  let numOri = [];
  let currentKey = null;
  let count = 0;

  ori.forEach((item) => {
    if (item === currentKey) {
      count++;
    } else {
      if (currentKey !== null) {
        numOri.push({ [currentKey]: count });
      }
      currentKey = item;
      count = 1;
    }
  });

  // thêm phần tử cúi vào map vì nó ko được duyệt lại khi chạy hết foreach
  if (currentKey !== null) {
    numOri.push({ [currentKey]: count });
  }
  // console.log(numOri)

  let turn = [locateFirst[0], locateFirst[1]]; // xác định tọa độ lúc đổi hướng giúp nối các line tiện hơn
  lines.forEach((line, index) => {
    // console.log('turnsssssssssssssssss : ' + turn)
    let breaked0 = false;
    numOri.forEach((item, i) => {
      if (!breaked0 && i == index) {
        // danh sách các key trong numOri
        let breaked = false;
        let keys = Object.keys(item);
        // Duyệt qua từng key và giá trị tương ứng
        keys.forEach((key) => {
          // console.log("Key:", key, "Value:", item[key]);
          // console.log('turnsssssssssssssssss : ' + turn + "--" + breaked)
          if (item[key] != 0 && !breaked) {
            showLine(key, item[key], turn);
            if (key == "r") {
              turn[1] += item[key];
            } else if (key == "l") {
              turn[1] -= item[key];
            } else if (key == "u") {
              turn[0] -= item[key];
            } else if (key == "d") {
              turn[0] += item[key];
            }
            item[key] = 0; // set lại giá trị để line sau không bị ghi lại
            // console.log("==========ORI========" + key);
            breaked = true;
          }
        });
        breaked0 = true;
      }
    });
    // for (let i of numOri.keys()) { // r - l - u- d
    //     if (numOri.get(i) != 0) {
    //         showLine(i, numOri.get(i), turn);
    //         if (i == 'r') {
    //             turn[1] += numOri.get(i)
    //         } else if (i == 'l') {
    //             turn[1] -= numOri.get(i)
    //         } else if (i == 'u') {
    //             turn[0] -= numOri.get(i)
    //         } else if (i == 'd') {
    //             turn[0] += numOri.get(i)
    //         }
    //         console.log('turnsssssssssssssssss : ' + turn)
    //         numOri.set(i, 0); // set lại giá trị để line sau không bị ghi lại
    //         console.log("==========ORI========" + i);
    //         break;
    //     }
    // }
    function showLine(lineType, len, turn) {
      //len : tinh chieu dai cua line, index : xac dinh huong di la r/l/u/d
      line.style.visibility = "visible";
      // line.classList.add('.Hline');
      switch (lineType) {
        case "r":
          line.classList.add("Hline");
          break;
        case "l":
          line.classList.add("Hline");
          break;
        case "u":
          line.classList.add("Vline");
          break;
        case "d":
          line.classList.add("Vline");
          break;
        default:
          break;
      }
      let widthLine = parseFloat(
        window.getComputedStyle(line).getPropertyValue("width").valueOf()
      );
      let heightLine = parseFloat(
        window.getComputedStyle(line).getPropertyValue("height").valueOf()
      );
      let topLine = parseFloat(
        window.getComputedStyle(line).getPropertyValue("top").valueOf()
      );
      let leftLine = parseFloat(
        window.getComputedStyle(line).getPropertyValue("left").valueOf()
      );
      // console.log('======== newWidthLine:' + (widthLine))
      // console.log('======== newHeightLine:' + (heightLine))
      // console.log('======== newTopLine:' + (topLine - (locateFirst[0] * 45)))
      // console.log('======== newLeftLine:' + (leftLine + (locateFirst[1] * 45)))
      switch (lineType) {
        case "r":
          line.style.width = widthLine + widthLine * (len - 1) + "px";
          // line.style.height = heightLine;
          line.style.top = topLine + (turn[0] - 1) * 48 + "px"; // fix
          line.style.left = leftLine + (turn[1] - 1) * 48 + "px";
          break;
        case "l":
          line.style.width = widthLine + widthLine * (len - 1) + "px";
          // line.style.height = heightLine;
          line.style.top = topLine + (turn[0] - 1) * 48 + "px";
          line.style.left = leftLine + (turn[1] - (len + 1)) * 48 + "px";
          break;
        case "u":
          // line.style.width = widthLine;
          line.style.height = heightLine + heightLine * (len - 1) + "px";
          line.style.top = topLine + (turn[0] - (len + 1)) * 48 + "px"; // top : true , left : fasle
          line.style.left = leftLine + (turn[1] - 1) * 48 + "px"; // top : true, left : true
          break;
        case "d":
          // line.style.width = widthLine;
          line.style.height = heightLine + heightLine * (len - 1) + "px";
          line.style.top = topLine + (turn[0] - 1) * 48 + "px"; // -/+
          line.style.left = leftLine + (turn[1] - 1) * 48 + "px";
          break;
        default:
          break;
      }
      // if (lineType === 'Hline') {
      // line.style.width = widthLine + widthLine * (len - 1) + "px";
      // } else {
      // line.style.height = heightLine + heightLine * (len - 1) + "px";
      // }
      // line.style.top = topLine + ((locateFirst[0]-1) * 48) + "px";
      // line.style.left = leftLine + ((locateFirst[1]-1) * 48) + "px";
    }
    setTimeout(function () {
      line.removeAttribute("style");
      while (line.classList.length != 1) {
        line.classList.remove(line.classList.item(1));
      }
    }, 300);
  });
}

let running = false;
// thay đổi trạng thái game thành pause
function stopTimeLine() {
  running = false;
}

// reset lại timeline khi chuyển level/ chơi lại game
function resetTimeline() {
  targetWidth = 0;
  timeline.style.transition = "none"; // hủy transition
  timeline.style.width = currentWidth + "px"; // thiết lập lại chiều rộng ban đầu
}

// Biến lưu trữ ID của interval (vì nếu ko đặt biến để set lại giá trị thì khi để vào vòng lặp các buttonLevel sẽ bị setInterval() nhiều lần dẫn đến timeline sẽ đi nhanh hơn)
let intervalID;

// hàm để giảm timeline khi chọn sai trong level5-6 + fix thêm hiệu ứng giảm time
function decreaseWidth() {
  console.log("minus timeline successful");
  targetWidth -= 10;
  // kiểm tra xem độ dài timeline đủ không, nếu không thì dừng timeline
  if (targetWidth >= 0) {
    timeline.classList.add("shake");
    setTimeout(() => {
      timeline.classList.remove("shake");
    }, 400);
    timeline.style.transition = "width 0.5s ease-in-out";
    timeline.style.width = targetWidth + "px";
  } else {
    clearInterval(intervalID);
    return;
  }
  if (targetWidth < 10) {
    loseGame();
  }
}

let plusTime = document.querySelector(".plusTime");
let imgPlusTime = document.querySelectorAll(".plusTime img");
// hàm để tăng timeline khi chọn sai trong level5-6 + fix thêm hiệu ứng giảm time
function increaseWidth() {
  // kiểm tra xem độ dài timeline đủ không, nếu không thì dừng timeline
  console.log("targetWidth + 10  : " + (targetWidth + 10));
  console.log(targetWidth + 10 <= FULL_TIMELINE_WIDTH);
  plusTime.style.display = "flex";
  imgPlusTime.forEach((img) => {
    img.style.animation = "plus 2s linear";
  });
  setTimeout(() => {
    imgPlusTime.forEach((img) => {
      plusTime.style.display = "none";
      img.style.animation = null;
    });
  }, 2000);
  if (targetWidth + 20 <= FULL_TIMELINE_WIDTH) {
    console.log("plus timeline successful");
    targetWidth += 20;
    timeline.style.transition = "width 0.5s ease-in-out";
    timeline.style.width = targetWidth + "px";
  } else {
    console.log("plus timeline fail");
    targetWidth += FULL_TIMELINE_WIDTH - targetWidth;
    return;
  }
}

// thiết lập thời gian cho 1 level
function initializeTimeLine() {
  // Tính toán chiều dài hiện tại của .timeline
  // console.log('targetWidth:' + targetWidth)
  if (targetWidth == 0) {
    targetWidth = FULL_TIMELINE_WIDTH;
  }

  // Dừng interval cũ trước khi tạo một interval mới
  clearInterval(intervalID);

  // mỗi 1s set lại width cho timeline bằng targetWidth
  intervalID = setInterval(() => {
    targetWidth -= FULL_TIMELINE_WIDTH / LEVEL_TIME_SECONDS;
    if (!running) {
      clearInterval(intervalID); // Dừng interval
      return; // Kết thúc hàm
    }

    // nếu width = 0 thì kết thúc
    if (targetWidth >= 0) {
      timeline.style.transition = "width 0.5s ease-in-out";
      timeline.style.width = targetWidth + "px";
    } else {
      clearInterval(intervalID);
    }
    if (targetWidth < 2) {
      targetWidth = 0;
      loseGame();
    }
  }, 1000); // mỗi giây lặp lại việc giảm kích thước của timeline
}

// kết thúc game và hiện bảng điểm
function loseGame() {
  loseScore.textContent = score.textContent;
  board_lose.style.display = "block";
}

//play
// initializeGame();
function initializeGame() {
  const savedProgress = getSavedGameProgress();
  currentLevel = savedProgress.level.toString();
  updateCellIds();
  initializeBoardUI();
  initializeBoardForCurrentLevel();
  initializeScore(savedProgress.score);
  restoreBoard();
  resetTimeline();
  // statusGame.textContent = `${currentPlayer}'s turn`;
  running = true;
  currentWidth = parseFloat(window.getComputedStyle(timeline).width);
  resetButtonLevel();
  checkLevel();
  initializeTimeLine();
}
