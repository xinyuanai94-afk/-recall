
const STORAGE_KEY = "recallStudy_v2";

const categories = ["政治", "経済", "国際", "公共"];

const starterCards = [
  {
    id: 1,
    category: "政治",
    definition: "国会が内閣総理大臣を指名し、内閣が国会に対して連帯して責任を負う制度。",
    term: "議院内閣制",
    extra: "日本やイギリスで採用。",
  },
  {
    id: 2,
    category: "政治",
    definition: "国会が国政について調査することができる権限。",
    term: "国政調査権",
    extra: "日本国憲法第62条。",
  },
  {
    id: 3,
    category: "政治",
    definition: "裁判所が法律や命令などが憲法に適合するか判断する権限。",
    term: "違憲審査権",
    extra: "日本では具体的な争訟を前提とする。",
  },
  {
    id: 4,
    category: "経済",
    definition: "中央銀行が国債などを売買して市場の資金量を調整する金融政策。",
    term: "公開市場操作",
    extra: "買いオペは資金供給、売りオペは資金吸収。",
  },
  {
    id: 5,
    category: "経済",
    definition: "物価が継続的に下落する現象。",
    term: "デフレーション",
    extra: "消費や投資が抑制されることがある。",
  },
  {
    id: 6,
    category: "経済",
    definition: "一国の一定期間に生み出された付加価値の合計。",
    term: "国内総生産（GDP）",
    extra: "中間生産物の二重計算を避ける。",
  },
  {
    id: 7,
    category: "国際",
    definition: "財・サービスの貿易や第一次所得収支などを記録する国際収支の項目。",
    term: "経常収支",
    extra: "貿易・サービス収支などからなる。",
  },
  {
    id: 8,
    category: "国際",
    definition: "国際の平和と安全の維持について主要な責任を負う国連の機関。",
    term: "安全保障理事会",
    extra: "常任理事国は5か国。",
  },
  {
    id: 9,
    category: "公共",
    definition: "個人の尊厳と幸福を追求する権利を尊重するという考え方。",
    term: "基本的人権の尊重",
    extra: "日本国憲法の基本原理の一つ。",
  }
];

let cards = loadCards();
let queue = [];
let index = 0;
let revealed = false;
let sessionMode = "all";
let touchStartX = 0;
let touchStartY = 0;

// 保存データの読み込み

function loadCards() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      return parsed.map(card => ({
        ...card,
        status: card.status || "new",
        reviews: card.reviews || 0,
        weakCount: card.weakCount || 0,
        due: card.due || 0,
        correctCount: card.correctCount || 0
      }));
    }
  } catch (error) {
    console.error("保存データの読み込みに失敗:", error);
  }

  return starterCards.map(card => ({
    ...card,
    status: "new",
    reviews: 0,
    weakCount: 0,
    due: 0,
    correctCount: 0
  }));
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  updateStats();
  updateDashboard();
}

// 日付

function startApp() {
  document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  updateStats();
  buildQueue();
  updateDashboard();
}

// 基本統計

function updateStats() {
  document.getElementById("total").textContent = cards.length;

  document.getElementById("mastered").textContent =
    cards.filter(c => c.status === "known").length;

  document.getElementById("weak").textContent =
    cards.filter(c => c.status === "weak").length;
}

// 出題リスト作成

function buildQueue() {
  const category = document.getElementById("category").value;
  const mode = document.getElementById("mode").value;
  const now = Date.now();

  sessionMode = mode;

  queue = cards.filter(card => {
    if (category !== "すべて" &&
        card.category !== category) return false;

    if (mode === "weak" &&
        card.status !== "weak") return false;

    if (mode === "due" &&
        card.due > now) return false;

    return true;
  });

  queue.sort((a, b) => {
    const priority = card =>
      card.status === "weak" ? 0 :
      card.status === "new" ? 1 : 2;

    return priority(a) - priority(b) ||
      (a.due || 0) - (b.due || 0);
  });

  index = 0;
  revealed = false;

  render();
}

// 現在のカード

