import { Aggregate } from "../base/aggregate.js";
import {
  WalletCreatedEvent,
  WalletRenamedEvent,
  ExpenseAddedEvent,
} from "./event.js";

export class WalletAggregate extends Aggregate {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields#simulating_private_constructors
  static #isInternalConstructing = false;

  static fromEvents(id, events) {
    WalletAggregate.#isInternalConstructing = true;
    const wallet = new WalletAggregate(id);
    WalletAggregate.#isInternalConstructing = false;

    for (const event of events) {
      wallet.apply(event);
    }

    return wallet;
  }

  static create(id, name) {
    WalletAggregate.#isInternalConstructing = true;
    const wallet = new WalletAggregate(id);
    WalletAggregate.#isInternalConstructing = false;
    wallet.raise(new WalletCreatedEvent({ name }, { id }));
    return wallet;
  }

  constructor(id) {
    super(id);

    if (!WalletAggregate.#isInternalConstructing) {
      throw new TypeError("WalletAggregate is not constructable");
    }

    this.data = {
      name: "",
      expenses: [],
    };
    this.when = {
      [WalletCreatedEvent.name]: (event) => this.walletCreated(event),
      [WalletRenamedEvent.name]: (event) => this.walletRenamed(event),
      [ExpenseAddedEvent.name]: (event) => this.expenseAdded(event),
    };
  }

  rename(name) {
    const event = new WalletRenamedEvent(
      { name },
      { id: this.id, version: this.version + BigInt(1) }
    );
    this.raise(event);
    return event;
  }

  addExpense(name, amount) {
    const event = new ExpenseAddedEvent(
      { name, amount },
      { id: this.id, version: this.version + BigInt(1) }
    );
    this.raise(event);
    return event;
  }

  walletCreated(data) {
    this.data.name = data.name;
  }

  walletRenamed(data) {
    this.data.name = data.name;
  }

  expenseAdded(data) {
    const { name, amount } = data;
    this.data.expenses.push({ name, amount });
  }
}
