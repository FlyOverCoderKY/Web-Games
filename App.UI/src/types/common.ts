// Shared enums and types used across games and UI

export enum AsyncStatus {
  Idle = "Idle",
  Pending = "Pending",
  Success = "Success",
  Error = "Error",
}

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface Range {
  min: number;
  max: number;
}

export interface LabeledValue<T extends string | number = string> {
  value: T;
  label: string;
}

export type Appearance = "light" | "dark" | "system";
