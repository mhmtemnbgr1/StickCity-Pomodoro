import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { PROFESSIONS, STICKMAN_NAMES } from '../data/messages.js';
import { BUILDINGS, CIVILIZATION_LEVELS } from '../data/buildings.js';

const CivilizationContext = createContext(null);

const INITIAL_STATE = {
  // Todos
  todos: [],
  completedTodosTotal: 0,
  todayCompleted: 0,
  todayTarget: 5,

  // Pomodoro
  activePomodoro: null, // todoId
  pomodoroPhase: 'idle', // idle | work | break
  pomodoroSeconds: 25 * 60,
  pomodoroCount: 0,
  pomodoroPaused: false,
  phaseEndsAt: null, // epoch ms, keeps the timer accurate in background tabs
  workMinutes: 25,
  breakMinutes: 5,

  // Civilization
  gold: 100,
  population: [],
  buildings: [], // { buildingId, id, x, y }
  populationCap: 10,
  happinessProtection: false,
  shield: false,
  shieldUsed: false,
  goldBonus: 0,
  passiveGold: 0,

  // Meta
  lastDayCheck: new Date().toDateString(),
  dayEnded: false, // today's evaluation already happened
  showDayEnd: false,
  dayEndResult: null,
  notifications: [],
  customMessages: [],
  
  // New Mechanics
  weather: 'clear', // clear | golden_age | storm
  consecutivePomodoros: 0,
  bandits: [], // { id, x, y }
};

// Fresh day: clear the counter and drop yesterday's finished todos
function rollover(s) {
  return {
    ...s,
    todayCompleted: 0,
    dayEnded: false,
    lastDayCheck: new Date().toDateString(),
    todos: s.todos.filter(t => !t.completed),
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem('stickcity_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      const base = {
        ...INITIAL_STATE,
        ...parsed,
        pomodoroPhase: 'idle',
        activePomodoro: null,
        pomodoroPaused: false,
        phaseEndsAt: null,
        pomodoroSeconds: (parsed.workMinutes || 25) * 60,
        showDayEnd: false,
        dayEndResult: null,
        // refresh names/icons of saved buildings after renames
        buildings: (parsed.buildings || []).map(b => {
          const def = BUILDINGS.find(d => d.id === b.id);
          return def ? { ...b, name: def.name, iconName: def.iconName } : b;
        }),
      };
      if (parsed.lastDayCheck !== new Date().toDateString()) {
        // A day passed while the app was closed: judge it automatically
        if (!parsed.dayEnded && (parsed.population || []).length > 0) {
          return { ...base, pendingAutoDayEnd: true };
        }
        return rollover(base);
      }
      return base;
    }
  } catch (e) {}
  return INITIAL_STATE;
}

function saveState(state) {
  try {
    const toSave = {
      ...state,
      pomodoroPhase: 'idle',
      activePomodoro: null,
      pomodoroPaused: false,
      phaseEndsAt: null,
      pomodoroSeconds: state.workMinutes * 60,
      showDayEnd: false,
      notifications: [],
    };
    localStorage.setItem('stickcity_state', JSON.stringify(toSave));
  } catch (e) {}
}

function getRandomName(existingNames) {
  const available = STICKMAN_NAMES.filter(n => !existingNames.includes(n));
  if (available.length === 0) return STICKMAN_NAMES[Math.floor(Math.random() * STICKMAN_NAMES.length)];
  return available[Math.floor(Math.random() * available.length)];
}

