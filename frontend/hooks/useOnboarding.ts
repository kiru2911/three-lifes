import { useCallback, useEffect, useState } from 'react';
import {
  STORAGE_KEYS,
  getBool,
  getJSON,
  setBool,
  setJSON,
} from '@/utils/storage';

export interface OnboardingState {
  ready: boolean;
  hasCompleted: boolean;
  selectedInterests: string[];
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    ready: false,
    hasCompleted: false,
    selectedInterests: [],
  });

  useEffect(() => {
    setState({
      ready: true,
      hasCompleted: getBool(STORAGE_KEYS.hasCompletedOnboarding),
      selectedInterests: getJSON<string[]>(STORAGE_KEYS.selectedInterests, []),
    });
  }, []);

  const complete = useCallback((interests: string[]) => {
    setBool(STORAGE_KEYS.hasCompletedOnboarding, true);
    setJSON(STORAGE_KEYS.selectedInterests, interests);
    setState({
      ready: true,
      hasCompleted: true,
      selectedInterests: interests,
    });
  }, []);

  return { ...state, complete };
}
