/**
 * LIFE DASHBOARD — script.js
 * ============================================================
 * Modules:
 *  1. Constants & Storage Keys
 *  2. Utility Helpers
 *  3. Theme Module       — Light / Dark Mode
 *  4. Greeting Module    — Clock, Date, Greeting Label, Custom Name
 *  5. Timer Module       — Pomodoro Focus Timer
 *  6. Todo Module        — Task CRUD, Duplicate Prevention, Sorting
 *  7. Links Module       — Quick Links CRUD
 *  8. App Init
 * ============================================================
 */

'use strict';

/* ============================================================
   1. CONSTANTS & STORAGE KEYS
   ============================================================ */
const STORAGE_KEYS = {
  THEME:     'dashboard_theme',
  USERNAME:  'dashboard_username',
  POMODORO:  'dashboard_pomodoro_duration',
  TASKS:     'dashboard_tasks',
  LINKS:     'dashboard_links',
};

const DEFAULT_POMODORO_MINUTES = 25;


/* ============================================================
   2. UTILITY HELPERS
   ============================================================ */

/**
 * Generate a simple unique ID (timestamp + random suffix).
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Read a JSON value from localStorage.
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
function storageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write a JSON value to localStorage.
 * @param {string} key
 * @param {*} value
 */
function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

/**
 * Pad a number to two digits.
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Get the first letter (uppercase) of a string, used for link icons.
 * @param {string} text
 * @returns {string}
 */
function firstLetter(text) {
  return (text || '?').trim().charAt(0).toUpperCase();
}

/**
 * Ensure a URL has a protocol prefix.
 * @param {string} url
 * @returns {string}
 */
function normalizeUrl(url) {
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) {
    return 'https://' + url;
  }
  return url;
}

/**
 * Show a temporary warning message element, then hide it.
 * @param {HTMLElement} el
 * @param {number} ms
 */
function showTempMessage(el, ms = 2500) {
  el.classList.remove('hidden');
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => el.classList.add('hidden'), ms);
}


/* ============================================================
   3. THEME MODULE — Light / Dark Mode
   ============================================================ */
const ThemeModule = (() => {
  const html        = document.documentElement;
  const toggleBtn   = document.getElementById('themeToggle');

  /** Apply a theme ('light' | 'dark') to the document. */
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    storageSet(STORAGE_KEYS.THEME, theme);
  }

  /** Toggle between light and dark. */
  function toggle() {
    const current = html.getAttribute('data-theme') || 'light';
    applyTheme(current === 'light' ? 'dark' : 'light');
  }

  /** Load saved theme on startup. */
  function init() {
    const saved = storageGet(STORAGE_KEYS.THEME, 'light');
    applyTheme(saved);
    toggleBtn.addEventListener('click', toggle);
  }

  return { init };
})();


/* ============================================================
   4. GREETING MODULE — Clock, Date, Label, Custom Name
   ============================================================ */
const GreetingModule = (() => {
  // DOM refs
  const timeEl        = document.getElementById('greetingTime');
  const dateEl        = document.getElementById('greetingDate');
  const labelEl       = document.getElementById('greetingLabel');
  const nameEl        = document.getElementById('greetingName');
  const editNameBtn   = document.getElementById('editNameBtn');
  const nameEditWrap  = document.getElementById('nameEditWrap');
  const nameInput     = document.getElementById('nameInput');
  const saveNameBtn   = document.getElementById('saveNameBtn');
  const cancelNameBtn = document.getElementById('cancelNameBtn');

  const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

  /** Return greeting label based on hour. */
  function getGreetingLabel(hour) {
    if (hour >= 5  && hour < 12) return 'Good Morning,';
    if (hour >= 12 && hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }

  /** Update clock and greeting every second. */
  function updateClock() {
    const now   = new Date();
    const h     = now.getHours();
    const m     = now.getMinutes();
    const s     = now.getSeconds();

    // Time — 24h display
    timeEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

    // Date
    const dayName   = DAY_NAMES[now.getDay()];
    const monthName = MONTH_NAMES[now.getMonth()];
    dateEl.textContent = `${dayName}, ${monthName} ${now.getDate()}, ${now.getFullYear()}`;

    // Greeting label
    labelEl.textContent = getGreetingLabel(h);
  }

  /** Load and display the saved username. */
  function loadName() {
    const name = storageGet(STORAGE_KEYS.USERNAME, 'Friend');
    nameEl.textContent = name;
  }

  /** Show the inline name editor. */
  function showEditForm() {
    nameEl.closest('.greeting__name-wrap').classList.add('hidden');
    nameEditWrap.classList.remove('hidden');
    nameInput.value = storageGet(STORAGE_KEYS.USERNAME, '');
    nameInput.focus();
    nameInput.select();
  }

  /** Hide the inline name editor. */
  function hideEditForm() {
    nameEditWrap.classList.add('hidden');
    nameEl.closest('.greeting__name-wrap').classList.remove('hidden');
  }

  /** Save the name from the input field. */
  function saveName() {
    const raw  = nameInput.value.trim();
    const name = raw.length > 0 ? raw : 'Friend';
    storageSet(STORAGE_KEYS.USERNAME, name);
    nameEl.textContent = name;
    hideEditForm();
  }

  function init() {
    loadName();
    updateClock();
    setInterval(updateClock, 1000);

    // Events
    editNameBtn.addEventListener('click', showEditForm);
    nameEl.addEventListener('click', showEditForm);

    saveNameBtn.addEventListener('click', saveName);
    cancelNameBtn.addEventListener('click', hideEditForm);

    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  saveName();
      if (e.key === 'Escape') hideEditForm();
    });
  }

  return { init };
})();


