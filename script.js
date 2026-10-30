const root = document.getElementById("app");

const starterCards = [
  {id:1,category:"政治",definition:"国会が内閣総理大臣を指名し、内閣が国会に対して連帯して責任を負う制度。",term:"議院内閣制",extra:"日本やイギリスで採用。"},
  {id:2,category:"政治",definition:"国会が内閣総理大臣や国務大臣の出席を求め、国政について説明を求める権限。",term:"国政調査権",extra:"憲法62条。"},
  {id:3,category:"政治",definition:"裁判所が、法律や命令などが憲法に適合するかどうかを判断する権限。",term:"違憲審査権",extra:"日本では具体的な争訟を前提とする。"},
  {id:4,category:"経済",definition:"中央銀行が国債などを売買して、市場に流通する資金量を調整する金融政策。",term:"公開市場操作",extra:"買いオペは資金供給、売りオペは資金吸収。"},
  {id:5,category:"経済",definition:"物価が継続的に下落し、貨幣の実質的な価値が上昇する現象。",term:"デフレーション",extra:"消費や投資が抑制され、景気悪化につながることがある。"},
  {id:6,category:"経済",definition:"一国の一定期間における、財・サービスの生産によって新たに生み出された付加価値の合計。",term:"国内総生産（GDP）",extra:"中間生産物は二重計算を避けるため含めない。"},
  {id:7,category:"国際",definition:"国際収支のうち、財・サービスの貿易や第一次所得収支などを記録する項目。",term:"経常収支",extra:"貿易・サービス収支、第一次所得収支、第二次所得収支からなる。"},
  {id:8,category:"国際",definition:"国連の主要機関の一つで、国際の平和と安全の維持について主要な責任を負う機関。",term:"安全保障理事会",extra:"常任理事国は5か国。"}
];

const STORAGE_KEY = "seikeiRecallLive_v1";

let cards = loadCards();
let queue = [];
let index = 0;
let revealed = false;

function loadCards() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : starterCards.map(c => ({
      ...c, status:"new", reviews:0, due:0
    }));
  } catch {
    return starterCards.map(c => ({...c,status:"new",reviews:0,due:0}));
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  updateStats();
}

function updateStats() {
  document.getElementById("total").textContent = cards.length;
  document.getElementById("mastered").textContent =
    cards.filter(c => c.status === "known").length;
  document.getElementById("weak").textContent =
    cards.filter(c => c.status === "weak").length;
}

function buildQueue() {
  const cat = document.getElementById("category").value;
  const mode = document.getElementById("mode").value;
  const now = Date.now();

  queue = cards.filter(c => {
    if (cat !== "すべて" && c.category !== cat) return false;
    if (mode === "weak" && c.status !== "weak") return false;
    if (mode === "due" && c.due > now) return false;
    return true;
  });

  queue.sort((a,b) => {
    const priority = c => c.status === "weak" ? 0 : c.status === "new" ? 1 : 2;
    return priority(a) - priority(b) || (a.due || 0) - (b.due || 0);
  });

  index = 0;
  revealed = false;
  render();
}

function currentCard() {
  return queue[index];
}

function render() {
  const card = currentCard();
  const empty = !card;

  document.getElementById("emptyMessage").classList.toggle("hidden", !empty);
  document.querySelector(".card").classList.toggle("hidden", empty);
  document.querySelector(".controls").classList.toggle("hidden", empty);
  if (empty) {
    document.getElementById("counter").textContent = "0 / 0";
    document.getElementById("progressBar").style.width = "0%";
    return;
  }

  document.getElementById("counter").textContent = `${index+1} / ${queue.length}`;
  document.getElementById("progressBar").style.width =
    `${((index+1)/queue.length)*100}%`;

  document.getElementById("cardCategory").textContent = card.category;
  document.getElementById("cardStatus").textContent =
    card.status === "known" ? "習得済み" :
    card.status === "weak" ? "復習" : "未学習";

  document.getElementById("definition").textContent = card.definition;
  document.getElementById("term").textContent = card.term;
  document.getElementById("extra").textContent = card.extra || "";

  document.getElementById("answerArea").classList.toggle("hidden", !revealed);
  document.getElementById("judgeArea").classList.toggle("hidden", !revealed);
  document.getElementById("reveal").classList.toggle("hidden", revealed);
}

