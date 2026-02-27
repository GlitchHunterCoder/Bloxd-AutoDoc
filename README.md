# Bloxd-AutoDoc
## Usage
```js
API_Docs = new AutoDocs(api.giveItem) //create new doc
API_Docs.tick() //run a test
api.broadcastMessage(JSON.stringify(API_Docs.data)) //log the resulting data
```
