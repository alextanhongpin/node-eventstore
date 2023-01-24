import { events, createWallet, renameWallet, addExpense } from "./command.js";

import {
  EventStoreDBClient,
  streamNameFilter,
  NO_STREAM,
  FORWARDS,
  BACKWARDS,
  START,
  END,
} from "@eventstore/db-client";

async function main() {
  const client = EventStoreDBClient.connectionString(
    "esdb://localhost:2113?tls=false"
  );

  const walletId = generateId();
  const streamId = `wallet_${walletId}`;
  const walletCreatedEvent = createWallet(walletId, "Housing");
  const walletRenamedEvent = renameWallet(walletId, "Home Expenses");

  {
    const result = await client.appendToStream(
      streamId,
      [walletCreatedEvent, walletRenamedEvent],
      {
        // The first event starts with revision 0.
        revision: NO_STREAM,
      }
    );
    if (!result.success) {
      throw new Error("failed to append events");
    }
    console.log("events appended to stream", streamId);
  }

  // The last revision is needed for optimistic concurrency control.
  const lastRevision = await getLastRevision(client, streamId);
  const firstExpense = addExpense(walletId, "Lunch", 15);
  const secondExpense = addExpense(walletId, "Dinner", 10);
  {
    const result = await client.appendToStream(
      streamId,
      [firstExpense, secondExpense],
      {
        revision: lastRevision,
      }
    );
    if (!result.success) {
      throw new Error("failed to append events");
    }
    console.log("events appended to stream", streamId);
  }

  // This projection creates a summary of the number of expenses, and the total
  // amount.
  const projectionName = `wallet_${walletId}_expenses_count`;
  const projection = `fromStream('${streamId}')
.when({
  $init() {
    return {
      count: 0,
      total: 0
    };
  },
  ExpenseAdded(s, e) {
    s.count++;
    s.total += e.data.amount;
  }
})
.transformBy((state) => state.total)
.outputState()`;
  await client.createProjection(projectionName, projection);

  // Give it some time to count event.
  await delay(500);

  // This returns the `state` object.
  const state = await client.getProjectionState(projectionName);

  // This returns the `transformBy` result.
  const result = await client.getProjectionResult(projectionName);
  console.log({ state, result });

  await await client.dispose();
}

async function getLastRevision(client, streamId) {
  const $events = await client.readStream(streamId, {
    direction: BACKWARDS,
    fromRevision: END,
    maxCount: 1,
  });

  const events = [];
  for await (const { event } of $events) {
    events.push(event);
  }
  return events[0].revision;
}

function generateId() {
  return Date.now().toString();
}

async function delay(duration = 1_000) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

main().catch(console.error);
