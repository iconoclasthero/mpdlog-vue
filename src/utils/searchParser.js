function parseQuery(q){
  const groups = splitOrGroups(q)
  return groups.map(parseGroup)
}

/* ---------------- OR GROUP SPLIT ---------------- */
function splitOrGroups(q){
  return q
    .split(/\s*(?:\|\||\||\bOR\b)\s*/i)
    .map(x => x.trim())
    .filter(Boolean)
}

/* ---------------- GROUP PARSER ---------------- */
/*function parseGroup(str){
  const tokens = tokenize(str)
  const conds = []
  for(let i=0;i<tokens.length;i++){
    const t = tokens[i]
    const cond = parseToken(tokens,i)
    if(cond){
      conds.push(cond.cond)
      i += cond.skip
    }
  }
  return conds
}
*/
/* ---------------- GROUP PARSER ---------------- */
function parseGroup(str){
  const tokens = tokenize(str)
  const conds = []

  for(let i=0;i<tokens.length;i++){
    let cond

    // check for 3-token pattern: field OP value
    if(i + 2 < tokens.length){
      const field = normalizeField(tokens[i])
//      const op = tokens[i+1]
      let op = tokens[i+1]
      const value = stripQuotes(tokens[i+2])

      // valid operators
      const validOps = ['=','==','!=','>=','<=','>','<','starts_with','startswith','starts','contains','!~','~','=~']
      if(validOps.includes(op) && !UNARY_FIELDS.has(field)){
        if(op === '=') op = '=='

        if(op === 'startswith' || op === 'starts') op = 'starts_with'
        cond = {
          skip: 2,
          cond: { field, op, value, not:'', unary:false }
        }
      }
    }

    // fallback to original parseToken
    if(!cond){
      cond = parseToken(tokens,i)
    }

    if(cond){
      // support both cond and conds arrays from parseToken
      if(cond.cond) conds.push(cond.cond)
      if(cond.conds) conds.push(...cond.conds)
      i += cond.skip
    }
  }

  return conds
}

/* ---------------- TOKENIZER ---------------- */
function tokenize(str){
  const tokens = []
  let buf = ""
  let quote = null
  let esc = false

  for(const ch of str){
    if(esc){
      buf += ch
      esc = false
      continue
    }
    if(ch === "\\"){
      esc = true
      continue
    }
    if(quote){
      if(ch === quote){
        quote = null
      } else {
        buf += ch
      }
      continue
    }
    if(ch === '"' || ch === "'"){
      quote = ch
      continue
    }
    if(/\s/.test(ch)){

      if(buf){
        tokens.push(buf)
        buf=""
      }
      continue
    }
    buf += ch
  }
  if(buf)
    tokens.push(buf)
  return tokens
}

/* ---------------- FIELD ALIASES ---------------- */
const FIELD_ALIASES = {
  a:  "artist",
  aa: "albumartist",
  al: "album",
  t:  "title",
  g:  "genre",
  y:  "date",
  tr: "track"
}

/* ---------------- UNARY FIELDS ---------------- */
const UNARY_FIELDS = new Set([
  "base",
  "modified-since",
  "added-since"
])


/* ---------------- TOKEN PARSER ---------------- */

function parseToken(tokens,i){

  let t = tokens[i]

  let not = ""

  if(t.startsWith("!")){
    not = "!"
    t = t.slice(1)
  }

  /* unary */

//  if(UNARY_FIELDS.has(t)){
//
//    const value = tokens[i+1] || ""
//
//    return {
//      skip:1,
//      cond:{
//        field:t,
//        value,
//        op:null,
//        not,
//        unary:true
//      }
//    }
//  }

//if(UNARY_FIELDS.has(t)){
const field = normalizeField(t)

if(UNARY_FIELDS.has(field)){
  const maybeOp = tokens[i+1]
  const maybeVal = tokens[i+2]
  const OPS = new Set([
    '=', '==','!=','>=','<=','>','<',
    'starts_with','startswith','starts',
    'contains','~','!~'
  ])

  if(OPS.has(maybeOp)){
    return {
      skip:2,
      cond:{
        field:t,
        op:maybeOp,
        value:stripQuotes(maybeVal || ""),
        not,
        unary:true
      }
    }
  }

  const value = tokens[i+1] || ""

  return {
    skip:1,
    cond:{
      field:t,
      op:null,
      value:stripQuotes(value),
      not,
      unary:true
    }
  }
}

  /* operator detection */

  const m = t.match(/^([^:=<>!~]+)(==|!=|>=|<=|>|<|:|=|~|!~)?(.+)?$/)

  if(m){

    let [,field,op,value] = m

    field = normalizeField(field)

    if(op){

      if(op === ":" || op === "=")
        op = "=="

      if(op === "~")
        op = "=~"

      value = value || ""

      value = stripQuotes(value)

      return {
        skip:0,
        cond:{
          field,
          op,
          value,
          not,
          unary:false
        }
      }

    }

  }

  /* repetition delimiter */

  if(t.includes(",") || t.includes(";")){

    const parts = t.split(/[;,]/)

    return {
      skip:0,
      conds:parts.map(v=>({
        field:"any",
        op:"contains",
        value:v,
        not:"",
        unary:false
      }))
    }

  }

  /* bareword */

  return {
    skip:0,
    cond:{
      field:"any",
      op:"contains",
      value:t,
      not:"",
      unary:false
    }
  }

}


/* ---------------- HELPERS ---------------- */
function normalizeField(f){
  if(FIELD_ALIASES[f])
    return FIELD_ALIASES[f]
  return f
}


function stripQuotes(v){
  if(!v)
    return v
  if(
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ){
    return v.slice(1,-1)
  }
  return v
}

export { tokenize, parseQuery }