function currentCard() {
  return queue[index];
}

// 画面表示

function render() {
  const card = currentCard();
  const empty = !card;

  document.getElementById("emptyMessage")
    .classList.toggle("hidden", !empty);

  document.getElementById("studyCard")
    .classList.toggle("hidden", empty);

  document.querySelector(".controls")
    .classList.toggle("hidden", empty);

  if (empty) {
    document.getElementById("counter").textContent = "0 / 0";
    document.getElementById("progressBar").style.width = "0%";
    document.getElementById("progressText").textContent = "NO CARDS";
    return;
  }

  document.getElementById("counter").textContent =
    `${index + 1} / ${queue.length}`;

  document.getElementById("progressText").textContent =
    sessionMode === "weak" ? "WEAK CARDS" :
    sessionMode === "due" ? "REVIEW MODE" :
    "YOUR PROGRESS";

  document.getElementById("progressBar").style.width =
    `${((index + 1) / queue.length) * 100}%`;

  document.getElementById("cardCategory").textContent =
    card.category;

  document.getElementById("cardStatus").textContent =
    card.status === "known" ? "習得済み" :
    card.status === "weak" ? "復習" : "未学習";

  document.getElementById("definition").textContent =
    card.definition;

  document.getElementById("term").textContent =
    card.term;

  document.getElementById("extra").textContent =
    card.extra || "";

  document.getElementById("answerArea")
    .classList.toggle("hidden", !revealed);

  document.getElementById("judgeArea")
    .classList.toggle("hidden", !revealed);

  document.getElementById("reveal")
    .classList.toggle("hidden", revealed);
}

// 次のカード

function nextCard() {
  if (!queue.length) return;

  index = (index + 1) % queue.length;
  revealed = false;
  render();
}

// 前のカード

function previousCard() {
  if (!queue.length) return;

  index = (index - 1 + queue.length) % queue.length;
  revealed = false;
  render();
}

// 答えの表示

function revealAnswer() {
  if (!currentCard()) return;

  revealed = !revealed;
  render();
}

document.getElementById("reveal")
  .addEventListener("click", revealAnswer);

// カードをタップして答え表示

document.getElementById("studyCard")
  .addEventListener("click", event => {
    if (event.target.closest("button")) return;
    revealAnswer();
  });

// 左右・上下スワイプ

const studyCard = document.getElementById("studyCard");

studyCard.addEventListener("touchstart", event => {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;
}, { passive: true });

studyCard.addEventListener("touchend", event => {
  const dx = event.changedTouches[0].clientX - touchStartX;
  const dy = event.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy) &&
      Math.abs(dx) > 55) {
    if (dx < 0) nextCard();
    else previousCard();
  } else if (Math.abs(dy) > 55) {
    if (dy < 0) {
      if (!revealed) {
        revealed = true;
        render();
      }
    } else {
      if (revealed) {
        revealed = false;
        render();
      }
    }
  }
}, { passive: true });

// ボタン操作

document.getElementById("next")
  .addEventListener("click", nextCard);

document.getElementById("prev")
  .addEventListener("click", previousCard);

// シャッフル

document.getElementById("shuffle")
  .addEventListener("click", () => {
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    index = 0;
    revealed = false;
    render();
  });

// 4枚後に再出題するカード

let retryQueue = [];

function insertRetry(card) {
  retryQueue.push(card);
}

function advanceRetryQueue() {
  if (retryQueue.length > 0) {
    const retryCard = retryQueue.shift();

    // 現在位置から4枚後に挿入
    const insertAt = Math.min(index + 4, queue.length);

    queue.splice(insertAt, 0, retryCard);
  }
}

// 学習判定

