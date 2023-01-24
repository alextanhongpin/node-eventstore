import { createEvent } from "./event.js";

export const events = {
  WALLET_CREATED: "WalletCreated",
  WALLET_RENAMED: "WalletRenamed",
  EXPENSE_ADDED: "ExpenseAdded",
};

export function createWallet(id, name) {
  return createEvent({
    type: events.WALLET_CREATED,
    data: {
      name,
    },
    aggregateId: id,
    aggregateType: "Wallet",
    aggregateVersion: BigInt(0),
  });
}

export function renameWallet(id, version, name) {
  return createEvent({
    type: events.WALLET_RENAMED,
    data: {
      name,
    },
    aggregateId: id,
    aggregateType: "Wallet",
    aggregateVersion: version + BigInt(1),
  });
}

export function addExpense(id, version, name, amount) {
  return createEvent({
    type: events.EXPENSE_ADDED,
    data: {
      name,
      amount,
    },
    aggregateId: id,
    aggregateType: "Wallet",
    aggregateVersion: version + BigInt(1),
  });
}
