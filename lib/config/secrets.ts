import "server-only";

export class SecretValue {
  #value: string;

  constructor(value: string) {
    this.#value = value;
    Object.freeze(this);
  }

  reveal() {
    return this.#value;
  }

  toJSON() {
    return "[СКРЫТО]";
  }

  toString() {
    return "[СКРЫТО]";
  }
}

export interface SecretProvider {
  get(name: string): Promise<SecretValue>;
}

export class EnvironmentSecretProvider implements SecretProvider {
  constructor(private readonly source: Readonly<Record<string, string | undefined>> = process.env) {}

  async get(name: string) {
    const value = this.source[name]?.trim();
    if (!value) throw new Error(`Секрет ${name} недоступен`);
    return new SecretValue(value);
  }
}
