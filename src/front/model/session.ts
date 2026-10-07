import { createContext, useContext, useSyncExternalStore } from 'react';
import type { AppUser } from '../types/user';
import type { Vendor } from '../types/vendor';
import { authLogout, authMe } from '../services/api';
import { startLogin } from '../services/auth';

type SessionSnapshot = {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

class Session {
  #user: AppUser | null = null;
  #isLoading = true;
  #listeners = new Set<() => void>();
  #snapshot: SessionSnapshot = { user: null, isLoading: true, isAuthenticated: false };
  #didInit = false;

  constructor() {
    if (typeof window !== 'undefined') {
      void this.loadMe();
    } else {
      this.#isLoading = false;
      this.#rebuild();
    }
  }

  subscribe = (cb: () => void): (() => void) => {
    this.#listeners.add(cb);
    return () => {
      this.#listeners.delete(cb);
    };
  };

  getSnapshot = (): SessionSnapshot => this.#snapshot;

  #rebuild(): void {
    this.#snapshot = {
      user: this.#user,
      isLoading: this.#isLoading,
      isAuthenticated: this.#user !== null,
    };
    this.#listeners.forEach((l) => l());
  }

  setUser(user: AppUser | null, isLoading = false): void {
    this.#user = user;
    this.#isLoading = isLoading;
    this.#rebuild();
  }

  get user(): AppUser | null {
    return this.#user;
  }

  get isAuthenticated(): boolean {
    return this.#user !== null;
  }

  async loadMe(): Promise<void> {
    if (this.#didInit) return;
    this.#didInit = true;
    try {
      const { user } = await authMe();
      this.#user = user;
    } catch {
      this.#user = null;
    } finally {
      this.#isLoading = false;
      this.#rebuild();
    }
  }

  async login(vendor: Vendor): Promise<void> {
    await startLogin(vendor);
  }

  async logout(): Promise<void> {
    try {
      await authLogout();
    } catch {
      /* ignore */
    }
    this.#user = null;
    this.#rebuild();
  }
}

const SessionContext = createContext<Session | null>(null);
const SessionProvider = SessionContext.Provider;

function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

function useSessionState(): SessionSnapshot {
  const session = useSession();
  return useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
}

export { Session, SessionContext, SessionProvider, useSession, useSessionState };
