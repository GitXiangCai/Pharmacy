const YEARS = ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"];

const TYPES = [
  "名解",
  "判断",
  "单选",
  "多选",
  "填空",
  "简答",
  "论述",
];

const CARDS_PER_BATCH = 3;

const state = {
  allQuestions: [],
  selectedYear: "ALL",
  selectedType: "ALL",
  randomAll: false,
  cursorIndex: 0,
};

const dom = {
  yearChips: document.getElementById("year-chips"),
  typeChips: document.getElementById("type-chips"),
  randomAllBtn: document.getElementById("random-all-btn"),
  cardsContainer: document.getElementById("cards-container"),
  emptyState: document.getElementById("empty-state"),
  statusText: document.getElementById("status-text"),
  prevPageBtn: document.getElementById("prev-page-btn"),
  nextPageBtn: document.getElementById("next-page-btn"),
};

function setStatus(text) {
  if (dom.statusText) {
    dom.statusText.textContent = text;
  }
}

async function loadAllQuestions() {
  setStatus("正在加载题库…");
  try {
    const all = [];
    for (const year of YEARS) {
      const res = await fetch(`./02-json/${year}.json`);
      if (!res.ok) continue;
      const list = await res.json();
      if (Array.isArray(list)) {
        all.push(...list);
      }
    }
    state.allQuestions = all;
    if (!all.length) {
      setStatus("未加载到题库数据，请检查 JSON 文件。");
    } else {
      setStatus("题库已加载。");
    }
  } catch (e) {
    console.error(e);
    setStatus("加载题库失败，请检查是否通过本地服务器访问。");
  }
}

function initChips() {
  dom.yearChips.innerHTML = "";
  // "所有年份" 选项
  const allYearBtn = document.createElement("button");
  allYearBtn.className = "chip";
  allYearBtn.textContent = "所有年份";
  allYearBtn.dataset.year = "ALL";
  if (state.selectedYear === "ALL") allYearBtn.classList.add("active");
  allYearBtn.addEventListener("click", () => {
    state.selectedYear = "ALL";
    state.randomAll = false;
    state.cursorIndex = 0;
    updateChipActive(dom.yearChips, allYearBtn);
    if (dom.randomAllBtn) {
      dom.randomAllBtn.classList.remove("active");
    }
    renderCurrentBatch();
  });
  dom.yearChips.appendChild(allYearBtn);

  YEARS.forEach((year) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.textContent = year;
    btn.dataset.year = year;
    if (year === state.selectedYear) btn.classList.add("active");
    btn.addEventListener("click", () => {
      state.selectedYear = year;
      state.randomAll = false;
      state.cursorIndex = 0;
      updateChipActive(dom.yearChips, btn);
      if (dom.randomAllBtn) {
        dom.randomAllBtn.classList.remove("active");
      }
      renderCurrentBatch();
    });
    dom.yearChips.appendChild(btn);
  });

  dom.typeChips.innerHTML = "";
  // "所有题型" 选项
  const allTypeBtn = document.createElement("button");
  allTypeBtn.className = "chip";
  allTypeBtn.textContent = "所有题型";
  allTypeBtn.dataset.type = "ALL";
  if (state.selectedType === "ALL") allTypeBtn.classList.add("active");
  allTypeBtn.addEventListener("click", () => {
    state.selectedType = "ALL";
    state.randomAll = false;
    state.cursorIndex = 0;
    updateChipActive(dom.typeChips, allTypeBtn);
    if (dom.randomAllBtn) {
      dom.randomAllBtn.classList.remove("active");
    }
    renderCurrentBatch();
  });
  dom.typeChips.appendChild(allTypeBtn);

  TYPES.forEach((type) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.textContent = type;
    btn.dataset.type = type;
    if (type === state.selectedType) btn.classList.add("active");
    btn.addEventListener("click", () => {
      state.selectedType = type;
      state.randomAll = false;
      state.cursorIndex = 0;
      updateChipActive(dom.typeChips, btn);
      if (dom.randomAllBtn) {
        dom.randomAllBtn.classList.remove("active");
      }
      renderCurrentBatch();
    });
    dom.typeChips.appendChild(btn);
  });
}

function updateChipActive(container, activeBtn) {
  Array.from(container.querySelectorAll(".chip")).forEach((chip) => {
    chip.classList.toggle("active", chip === activeBtn);
  });
}

function getFilteredQuestions() {
  if (!state.allQuestions.length) return [];

  if (state.randomAll) {
    return state.allQuestions;
  }

  let list = state.allQuestions.slice();
  if (state.selectedYear !== "ALL") {
    list = list.filter((q) => q.year === state.selectedYear);
  }
  if (state.selectedType !== "ALL") {
    list = list.filter((q) => q.type === state.selectedType);
  }
  return list;
}

