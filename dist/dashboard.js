(() => {
  const TASK_HISTORY_KEY = 'baidangTaskHistoryV1';
  const PET_HISTORY_KEY = 'baidangPetStatusHistoryV1';
  const LEVEL_KEY = 'baidangPetLevelV1';
  const MOOD_HIT_KEY = 'baidangPetLevelMoodHitV2';
  const FULLNESS_HIT_KEY = 'baidangPetLevelFullnessHitV2';
  const MOOD_FULL_KEY = 'baidangPetLevelMoodWasFullV2';
  const FULLNESS_FULL_KEY = 'baidangPetLevelFullnessWasFullV2';

  function readObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  function trimHistory(history) {
    const keys = Object.keys(history).sort();
    while (keys.length > 60) delete history[keys.shift()];
    return history;
  }

  function dayKey(date = new Date()) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function relevantTasks(list, day) {
    return (Array.isArray(list) ? list : []).filter(task => !task.deadline || task.deadline <= day);
  }

  window.archiveTaskDay = (day, list) => {
    if (!day) return;
    const daily = relevantTasks(list, day);
    const done = daily.filter(task => task.done).length;
    const history = readObject(TASK_HISTORY_KEY);
    history[day] = { done, total: daily.length, rate: daily.length ? Math.round(done / daily.length * 100) : 0 };
    localStorage.setItem(TASK_HISTORY_KEY, JSON.stringify(trimHistory(history)));
  };

  function startOfWeek() {
    const now = new Date();
    const mondayOffset = (now.getDay() + 6) % 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
    monday.setHours(12, 0, 0, 0);
    return monday;
  }

  function weekDays() {
    const monday = startOfWeek();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  }

  function lineChart(values, color, label) {
    const width = 320, height = 158, left = 28, right = 12, top = 14, bottom = 30;
    const plotWidth = width - left - right, plotHeight = height - top - bottom;
    const x = index => left + plotWidth * index / 6;
    const y = value => top + plotHeight * (100 - value) / 100;
    const labels = ['一', '二', '三', '四', '五', '六', '日'];
    const valid = values.map((value, index) => value == null ? null : { value, index }).filter(Boolean);
    const points = valid.map(point => `${x(point.index)},${y(point.value)}`).join(' ');
    const grid = [0, 25, 50, 75, 100].map(value => `<line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}"/><text x="${left - 5}" y="${y(value) + 3}" text-anchor="end">${value}</text>`).join('');
    const days = labels.map((text, index) => `<text class="day" x="${x(index)}" y="${height - 8}" text-anchor="middle">${text}</text>`).join('');
    const marks = valid.map(point => `<g><circle cx="${x(point.index)}" cy="${y(point.value)}" r="4"/><text class="value" x="${x(point.index)}" y="${Math.max(11, y(point.value) - 8)}" text-anchor="middle">${point.value}%</text><title>周${labels[point.index]} ${point.value}%</title></g>`).join('');
    const empty = valid.length ? '' : `<text class="empty-chart" x="${width / 2}" y="${height / 2}" text-anchor="middle">本周暂无记录</text>`;
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}"><g class="grid">${grid}</g><g class="axis-labels">${days}</g>${valid.length > 1 ? `<polyline points="${points}" style="stroke:${color}"/>` : ''}<g class="marks" style="color:${color}">${marks}</g>${empty}</svg>`;
  }

  function currentTaskStats() {
    const list = relevantTasks(tasks, dayKey());
    const done = list.filter(task => task.done).length;
    return { done, total: list.length, rate: list.length ? Math.round(done / list.length * 100) : 0 };
  }

  function fullnessValue() {
    return window.petFullness ? Number(window.petFullness.get()) : 50;
  }

  let level = 1;
  let moodHit = false;
  let fullnessHit = false;
  let moodWasFull = false;
  let fullnessWasFull = false;

  function saveLevelProgress() {
    localStorage.setItem(LEVEL_KEY, String(level));
    localStorage.setItem(MOOD_HIT_KEY, moodHit ? '1' : '0');
    localStorage.setItem(FULLNESS_HIT_KEY, fullnessHit ? '1' : '0');
    localStorage.setItem(MOOD_FULL_KEY, moodWasFull ? '1' : '0');
    localStorage.setItem(FULLNESS_FULL_KEY, fullnessWasFull ? '1' : '0');
  }

  function initializeLevel() {
    level = Math.max(1, Math.floor(Number(localStorage.getItem(LEVEL_KEY)) || 1));
    const moodFullNow = Number(mood) >= 99.999;
    const fullnessFullNow = fullnessValue() >= 99.999;
    if (localStorage.getItem(MOOD_HIT_KEY) == null) {
      moodHit = moodFullNow;
      fullnessHit = fullnessFullNow;
      moodWasFull = moodFullNow;
      fullnessWasFull = fullnessFullNow;
    } else {
      moodHit = localStorage.getItem(MOOD_HIT_KEY) === '1';
      fullnessHit = localStorage.getItem(FULLNESS_HIT_KEY) === '1';
      moodWasFull = localStorage.getItem(MOOD_FULL_KEY) === '1';
      fullnessWasFull = localStorage.getItem(FULLNESS_FULL_KEY) === '1';
    }
    saveLevelProgress();
  }

  function updateLevelLabels() {
    const petLevel = document.querySelector('#petLevel');
    const boardLevel = document.querySelector('#dashboardLevel');
    if (petLevel) petLevel.textContent = `Lv. ${level}`;
    if (boardLevel) boardLevel.textContent = `Lv. ${level}`;
  }

  function checkLevel() {
    const moodFullNow = Number(mood) >= 99.999;
    const fullnessFullNow = fullnessValue() >= 99.999;
    if (moodFullNow && !moodWasFull) moodHit = true;
    if (fullnessFullNow && !fullnessWasFull) fullnessHit = true;
    moodWasFull = moodFullNow;
    fullnessWasFull = fullnessFullNow;
    if (moodHit && fullnessHit) {
      level += 1;
      moodHit = false;
      fullnessHit = false;
      if (typeof toast === 'function') toast('心情和饱食度各满过一次，啾啾升级到 Lv. ' + level + ' 啦！');
    }
    saveLevelProgress();
    updateLevelLabels();
  }

  function recordPetStatus() {
    const now = new Date();
    if (now.getHours() < 20) return false;
    const key = dayKey(now);
    const history = readObject(PET_HISTORY_KEY);
    if (history[key] != null) return false;
    history[key] = Math.round((Number(mood) + fullnessValue()) / 2);
    localStorage.setItem(PET_HISTORY_KEY, JSON.stringify(trimHistory(history)));
    return true;
  }

  function drawDashboard() {
    const ring = document.querySelector('#todayRateRing');
    if (!ring) return;
    const todayStats = currentTaskStats();
    ring.style.setProperty('--rate', `${todayStats.rate * 3.6}deg`);
    document.querySelector('#todayRate').textContent = `${todayStats.rate}%`;
    document.querySelector('#todayRateDetail').textContent = todayStats.total ? `已完成 ${todayStats.done} / ${todayStats.total} 项` : '今天还没有任务';
    const taskHistory = readObject(TASK_HISTORY_KEY);
    const petHistory = readObject(PET_HISTORY_KEY);
    const todayKey = dayKey();
    const dates = weekDays();
    const taskValues = dates.map(date => {
      const key = dayKey(date);
      if (key > todayKey) return null;
      if (key === todayKey) return todayStats.rate;
      return taskHistory[key] ? taskHistory[key].rate : null;
    });
    const petValues = dates.map(date => petHistory[dayKey(date)] ?? null);
    document.querySelector('#taskWeekChart').innerHTML = lineChart(taskValues, '#dc7a75', '本周任务完成率折线图');
    document.querySelector('#petWeekChart').innerHTML = lineChart(petValues, '#6f9eac', '本周宠物状态折线图');
    updateLevelLabels();
  }

  function scheduleEightPm() {
    clearTimeout(window.jiujiuEightPmTimer);
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0, 0);
    if (now >= next) next.setDate(next.getDate() + 1);
    window.jiujiuEightPmTimer = setTimeout(() => {
      recordPetStatus();
      drawDashboard();
      scheduleEightPm();
    }, next.getTime() - now.getTime() + 100);
  }

  function init() {
    initializeLevel();
    if (typeof render === 'function') {
      const previousRender = render;
      render = () => {
        previousRender();
        checkLevel();
        drawDashboard();
      };
    }
    recordPetStatus();
    checkLevel();
    drawDashboard();
    scheduleEightPm();
    document.addEventListener('click', () => setTimeout(() => { checkLevel(); recordPetStatus(); drawDashboard(); }, 0));
    document.addEventListener('submit', () => setTimeout(drawDashboard, 0));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { recordPetStatus(); checkLevel(); drawDashboard(); scheduleEightPm(); } });
    window.addEventListener('focus', () => { recordPetStatus(); checkLevel(); drawDashboard(); scheduleEightPm(); });
    setInterval(() => { recordPetStatus(); checkLevel(); drawDashboard(); }, 60000);
  }

  setTimeout(init, 0);
})();