import type { Backup } from "./domain";
export type Ctx = {
  data: Backup;
  run: (fn: () => Promise<unknown>, message?: string) => Promise<void>;
  setToast: (s: string) => void;
};