/* ============================================================
   5. TIMER MODULE — Pomodoro Focus Timer
   ============================================================ */
const TimerModule = (() => {
  // DOM refs
  const displayEl      = document.getElementById('timerDisplay');
  const statusEl       = document.getElementById('timerStatus');
  const startBtn       = document.getElementById('timerStart');
  const stopBtn        = document.getElementById('timerStop');
  const resetBtn       = document.getElementById('timerReset');
  const pomodoroInput  = document.getElementById('pomodoroInput');
  const applyBtn       = document.getElementById('applyPomodoro');

  // State
  let totalSeconds  = 0;   // current remaining seconds
  let intervalId    = null; // setInterval handle
  let isRunning     = false;

  /** Load saved duration (minutes) from storage. */
  function loadDuration() {
    return storageGet(STORAGE_KEYS.POMODORO, DEFAULT_POMODORO_MINUTES);
  }

  /** Update the visual display (MM:SS). */
  function updateDisplay() {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    displayEl.textContent = `${pad(m)}:${pad(s)}`;
  }

  /** Sync button states: start/stop enable‑disable. */
  function syncButtons() {
    startBtn.disabled = isRunning;
    stopBtn.disabled  = !isRunning;
  }

  /** Set running visual state on display. */
  function setDisplayState(state) {
    // state: 'idle' | 'running' | 'ended'
    displayEl.classList.toggle('running', state === 'running');
    displayEl.classList.toggle('ended',   state === 'ended');
  }

  /** Tick: decrement every second. */
  function tick() {
    if (totalSeconds <= 0) {
      clearInterval(intervalId);
      intervalId = null;
      isRunning  = false;
      totalSeconds = 0;
      updateDisplay();
      syncButtons();
      setDisplayState('ended');
      statusEl.textContent = 'Session complete! 🎉';
      // Browser notification (if permission granted)
      notifyUser();
      return;
    }
    totalSeconds--;
    updateDisplay();
  }

  /** Request / send a browser Notification when timer ends. */
  function notifyUser() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification('Focus Timer', {
        body: 'Pomodoro session complete! Take a short break.',
        icon: '',
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  /** Start the countdown. */
  function start() {
    if (isRunning) return;
    if (totalSeconds <= 0) {
      // Auto-reset to saved duration if time ran out
      const minutes = loadDuration();
      totalSeconds  = minutes * 60;
    }
    isRunning  = true;
    intervalId = setInterval(tick, 1000);
    syncButtons();
    setDisplayState('running');
    statusEl.textContent = 'Focusing…';
  }

  /** Stop (pause) the countdown. */
  function stop() {
    if (!isRunning) return;
    clearInterval(intervalId);
    intervalId = null;
    isRunning  = false;
    syncButtons();
    setDisplayState('idle');
    statusEl.textContent = 'Paused';
  }

  /** Reset to the saved duration. */
  function reset() {
    clearInterval(intervalId);
    intervalId   = null;
    isRunning    = false;
    const minutes = loadDuration();
    totalSeconds  = minutes * 60;
    updateDisplay();
    syncButtons();
    setDisplayState('idle');
    statusEl.textContent = 'Ready';
  }

  /** Apply a new Pomodoro duration. */
  function applyDuration() {
    let val = parseInt(pomodoroInput.value, 10);
    if (isNaN(val) || val < 1)  val = 1;
    if (val > 60)               val = 60;
    pomodoroInput.value = val;
    storageSet(STORAGE_KEYS.POMODORO, val);
    // Only update display if timer is not running
    if (!isRunning) {
      totalSeconds = val * 60;
      updateDisplay();
      setDisplayState('idle');
      statusEl.textContent = 'Ready';
    }
  }

  function init() {
    const minutes = loadDuration();
    pomodoroInput.value = minutes;
    totalSeconds = minutes * 60;
    updateDisplay();
    syncButtons();

    startBtn.addEventListener('click', start);
    stopBtn.addEventListener('click',  stop);
    resetBtn.addEventListener('click', reset);
    applyBtn.addEventListener('click', applyDuration);

    pomodoroInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyDuration();
    });
  }

  return { init };
})();


