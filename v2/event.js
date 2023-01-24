export function createEvent({
  id,
  type,
  data,
  metadata,
  aggregateId,
  aggregateType,
  aggregateVersion = BigInt(0),
}) {
  if (!type) throw new Error("type is required");
  if (!aggregateId) throw new Error("aggregateId is required");
  if (!aggregateType) throw new Error("aggregateType is required");
  return {
    id,
    type,
    data,
    metadata,
    aggregateId,
    aggregateType,
    aggregateVersion,
  };
}
