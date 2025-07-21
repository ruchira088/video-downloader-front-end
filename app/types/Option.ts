export abstract class Option<T> {
  abstract map<R>(fn: (value: T) => R): Option<R>

  abstract flatMap<R>(fn: (value: T) => Option<R>): Option<R>

  abstract fold<R>(onNone: () => R, onSome: (value: T) => R): R

  abstract filter(fn: (value: T) => boolean): Option<T>

  abstract getOrElse(fn: () => T): T

  abstract toNullable(): T | null

  abstract toDefined(): T | undefined

  abstract toList(): T[]

  abstract isEmpty(): boolean

  abstract forEach<A>(fn: (value: T) => Promise<A> | A): Promise<A | void> | A

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

  toDefined(): T | undefined {
    return this.value
  }

  toList(): T[] {
    return [this.value]
  }

  isEmpty(): boolean {
    return false
  }

  forEach<A>(fn: (value: T) => Promise<A> | A ): Promise<A | void> | A {
    return fn(this.value)
  }

  static of<A>(value: A): Some<A> {
    return new Some(value)
  }
}

export class None<T> extends Option<T> {
  map<R>(fn: (value: any) => R): Option<R> {
    return None.of()
  }

  flatMap<R>(fn: (value: any) => Option<R>): Option<R> {
    return None.of()
  }

  filter(fn: (value: T) => boolean): Option<T> {
    return this
  }

  fold<R>(onNone: () => R, onSome: (value: any) => R): R {
    return onNone()
  }

  getOrElse(fn: () => T): T {
    return fn()
  }

  toNullable(): T | null {
    return null
  }

  toDefined(): T | undefined {
    return undefined
  }

  toList(): T[] {
    return []
  }

  isEmpty(): boolean {
    return true
  }

  forEach<A>(fn: (value: T) => Promise<A>): Promise<A | void> | A  {
    return Promise.resolve()
  }

  static of<A>(): None<A> {
    return new None()
  }
}