function createStickman(existingPopulation) {
  const prof = PROFESSIONS[Math.floor(Math.random() * PROFESSIONS.length)];
  const name = getRandomName(existingPopulation.map(p => p.name));
  return {
    id: `stick_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name,
    profession: prof,
    happiness: 85 + Math.floor(Math.random() * 15),
    x: 5 + Math.random() * 90,
    y: 60 + Math.random() * 25,
    direction: Math.random() > 0.5 ? 1 : -1,
    speed: 0.15 + Math.random() * 0.25,
    showBubble: false,
    bubbleTimeout: null,
    isLeaving: false,
    birthDate: new Date().toISOString(),
  };
}

function getCivLevel(completedTotal, buildingsCount) {
  let level = CIVILIZATION_LEVELS[0];
  for (const l of CIVILIZATION_LEVELS) {
    if (completedTotal >= l.requiredTodos && buildingsCount >= l.requiredBuildings) {
      level = l;
    }
  }
  return level;
}

function recalcEffects(buildings) {
  let populationCap = 10;
  let happinessProtection = false;
  let shield = false;
  let goldBonus = 0;
  let passiveGold = 0;
  for (const b of buildings) {
    const lvl = b.level || 1;
    if (b.effect.populationCap) populationCap += b.effect.populationCap * lvl;
    if (b.effect.happinessProtection) happinessProtection = true;
    if (b.effect.shield) shield = true;
    if (b.effect.goldBonus) goldBonus += b.effect.goldBonus * lvl;
    if (b.effect.passiveGold) passiveGold += b.effect.passiveGold * lvl;
  }
  return { populationCap, happinessProtection, shield, goldBonus, passiveGold };
}

// Grid-based building placement — divides canvas into COLS x ROWS slots
// Each slot is claimed when a building is placed there, preventing overlap.
const GRID_COLS = 6;
const GRID_ROWS = 3;

function getNextBuildingSlot(existingBuildings) {
  // Mark occupied slots
  const occupied = new Set();
  for (const b of existingBuildings) {
    if (b.slotIndex !== undefined) occupied.add(b.slotIndex);
  }
  // Find first free slot (row-major order, skip center crossroads)
  const totalSlots = GRID_COLS * GRID_ROWS;
  for (let i = 0; i < totalSlots; i++) {
    if (!occupied.has(i)) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      // Convert to % coordinates, keeping them in the center safe zone
      // X from 15% to 85%
      const x = 15 + col * (70 / (GRID_COLS - 1));
      // Y from 35% to 75%
      const y = 35 + row * (40 / (GRID_ROWS - 1));
      return { x, y, slotIndex: i };
    }
  }
  // Fallback: stack slightly offset if all slots full
  const i = existingBuildings.length % totalSlots;
  const loopCycle = Math.floor(existingBuildings.length / totalSlots);
  const col = i % GRID_COLS;
  const row = Math.floor(i / GRID_COLS);
  
  // Add slight offset for each full cycle so they don't perfectly overlap
  const offset = loopCycle * 2; 

  return {
    x: 15 + col * (70 / (GRID_COLS - 1)) + offset,
    y: 35 + row * (40 / (GRID_ROWS - 1)) + offset,
    slotIndex: i,
  };
}

function reducer(state, action) {
  switch (action.type) {

    case 'ADD_TODO': {
      const todo = {
        id: `todo_${Date.now()}`,
        title: action.title,
        difficulty: action.difficulty || 'normal', // easy | normal | hard
        completed: false,
        pomodorosDone: 0,
        pomodorosNeeded: action.difficulty === 'hard' ? 4 : action.difficulty === 'easy' ? 1 : 2,
        createdAt: new Date().toISOString(),
      };
      return { ...state, todos: [...state.todos, todo] };
    }

    case 'DELETE_TODO': {
      return { ...state, todos: state.todos.filter(t => t.id !== action.id) };
    }

    case 'COMPLETE_TODO': {
      const todo = state.todos.find(t => t.id === action.id);
      if (!todo || todo.completed) return state;

      const weatherMultiplier = state.weather === 'golden_age' ? 1.5 : 1;
      const goldEarned = Math.floor(
        (todo.difficulty === 'hard' ? 80 : todo.difficulty === 'easy' ? 30 : 50) *
        (1 + state.goldBonus) * weatherMultiplier
      );

      let newPopulation = [...state.population];
      if (newPopulation.length < state.populationCap) {
        newPopulation = [...newPopulation, createStickman(newPopulation)];
      }

      const updatedTodos = state.todos.map(t =>
        t.id === action.id ? { ...t, completed: true } : t
      );

      const newCompleted = state.completedTodosTotal + 1;
      const newTodayCompleted = state.todayCompleted + 1;

      const notification = {
        id: `notif_${Date.now()}`,
        message: `Görev tamamlandı! +${goldEarned} altın`,
        type: 'success',
      };

      return {
        ...state,
        todos: updatedTodos,
        gold: state.gold + goldEarned,
        population: newPopulation,
        completedTodosTotal: newCompleted,
        todayCompleted: newTodayCompleted,
        notifications: [...state.notifications, notification],
      };
    }

    case 'START_POMODORO': {
      let notifs = state.notifications;
      if (state.bandits && state.bandits.length > 0) {
        notifs = [...notifs, { id: `notif_${Date.now()}_bandits`, message: 'Çalışmaya başladığın için hırsızlar korkup kaçtı!', type: 'success' }];
      }
      return {
        ...state,
        activePomodoro: action.id,
        pomodoroPhase: 'work',
        pomodoroPaused: false,
        pomodoroSeconds: state.workMinutes * 60,
        phaseEndsAt: Date.now() + state.workMinutes * 60 * 1000,
        bandits: [], // Bandits run away when you start working!
        notifications: notifs,
      };
    }


    case 'TICK_POMODORO': {
      if (state.pomodoroPhase === 'idle' || state.pomodoroPaused) return state;
      const remaining = state.phaseEndsAt
        ? Math.ceil((state.phaseEndsAt - Date.now()) / 1000)
        : state.pomodoroSeconds - 1;
      if (remaining > 0) {
        return remaining === state.pomodoroSeconds ? state : { ...state, pomodoroSeconds: remaining };
      }

      if (state.pomodoroPhase === 'work') {
        // Work session done: count it on the todo, pay a small reward
        const active = state.todos.find(t => t.id === state.activePomodoro);
        const updatedTodos = state.todos.map(t =>
          t.id === state.activePomodoro ? { ...t, pomodorosDone: t.pomodorosDone + 1 } : t
        );
        const reward = Math.floor(10 * (1 + state.goldBonus));
        const newConsecutive = state.consecutivePomodoros + 1;
        const stamp = Date.now();
        let notifs = [...state.notifications];
        let weather = state.weather;

        if (state.weather === 'storm') {
          weather = 'clear';
          notifs.push({ id: `n_${stamp}_clear`, message: 'Fırtına dindi, güneş açtı!', type: 'success' });
        }
        if (newConsecutive >= 3 && weather !== 'golden_age') {
          weather = 'golden_age';
          notifs.push({ id: `n_${stamp}_weather`, message: 'Şehirde Altın Çağ başladı! Görevlerden +%50 altın kazanacaksın!', type: 'success' });
        }
        if (active && active.pomodorosDone + 1 >= active.pomodorosNeeded) {
          notifs.push({ id: `n_${stamp}_ready`, message: `"${active.title}" için yeterli pomodoro tamamlandı, görevi bitirebilirsin!`, type: 'info' });
        }
        notifs.push({ id: `n_${stamp}`, message: `Pomodoro bitti! +${reward} altın. Mola zamanı`, type: 'pomodoro' });

        return {
          ...state,
          todos: updatedTodos,
          gold: state.gold + reward,
          population: state.population.map(p => ({ ...p, happiness: Math.min(100, p.happiness + 2) })),
          pomodoroPhase: 'break',
          pomodoroSeconds: state.breakMinutes * 60,
          phaseEndsAt: stamp + state.breakMinutes * 60 * 1000,
          pomodoroCount: state.pomodoroCount + 1,
          consecutivePomodoros: newConsecutive,
          weather,
          notifications: notifs,
        };
      }

      // Break finished: back to work if the todo is still open, otherwise stop
      const stillOpen = state.todos.some(t => t.id === state.activePomodoro && !t.completed);
      if (!stillOpen) {
        return {
          ...state,
          activePomodoro: null,
          pomodoroPhase: 'idle',
          phaseEndsAt: null,
          pomodoroSeconds: state.workMinutes * 60,
          notifications: [...state.notifications, { id: `n_${Date.now()}`, message: 'Mola bitti! Yeni bir görev seç.', type: 'info' }],
        };
      }
      return {
        ...state,
        pomodoroPhase: 'work',
        pomodoroSeconds: state.workMinutes * 60,
        phaseEndsAt: Date.now() + state.workMinutes * 60 * 1000,
        notifications: [...state.notifications, { id: `n_${Date.now()}`, message: 'Mola bitti! Çalışma zamanı!', type: 'info' }],
      };
    }

    case 'PAUSE_POMODORO': {
      if (state.pomodoroPhase === 'idle' || state.pomodoroPaused) return state;
      const secs = Math.max(1, Math.ceil((state.phaseEndsAt - Date.now()) / 1000));
      return { ...state, pomodoroPaused: true, pomodoroSeconds: secs, phaseEndsAt: null };
    }

    case 'RESUME_POMODORO': {
      if (state.pomodoroPhase === 'idle' || !state.pomodoroPaused) return state;
      return { ...state, pomodoroPaused: false, phaseEndsAt: Date.now() + state.pomodoroSeconds * 1000 };
    }

    case 'SKIP_BREAK': {
      if (state.pomodoroPhase !== 'break') return state;
      return {
        ...state,
        pomodoroPhase: 'work',
        pomodoroPaused: false,
        pomodoroSeconds: state.workMinutes * 60,
        phaseEndsAt: Date.now() + state.workMinutes * 60 * 1000,
      };
    }

    case 'SET_DURATIONS': {
      if (state.pomodoroPhase !== 'idle') return state;
      const workMinutes = Math.min(90, Math.max(1, action.work));
      const breakMinutes = Math.min(30, Math.max(1, action.rest));
      return { ...state, workMinutes, breakMinutes, pomodoroSeconds: workMinutes * 60 };
    }

    case 'STOP_POMODORO': {
      return {
        ...state,
        activePomodoro: null,
        pomodoroPhase: 'idle',
        pomodoroPaused: false,
        phaseEndsAt: null,
        pomodoroSeconds: state.workMinutes * 60,
        // abandoning a work session breaks the golden-age streak
        consecutivePomodoros: state.pomodoroPhase === 'work' ? 0 : state.consecutivePomodoros,
      };
    }

    case 'BUY_BUILDING': {
      const { building } = action;
      if (state.gold < building.cost) return state;
      const slot = getNextBuildingSlot(state.buildings);
      const newBuilding = {
        ...building,
        uid: `b_${Date.now()}`,
        x: slot.x,
        y: slot.y,
        slotIndex: slot.slotIndex,
        level: 1,
      };
      const newBuildings = [...state.buildings, newBuilding];
      const effects = recalcEffects(newBuildings);
      const notification = { id: `notif_${Date.now()}`, message: `${building.name} inşa edildi!`, type: 'building' };
      return {
        ...state,
        gold: state.gold - building.cost,
        buildings: newBuildings,
        ...effects,
        notifications: [...state.notifications, notification],
      };
    }

    case 'UPGRADE_BUILDING': {
      const targetBuilding = state.buildings.find(b => b.uid === action.uid);
      if (!targetBuilding) return state;
      const lvl = targetBuilding.level || 1;
      const upgradeCost = Math.floor(targetBuilding.cost * (lvl + 1) * 0.75); // Upgrade costs 75% of base per level multiplier
      
      if (state.gold < upgradeCost) {
        const notif = { id: `notif_${Date.now()}`, message: `Geliştirme için ${upgradeCost} altın gerekiyor!`, type: 'danger' };
        return { ...state, notifications: [...state.notifications, notif] };
      }

      const updatedBuildings = state.buildings.map(b => 
        b.uid === action.uid ? { ...b, level: lvl + 1 } : b
      );
      
      const effects = recalcEffects(updatedBuildings);
      const notification = { id: `notif_${Date.now()}`, message: `${targetBuilding.name} Seviye ${lvl + 1}'e yükseltildi!`, type: 'success' };
      
      return {
        ...state,
        gold: state.gold - upgradeCost,
        buildings: updatedBuildings,
        ...effects,
        notifications: [...state.notifications, notification],
      };
    }

    case 'DAY_END': {
      if (state.dayEnded) {
        const notif = { id: `n_${Date.now()}`, message: 'Bugünü zaten bitirdin. Yarın yeni bir gün!', type: 'info' };
        return { ...state, notifications: [...state.notifications, notif] };
      }
      const { todayCompleted, todayTarget, population, happinessProtection, shield, shieldUsed } = state;
      const ratio = todayTarget > 0 ? todayCompleted / todayTarget : 1;
      const common = {
        todayCompleted: 0,
        dayEnded: true,
        lastDayCheck: new Date().toDateString(),
        showDayEnd: true,
        bandits: [],
        pomodoroPhase: 'idle',
        pomodoroPaused: false,
        phaseEndsAt: null,
        activePomodoro: null,
        pomodoroSeconds: state.workMinutes * 60,
      };

      if (ratio >= 0.8) {
        const updatedPop = population.map(p => ({ ...p, happiness: Math.min(100, p.happiness + 10) }));
        const passiveIncome = state.passiveGold;
        return {
          ...state,
          ...common,
          population: updatedPop,
          gold: state.gold + passiveIncome,
          shieldUsed: false, // the castle recharges after a good day
          weather: 'clear',
          dayEndResult: { type: 'good', ratio, passiveIncome, completed: todayCompleted },
        };
      }

      const happinessLoss = happinessProtection ? 10 : 20;
      let updatedPop = population.map(p => ({ ...p, happiness: Math.max(0, p.happiness - happinessLoss) }));

      // Castle: prevents citizens from leaving once
      if (shield && !shieldUsed) {
        return {
          ...state,
          ...common,
          population: updatedPop,
          shieldUsed: true,
          weather: 'storm',
          consecutivePomodoros: 0,
          dayEndResult: { type: 'shielded', ratio, happinessLoss, completed: todayCompleted },
        };
      }

      const lostCount = updatedPop.filter(p => p.happiness === 0).length;
      updatedPop = updatedPop.filter(p => p.happiness > 0);
      return {
        ...state,
        ...common,
        population: updatedPop,
        weather: 'storm',
        consecutivePomodoros: 0,
        dayEndResult: { type: 'bad', ratio, happinessLoss, lostCount, completed: todayCompleted },
      };
    }

    // The app was closed over midnight: judge the missed day, then start a fresh one
    case 'AUTO_DAY_ROLLOVER': {
      if (!state.pendingAutoDayEnd) return state;
      const judged = reducer({ ...state, pendingAutoDayEnd: false, dayEnded: false }, { type: 'DAY_END' });
      return rollover(judged);
    }

    case 'CLOSE_DAY_END': {
      return { ...state, showDayEnd: false, dayEndResult: null };
    }

    case 'UPDATE_TARGET': {
      return { ...state, todayTarget: Math.max(1, action.target) };
    }

    case 'DISMISS_NOTIFICATION': {
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.id) };
    }

    case 'UPDATE_STICKMAN_POSITIONS': {
      return { ...state, population: action.population };
    }

    case 'ADD_CUSTOM_MESSAGE': {
      if (!action.message || action.message.trim() === '') return state;
      // Keep up to 20 custom messages
      const updatedMessages = [...(state.customMessages || []), action.message].slice(-20);
      return { ...state, customMessages: updatedMessages };
    }

    case 'DECAY_HAPPINESS': {
      if (state.population.length === 0) return state;
      let someoneLeft = false;
      let leftName = '';
      
      const newPop = state.population.map(p => ({
        ...p,
        happiness: Math.max(0, p.happiness - 1)
      })).filter(p => {
        // Only leave if completely at 0, or under 10 with 3% chance
        if (p.happiness === 0 || (p.happiness < 10 && Math.random() < 0.03)) {
          if (!someoneLeft) {
            someoneLeft = true;
            leftName = p.name;
          }
          return false;
        }
        return true;
      });

      let updatedNotifications = state.notifications;
      if (someoneLeft) {
        updatedNotifications = [...updatedNotifications, { id: `notif_${Date.now()}`, message: `⚠️ Şehir çok mutsuz! ${leftName} şehri terk etti!`, type: 'danger' }];
      }

      // Bandit logic
      let currentBandits = state.bandits || [];
      let currentGold = state.gold;
      
      // Bandits steal gold
      if (currentBandits.length > 0) {
        const stolen = currentBandits.length * 5;
        currentGold = Math.max(0, currentGold - stolen);
        if (Math.random() < 0.5) { // Occasional notification
          updatedNotifications = [...updatedNotifications, { id: `notif_${Date.now()}_steal`, message: `Hırsızlar ${stolen} altın çaldı! Pomodoro başlat veya üstlerine tıkla!`, type: 'danger' }];
        }
      }

      // Spawn new bandit (10% chance per tick if idle, max 3)
      if (currentBandits.length < 3 && Math.random() < 0.15) {
        currentBandits = [
          ...currentBandits,
          {
            id: `bandit_${Date.now()}`,
            x: 5 + Math.random() * 90,
            y: 35 + Math.random() * 55,
            direction: Math.random() > 0.5 ? 1 : -1,
            speed: 0.25 + Math.random() * 0.2, // Fast!
          }
        ];
        updatedNotifications = [...updatedNotifications, { id: `notif_${Date.now()}_spawn`, message: '⚠️ Şehre hırsız dadandı!', type: 'danger' }];
      }

      return { 
        ...state, 
        population: newPop, 
        gold: currentGold,
        bandits: currentBandits,
        notifications: updatedNotifications 
      };
    }

    case 'BANISH_BANDIT': {
      const newBandits = (state.bandits || []).filter(b => b.id !== action.id);
      const notification = { id: `notif_${Date.now()}`, message: 'Hırsız yakalandı! +10 Altın ödül!', type: 'success' };
      return { 
        ...state, 
        bandits: newBandits, 
        gold: state.gold + 10,
        notifications: [...state.notifications, notification] 
      };
    }

    case 'UPDATE_BANDIT_POSITIONS': {
      return { ...state, bandits: action.bandits };
    }

    default:
      return state;
  }
}

export function CivilizationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Judge a day that ended while the app was closed
  useEffect(() => {
    if (state.pendingAutoDayEnd) dispatch({ type: 'AUTO_DAY_ROLLOVER' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto dismiss notifications
  useEffect(() => {
    if (state.notifications.length > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'DISMISS_NOTIFICATION', id: state.notifications[0].id });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [state.notifications]);

  // Passive gold from market each day (checked on load)
  // Already handled in DAY_END

  const civLevel = getCivLevel(state.completedTodosTotal, state.buildings.length);

  return (
    <CivilizationContext.Provider value={{ state, dispatch, civLevel }}>
      {children}
    </CivilizationContext.Provider>
  );
}

export function useCivilization() {
  const ctx = useContext(CivilizationContext);
  if (!ctx) throw new Error('useCivilization must be used inside CivilizationProvider');
  return ctx;
}
