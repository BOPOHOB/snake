import { useState, useEffect, type DependencyList } from 'react';

type Disposable = object & {
  destructor?: () => void;
};

/** Creates a model synchronously (SSR-safe). Recreates when `deps` change. */
function useModel<T extends Disposable>(
  creator: () => T,
  deps: DependencyList = [],
): T {
  const [model, setModel] = useState(creator);

  useEffect(() => {
    if (deps.length === 0) {
      return () => {
        model.destructor?.();
      };
    }

    const instance = creator();
    setModel(instance);
    return () => {
      instance.destructor?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller-controlled deps
  }, deps);

  return model;
}

export { useModel };