function judge(status) {
  const card = currentCard();

  if (!card) return;

  card.reviews = (card.reviews || 0) + 1;

  if (status === "weak") {
    card.status = "weak";
    card.weakCount = (card.weakCount || 0) + 1;
    card.due = Date.now();

    // 同じカードを4枚後に再出題
    insertRetry(card);

  } else {
    card.status = "known";
    card.correctCount = (card.correctCount || 0) + 1;

    // 忘却曲線を意識した復習間隔
    const intervals = [1, 3, 7, 14, 30];

    const days = intervals[
      Math.min(card.correctCount - 1, intervals.length - 1)
    ];

    card.due = Date.now() +
      days * 24 * 60 * 60 * 1000;
  }

  save();

  // 次のカードへ進む
  if (index < queue.length - 1) {
    index++;
  } else {
    index = 0;
  }

  revealed = false;

  // 4枚後に再出題するカードを追加
  advanceRetryQueue();

  render();
}

document.getElementById("unknown")
  .addEventListener("click", () => judge("weak"));

document.getElementById("known")
  .addEventListener("click", () => judge("known"));

// フィルター

document.getElementById("category")
  .addEventListener("change", () => {
    retryQueue = [];
    buildQueue();
  });

document.getElementById("mode")
  .addEventListener("change", () => {
    retryQueue = [];
    buildQueue();
  });

// ページ切り替え

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b =>
      b.classList.remove("active")
    );

    button.classList.add("active");

    const page = button.dataset.page;

    document.getElementById("studyPage")
      .classList.toggle("hidden", page !== "study");

    document.getElementById("dashboardPage")
      .classList.toggle("hidden", page !== "dashboard");

    document.getElementById("managePage")
      .classList.toggle("hidden", page !== "manage");

    if (page === "dashboard") updateDashboard();
    if (page === "manage") renderList();
  });
});

// 1問追加

document.getElementById("addForm")
  .addEventListener("submit", event => {
    event.preventDefault();

    const definition =
      document.getElementById("newDefinition").value.trim();

    const term =
      document.getElementById("newTerm").value.trim();

    const category =
      document.getElementById("newCategory").value;

    const extra =
      document.getElementById("newExtra").value.trim();

    if (!definition || !term) return;

    cards.push({
      id: Date.now(),
      category,
      definition,
      term,
      extra,
      status: "new",
      reviews: 0,
      weakCount: 0,
      correctCount: 0,
      due: 0
    });

    save();
    event.target.reset();
    renderList();
    buildQueue();

    alert("問題を追加しました！");
  });

// 一括登録

document.getElementById("bulkAdd")
  .addEventListener("click", () => {
    const input = document.getElementById("bulkInput").value;

    const lines = input.split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    const newCards = [];
    const errors = [];

    lines.forEach((line, index) => {
      const parts = line.split("|").map(x => x.trim());

      if (parts.length < 3 ||
          !categories.includes(parts[0]) ||
          !parts[1] ||
          !parts[2]) {
        errors.push(index + 1);
        return;
      }

      newCards.push({
        id: Date.now() + index + Math.random(),
        category: parts[0],
        definition: parts[1],
        term: parts[2],
        extra: parts[3] || "",
        status: "new",
        reviews: 0,
        weakCount: 0,
        correctCount: 0,
        due: 0
      });
    });

    if (!newCards.length) {
      document.getElementById("bulkMessage").textContent =
        "登録できる問題がありません。入力形式を確認してください。";
      return;
    }

    cards.push(...newCards);

    save();
    buildQueue();
    renderList();

    document.getElementById("bulkInput").value = "";

    document.getElementById("bulkMessage").textContent =
      `${newCards.length}問を登録しました。` +
      (errors.length
        ? ` ${errors.length}行は形式が違うためスキップしました。`
        : "");

  });

// 学習記録の更新

