function formatType(str) {
  return str
    .replace(/string|valid| /g,"")
    .replace(/^./, c => c.toUpperCase())
    .replace(/([A-Z])([A-Z]+)/g, (_, a, b) =>
      a + b.toLowerCase()
    );
}

AutoDocs = class {
  constructor(fn){
    this.fn = fn
    this.data = {}
    this.args = []
    this.return = void 0
    this.error = void 0
    this.state = "pending" //borrowed name from promise
    this.check = { //check.arity
      arity:[
        {
          injector: (e)=>e,
          pattern: RegExp(`^${this.fn.name} got too few arguments \\((\\d+) < (\\d+)\\)$`),
          extractor: (m) => m[2]
        },
        {
          injector: (e)=>e,
          pattern: RegExp(`^${this.fn.name} got too many arguments \\((\\d+) > (\\d+)\\)$`),
          extractor: (m) => m[2]
        }
      ],
      type:[
        {
          injector: (e)=>e.split("\n")[2],
          pattern: RegExp(`^Expected type: (.*)$`),
          extractor: (m) => formatType(m[1])
        }
      ]
    }
  }
  
  parse(text, pattern, extractor, strict = true) {
    if (!text) return { success: false, data: null }
    const match = text.match(pattern)
    if (!match) return { success: false, data: null }
    if (strict && match[0] !== text) return { success: false, data: null }
    try {
      const data = extractor(match, text)
      return { success: true, data }
    } catch (e) {
      return { success: false, data: null }
    }
  }

  regex(line, patterns, strict = true) {
    //TODO: if no matches are found, take error and throw
    let results = []
    for (const patternObj of patterns) {
      const {injector, pattern, extractor } = patternObj
      const parseResult = this.parse(injector(line), pattern, extractor, strict)
      if (parseResult.success) {
        results.push(parseResult.data)
      }
    }
    return results
  }
  

  tryFn(){ //try fn and report on state
    try{
      this.return = this.fn(...this.args)
      this.state = "fulfilled"
    }catch(e){
      this.error = e.message
      this.state = "rejected"
    }
  }
  catchFn(name){ //catch and parse error or return
    let settle = {
      fulfilled:"return",
      rejected:"error"
    }
    if(this[settle[this.state]]==void 0){return} //nothing to report on
    this[settle[this.state]] = this.regex(this[settle[this.state]], this.check[name])
  }
  
  finallyFn(M){ //return and reset back to defaults
    let settle = {
      fulfilled:this.return,
      rejected:this.error
    }
    let output = {
      state:this.state,
      output:settle[this.state]
    }
    return output
  }
  
  test(args,category,key,{M=void 0,E=void 0,R=void 0}={}){ //batched into 1 function for ease of testing
    this.return = void 0
    this.error = void 0
    this.state = "pending"
    this.args = args
    this.tryFn()
    
    this.state = M??this.state //default is whatever result happened, M can override what result we care about
    this.catchFn(category)
    
    //if value is undefined revert back to defaults
    this.return ??= R
    this.error ??= E
    
    this.data[category] ??= {}
    this.data[category][key]=this.finallyFn(M).output
  }
  
  tick(){ //Test matrix, using the this.test api
    this.test([],"arity","min",{M:"rejected",E:0})
    this.test(Array(10000).fill(1),"arity","max",{M:"rejected",E:Infinity}) //TODO: add array to arg to handle "fulfilled" or "rejected"
    this.test(
      Array(
        this.data.arity.min
      )
        .fill(1)
        .map((e,i)=>{return {[i]:i}}),
      "type","1",{M:"rejected",E:"any"}
    )
  }
}
/*
api={
  giveItem:(...arg)=>{
    if(arg.length<2){
      throw new Error(`giveItem got too few arguments (${arg.length} < 2)`)
    }
    if(arg.length>4){
      throw new Error(`giveItem got too many arguments (${arg.length} > 4)`)
    }
  }
}
*/
API_Docs = new AutoDocs(api.giveItem) //create new doc
API_Docs.tick() //run a test
console.log(API_Docs.data) //log the resulting data
