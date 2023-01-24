import { EventStoreDBClient } from "@eventstore/db-client";

const client = EventStoreDBClient.connectionString(
  "esdb://localhost:2113?tls=false"
);
const state = await client.getProjectionState("res_homealone_seat1_projection");
console.log(state);
