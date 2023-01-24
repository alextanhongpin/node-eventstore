import { WalletAggregate } from "./aggregate.js";
import {
  ExpenseAddedEvent,
  WalletCreatedEvent,
  WalletRenamedEvent,
} from "./event.js";
import {
  EventStoreDBClient,
  jsonEvent,
  streamNameFilter,
  NO_STREAM,
  FORWARDS,
  START,
} from "@eventstore/db-client";

async function main() {
  const client = EventStoreDBClient.connectionString(
    "esdb://localhost:2113?tls=false"
  );

  const id = Date.now().toString();
  const wallet = WalletAggregate.create(id, "Expenses");
  wallet.rename("Home Expenses");

  // Save events to event store.
  const isNew = true;
  await appendToStream(client, wallet, isNew);

  // Rehydrate aggregate from event store events.
  const events = await readStream(client, wallet);
  const wallet2 = WalletAggregate.fromEvents(wallet.id, events);
  wallet2.addExpense("dinner", 20);
  wallet2.rename("Housing");
  await appendToStream(client, wallet2);

  const events2 = await readStream(client, wallet2);
  console.log({ events2 });
  const wallet3 = WalletAggregate.fromEvents(wallet2.id, events2);
  console.log(wallet3);
  console.log(client);
  await client.dispose();
}

main().catch(console.error);

async function appendToStream(client, aggregate, isNew = false) {
  if (aggregate.events.length === 0) return false;

  const revision = isNew ? NO_STREAM : aggregate.events[0].version - BigInt(1);
  const events = aggregate.events.map((event) =>
    jsonEvent({
      type: event.type,
      data: event.data,
    })
  );
  const result = await client.appendToStream(aggregate.toStreamId(), events, {
    revision,
  });
  if (!result.success) {
    throw new Error("failed to append events");
  }

  console.log("appended", result);
}

async function readStream(client, aggregate) {
  const EVENT_MAP = {
    [ExpenseAddedEvent.name]: ({ id, version, data }) =>
      new ExpenseAddedEvent(data, { id, version }),
    [WalletCreatedEvent.name]: ({ id, version, data }) =>
      new WalletCreatedEvent(data, { id, version }),
    [WalletRenamedEvent.name]: ({ id, version, data }) =>
      new WalletRenamedEvent(data, { id, version }),
  };

  const $events = await client.readStream(aggregate.toStreamId(), {
    direction: FORWARDS,
    fromRevision: START,
    maxCount: 10,
  });

  const events = [];
  for await (const { event: rawEvent } of $events) {
    const { id: _id, revision, type, data } = rawEvent;
    const event = EVENT_MAP[type]({
      id: aggregate.id,
      version: revision,
      data,
    });
    events.push(event);
  }

  return events;
}
