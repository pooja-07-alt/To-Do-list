// ===============================
// DOM ELEMENTS
// ===============================

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const emptyState = document.getElementById("emptyState");
const clearCompleted = document.getElementById("clearCompleted");

const filterButtons = document.querySelectorAll(".filter-btn");


// ===============================
// APPLICATION STATE
// ===============================

// Get saved tasks from localStorage

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let currentFilter = "all";


// ===============================
// SAVE TASKS
// ===============================

function saveTasks() {

    localStorage.setItem("tasks", JSON.stringify(tasks));

}


// ===============================
// CREATE TASK
// ===============================

taskForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const taskText = taskInput.value.trim();

    // Don't add empty tasks

    if (taskText === "") {
        return;
    }

    const newTask = {

        id: Date.now(),

        text: taskText,

        completed: false

    };

    tasks.push(newTask);

    saveTasks();

    taskInput.value = "";

    renderTasks();

});


// ===============================
// READ / DISPLAY TASKS
// ===============================

function renderTasks() {

    // Clear existing list

    taskList.innerHTML = "";


    // Filter tasks

    let filteredTasks = tasks;

    if (currentFilter === "active") {

        filteredTasks = tasks.filter(function (task) {
            return !task.completed;
        });

    }

    else if (currentFilter === "completed") {

        filteredTasks = tasks.filter(function (task) {
            return task.completed;
        });

    }


    // Display empty state

    if (filteredTasks.length === 0) {

        emptyState.style.display = "block";

    } else {

        emptyState.style.display = "none";

    }


    // Create task elements

    filteredTasks.forEach(function (task) {

        const li = document.createElement("li");

        li.className = "task-item";

        if (task.completed) {
            li.classList.add("completed");
        }

        li.dataset.id = task.id;


        // Checkbox

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.className = "task-checkbox";

        checkbox.checked = task.completed;


        // Task text

        const span = document.createElement("span");

        span.className = "task-text";

        span.textContent = task.text;


        // Buttons container

        const actions = document.createElement("div");

        actions.className = "task-actions";


        // Edit button

        const editButton = document.createElement("button");

        editButton.className = "edit-btn";

        editButton.dataset.action = "edit";

        editButton.textContent = "Edit";


        // Delete button

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";

        deleteButton.dataset.action = "delete";

        deleteButton.textContent = "Delete";


        // Build task

        actions.appendChild(editButton);

        actions.appendChild(deleteButton);

        li.appendChild(checkbox);

        li.appendChild(span);

        li.appendChild(actions);

        taskList.appendChild(li);

    });


    updateTaskCount();

}


// ===============================
// EVENT DELEGATION
// ===============================

// One event listener handles
// checkbox, edit and delete actions.

taskList.addEventListener("click", function (event) {

    const taskItem = event.target.closest(".task-item");

    if (!taskItem) {
        return;
    }

    const taskId = Number(taskItem.dataset.id);

    const clickedButton = event.target.closest("button");


    // DELETE

    if (clickedButton && clickedButton.dataset.action === "delete") {

        tasks = tasks.filter(function (task) {

            return task.id !== taskId;

        });

        saveTasks();

        renderTasks();

    }


    // EDIT

    if (clickedButton && clickedButton.dataset.action === "edit") {

        const task = tasks.find(function (task) {

            return task.id === taskId;

        });

        const newText = prompt("Edit your task:", task.text);

        if (newText !== null && newText.trim() !== "") {

            task.text = newText.trim();

            saveTasks();

            renderTasks();

        }

    }

});


// ===============================
// COMPLETE / UNCOMPLETE TASK
// ===============================

taskList.addEventListener("change", function (event) {

    if (!event.target.classList.contains("task-checkbox")) {
        return;
    }

    const taskItem = event.target.closest(".task-item");

    const taskId = Number(taskItem.dataset.id);

    const task = tasks.find(function (task) {

        return task.id === taskId;

    });

    task.completed = event.target.checked;

    saveTasks();

    renderTasks();

});


// ===============================
// FILTER TASKS
// ===============================

filterButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        // Remove active class

        filterButtons.forEach(function (btn) {

            btn.classList.remove("active");

        });

        // Add active class to clicked button

        button.classList.add("active");

        // Change filter

        currentFilter = button.dataset.filter;

        renderTasks();

    });

});


// ===============================
// CLEAR COMPLETED
// ===============================

clearCompleted.addEventListener("click", function () {

    tasks = tasks.filter(function (task) {

        return !task.completed;

    });

    saveTasks();

    renderTasks();

});


// ===============================
// TASK COUNTER
// ===============================

function updateTaskCount() {

    const activeTasks = tasks.filter(function (task) {

        return !task.completed;

    });

    const count = activeTasks.length;

    if (count === 1) {

        taskCount.textContent = "1 task remaining";

    } else {

        taskCount.textContent = count + " tasks remaining";

    }

}


// ===============================
// INITIAL RENDER
// ===============================

renderTasks();