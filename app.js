// DOM Elements
const projectsList = document.getElementById('projectsList');
const addProjectBtn = document.getElementById('addProjectBtn');
const todoContainer = document.getElementById('todoContainer');
const emptyState = document.getElementById('emptyState');
const todoListWrapper = document.getElementById('todoListWrapper');
const todoList = document.getElementById('todoList');
const newTodoInput = document.getElementById('newTodoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const graffitiCanvas = document.getElementById('graffitiCanvas');
const ctx = graffitiCanvas.getContext('2d');
const historyToggleBtn = document.getElementById('historyToggleBtn');
const historyPanel = document.getElementById('historyPanel');
const calendar = document.getElementById('calendar');
const historyReport = document.getElementById('historyReport');
const gifPanel = document.getElementById('gifPanel');
const randomGifImg = document.getElementById('randomGif');

// Modal elements
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalInput = document.getElementById('modalInput');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');

// Confirm dialog elements
const confirmOverlay = document.getElementById('confirmOverlay');
const confirmMessage = document.getElementById('confirmMessage');
const confirmCancel = document.getElementById('confirmCancel');
const confirmDelete = document.getElementById('confirmDelete');

// State
let data = {
  projects: [],
  activeProjectId: null
};

// Work history: { "2024-01-15": { worked: [{...}], completed: [{...}] } }
let workHistory = {};

// Timer state
let activeTimer = null; // { projectId, projectName, todoId, todoText, startTime }

// Calendar state
let calendarDate = new Date();
let selectedDate = null;

let pendingDeleteCallback = null;

// Initialize canvas size
function resizeCanvas() {
  graffitiCanvas.width = window.innerWidth;
  graffitiCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Storage functions
function saveData() {
  chrome.storage.sync.set({ todoData: data });
}

function saveHistory() {
  chrome.storage.local.set({ workHistory: workHistory });
}

function loadData() {
  chrome.storage.sync.get(['todoData'], (result) => {
    if (result.todoData) {
      data = result.todoData;
    }
    render();
  });

  chrome.storage.local.get(['workHistory'], (result) => {
    if (result.workHistory) {
      workHistory = result.workHistory;
    }
  });
}

// Local images for random display
const LOCAL_IMAGES = [
  'img/1.webp',
  'img/2.webp',
  'img/3.webp',
  'img/4.webp',
  'img/5.webp',
  'img/6.webp',
  'img/7.webp',
  'img/8.webp',
  'img/9.webp',
  'img/10.webp',
  'img/11.webp',
  'img/12.webp',
  'img/13.webp',
  'img/14.webp',
  'img/15.webp',
  'img/16.webp',
  'img/17.webp',
  'img/18.webp',
  'img/19.webp',
  'img/20.webp',
  'img/21.webp',
  'img/22.webp',
  'img/23.webp',
  'img/24.webp',
  'img/25.webp',
  'img/26.webp',
  'img/27.webp',
  'img/28.webp',
  'img/29.webp',
  'img/30.webp',
  'img/31.webp',
  'img/32.gif',
  'img/33.webp'
];

function showRandomImage() {
  const randomIndex = Math.floor(Math.random() * LOCAL_IMAGES.length);
  randomGifImg.src = LOCAL_IMAGES[randomIndex];
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Date helpers
function getDateKey(date) {
  return date.toISOString().split('T')[0];
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

function formatDateDisplay(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Timer functions
function startTimer(projectId, projectName, todoId, todoText) {
  // Stop any existing timer first
  if (activeTimer) {
    stopTimer();
  }

  activeTimer = {
    projectId,
    projectName,
    todoId,
    todoText,
    startTime: Date.now()
  };

  renderTodos();
}

function stopTimer() {
  if (!activeTimer) return;

  const duration = Date.now() - activeTimer.startTime;
  const dateKey = getDateKey(new Date());

  // Initialize date entry if needed
  if (!workHistory[dateKey]) {
    workHistory[dateKey] = { worked: [], completed: [] };
  }

  // Record work session
  workHistory[dateKey].worked.push({
    projectId: activeTimer.projectId,
    projectName: activeTimer.projectName,
    todoId: activeTimer.todoId,
    todoText: activeTimer.todoText,
    duration: duration,
    endTime: Date.now()
  });

  saveHistory();
  activeTimer = null;
  renderTodos();

  // Update history if panel is open
  if (historyPanel.classList.contains('show')) {
    renderCalendar();
    if (selectedDate) {
      renderHistoryReport(selectedDate);
    }
  }
}

function toggleTimer(projectId, projectName, todoId, todoText) {
  if (activeTimer && activeTimer.todoId === todoId) {
    stopTimer();
  } else {
    startTimer(projectId, projectName, todoId, todoText);
  }
}

// Record completion
function recordCompletion(projectId, projectName, todoId, todoText) {
  const dateKey = getDateKey(new Date());

  if (!workHistory[dateKey]) {
    workHistory[dateKey] = { worked: [], completed: [] };
  }

  workHistory[dateKey].completed.push({
    projectId,
    projectName,
    todoId,
    todoText,
    time: Date.now()
  });

  saveHistory();
}

// Project functions
function addProject(name) {
  const project = {
    id: generateId(),
    name: name.trim(),
    todos: []
  };
  data.projects.push(project);
  data.activeProjectId = project.id;
  saveData();
  render();
}

function deleteProject(id) {
  const project = data.projects.find(p => p.id === id);
  if (!project) return;

  if (project.todos.length > 0) {
    showConfirmDialog(
      `Delete "${project.name}" and all its tasks?`,
      () => {
        performDeleteProject(id);
      }
    );
  } else {
    performDeleteProject(id);
  }
}

function performDeleteProject(id) {
  // Stop timer if running on this project
  if (activeTimer && activeTimer.projectId === id) {
    stopTimer();
  }

  data.projects = data.projects.filter(p => p.id !== id);
  if (data.activeProjectId === id) {
    data.activeProjectId = data.projects.length > 0 ? data.projects[0].id : null;
  }
  saveData();
  render();
}

function selectProject(id) {
  data.activeProjectId = id;
  saveData();
  render();
}

function getActiveProject() {
  return data.projects.find(p => p.id === data.activeProjectId);
}

// Todo functions
function addTodo(text) {
  const project = getActiveProject();
  if (!project || !text.trim()) return;

  const todo = {
    id: generateId(),
    text: text.trim(),
    completed: false
  };
  project.todos.push(todo);
  saveData();
  renderTodos();
}

function updateTodo(todoId, newText) {
  const project = getActiveProject();
  if (!project) return;

  const todo = project.todos.find(t => t.id === todoId);
  if (todo) {
    todo.text = newText.trim();
    saveData();
  }
}

function deleteTodo(todoId) {
  const project = getActiveProject();
  if (!project) return;

  // Stop timer if running on this todo
  if (activeTimer && activeTimer.todoId === todoId) {
    stopTimer();
  }

  project.todos = project.todos.filter(t => t.id !== todoId);
  saveData();
  renderTodos();
}

function toggleTodo(todoId) {
  const project = getActiveProject();
  if (!project) return;

  const todo = project.todos.find(t => t.id === todoId);
  if (todo) {
    const wasCompleted = todo.completed;
    todo.completed = !todo.completed;
    saveData();

    // Stop timer if completing this task
    if (!wasCompleted && todo.completed && activeTimer && activeTimer.todoId === todoId) {
      stopTimer();
    }

    // Record completion
    if (!wasCompleted && todo.completed) {
      recordCompletion(project.id, project.name, todo.id, todo.text);
      playGraffitiAnimation();
      // Show a new random image on task completion
      if (!historyPanel.classList.contains('show')) {
        showRandomImage();
      }
    }

    renderTodos();
  }
}

// Sound Effect - Clink sound
function playConfettiSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Main clink tone
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.type = 'triangle';
  osc1.frequency.value = 2400;
  gain1.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
  osc1.start(audioCtx.currentTime);
  osc1.stop(audioCtx.currentTime + 0.12);

  // Harmonic overtone for metallic quality
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.type = 'sine';
  osc2.frequency.value = 4800;
  gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  osc2.start(audioCtx.currentTime);
  osc2.stop(audioCtx.currentTime + 0.08);
}

// Confetti Animation
function playGraffitiAnimation() {
  playConfettiSound();
  const confetti = [];
  const colors = [
    '#ff6b6b', // red
    '#ffd93d', // yellow
    '#6bcb77', // green
    '#4d96ff', // blue
    '#ff6bd6', // pink
    '#845ef7', // purple
    '#ff922b', // orange
    '#20c997', // teal
  ];

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  // Create confetti particles
  for (let i = 0; i < 100; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    confetti.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      width: 8 + Math.random() * 8,
      height: 6 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      alpha: 1,
      gravity: 0.15 + Math.random() * 0.1,
      friction: 0.98,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    });
  }

  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    ctx.clearRect(0, 0, graffitiCanvas.width, graffitiCanvas.height);

    let hasActiveParticles = false;

    confetti.forEach(p => {
      if (p.alpha > 0 && p.y < window.innerHeight + 50) {
        hasActiveParticles = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Update physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= p.friction;
        p.rotation += p.rotationSpeed;

        // Fade out after a while
        if (elapsed > 1000) {
          p.alpha -= 0.02;
        }
      }
    });

    ctx.globalAlpha = 1;

    if (hasActiveParticles && elapsed < 2500) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, graffitiCanvas.width, graffitiCanvas.height);
    }
  }

  animate();
}

