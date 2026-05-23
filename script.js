const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const priorityInput = document.getElementById("priorityInput");

const taskList = document.getElementById("taskList");

const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");

const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const pendingCount = document.getElementById("pendingCount");

const notification = document.getElementById("notification");
const loading = document.getElementById("loading");

const darkModeBtn = document.getElementById("darkModeBtn");
const exportBtn = document.getElementById("exportBtn");

let tasks = [];
let currentSearch = "";
let currentCategory = "All";


// =========================
// HELPERS
// =========================

function getFilteredTasks() {
  return tasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(currentSearch);
    const matchesCategory =
      currentCategory === "All" || task.category === currentCategory;

    return matchesSearch && matchesCategory;
  });
}

function showNotification(message) {
  notification.textContent = message;
  notification.style.opacity = "1";

  setTimeout(() => {
    notification.style.opacity = "0";
  }, 2000);
}

function updateCounter() {
  totalCount.textContent = tasks.length;

  const completed = tasks.filter(task => task.completed).length;
  completedCount.textContent = completed;
  pendingCount.textContent = tasks.length - completed;
}

function saveTasks() {
  const cleanTasks = tasks.map(task => ({
    id: task.id,
    text: task.text,
    completed: task.completed,
    category: task.category,
    priority: task.priority,
    timer: task.timer
  }));

  localStorage.setItem("tasks", JSON.stringify(cleanTasks));
}

function loadTasks() {
  const storedTasks = localStorage.getItem("tasks");

  if (storedTasks) {
    tasks = JSON.parse(storedTasks).map(task => ({
      ...task,
      interval: null
    }));
  }

  renderTasks();
}

function loadDarkMode() {
  const darkMode = localStorage.getItem("darkMode");

  if (darkMode === "true") {
    document.body.classList.add("dark-mode");
  }
}

function debounce(callback, delay) {
  let timeout;

  return function () {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      callback.apply(this, arguments);
    }, delay);
  };
}


// =========================
// RENDER TASKS
// =========================

function renderTasks(filteredTasks = getFilteredTasks()) {
  taskList.innerHTML = "";

  if (filteredTasks.length === 0) {
    taskList.innerHTML = `
      <p class="empty-message">No tasks found</p>
    `;
    updateCounter();
    saveTasks();
    return;
  }

  filteredTasks.forEach(task => {
    const li = document.createElement("li");

    li.className = `task ${task.completed ? "completed" : ""} ${task.priority.toLowerCase()}`;

    li.innerHTML = `
      <div class="task-left">
        <span class="task-text" data-id="${task.id}">
          ${task.text}
        </span>

        <div class="task-info">
          <span class="category ${task.category}">
            ${task.category}
          </span>

          <span class="priority-label">
            ${task.priority} Priority
          </span>

          <span class="timer">
            ⏱ ${task.timer}s
          </span>
        </div>
      </div>

      <div class="task-buttons">
        <button class="timer-btn" data-id="${task.id}">
          ${task.interval ? "⏸" : "▶"}
        </button>

        <button class="complete-btn" data-id="${task.id}">
          ✔
        </button>

        <button class="delete-btn" data-id="${task.id}">
          ✖
        </button>
      </div>
    `;

    taskList.appendChild(li);
  });

  updateCounter();
  saveTasks();
}


// =========================
// ADD TASK
// =========================

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const text = taskInput.value.trim();

  if (text === "") {
    showNotification("Task cannot be empty");
    return;
  }

  const task = {
    id: Date.now(),
    text,
    completed: false,
    category: categoryInput.value,
    priority: priorityInput.value,
    timer: 60,
    interval: null
  };

  tasks.push(task);
  renderTasks();
  showNotification("Task Added");
  taskForm.reset();
});


// =========================
// TASK ACTIONS
// =========================

taskList.addEventListener("click", function (event) {
  const id = Number(event.target.dataset.id);

  // COMPLETE TASK
  if (event.target.classList.contains("complete-btn")) {
    tasks = tasks.map(task => {
      if (task.id === id) {
        return {
          ...task,
          completed: !task.completed
        };
      }
      return task;
    });

    renderTasks();
    showNotification("Task Updated");
  }

  // DELETE TASK
  if (event.target.classList.contains("delete-btn")) {
    const taskToDelete = tasks.find(task => task.id === id);

    if (taskToDelete && taskToDelete.interval) {
      clearInterval(taskToDelete.interval);
    }

    tasks = tasks.filter(task => task.id !== id);
    renderTasks();
    showNotification("Task Deleted");
  }

  // TIMER START / PAUSE / RESUME
  if (event.target.classList.contains("timer-btn")) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    // PAUSE
    if (task.interval) {
      clearInterval(task.interval);
      task.interval = null;
      renderTasks();
      showNotification("Timer Paused");
      return;
    }

    // START / RESUME
    task.interval = setInterval(() => {
      task.timer--;

      if (task.timer <= 0) {
        task.timer = 0;
        clearInterval(task.interval);
        task.interval = null;
        renderTasks();
        showNotification(`Timer finished for "${task.text}"`);
        return;
      }

      renderTasks();
    }, 1000);

    renderTasks();
    showNotification("Timer Started");
  }
});


// =========================
// EDIT TASK
// =========================

taskList.addEventListener("dblclick", function (event) {
  if (!event.target.classList.contains("task-text")) return;

  const id = Number(event.target.dataset.id);
  const newText = prompt("Edit task:");

  if (!newText || newText.trim() === "") return;

  tasks = tasks.map(task => {
    if (task.id === id) {
      return {
        ...task,
        text: newText.trim()
      };
    }
    return task;
  });

  renderTasks();
  showNotification("Task Edited");
});


// =========================
// SEARCH + FILTER
// =========================

function applyFilters() {
  renderTasks();
}

searchInput.addEventListener(
  "input",
  debounce(function (event) {
    currentSearch = event.target.value.toLowerCase();
    applyFilters();
  }, 300)
);

filterCategory.addEventListener("change", function (event) {
  currentCategory = event.target.value;
  applyFilters();
});


// =========================
// DARK MODE
// =========================

darkModeBtn.addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");

  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDark);
});


// =========================
// EXPORT JSON
// =========================

exportBtn.addEventListener("click", function () {
  const data = JSON.stringify(
    tasks.map(task => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      category: task.category,
      priority: task.priority,
      timer: task.timer
    })),
    null,
    2
  );

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks.json";
  a.click();

  URL.revokeObjectURL(url);
  showNotification("Tasks Exported");
});


// =========================
// FETCH API
// =========================

async function fetchCategories() {
  try {
    loading.classList.remove("hidden");

    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await response.json();
    console.log("Fetched Data:", data);

  } catch (error) {
    showNotification(error.message);
  } finally {
    loading.classList.add("hidden");
  }
}


// =========================
// INITIAL LOAD
// =========================

loadDarkMode();
loadTasks();
fetchCategories();