function nextCard() {
  if (!queue.length) return;
  index = (index + 1) % queue.length;
  revealed = false;
  render();
}

function previousCard() {
  if (!queue.length) return;
  index = (index - 1 + queue.length) % queue.length;
  revealed = false;
  render();
}

document.getElementById("reveal").addEventListener("click", () => {
  revealed = true;
  render();
});

document.getElementById("next").addEventListener("click", nextCard);
document.getElementById("prev").addEventListener("click", previousCard);

document.getElementById("shuffle").addEventListener("click", () => {
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  index = 0;
  revealed = false;
  render();
});

function judge(status) {
  const card = currentCard();
  if (!card) return;

  card.status = status;
  card.reviews = (card.reviews || 0) + 1;

  if (status === "weak") {
    card.due = Date.now();
  } else {
    const intervals = [1,3,7,14,30];
    const days = intervals[Math.min(card.reviews - 1, intervals.length - 1)];
    card.due = Date.now() + days * 24 * 60 * 60 * 1000;
  }

  save();
  buildQueue();
  if (queue.length) {
    index = Math.min(index, queue.length - 1);
    render();
  }
}

document.getElementById("unknown").addEventListener("click", () => judge("weak"));
document.getElementById("known").addEventListener("click", () => judge("known"));

document.getElementById("category").addEventListener("change", buildQueue);
document.getElementById("mode").addEventListener("change", buildQueue);

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    button.classList.add("active");

    const study = button.dataset.page === "study";
    document.getElementById("studyPage").classList.toggle("hidden", !study);
    document.getElementById("managePage").classList.toggle("hidden", study);

    if (!study) renderList();
  });
});

document.getElementById("addForm").addEventListener("submit", event => {
  event.preventDefault();

  const definition = document.getElementById("newDefinition").value.trim();
  const term = document.getElementById("newTerm").value.trim();
  const category = document.getElementById("newCategory").value;
  const extra = document.getElementById("newExtra").value.trim();

  if (!definition || !term) return;

  cards.push({
    id: Date.now(),
    definition, term, category, extra,
    status:"new", reviews:0, due:0
  });

  save();
  event.target.reset();
  renderList();
  buildQueue();
  alert("問題を追加しました！");
});

function renderList() {
  const search = document.getElementById("search").value.toLowerCase();
  const list = document.getElementById("cardList");
  list.innerHTML = "";

  const filtered = cards.filter(c =>
    `${c.term} ${c.definition} ${c.extra || ""}`.toLowerCase().includes(search)
  );

  filtered.forEach(card => {
    const item = document.createElement("div");
    item.className = "item";

    const title = document.createElement("strong");
    title.textContent = `${card.term}　・　${card.category}`;

    const description = document.createElement("p");
    description.textContent = card.definition;

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const edit = document.createElement("button");
    edit.textContent = "編集";
    edit.addEventListener("click", () => editCard(card.id));

    const remove = document.createElement("button");
    remove.textContent = "削除";
    remove.addEventListener("click", () => deleteCard(card.id));

    actions.append(edit, remove);
    item.append(title, description, actions);
    list.append(item);
  });

  if (!filtered.length) {
    list.textContent = "該当する問題はありません。";
  }
}

function editCard(id) {
  const card = cards.find(c => c.id === id);
  if (!card) return;

  const term = prompt("用語", card.term);
  if (term === null) return;
  const definition = prompt("意味・説明", card.definition);
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

function deleteCard(id) {
  if (!confirm("この問題を削除しますか？")) return;
  cards = cards.filter(c => c.id !== id);
  save();
  buildQueue();
  renderList();
}

document.getElementById("search").addEventListener("input", renderList);

updateStats();
buildQueue();