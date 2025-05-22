export abstract class Option<T> {
  abstract map<R>(fn: (value: T) => R): Option<R>

  abstract flatMap<R>(fn: (value: T) => Option<R>): Option<R>

  abstract fold<R>(onNone: () => R, onSome: (value: T) => R): R

  abstract filter(fn: (value: T) => boolean): Option<T>

  abstract getOrElse(fn: () => T): T

  abstract toNullable(): T | null

  abstract toList(): T[]

  abstract forEach(fn: (value: T) => void): void

  static fromNullable<T>(value: T | null | undefined): Option<T> {
    return value === null || value === undefined ? None.of<T>() : Some.of<T>(value)
  }
}

export class Some<T> extends Option<T> {
  constructor(public readonly value: T) {
    super()
  }

  map<R>(fn: (value: T) => R): Option<R> {
    return Some.of(fn(this.value))
  }

  flatMap<R>(fn: (value: T) => Option<R>): Option<R> {
    return fn(this.value)
  }

  filter(fn: (value: T) => boolean): Option<T> {
    return fn(this.value) ? this : None.of()
  }

  fold<R>(onNone: () => R, onSome: (value: T) => R): R {
    return onSome(this.value)
  }

  getOrElse(fn: () => T): T {
    return this.value
  }

  toNullable(): T | null {
    return this.value
  }

  toList(): T[] {
    return [this.value]
  }

  forEach(fn: (value: T) => void): void {
    fn(this.value)
  }

  static of<A>(value: A): Some<A> {
    return new Some(value)
  }
}

export class None<A> extends Option<A> {
  value: null = null

  map<R>(fn: (value: any) => R): Option<R> {
    return None.of()
  }

  flatMap<R>(fn: (value: any) => Option<R>): Option<R> {
    return None.of()
  }

  filter(fn: (value: A) => boolean): Option<A> {
    return this
  }

  fold<R>(onNone: () => R, onSome: (value: any) => R): R {
    return onNone()
  }

  getOrElse(fn: () => A): A {
    return fn()
  }

  toNullable(): A | null {
    return null
  }

  toList(): A[] {
    return []
  }

  forEach(fn: (value: A) => void): void {
  }

  static of<A>(): None<A> {
    return new None()
  }
}