// Calendar functions
function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  const todayKey = getDateKey(today);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  let html = `
    <div class="calendar-header">
      <button class="calendar-nav" id="prevMonth">&lt;</button>
      <span>${monthNames[month]} ${year}</span>
      <button class="calendar-nav" id="nextMonth">&gt;</button>
    </div>
    <div class="calendar-grid">
      <div class="calendar-day-header">Su</div>
      <div class="calendar-day-header">Mo</div>
      <div class="calendar-day-header">Tu</div>
      <div class="calendar-day-header">We</div>
      <div class="calendar-day-header">Th</div>
      <div class="calendar-day-header">Fr</div>
      <div class="calendar-day-header">Sa</div>
  `;

  // Previous month days
  const prevMonth = new Date(year, month, 0);
  const prevDays = prevMonth.getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevDays - i;
    const dateKey = getDateKey(new Date(year, month - 1, day));
    const hasData = workHistory[dateKey] && (workHistory[dateKey].worked.length > 0 || workHistory[dateKey].completed.length > 0);
    html += `<div class="calendar-day other-month${hasData ? ' has-data' : ''}" data-date="${dateKey}">${day}</div>`;
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = getDateKey(new Date(year, month, day));
    const isToday = dateKey === todayKey;
    const isSelected = dateKey === selectedDate;
    const hasData = workHistory[dateKey] && (workHistory[dateKey].worked.length > 0 || workHistory[dateKey].completed.length > 0);

    let classes = 'calendar-day';
    if (isToday) classes += ' today';
    if (isSelected) classes += ' selected';
    if (hasData) classes += ' has-data';

    html += `<div class="${classes}" data-date="${dateKey}">${day}</div>`;
  }

  // Next month days
  const totalCells = startDay + daysInMonth;
  const remaining = 7 - (totalCells % 7);
  if (remaining < 7) {
    for (let day = 1; day <= remaining; day++) {
      const dateKey = getDateKey(new Date(year, month + 1, day));
      const hasData = workHistory[dateKey] && (workHistory[dateKey].worked.length > 0 || workHistory[dateKey].completed.length > 0);
      html += `<div class="calendar-day other-month${hasData ? ' has-data' : ''}" data-date="${dateKey}">${day}</div>`;
    }
  }

  html += '</div>';
  calendar.innerHTML = html;

  // Add event listeners
  document.getElementById('prevMonth').onclick = () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  };

  document.getElementById('nextMonth').onclick = () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  };

  calendar.querySelectorAll('.calendar-day:not(.calendar-day-header)').forEach(el => {
    el.onclick = () => {
      selectedDate = el.dataset.date;
      renderCalendar();
      renderHistoryReport(selectedDate);
    };
  });
}

