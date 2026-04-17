const STORAGE_KEY = "waardenkompas_data";

const DEFAULT_DATA = {
  answers: {},
  impulses: [],
  decisions: [],
  actions: [],
  customQuestions: [],
  onboardingDone: false,
  aiProfile: null,
  aiProfileDate: null,
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure all keys exist after upgrades
      return { ...DEFAULT_DATA, ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load data from localStorage:", e);
  }
  return { ...DEFAULT_DATA };
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save data to localStorage:", e);
  }
}

export function clearData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Failed to clear data:", e);
  }
}
