import { Maybe } from "monet";

const localStorage: Storage = window.localStorage;

export enum KeySpace {
  Authentication = "Authentication",
}

export default interface KeyValueStore<K, V> {
  put(key: K, value: V): void;

  get(key: K): Maybe<V>;

  remove(key: K): Maybe<V>;
}

export class LocalStorage implements KeyValueStore<string, string> {
  constructor(readonly keySpace: KeySpace) {}

  get(key: string): Maybe<string> {
    return Maybe.fromFalsy(localStorage.getItem(this.stringKey(key)));
  }

  put(key: string, value: string): void {
    localStorage.setItem(this.stringKey(key), value);
  }

  remove(key: string): Maybe<string> {
    return this.get(key).map((value) => {
      localStorage.removeItem(this.stringKey(key));

      return value;
    });
  }

  stringKey = (key: string): string => `${this.keySpace}-${key}`;
}
