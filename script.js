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

taskForm.addEventListener("submit", function(event) {

  event.preventDefault();

  const text = taskInput.value.trim();

  if (text === "") return;

  const task = {
    id: Date.now(),
    text: text,
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

function renderTasks(filteredTasks = tasks) {

  taskList.innerHTML = "";

  filteredTasks.forEach(task => {

    const li = document.createElement("li");

    li.className = `task ${task.completed ? "completed" : ""} ${task.priority.toLowerCase()}`;

    li.innerHTML = `
      <div>

        <span class="task-text" data-id="${task.id}">
          ${task.text}
        </span>

        <span class="category ${task.category}">
          ${task.category}
        </span>

      </div>

      <div>

        <button class="complete-btn" data-id="${task.id}">
          ✔
        </button>

        <button class="delete-btn" data-id="${task.id}">
          ❌
        </button>

      </div>
    `;

    taskList.appendChild(li);

  });

  updateCounter();

  saveTasks();
}

taskList.addEventListener("click", function(event) {

  const id = Number(event.target.dataset.id);

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

    showNotification("Task Completed");

  }

  if (event.target.classList.contains("delete-btn")) {

    tasks = tasks.filter(task => task.id !== id);

    renderTasks();

    showNotification("Task Deleted");

  }

});

function updateCounter() {

  totalCount.textContent = tasks.length;

  const completed = tasks.filter(task => task.completed).length;

  completedCount.textContent = completed;

  pendingCount.textContent = tasks.length - completed;
}

function debounce(callback, delay) {

  let timeout;

  return function() {

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      callback.apply(this, arguments);
    }, delay);

  };
}

searchInput.addEventListener(
  "input",

  debounce(function(event) {

    const value = event.target.value.toLowerCase();

    const filtered = tasks.filter(task =>
      task.text.toLowerCase().includes(value)
    );

    renderTasks(filtered);

  }, 300)
);

filterCategory.addEventListener("change", function(event) {

  const category = event.target.value;

  if (category === "All") {

    renderTasks();

    return;

  }

  const filtered = tasks.filter(task =>
    task.category === category
  );

  renderTasks(filtered);

});

function showNotification(message) {

  notification.textContent = message;

  notification.style.opacity = "1";

  setTimeout(() => {

    notification.style.opacity = "0";

  }, 2000);
}

darkModeBtn.addEventListener("click", function() {

  document.body.classList.toggle("dark-mode");

});

function saveTasks() {

  localStorage.setItem(
    "tasks",
    JSON.stringify(tasks)
  );
}

function loadTasks() {

  const storedTasks = localStorage.getItem("tasks");

  if (storedTasks) {

    tasks = JSON.parse(storedTasks);

  }

  renderTasks();
}

loadTasks();

exportBtn.addEventListener("click", function() {

  const data = JSON.stringify(tasks, null, 2);

  const blob = new Blob([data], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download = "tasks.json";

  a.click();

});

async function fetchCategories() {

  try {

    loading.classList.remove("hidden");

    const response = await fetch(
      "https://jsonplaceholder.typicode.com/users"
    );

    if (!response.ok) {

      throw new Error("Failed to fetch");

    }

    const data = await response.json();

    console.log(data);

  } catch(error) {

    showNotification(error.message);

  } finally {

    loading.classList.add("hidden");

  }
}

fetchCategories();

taskList.addEventListener("dblclick", function(event) {

  if (event.target.classList.contains("task-text")) {

    const id = Number(event.target.dataset.id);

    const newText = prompt("Edit task");

    if (!newText) return;

    tasks = tasks.map(task => {

      if (task.id === id) {

        return {
          ...task,
          text: newText
        };

      }

      return task;

    });

    renderTasks();

    showNotification("Task Edited");

  }

});