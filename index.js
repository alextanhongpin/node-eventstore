import {
  EventStoreDBClient,
  jsonEvent,
  streamNameFilter,
  NO_STREAM,
  FORWARDS,
  START,
} from "@eventstore/db-client";

const client = EventStoreDBClient.connectionString(
  "esdb://localhost:2113?tls=false"
);

const userId = "ms_smith";
const movieId = "homealone";
const seatId = "seat1";

const reservationId = `res_${movieId}_${seatId}`;
const event = jsonEvent({
  //id: unique-id
  //metadata: {}
  type: "SeatReserved",
  data: {
    reservationId,
    movieId,
    userId,
    seatId,
  },
});

// Subscribing to Streams.
client
  .subscribeToStream(reservationId, { fromRevision: START })
  .on("data", function (resolvedEvent) {
    console.log({ resolvedEvent });
  });

// Filtering streams by the stream type prefix.
const reservationStreamPrefix = "res";
const filter = streamNameFilter({ prefixes: [reservationStreamPrefix] });
const subscription = client.subscribeToAll({ filter });
subscription.on("data", function (resolvedEvent) {
  console.log("byPrefix", { resolvedEvent });
});

// Appending to Stream.
const result = await client.appendToStream(reservationId, event, {
  revision: NO_STREAM,
});
console.log({ result });
const resolvedEvent = await client.readStream(reservationId);
console.log({ resolvedEvent, revision: resolvedEvent.revision });

const events = await client.readAll({
  direction: FORWARDS,
  fromPosition: START,
  maxCount: 10,
});

console.log({ events });
