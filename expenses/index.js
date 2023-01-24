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
  await appendEvents(client, wallet);

  // Rehydrate aggregate from event store events.
  const events = await loadEvents(client, wallet);
  const wallet2 = WalletAggregate.fromEvents(wallet.id, events);
  wallet2.addExpense("dinner", 20);
  wallet2.rename("Housing");
  await appendEvents(client, wallet2);

  const events2 = await loadEvents(client, wallet2);
  console.log({ events2 });
  const wallet3 = WalletAggregate.fromEvents(wallet2.id, events2);
  console.log(wallet3);
  console.log(client);
  await client.dispose();
}

main().catch(console.error);

async function appendEvents(client, aggregate) {
  for await (const event of aggregate.events) {
    console.log({ event, version: event.version });
    // The revision starts from 0 for event store, and the expected revision is
    // the previous revision.
    const revision =
      event.type === WalletCreatedEvent.name
        ? NO_STREAM
        : event.version - BigInt(1);
    const evt = jsonEvent({
      type: event.type,
      data: event.data,
    });
    const result = await client.appendToStream(aggregate.toStream(), evt, {
      revision,
    });
    if (!result.success) {
      throw new Error("failed to append events");
    }
    console.log("appended", result);
  }
}

async function loadEvents(client, aggregate) {
  const EVENT_MAP = {
    [ExpenseAddedEvent.name]: ({ id, version, data }) =>
      new ExpenseAddedEvent(data, { id, version }),
    [WalletCreatedEvent.name]: ({ id, version, data }) =>
      new WalletCreatedEvent(data, { id, version }),
    [WalletRenamedEvent.name]: ({ id, version, data }) =>
      new WalletRenamedEvent(data, { id, version }),
  };

  const $events = await client.readStream(aggregate.toStream(), {
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