function renderHistoryReport(dateKey) {
  const dayData = workHistory[dateKey];

  if (!dayData || (dayData.worked.length === 0 && dayData.completed.length === 0)) {
    historyReport.innerHTML = `
      <div class="history-date-title">${formatDateDisplay(dateKey)}</div>
      <p class="history-empty">No activity on this day</p>
    `;
    return;
  }

  let html = `<div class="history-date-title">${formatDateDisplay(dateKey)}</div>`;

  // Worked tasks
  if (dayData.worked.length > 0) {
    html += `
      <div class="history-section">
        <div class="history-section-title">Worked On</div>
    `;

    // Group by todo and sum durations
    const workSummary = {};
    dayData.worked.forEach(w => {
      const key = `${w.projectId}-${w.todoId}`;
      if (!workSummary[key]) {
        workSummary[key] = { ...w, totalDuration: 0 };
      }
      workSummary[key].totalDuration += w.duration;
    });

    Object.values(workSummary).forEach(w => {
      html += `
        <div class="history-item">
          <div class="history-item-dot worked"></div>
          <div class="history-item-text">
            ${w.todoText}
            <div class="history-item-project">${w.projectName}</div>
          </div>
          <div class="history-item-duration">${formatDuration(w.totalDuration)}</div>
        </div>
      `;
    });

    html += '</div>';
  }

  // Completed tasks
  if (dayData.completed.length > 0) {
    html += `
      <div class="history-section">
        <div class="history-section-title">Completed</div>
    `;

    dayData.completed.forEach(c => {
      html += `
        <div class="history-item">
          <div class="history-item-dot completed"></div>
          <div class="history-item-text">
            ${c.todoText}
            <div class="history-item-project">${c.projectName}</div>
          </div>
        </div>
      `;
    });

    html += '</div>';
  }

  historyReport.innerHTML = html;
}