/* ============================================================
   6. TODO MODULE — Task CRUD, Duplicate Check, Sort, Storage
   ============================================================ */
const TodoModule = (() => {
  // DOM refs
  const form             = document.getElementById('taskForm');
  const taskInput        = document.getElementById('taskInput');
  const taskList         = document.getElementById('taskList');
  const todoEmpty        = document.getElementById('todoEmpty');
  const duplicateWarning = document.getElementById('duplicateWarning');
  const sortSelect       = document.getElementById('taskSort');
  const statTotal        = document.getElementById('statTotal');
  const statDone         = document.getElementById('statDone');

  // Edit modal refs
  const editModal     = document.getElementById('editModal');
  const editTaskInput = document.getElementById('editTaskInput');
  const saveEditBtn   = document.getElementById('saveEditBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  // State
  let tasks       = [];   // Array<{ id, text, completed, createdAt }>
  let editingId   = null; // id of task being edited

  /* ---- Storage ---- */
  function load()  { tasks = storageGet(STORAGE_KEYS.TASKS, []); }
  function save()  { storageSet(STORAGE_KEYS.TASKS, tasks); }

  /* ---- Duplicate check ---- */
  /**
   * Returns true if a task with the same text (case‑insensitive) already exists,
   * optionally excluding a task by id (used during edit).
   */
  function isDuplicate(text, excludeId = null) {
    const normalized = text.trim().toLowerCase();
    return tasks.some(t =>
      t.id !== excludeId &&
      t.text.trim().toLowerCase() === normalized
    );
  }

  /* ---- Sorting ---- */
  function getSortedTasks() {
    const mode = sortSelect.value;
    const copy = [...tasks];
    switch (mode) {
      case 'az':
        return copy.sort((a, b) => a.text.localeCompare(b.text));
      case 'za':
        return copy.sort((a, b) => b.text.localeCompare(a.text));
      case 'completed':
        return copy.sort((a, b) => Number(b.completed) - Number(a.completed));
      case 'pending':
        return copy.sort((a, b) => Number(a.completed) - Number(b.completed));
      default:
        // default: insertion order (oldest first)
        return copy.sort((a, b) => a.createdAt - b.createdAt);
    }
  }

  /* ---- Render ---- */
  function render() {
    const sorted = getSortedTasks();

    // Update stats
    const total = tasks.length;
    const done  = tasks.filter(t => t.completed).length;
    statTotal.textContent = `${total} task${total !== 1 ? 's' : ''}`;
    statDone.textContent  = `${done} done`;

    // Show/hide empty state
    todoEmpty.classList.toggle('hidden', total > 0);

    // Clear & re-render list
    taskList.innerHTML = '';
    sorted.forEach(task => {
      taskList.appendChild(createTaskElement(task));
    });
  }

  /** Build a single task <li> element. */
  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item${task.completed ? ' completed' : ''}`;
    li.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.className = 'task-item__checkbox';
    checkbox.checked   = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Text
    const span = document.createElement('span');
    span.className = 'task-item__text';
    span.textContent = task.text;

    // Actions container
    const actions = document.createElement('div');
    actions.className = 'task-item__actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'task-btn task-btn--edit';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.title = 'Edit task';
    editBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>`;
    editBtn.addEventListener('click', () => openEditModal(task.id));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-btn task-btn--delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.title = 'Delete task';
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6"/>
        <path d="M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>`;
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.append(editBtn, deleteBtn);
    li.append(checkbox, span, actions);
    return li;
  }

  /* ---- CRUD Operations ---- */

  /** Add a new task. */
  function addTask(text) {
    text = text.trim();
    if (!text) return;

    if (isDuplicate(text)) {
      showTempMessage(duplicateWarning);
      taskInput.focus();
      return;
    }

    tasks.push({
      id:        generateId(),
      text,
      completed: false,
      createdAt: Date.now(),
    });
    save();
    render();
    taskInput.value = '';
    taskInput.focus();
  }

  /** Toggle completed status of a task. */
  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    save();
    render();
  }

  /** Delete a task by id. */
  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    save();
    render();
  }

  /* ---- Edit Modal ---- */

  function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingId = id;
    editTaskInput.value = task.text;
    editModal.classList.remove('hidden');
    editTaskInput.focus();
    editTaskInput.select();
  }

  function closeEditModal() {
    editModal.classList.add('hidden');
    editingId = null;
  }

  function saveEdit() {
    if (!editingId) return;
    const newText = editTaskInput.value.trim();
    if (!newText) return;

    if (isDuplicate(newText, editingId)) {
      // Show error inside modal input
      editTaskInput.style.borderColor = 'var(--color-danger)';
      editTaskInput.title = 'A task with this name already exists!';
      setTimeout(() => {
        editTaskInput.style.borderColor = '';
        editTaskInput.title = '';
      }, 2000);
      return;
    }

    const task = tasks.find(t => t.id === editingId);
    if (task) {
      task.text = newText;
      save();
      render();
    }
    closeEditModal();
  }

  function init() {
    load();
    render();

    // Add task form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      addTask(taskInput.value);
    });

    // Sort change
    sortSelect.addEventListener('change', render);

    // Edit modal events
    saveEditBtn.addEventListener('click', saveEdit);
    cancelEditBtn.addEventListener('click', closeEditModal);

    editTaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  saveEdit();
      if (e.key === 'Escape') closeEditModal();
    });

    // Close modal on overlay click
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) closeEditModal();
    });
  }

  return { init };
})();


