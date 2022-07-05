/**
 * Manually forked from https://github.com/maxme/abi2solidity/blob/2eb5fd2ae9ac646074a8ae3f66a29a639a4bde61/src/abi2solidity.js
 */

 module.exports = function ABI2Solidity(abi, name) {
  const context = {
    registry: new Map(),
  }

  let body = ''
  for (const it of abi) {
    const definition = getMethodInterface(it, context);
    if (definition) body += `  ${definition};\n`
  }

  let neck = ''
  for (const [identify, definition] of context.registry.values()) {
    neck +=  `  ${identify} { ${definition} }\n`
  }

  return `interface ${name} {\n${neck}${body}}\n`;
}


function getInOrOut(inputs, ctx) {
  const buffer = []
  for (const input of inputs) {
    const type = (() => {
      if (input.type === 'tuple' || input.type === 'tuple[]') {
        const [kind, originalIdentify] = input.internalType.split(/\s+/)
        const isArray = originalIdentify.endsWith('[]')

        const define = originalIdentify.split('.').slice(1).join('.')
        const registeringName = isArray ? define.substring(0, define.length - 2) : define

        if (!ctx.registry.has(registeringName)) {
          ctx.registry.set(registeringName,
            [`${kind} ${registeringName}`, getInOrOut(input.components, { ...ctx, inline: true }).map(x => `${x};`).join(' ')]
          )
        }
        return `${define} ${ctx.case === 'in' ? 'calldata' : 'memory'}`
      }
      if (input.type === 'string' && !ctx.inline) {
        return `string calldata`
      }
      return input.type
    })()
    buffer.push(`${type} ${input.name}`)
  }
  return buffer
}

function getMethodInterface(method, ctx) {
  const out = [];
  // Type
  // Interfaces limitation: https://solidity.readthedocs.io/en/v0.4.24/contracts.html#interfaces
  if (method.type !== 'function') {
    return null;
  }
  out.push(method.type);
  // Name
  if (method.name) {
    out.push(method.name);
  }
  // Inputs
  out.push('(');
  out.push(getInOrOut(method.inputs, { ...ctx, case: 'in' }).join(', '));
  out.push(')');
  // Functions in ABI are either public or external and there is no difference in the ABI
  out.push('external');
  // State mutability
  if (method.stateMutability === 'pure') {
    out.push('pure');
  } else if (method.stateMutability === 'view') {
    out.push('view');
  } else if (method.stateMutability === 'pure') {
    out.push('pure');
  }
  // Payable
  if (method.payable) {
    out.push('payable');
  }
  // Outputs
  if (method.outputs && method.outputs.length > 0) {
    out.push('returns');
    out.push('(');
    out.push(getInOrOut(method.outputs, { ...ctx, case: 'out' }).join(', '));
    out.push(')');
  }
  return out.join(' ');
}
