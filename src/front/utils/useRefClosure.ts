import { useRef } from 'react';

const useRefClosure = <T = undefined>(value: T) => {
  const ref = useRef<T>(value);
  ref.current = value;
  return ref;
};

export { useRefClosure };
