import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { PROFESSIONS, STICKMAN_NAMES } from '../data/messages.js';
import { CIVILIZATION_LEVELS } from '../data/buildings.js';

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
  showDayEnd: false,
  dayEndResult: null,
  notifications: [],
  customMessages: [],
  
  // New Mechanics
  weather: 'clear', // clear | golden_age | storm
  consecutivePomodoros: 0,
  bandits: [], // { id, x, y }
};

function loadState() {
  try {
    const saved = localStorage.getItem('stickcity_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Reset today's progress if it's a new day
      if (parsed.lastDayCheck !== new Date().toDateString()) {
        return {
          ...parsed,
          todayCompleted: 0,
          lastDayCheck: new Date().toDateString(),
          pomodoroPhase: 'idle',
          activePomodoro: null,
          pomodoroSeconds: 25 * 60,
        };
      }
      return { ...INITIAL_STATE, ...parsed, pomodoroPhase: 'idle', activePomodoro: null, pomodoroSeconds: 25 * 60 };
    }
  } catch (e) {}
  return INITIAL_STATE;
}

function saveState(state) {
  try {
    const toSave = { ...state, pomodoroPhase: 'idle', activePomodoro: null, pomodoroSeconds: 25 * 60, showDayEnd: false, notifications: [] };
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
        pomodoroSeconds: 25 * 60,
        bandits: [], // Bandits run away when you start working!
        notifications: notifs,
      };
    }


    case 'TICK_POMODORO': {
      if (state.pomodoroPhase === 'idle') return state;
      const newSecs = state.pomodoroSeconds - 1;
      if (newSecs <= 0) {
        if (state.pomodoroPhase === 'work') {
          // Work session done → update pomodoro count on todo
          const updatedTodos = state.todos.map(t => {
            if (t.id === state.activePomodoro) {
              const newCount = t.pomodorosDone + 1;
              return { ...t, pomodorosDone: newCount };
            }
            return t;
          });
          
          const newConsecutive = state.consecutivePomodoros + 1;
          const isGoldenAge = newConsecutive >= 3;
          let newWeather = state.weather;
          let notifs = state.notifications;
          
          if (isGoldenAge && state.weather !== 'golden_age') {
            newWeather = 'golden_age';
            notifs = [...notifs, { id: `notif_${Date.now()}_weather`, message: '✨ Şehirde Altın Çağ başladı! Görevlerden daha çok altın kazanacaksın!', type: 'success' }];
          }

          const notification = { id: `notif_${Date.now()}`, message: 'Pomodoro bitti! Mola zamanı', type: 'pomodoro' };
          notifs = [...notifs, notification];

          return {
            ...state,
            todos: updatedTodos,
            pomodoroPhase: 'break',
            pomodoroSeconds: 5 * 60,
            pomodoroCount: state.pomodoroCount + 1,
            consecutivePomodoros: newConsecutive,
            weather: newWeather,
            notifications: notifs,
          };
        } else {
          // Break done → back to work
          const notification = { id: `notif_${Date.now()}`, message: 'Mola bitti! Çalışma zamanı!', type: 'info' };
          return {
            ...state,
            pomodoroPhase: 'work',
            pomodoroSeconds: 25 * 60,
            notifications: [...state.notifications, notification],
          };
        }
      }
      return { ...state, pomodoroSeconds: newSecs };
    }

    case 'STOP_POMODORO': {
      return { ...state, activePomodoro: null, pomodoroPhase: 'idle', pomodoroSeconds: 25 * 60 };
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
      const { todayCompleted, todayTarget, population, happinessProtection, shield, shieldUsed } = state;
      const ratio = todayTarget > 0 ? todayCompleted / todayTarget : 1;

      if (ratio >= 0.8) {
        // Good day! happiness up
        const updatedPop = population.map(p => ({ ...p, happiness: Math.min(100, p.happiness + 10) }));
        const passiveIncome = state.passiveGold;
        return {
          ...state,
          population: updatedPop,
          gold: state.gold + passiveIncome,
          todayCompleted: 0,
          lastDayCheck: new Date().toDateString(),
          showDayEnd: true,
          weather: 'clear',
          dayEndResult: { type: 'good', ratio, passiveIncome },
        };
      } else {
        // Bad day
        const happinessLoss = happinessProtection ? 10 : 20;
        let updatedPop = population.map(p => ({ ...p, happiness: Math.max(0, p.happiness - happinessLoss) }));

        // Shield: prevent population loss once
        if (shield && !shieldUsed) {
          return {
            ...state,
            population: updatedPop,
            todayCompleted: 0,
            lastDayCheck: new Date().toDateString(),
            shieldUsed: true,
            showDayEnd: true,
            weather: 'storm',
            consecutivePomodoros: 0,
            dayEndResult: { type: 'shielded', ratio, happinessLoss },
          };
        }

        // Remove unhappy stickmen
        const leaving = updatedPop.filter(p => p.happiness === 0);
        updatedPop = updatedPop.filter(p => p.happiness > 0);

        return {
          ...state,
          population: updatedPop,
          todayCompleted: 0,
          lastDayCheck: new Date().toDateString(),
          showDayEnd: true,
          weather: 'storm',
          consecutivePomodoros: 0,
          dayEndResult: { type: 'bad', ratio, happinessLoss, lostCount: leaving.length },
        };
      }
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
