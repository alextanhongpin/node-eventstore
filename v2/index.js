import { events, createWallet, renameWallet, addExpense } from "./command.js";

import {
  EventStoreDBClient,
  jsonEvent,
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
  const walletRenamedEvent = renameWallet(
    walletId,
    walletCreatedEvent.aggregateVersion,
    "Home Expenses"
  );

  {
    const result = await client.appendToStream(
      streamId,
      [walletCreatedEvent, walletRenamedEvent].map(jsonEvent),
      {
        revision: NO_STREAM,
      }
    );
    if (!result.success) {
      throw new Error("failed to append events");
    }
    console.log("events appended to stream", streamId);
  }

  const $events = await client.readStream(streamId, {
    direction: BACKWARDS,
    fromRevision: END,
    maxCount: 1,
  });
  const events = [];
  for await (const event of $events) {
    events.push(event);
  }

  const lastEvent = events[0];
  console.log(lastEvent);
  const lastRevision = lastEvent.event.revision;
  const firstExpense = addExpense(walletId, lastRevision, "Lunch", 15);
  const secondExpense = addExpense(
    walletId,
    firstExpense.aggregateVersion,
    "Dinner",
    10
  );
  {
    const result = await client.appendToStream(
      streamId,
      [firstExpense, secondExpense].map(jsonEvent),
      {
        revision: lastRevision,
      }
    );
    if (!result.success) {
      throw new Error("failed to append events");
    }
    console.log("events appended to stream", streamId);
  }

  const projectionName = `wallet_${walletId}_expenses_count`;
  const projection = `
fromStream('${streamId}')
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
.outputState()
`;
  await client.createProjection(projectionName, projection);
  // Give it some time to count event.
  await delay(500);

  const state = await client.getProjectionState(projectionName);
  const result = await client.getProjectionResult(projectionName);
  console.log({ state, result });

  await await client.dispose();
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
