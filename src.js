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
  catchFn(name){ //catch and parse error
    if(!this.error){return}
    this.error = this.regex(this.error, this.check[name])
  }
  finallyFn(){ //return and reset back to defaults
    let settle = {
      fulfilled:this.return,
      rejected:this.error
    }[this.state]
    let output = {
      state:this.state,
      output:settle
    }
    return output
  }
  
  test(args,category,key){ //batched into 1 function for ease of testing
    this.return = void 0
    this.error = void 0
    this.state = "pending"
    this.args = args
    
    this.tryFn()
    this.catchFn(category)
    this.data[category] ??= {}
    this.data[category][key]=this.finallyFn().output
  }
  
  tick(){ //Arity Test using test
    this.test([],"arity","min")
    this.test(Array(10000).fill(1),"arity","max") //TODO: add array to arg to handle "fulfilled" or "rejected"
    this.test(
      Array(
        +this.data.arity.min[0]
      ).fill(1).map((e,i)=>{
        return {[i]:i}
      }),
      "type",
      "1"
    )
  }
}
