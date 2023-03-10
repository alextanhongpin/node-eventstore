export class Aggregate {
  #name = "";
  constructor(id) {
    this.#name = this.constructor.name;
    this.id = id;
    this.events = [];
    // NOTE: The first event should produce version 0, not 1.
    this.version = BigInt(-1);
    this.when = {};
  }

  apply(event) {
    const { version, id, type, data } = event;
    if (this.version + BigInt(1) !== version) {
      throw new Error("invalid aggregate version");
    }

    if (this.version > BigInt(0) && this.id !== id) {
      throw new Error("invalid aggregate id");
    }

    this.when[type](data);

    this.version++;
  }

  raise(event) {
    this.apply(event);
    this.events.push(event);
  }

  toStreamId() {
    return `${this.#name}_${this.id}`;
  }
}
