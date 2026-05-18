const STORAGE_KEY = "voting-mini-app";

const defaultOptions = [
  { id: 1, name: "1号选手", votes: 0 },
  { id: 2, name: "2号选手", votes: 0 },
  { id: 3, name: "3号选手", votes: 0 }
];

const optionForm = document.querySelector("#optionForm");
const optionInput = document.querySelector("#optionInput");
const optionList = document.querySelector("#optionList");
const totalVotesElement = document.querySelector("#totalVotes");
const resetButton = document.querySelector("#resetButton");
const optionTemplate = document.querySelector("#optionTemplate");

let state = loadState();

render();

optionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = optionInput.value.trim();
  if (!name) {
    return;
  }

  const duplicated = state.options.some(
    (option) => option.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicated) {
    window.alert("这个候选项已经存在了，请换一个名称。");
    return;
  }

  state.options.push({
    id: Date.now(),
    name,
    votes: 0
  });

  optionInput.value = "";
  persist();
  render();
});

resetButton.addEventListener("click", () => {
  const confirmed = window.confirm("确定要清空所有票数并恢复默认候选项吗？");
  if (!confirmed) {
    return;
  }

  state = {
    options: defaultOptions.map((option) => ({ ...option }))
  };
  persist();
  render();
});

optionList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const optionId = Number(target.dataset.id);
  const option = state.options.find((item) => item.id === optionId);
  if (!option) {
    return;
  }

  option.votes += 1;
  persist();
  render();
});

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        options: defaultOptions.map((option) => ({ ...option }))
      };
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.options) || parsed.options.length === 0) {
      throw new Error("Invalid state");
    }

    return parsed;
  } catch (error) {
    return {
      options: defaultOptions.map((option) => ({ ...option }))
    };
  }
}

function persist() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const totalVotes = state.options.reduce((sum, option) => sum + option.votes, 0);
  totalVotesElement.textContent = String(totalVotes);
  optionList.innerHTML = "";

  if (state.options.length === 0) {
    optionList.innerHTML =
      '<div class="empty-state">还没有候选项，先在上面新增一个吧。</div>';
    return;
  }

  state.options.forEach((option) => {
    const node = optionTemplate.content.firstElementChild.cloneNode(true);
    const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);

    node.querySelector(".option-name").textContent = option.name;
    node.querySelector(".option-meta").textContent = `${option.votes} 票 · ${percentage}%`;
    node.querySelector(".progress-bar").style.width = `${percentage}%`;

    const button = node.querySelector(".vote-button");
    button.dataset.id = String(option.id);

    optionList.appendChild(node);
  });
}
