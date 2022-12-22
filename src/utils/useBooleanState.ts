import { useCallback, useState } from 'react';

export const useBooleanState: (defaultValue?: boolean) => {
  value: boolean,
  on: () => void,
  off: () => void,
  toggle: () => void,
} = (defaultValue = false) => {
  const [value, setValue] = useState(defaultValue);
  return {
    value,
    on: useCallback(() => { setValue(true); }, []),
    off: useCallback(() => { setValue(false); }, []),
    toggle: useCallback(() => { setValue(v => !v); }, []),
  };
};
