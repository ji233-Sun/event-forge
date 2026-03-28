import {
  DEFAULT_TEMPLATE_VALUES,
  TEMPLATE_KEYS,
  TEMPLATE_OPTIONS,
  type TemplateKey,
  type TemplateValues,
  type ThemeMode,
} from "./config";

type PropertyState<T> = {
  value: T;
  isLocked: boolean;
};

export type TemplateStoreState = {
  [K in TemplateKey]: PropertyState<TemplateValues[K]>;
};

const MODE_BIAS: Record<
  ThemeMode,
  Partial<
    Record<TemplateKey, readonly string[]>
  >
> = {
  dark: {
    baseColor: ["slate", "zinc"],
    bgStyle: ["radial-gradient", "mesh", "linear-gradient"],
    cardStyle: ["glassmorphism", "neumorphism", "flat"],
    primaryColor: ["cyan", "violet", "emerald", "blue"],
  },
  light: {
    baseColor: ["neutral", "zinc", "slate"],
    bgStyle: ["solid", "linear-gradient", "dots"],
    cardStyle: ["flat", "brutalism", "glassmorphism"],
    primaryColor: ["blue", "amber", "rose", "emerald"],
  },
};

const FONT_PAIRS = [
  { headingFont: "Inter", bodyFont: "Roboto" },
  { headingFont: "Montserrat", bodyFont: "Open Sans" },
  { headingFont: "Space Grotesk", bodyFont: "Nunito" },
  { headingFont: "Playfair Display", bodyFont: "Open Sans" },
] as const;

function randomFrom<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length)];
}

function randomDifferentFrom<T>(values: readonly T[], current: T, random: () => number): T {
  if (values.length <= 1) {
    return values[0] as T;
  }

  const pool = values.filter((entry) => entry !== current);
  return randomFrom(pool, random);
}

function randomBiased(
  values: readonly string[],
  preferred: readonly string[] | undefined,
  current: string,
  random: () => number
): string {
  if (preferred && preferred.length > 0 && random() < 0.78) {
    const narrowed = values.filter((item) => preferred.includes(item));
    if (narrowed.length > 0) {
      return randomDifferentFrom(narrowed, current, random);
    }
  }

  return randomDifferentFrom(values, current, random);
}

export function createInitialTemplateStoreState(): TemplateStoreState {
  return {
    themeMode: { value: DEFAULT_TEMPLATE_VALUES.themeMode, isLocked: false },
    baseColor: { value: DEFAULT_TEMPLATE_VALUES.baseColor, isLocked: false },
    primaryColor: { value: DEFAULT_TEMPLATE_VALUES.primaryColor, isLocked: false },
    bgStyle: { value: DEFAULT_TEMPLATE_VALUES.bgStyle, isLocked: false },
    headingFont: { value: DEFAULT_TEMPLATE_VALUES.headingFont, isLocked: false },
    bodyFont: { value: DEFAULT_TEMPLATE_VALUES.bodyFont, isLocked: false },
    cardStyle: { value: DEFAULT_TEMPLATE_VALUES.cardStyle, isLocked: false },
    borderRadius: { value: DEFAULT_TEMPLATE_VALUES.borderRadius, isLocked: false },
  };
}

export function getTemplateValues(state: TemplateStoreState): TemplateValues {
  return {
    themeMode: state.themeMode.value,
    baseColor: state.baseColor.value,
    primaryColor: state.primaryColor.value,
    bgStyle: state.bgStyle.value,
    headingFont: state.headingFont.value,
    bodyFont: state.bodyFont.value,
    cardStyle: state.cardStyle.value,
    borderRadius: state.borderRadius.value,
  };
}

export function setTemplateValue<K extends TemplateKey>(
  state: TemplateStoreState,
  key: K,
  value: TemplateValues[K]
): TemplateStoreState {
  return {
    ...state,
    [key]: {
      ...state[key],
      value,
    },
  };
}

export function applyTemplateValues(
  state: TemplateStoreState,
  values: TemplateValues
): TemplateStoreState {
  return TEMPLATE_KEYS.reduce((acc, key) => {
    return {
      ...acc,
      [key]: {
        ...acc[key],
        value: values[key],
      },
    };
  }, state);
}

export function toggleTemplateLock<K extends TemplateKey>(
  state: TemplateStoreState,
  key: K
): TemplateStoreState {
  return {
    ...state,
    [key]: {
      ...state[key],
      isLocked: !state[key].isLocked,
    },
  };
}

export function shuffleTemplateState(
  state: TemplateStoreState,
  random: () => number = Math.random
): TemplateStoreState {
  const next: TemplateStoreState = {
    themeMode: { ...state.themeMode },
    baseColor: { ...state.baseColor },
    primaryColor: { ...state.primaryColor },
    bgStyle: { ...state.bgStyle },
    headingFont: { ...state.headingFont },
    bodyFont: { ...state.bodyFont },
    cardStyle: { ...state.cardStyle },
    borderRadius: { ...state.borderRadius },
  };

  if (!next.themeMode.isLocked) {
    next.themeMode.value = randomDifferentFrom(
      TEMPLATE_OPTIONS.themeMode,
      next.themeMode.value,
      random
    );
  }

  const activeMode = next.themeMode.value;
  const bias = MODE_BIAS[activeMode];

  for (const key of TEMPLATE_KEYS) {
    if (key === "themeMode") {
      continue;
    }
    if (next[key].isLocked) {
      continue;
    }

    const options = TEMPLATE_OPTIONS[key] as readonly string[];
    const preferred = bias[key] as readonly string[] | undefined;

    next[key].value = randomBiased(options, preferred, String(next[key].value), random) as TemplateStoreState[typeof key]["value"];
  }

  const pair = randomFrom(FONT_PAIRS, random);
  if (!next.headingFont.isLocked) {
    next.headingFont.value = pair.headingFont;
  }
  if (!next.bodyFont.isLocked) {
    next.bodyFont.value = pair.bodyFont;
  }

  return next;
}
