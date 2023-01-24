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
