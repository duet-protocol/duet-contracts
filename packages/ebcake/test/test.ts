import { expect } from 'chai'

describe('share algo compare', () => {
  return

  function a(deposit: number, totalShares: number, underlying: number) {
    return deposit * (totalShares / (underlying + deposit))
  }

  function b(deposit: number, totalShares: number, underlying: number) {
    return deposit * (totalShares / underlying)
  }

  it('a', () => {
    for (let i = 1, j = 2, k = 4; i < 10; i += i, j += j, k += k) {
      const shares = a(i, j, k)
      console.info('shares', shares)
      console.log({ i, j, k })
      const totalShares = j + shares
      const totalAmount = k + i
      expect((totalAmount / totalShares) * shares).equal(i)
      // previous amount of shares j
      expect((totalAmount / totalShares) * j).equal(k)
    }
  })

  it('b', () => {
    for (let i = 1, j = 2, k = 4; i < 10; i += i, j += j, k += k) {
      const shares = b(i, j, k)
      console.info('shares', shares)
      console.log({ i, j, k })

      const totalShares = j + shares
      const totalAmount = k + i
      expect((totalAmount / totalShares) * shares).equal(i)
      // previous amount of shares j
      expect((totalAmount / totalShares) * j).equal(k)
    }
  })
})
