

(function () {
  "use strict";

  var STORAGE_KEY = "taskquest.todos";
  var FILTERS = ["all", "active", "completed"];


  var state = {
    todos: [],
    filter: "all",
    editingId: null,
  };


  var form = document.getElementById("todo-form");
  var input = document.getElementById("todo-input");
  var inputError = document.getElementById("todo-input-error");
  var list = document.getElementById("todo-list");
  var countEl = document.getElementById("todo-count");
  var emptyEl = document.getElementById("todo-empty");
  var filtersEl = document.querySelector(".filters");
  var clearBtn = document.getElementById("clear-completed");


  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (t) {
        return t && typeof t.id === "string" && typeof t.text === "string";
      }).map(function (t) {
        return {
          id: t.id,
          text: t.text,
          completed: Boolean(t.completed),
          createdAt: t.createdAt || Date.now(),
        };
      });
    } catch (e) {
      console.warn("Could not read saved tasks:", e);
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
    } catch (e) {
      
      console.warn("Could not save tasks:", e);
    }
  }


  function setState(patch) {
    Object.keys(patch).forEach(function (key) {
      state[key] = patch[key];
    });
    save();
    render();
  }

  function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }


  function addTodo(text) {
    var clean = text.trim();
    if (!clean) return false;
    // concat() returns a NEW array rather than mutating the old one —
    // immutable updates make state changes easy to trace.
    setState({
      todos: state.todos.concat({
        id: createId(),
        text: clean,
        completed: false,
        createdAt: Date.now(),
      }),
    });
    return true;
  }

  // UPDATE — toggle done/not done
  function toggleTodo(id) {
    setState({
      todos: state.todos.map(function (t) {
        return t.id === id ? Object.assign({}, t, { completed: !t.completed }) : t;
      }),
    });
  }

  // UPDATE — rename
  function renameTodo(id, text) {
    var clean = text.trim();
    // An empty rename deletes the task, matching the TodoMVC convention
    if (!clean) {
      deleteTodo(id);
      return;
    }
    setState({
      editingId: null,
      todos: state.todos.map(function (t) {
        return t.id === id ? Object.assign({}, t, { text: clean }) : t;
      }),
    });
  }

  // DELETE
  function deleteTodo(id) {
    setState({
      editingId: state.editingId === id ? null : state.editingId,
      todos: state.todos.filter(function (t) {
        return t.id !== id;
      }),
    });
  }

  function clearCompleted() {
    setState({
      todos: state.todos.filter(function (t) {
        return !t.completed;
      }),
    });
  }

  /* ---------------- Derived data ----------------
     Filtering is computed at render time from state.
     The filter is NOT baked into the stored array, so
     switching tabs never risks losing tasks. */
  function visibleTodos() {
    if (state.filter === "active") {
      return state.todos.filter(function (t) { return !t.completed; });
    }
    if (state.filter === "completed") {
      return state.todos.filter(function (t) { return t.completed; });
    }
    return state.todos;
  }

  /* =======================================================
     RENDER — state in, DOM out. No data lives here.
     ======================================================= */
  function buildItem(todo) {
    var li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " is-completed" : "");
    li.dataset.id = todo.id;

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-item__checkbox";
    checkbox.checked = todo.completed;
    checkbox.dataset.action = "toggle";
    checkbox.id = "todo-" + todo.id;
    // Screen readers need to know WHICH task this checkbox controls
    checkbox.setAttribute("aria-label", "Mark \u201C" + todo.text + "\u201D as complete");
    li.appendChild(checkbox);

    if (state.editingId === todo.id) {
      // --- edit mode ---
      var editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "todo-item__edit";
      editInput.value = todo.text;
      editInput.maxLength = 200;
      editInput.dataset.action = "edit-input";
      editInput.setAttribute("aria-label", "Rename task");
      li.appendChild(editInput);
    } else {
      // --- display mode ---
      var label = document.createElement("label");
      label.className = "todo-item__text";
      label.htmlFor = "todo-" + todo.id;
      label.textContent = todo.text;   // textContent, not innerHTML — see note below
      li.appendChild(label);

      var actions = document.createElement("div");
      actions.className = "todo-item__actions";

      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-btn";
      editBtn.dataset.action = "start-edit";
      editBtn.textContent = "Edit";
      editBtn.setAttribute("aria-label", "Edit \u201C" + todo.text + "\u201D");
      actions.appendChild(editBtn);

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "icon-btn";
      delBtn.dataset.action = "delete";
      delBtn.textContent = "Delete";
      delBtn.setAttribute("aria-label", "Delete \u201C" + todo.text + "\u201D");
      actions.appendChild(delBtn);

      li.appendChild(actions);
    }

    return li;
  }

  function render() {
    var items = visibleTodos();

    // Build into a fragment first: one reflow instead of one per item
    var fragment = document.createDocumentFragment();
    items.forEach(function (todo) {
      fragment.appendChild(buildItem(todo));
    });
    list.innerHTML = "";
    list.appendChild(fragment);

    // Empty states differ by filter — a generic message is unhelpful
    var messages = {
      all: "No tasks yet. Add your first one above.",
      active: "Nothing active — everything is done.",
      completed: "No completed tasks yet.",
    };
    emptyEl.hidden = items.length !== 0;
    emptyEl.textContent = messages[state.filter];

    // aria-live on this element announces the change to screen readers
    var remaining = state.todos.filter(function (t) { return !t.completed; }).length;
    var total = state.todos.length;
    countEl.textContent = total === 0
      ? "0 tasks"
      : remaining + " of " + total + " remaining";

    // Filter buttons reflect state rather than tracking it themselves
    Array.prototype.forEach.call(
      filtersEl.querySelectorAll(".filter-btn"),
      function (btn) {
        btn.setAttribute("aria-pressed", btn.dataset.filter === state.filter ? "true" : "false");
      }
    );

    clearBtn.disabled = !state.todos.some(function (t) { return t.completed; });

    // Focus the edit box after it enters the DOM, so keyboard users
    // aren't dropped back at the top of the page.
    if (state.editingId) {
      var active = list.querySelector('[data-action="edit-input"]');
      if (active) {
        active.focus();
        active.setSelectionRange(active.value.length, active.value.length);
      }
    }
  }

  /* =======================================================
     EVENT DELEGATION
     One listener on the list handles every task, including
     ones that don't exist yet. closest() walks up from the
     clicked element to find the row it belongs to.
     ======================================================= */
  list.addEventListener("click", function (event) {
    var target = event.target.closest("[data-action]");
    if (!target) return;
    var row = event.target.closest(".todo-item");
    if (!row) return;
    var id = row.dataset.id;

    switch (target.dataset.action) {
      case "toggle":
        toggleTodo(id);
        break;
      case "start-edit":
        setState({ editingId: id });
        break;
      case "delete":
        deleteTodo(id);
        break;
    }
  });

  // Enter commits a rename, Escape abandons it
  list.addEventListener("keydown", function (event) {
    if (event.target.dataset.action !== "edit-input") return;
    var row = event.target.closest(".todo-item");
    if (!row) return;

    if (event.key === "Enter") {
      event.preventDefault();
      renameTodo(row.dataset.id, event.target.value);
    } else if (event.key === "Escape") {
      setState({ editingId: null });
    }
  });

  // Clicking away also commits, so edits are never silently lost
  list.addEventListener("focusout", function (event) {
    if (event.target.dataset.action !== "edit-input") return;
    var row = event.target.closest(".todo-item");
    if (row && state.editingId === row.dataset.id) {
      renameTodo(row.dataset.id, event.target.value);
    }
  });

  // Filters — also delegated
  filtersEl.addEventListener("click", function (event) {
    var btn = event.target.closest(".filter-btn");
    if (!btn) return;
    var filter = btn.dataset.filter;
    if (FILTERS.indexOf(filter) === -1) return;
    setState({ filter: filter, editingId: null });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (addTodo(input.value)) {
      input.value = "";
      input.setAttribute("aria-invalid", "false");
      inputError.hidden = true;
      input.focus();               // ready for the next entry
    } else {
      input.setAttribute("aria-invalid", "true");
      inputError.hidden = false;
      input.focus();
    }
  });

  input.addEventListener("input", function () {
    if (input.value.trim()) {
      input.setAttribute("aria-invalid", "false");
      inputError.hidden = true;
    }
  });

  clearBtn.addEventListener("click", clearCompleted);

  /* Keeps two open tabs in sync — fires when ANOTHER tab writes
     to localStorage. A small touch that surprises people. */
  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) {
      state.todos = load();
      render();
    }
  });

  /* ---------------- Theme toggle ---------------- */
  (function () {
    var toggle = document.getElementById("theme-toggle");
    if (!toggle) return;
    var root = document.documentElement;
    var label = toggle.querySelector(".theme-toggle__label");

    function current() {
      return root.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    }
    function paint(theme) {
      toggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      if (label) label.textContent = theme === "light" ? "Light" : "Dark";
    }
    paint(current());
    toggle.addEventListener("click", function () {
      var next = current() === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      paint(next);
    });
  })();

  /* ---------------- Boot ---------------- */
  state.todos = load();
  render();
})();