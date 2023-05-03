import { sankey } from "./d3-sankey"

const create_storyline = (a, node_padding, calc_width, calc_height) => {
  console.log(`
  
  
  
  storyline vis import
  
  
  `)

  let sankeyLeft = (node) => node.depth
  let layout_function = sankeyLeft

  let storyline = (NL) => {
    // TODO abchecken obs geht
    const san = sankey()
      .nodeWidth(1)
      .nodePadding(node_padding)
      .extent([
        [0, 0],
        [calc_width, calc_height],
      ])
      .nodeAlign(layout_function)
      .iterations(1)
    console.log(`

    sankey

    `)
    console.log(san)
    let ret = san(NL)
    return ret
  }

  let out = storyline(a)

  return out
}

export default { create_storyline }
