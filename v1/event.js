import { Event } from "../base/event.js";

export class WalletCreatedEvent extends Event {
  constructor({ name }, { id }) {
    super(id, BigInt(0));

    if (!name) throw new Error("name is required");
    this.data = { name };
  }
}

export class WalletRenamedEvent extends Event {
  constructor({ name }, { id, version }) {
    super(id, version);

    if (!name) throw new Error("name is required");
    this.data = { name };
  }
}

export class ExpenseAddedEvent extends Event {
  constructor({ name, amount }, { id, version }) {
    super(id, version);

    if (!name) throw new Error("expense.name is required");
    if (amount < 1) throw new Error("expense.amount must be greater than 0");
    this.data = { name, amount };
  }
}
