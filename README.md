# Bloxd-AutoDoc
## Usage
```js
/* api={
  giveItem:(...arg)=>{
    if(arg.length<2){
      throw new Error(`giveItem got too few arguments (${arg.length} < 2)`)
      return
    }
    if(arg.length>4){
      throw new Error(`giveItem got too many arguments (${arg.length} > 4)`)
      return
    } //just some random bad error to test
    throw new Error(`Error
Unexpected
Expected type: valid player ID string`)
  }
} */ //Small api to test it outside bloxd

API_Docs = new AutoDocs(api.giveItem) //create new doc
API_Docs.tick() //run a test
api.broadcastMessage(JSON.stringify(API_Docs.data)) //log the resulting data
```