function updateDashboard() {
  const total = cards.length;

  const mastered = cards.filter(c =>
    c.status === "known"
  ).length;

  const rate = total
    ? Math.round(mastered / total * 100)
    : 0;

  document.getElementById("overallRate").textContent =
    `${rate}%`;

  document.getElementById("overallBar").style.width =
    `${rate}%`;

  document.getElementById("overallDetail").textContent =
    `${mastered} / ${total} 問習得`;

  // カテゴリー別習得率

  const rateContainer =
    document.getElementById("categoryRates");

  rateContainer.innerHTML = "";

  categories.forEach(category => {
    const group = cards.filter(c =>
      c.category === category
    );

    const done = group.filter(c =>
      c.status === "known"
    ).length;

    const percent = group.length
      ? Math.round(done / group.length * 100)
      : 0;

    const item = document.createElement("div");
    item.className = "rate-item";

    item.innerHTML = `
      <div class="rate-top">
        <strong>${category}</strong>
        <span>${percent}%</span>
      </div>
      <div class="progress">
        <div style="width:${percent}%;height:100%;background:var(--sage);border-radius:20px"></div>
      </div>
      <div class="rate-bottom">
        ${done} / ${group.length} 問習得
      </div>
    `;

    rateContainer.appendChild(item);
  });

  // 苦手ランキング

  const ranking =
    document.getElementById("weakRanking");

  ranking.innerHTML = "";

  const weakCards = cards
    .filter(c => c.weakCount > 0)
    .sort((a, b) =>
      b.weakCount - a.weakCount ||
      a.correctCount - b.correctCount
    )
    .slice(0, 10);

  if (!weakCards.length) {
    ranking.textContent = "まだ苦手カードはありません。";
  }

  weakCards.forEach((card, i) => {
    const item = document.createElement("div");
    item.className = "rank-item";

    const number = document.createElement("span");
    number.className = "rank-number";
    number.textContent = i + 1;

    const info = document.createElement("div");
    info.className = "rank-info";

    const title = document.createElement("strong");
    title.textContent = card.term;

    const category = document.createElement("small");
    category.textContent = card.category;

    info.append(title, category);

    const count = document.createElement("span");
    count.className = "rank-count";
    count.textContent = `曖昧 ${card.weakCount}回`;

    item.append(number, info, count);
    ranking.appendChild(item);
  });

  // 今日の復習予定

  const now = Date.now();

  const dueCount = cards.filter(c =>
    c.status !== "new" &&
    c.due <= now
  ).length;

  document.getElementById("dueCount").textContent =
    dueCount;
}

// 問題検索・一覧

function renderList() {
  const search = document.getElementById("search")
    .value.toLowerCase();

  const list = document.getElementById("cardList");
  list.innerHTML = "";

  const filtered = cards.filter(card =>
    `${card.term} ${card.definition} ${card.extra}`
      .toLowerCase().includes(search)
  );

  document.getElementById("listCount").textContent =
    `${cards.length} CARDS`;

  if (!filtered.length) {
    list.textContent = "該当する問題はありません。";
    return;
  }

  filtered.forEach(card => {
    const item = document.createElement("div");
    item.className = "item";

    const title = document.createElement("strong");
    title.textContent =
      `${card.term} ・ ${card.category}`;

    const description = document.createElement("p");
    description.textContent = card.definition;

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const edit = document.createElement("button");
    edit.textContent = "編集";
    edit.addEventListener("click", () =>
      editCard(card.id)
    );

    const remove = document.createElement("button");
    remove.textContent = "削除";
    remove.addEventListener("click", () =>
      deleteCard(card.id)
    );

    actions.append(edit, remove);
    item.append(title, description, actions);
    list.appendChild(item);
  });
}

// 編集

function editCard(id) {
  const card = cards.find(c => c.id === id);
  if (!card) return;

  const term = prompt("用語", card.term);
  if (term === null) return;

  const definition = prompt("問題・説明", card.definition);
  if (definition === null) return;

  const extra = prompt("補足", card.extra || "");
  if (extra === null) return;

  card.term = term.trim();
  card.definition = definition.trim();
  card.extra = extra.trim();

  save();
  buildQueue();
  renderList();
}

// 削除

function deleteCard(id) {
  if (!confirm("この問題を削除しますか？")) return;

  cards = cards.filter(c => c.id !== id);

  // 削除したカードの再出題予約も解除
  retryQueue = retryQueue.filter(c => c.id !== id);

  save();
  buildQueue();
  renderList();
}

// 検索

document.getElementById("search")
  .addEventListener("input", renderList);

// 起動

startApp();
