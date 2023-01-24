export class Event {
  #id = "";
  #version = BigInt(0);
  #type = "";
  data = {};

  constructor(id, version) {
    if (!id) throw new Error("id is required");
    if (version < BigInt(0)) throw new Error("version is required");

    this.#id = id;
    this.#version = version;
    this.#type = this.constructor.name;
  }

  get id() {
    return this.#id;
  }

  get version() {
    return this.#version;
  }

  get type() {
    return this.#type;
  }
}

function isEvent(event) {
  return event instanceof Event;
}
