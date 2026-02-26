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
          pattern: RegExp(`^${this.fn.name} got too few arguments \\((\\d+) < (\\d+)\\)$`),
          extractor: (m) => m[2]
        },
        {
          pattern: RegExp(`^${this.fn.name} got too many arguments \\((\\d+) > (\\d+)\\)$`),
          extractor: (m) => m[2]
        }
      ]
    }
    this.errFn = {
      arity:e=>e
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

  regex(line, patterns, strict = true, debug = false) {
    let results = []

    for (const patternObj of patterns) {
      const { name, pattern, extractor } = patternObj

      const parseResult = this.parse(line, pattern, extractor, strict)
      if (parseResult.success) {
        results.push({
          parser: name,
          line,
          data: parseResult.data
        })
      }
    }
    
    if(!debug){
      results = results.map(e=>e.data)
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
    this.error = this.errFn[name](this.error)
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
    this.return = void 0
    this.error = void 0
    this.state = "pending"
    this.args = void 0
    return output
  }
  
  test(args,category,key){ //batched into 1 function for ease of testing
    this.args = args
    
    this.tryFn()
    this.catchFn(category)
    this.data[category] ??= {}
    this.data[category][key]=this.finallyFn()
  }
  
  arity(){ //Arity Test using test
    this.test([],"arity","min")
    this.test(Array(100).fill(1),"arity","max")
  }
}