/* ============================================================
   7. LINKS MODULE — Quick Links CRUD
   ============================================================ */
const LinksModule = (() => {
  // DOM refs
  const linkForm   = document.getElementById('linkForm');
  const linkName   = document.getElementById('linkName');
  const linkUrl    = document.getElementById('linkUrl');
  const linksList  = document.getElementById('linksList');
  const linksEmpty = document.getElementById('linksEmpty');

  // State
  let links = []; // Array<{ id, name, url }>

  /* ---- Storage ---- */
  function load() { links = storageGet(STORAGE_KEYS.LINKS, getDefaultLinks()); }
  function save() { storageSet(STORAGE_KEYS.LINKS, links); }

  /** Provide a few starter links if none saved. */
  function getDefaultLinks() {
    return [
      { id: generateId(), name: 'Google',    url: 'https://google.com'    },
      { id: generateId(), name: 'YouTube',   url: 'https://youtube.com'   },
      { id: generateId(), name: 'GitHub',    url: 'https://github.com'    },
      { id: generateId(), name: 'Wikipedia', url: 'https://wikipedia.org' },
    ];
  }

  /* ---- Render ---- */
  function render() {
    linksEmpty.classList.toggle('hidden', links.length > 0);
    linksList.innerHTML = '';
    links.forEach(link => linksList.appendChild(createLinkElement(link)));
  }

  /** Build a single link card element. */
  function createLinkElement(link) {
    const item = document.createElement('div');
    item.className = 'link-item';
    item.dataset.id = link.id;

    // Favicon / letter icon
    const icon = document.createElement('div');
    icon.className = 'link-item__icon';
    icon.textContent = firstLetter(link.name);
    // Assign a consistent background color based on first letter
    icon.style.backgroundColor = getIconColor(link.name);

    // Anchor wrapping icon + name
    const anchor = document.createElement('a');
    anchor.className = 'link-item__anchor';
    anchor.href   = link.url;
    anchor.target = '_blank';
    anchor.rel    = 'noopener noreferrer';
    anchor.setAttribute('aria-label', `Open ${link.name} in new tab`);

    const nameEl = document.createElement('span');
    nameEl.className   = 'link-item__name';
    nameEl.textContent = link.name;

    anchor.append(icon, nameEl);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'link-item__delete';
    deleteBtn.setAttribute('aria-label', `Remove ${link.name}`);
    deleteBtn.title   = 'Remove link';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    item.append(anchor, deleteBtn);
    return item;
  }

  /** Generate a consistent accent color from the first letter. */
  function getIconColor(name) {
    const colors = [
      '#5b6af5', '#8b5cf6', '#ec4899', '#f59e0b',
      '#10b981', '#3b82f6', '#ef4444', '#06b6d4',
    ];
    const index = (name.trim().toUpperCase().charCodeAt(0) - 65) % colors.length;
    return colors[Math.max(0, index)];
  }

  /* ---- CRUD ---- */

  function addLink(name, url) {
    name = name.trim();
    url  = url.trim();
    if (!name || !url) return;
    url = normalizeUrl(url);

    links.push({ id: generateId(), name, url });
    save();
    render();
    linkName.value = '';
    linkUrl.value  = '';
    linkName.focus();
  }

  function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    save();
    render();
  }

  function init() {
    load();
    render();

    linkForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addLink(linkName.value, linkUrl.value);
    });
  }

  return { init };
})();


/* ============================================================
   8. APP INIT — Bootstrap all modules
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  ThemeModule.init();
  GreetingModule.init();
  TimerModule.init();
  TodoModule.init();
  LinksModule.init();
});