function getRandomSample(arr, count) {
  const copy = arr.slice();
  const n = Math.min(count, copy.length);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function renderCurrentBatch() {
  const baseList = getFilteredQuestions();

  if (!baseList.length) {
    dom.cardsContainer.innerHTML = "";
    dom.emptyState.hidden = false;
    if (dom.prevPageBtn) dom.prevPageBtn.disabled = true;
    if (dom.nextPageBtn) dom.nextPageBtn.disabled = true;
    return;
  }

  dom.emptyState.hidden = true;

  let batch;
  let start = 0;
  let end = 0;

  if (state.randomAll) {
    batch = getRandomSample(baseList, CARDS_PER_BATCH);
  } else {
    const maxStart = Math.max(0, baseList.length - CARDS_PER_BATCH);
    start = Math.min(state.cursorIndex, maxStart);
    end = start + CARDS_PER_BATCH;
    batch = baseList.slice(start, end);
    state.cursorIndex = start;
  }

  const isFirstPage = !state.randomAll && state.cursorIndex === 0;
  const isLastPage =
    !state.randomAll && state.cursorIndex + CARDS_PER_BATCH >= baseList.length;

  if (dom.prevPageBtn) {
    dom.prevPageBtn.disabled = state.randomAll ? false : isFirstPage;
  }
  if (dom.nextPageBtn) {
    dom.nextPageBtn.disabled = state.randomAll ? false : isLastPage;
  }

  dom.cardsContainer.innerHTML = "";
  batch.forEach((q) => {
    const cardWrapper = document.createElement("div");
    cardWrapper.className = "card-wrapper";

    const card = document.createElement("article");
    card.className = "card";

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const front = document.createElement("div");
    front.className = "card-face front";

    const back = document.createElement("div");
    back.className = "card-face back";

    const metaFront = document.createElement("div");
    metaFront.className = "card-meta";
    metaFront.innerHTML = `
      <div class="card-meta-left">
        <span class="card-tag">${q.type || "题目"}</span>
      </div>
      <span class="card-score">${q.score || ""} 分</span>
    `;

    const stemEl = document.createElement("div");
    stemEl.className = "card-stem";
    stemEl.textContent = q.stem || "";

    const stemWrap = document.createElement("div");
    stemWrap.className = "card-stem-wrap";
    stemWrap.appendChild(stemEl);

    const footerFront = document.createElement("div");
    footerFront.className = "card-footer";
    footerFront.innerHTML = `
      <span class="card-year">${q.year || ""}</span>
      <span class="card-hint">点击卡片查看答案</span>
    `;

    front.appendChild(metaFront);
    front.appendChild(stemWrap);
    front.appendChild(footerFront);

    const metaBack = document.createElement("div");
    metaBack.className = "card-meta";
    metaBack.innerHTML = `
      <div class="card-meta-left">
        <span class="card-tag">${q.type || "题目"}</span>
      </div>
      <span class="card-score">${q.score || ""} 分</span>
    `;

    const answerLabel = document.createElement("div");
    answerLabel.className = "card-answer-label";
    answerLabel.textContent = "参考答案";

    const answerEl = document.createElement("div");
    answerEl.className = "card-answer";
    const ans = q.answers && String(q.answers).trim();
    answerEl.textContent = ans || "（该题暂未录入答案）";

    const answerWrap = document.createElement("div");
    answerWrap.className = "card-answer-wrap";
    answerWrap.appendChild(answerLabel);
    answerWrap.appendChild(answerEl);

    const footerBack = document.createElement("div");
    footerBack.className = "card-footer";
    footerBack.innerHTML = `
      <span class="card-year">${q.year || ""}</span>
      <span class="card-hint">再次点击返回题目</span>
    `;

    back.appendChild(metaBack);
    back.appendChild(answerWrap);
    back.appendChild(footerBack);

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    cardWrapper.appendChild(card);

    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
    });

    dom.cardsContainer.appendChild(cardWrapper);
  });
}

function setupInteractions() {
  if (dom.randomAllBtn) {
    dom.randomAllBtn.addEventListener("click", () => {
      state.randomAll = true;
      state.selectedYear = "ALL";
      state.selectedType = "ALL";
      state.cursorIndex = 0;

      dom.randomAllBtn.classList.add("active");

      // 取消年份和题型选中
      Array.from(dom.yearChips.querySelectorAll(".chip")).forEach((chip) =>
        chip.classList.remove("active"),
      );
      Array.from(dom.typeChips.querySelectorAll(".chip")).forEach((chip) =>
        chip.classList.remove("active"),
      );

      renderCurrentBatch();
    });
  }

  if (dom.nextPageBtn) {
    dom.nextPageBtn.addEventListener("click", () => {
      if (!state.allQuestions.length) return;
      const base = getFilteredQuestions();
      if (!base.length) return;

      if (state.randomAll) {
        renderCurrentBatch();
        return;
      }

      const maxStart = Math.max(0, base.length - CARDS_PER_BATCH);
      const nextIndex = state.cursorIndex + CARDS_PER_BATCH;
      if (nextIndex > maxStart) {
        return;
      }
      state.cursorIndex = nextIndex;
      renderCurrentBatch();
    });
  }

  if (dom.prevPageBtn) {
    dom.prevPageBtn.addEventListener("click", () => {
      if (!state.allQuestions.length) return;
      const base = getFilteredQuestions();
      if (!base.length) return;

      if (state.randomAll) {
        renderCurrentBatch();
        return;
      }

      state.cursorIndex = Math.max(0, state.cursorIndex - CARDS_PER_BATCH);
      renderCurrentBatch();
    });
  }
}

async function bootstrap() {
  initChips();
  setupInteractions();
  await loadAllQuestions();
  renderCurrentBatch();
}

bootstrap();

