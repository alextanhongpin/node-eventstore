# node-eventstore


```
# Open web ui
$ make web
```

## Query

To query stream from the `Query` tab:

```
fromStream('<streamName>')
```


## Projections

To create projections from the `Projection` tab:

```js
fromStream('res_homealone_seat1')
.when({
    $init() {
        return {
            count: 0
        }
    },
    $any(s, e) {
        s.count += 1;
    }
})
.outputState()
```

Sample events from projection:
```json
{
  "count": 1,
  "total": 0,
  "events": [
    {
      "partition": "",
      "bodyRaw": "{\"name\":\"Dinner\",\"amount\":10}",
      "metadataRaw": null,
      "streamId": "wallet_1674573897930",
      "eventId": "a539e828-fbbb-480d-871d-2f8d665ccde5",
      "eventType": "ExpenseAdded",
      "linkMetadataRaw": null,
      "isJson": true,
      "category": null,
      "sequenceNumber": 2,
      "body": {
        "name": "Dinner",
        "amount": 10
      },
      "data": {
        "name": "Dinner",
        "amount": 10
      },
      "metadata": null,
      "linkMetadata": null
    }
  ]
}
```

## Architecture for EventSourcing

- stateless: the next command does not need to depend on the previous one (append only)
- stateful: the next command depends on the result from the previous state

In general, stateless design is much simpler (see v2 directory). We can just produce the events without needing to know about the previous state.
