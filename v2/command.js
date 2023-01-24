import { jsonEvent } from "@eventstore/db-client";

export const events = {
  WALLET_CREATED: "WalletCreated",
  WALLET_RENAMED: "WalletRenamed",
  EXPENSE_ADDED: "ExpenseAdded",
};

export function createWallet(walletId, name) {
  return jsonEvent({
    type: events.WALLET_CREATED,
    data: {
      walletId,
      name,
    },
  });
}

export function renameWallet(walletId, name) {
  return jsonEvent({
    type: events.WALLET_RENAMED,
    data: {
      walletId,
      name,
    },
  });
}

export function addExpense(walletId, name, amount) {
  return jsonEvent({
    type: events.EXPENSE_ADDED,
    data: {
      walletId,
      name,
      amount,
    },
  });
}