// Modal functions
function showModal(title, placeholder, confirmText, onConfirm) {
  modalTitle.textContent = title;
  modalInput.placeholder = placeholder;
  modalInput.value = '';
  modalConfirm.textContent = confirmText;
  modalOverlay.classList.add('show');
  modalInput.focus();

  const handleConfirm = () => {
    const value = modalInput.value.trim();
    if (value) {
      onConfirm(value);
      hideModal();
    }
  };

  const handleKeydown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      hideModal();
    }
  };

  modalConfirm.onclick = handleConfirm;
  modalInput.onkeydown = handleKeydown;
}

function hideModal() {
  modalOverlay.classList.remove('show');
  modalInput.value = '';
}

function showConfirmDialog(message, onConfirm) {
  confirmMessage.textContent = message;
  confirmOverlay.classList.add('show');
  pendingDeleteCallback = onConfirm;
}

function hideConfirmDialog() {
  confirmOverlay.classList.remove('show');
  pendingDeleteCallback = null;
}

// Render functions
function renderProjects() {
  projectsList.innerHTML = '';

  data.projects.forEach(project => {
    const tab = document.createElement('button');
    tab.className = `project-tab${project.id === data.activeProjectId ? ' active' : ''}`;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = project.name;
    tab.appendChild(nameSpan);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-project';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteProject(project.id);
    };
    tab.appendChild(deleteBtn);

    tab.onclick = () => selectProject(project.id);
    projectsList.appendChild(tab);
  });
}

function renderTodos() {
  const project = getActiveProject();

  if (!project) {
    emptyState.style.display = 'block';
    todoListWrapper.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  todoListWrapper.style.display = 'block';

  // Sort: active todos first, then completed
  const sortedTodos = [...project.todos].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  todoList.innerHTML = '';

  sortedTodos.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.completed ? ' completed' : ''}`;

    // Show random image when clicking on a task
    li.onclick = () => {
      if (!historyPanel.classList.contains('show')) {
        showRandomImage();
      }
    };

    // Timer button (only for non-completed tasks)
    if (!todo.completed) {
      const timerBtn = document.createElement('button');
      const isActive = activeTimer && activeTimer.todoId === todo.id;
      timerBtn.className = `timer-btn${isActive ? ' active' : ''}`;
      timerBtn.innerHTML = isActive
        ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
      timerBtn.onclick = () => toggleTimer(project.id, project.name, todo.id, todo.text);
      li.appendChild(timerBtn);
    }

    // Checkbox
    const checkbox = document.createElement('div');
    checkbox.className = 'todo-checkbox';
    checkbox.onclick = () => toggleTodo(todo.id);
    li.appendChild(checkbox);

    // Text input
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'todo-text';
    textInput.value = todo.text;
    textInput.onblur = () => updateTodo(todo.id, textInput.value);
    textInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        textInput.blur();
      }
    };
    li.appendChild(textInput);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'todo-action-btn edit';
    editBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>`;
    editBtn.onclick = () => textInput.focus();
    actions.appendChild(editBtn);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'todo-action-btn delete';
    deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>`;
    deleteBtn.onclick = () => deleteTodo(todo.id);
    actions.appendChild(deleteBtn);

    li.appendChild(actions);
    todoList.appendChild(li);
  });
}

function render() {
  renderProjects();
  renderTodos();
}

// Toggle history panel
function toggleHistoryPanel() {
  historyPanel.classList.toggle('show');
  historyToggleBtn.classList.toggle('active');

  // Toggle GIF panel visibility (opposite of history panel)
  if (historyPanel.classList.contains('show')) {
    gifPanel.classList.add('hide');
    renderCalendar();
    // Select today by default
    if (!selectedDate) {
      selectedDate = getDateKey(new Date());
      renderCalendar();
      renderHistoryReport(selectedDate);
    }
  } else {
    gifPanel.classList.remove('hide');
  }
}

// Event listeners
addProjectBtn.onclick = () => {
  showModal('New Project', 'Project name', 'Create', addProject);
};

addTodoBtn.onclick = () => {
  addTodo(newTodoInput.value);
  newTodoInput.value = '';
};

newTodoInput.onkeydown = (e) => {
  if (e.key === 'Enter') {
    addTodo(newTodoInput.value);
    newTodoInput.value = '';
  }
};

historyToggleBtn.onclick = toggleHistoryPanel;

modalCancel.onclick = hideModal;
modalOverlay.onclick = (e) => {
  if (e.target === modalOverlay) hideModal();
};

confirmCancel.onclick = hideConfirmDialog;
confirmDelete.onclick = () => {
  if (pendingDeleteCallback) {
    pendingDeleteCallback();
  }
  hideConfirmDialog();
};
confirmOverlay.onclick = (e) => {
  if (e.target === confirmOverlay) hideConfirmDialog();
};

// Keyboard shortcuts
document.onkeydown = (e) => {
  if (e.key === 'Escape') {
    hideModal();
    hideConfirmDialog();
  }
};

// Initialize
loadData();
showRandomImage();
