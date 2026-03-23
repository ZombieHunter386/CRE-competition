// Back-solve: given target IRR + equity multiple, find max land price
// Uses binary search iterating over land price until returns match targets
export function solveMaxPrice({ inputs, assumptions, targetIrr, targetEquityMultiple }) {
  const { gfa, units, retailSf, holdPeriod, equityPct } = inputs
  const { hardCostPerSf, softCostsPct, financingCostsPct, marketRentPerUnit,
    marketRentPerSf, vacancyRate, exitCapRate, opexRatio } = assumptions

  // hardCostOverride allows sensitivity table to vary construction costs
  function calcReturns(landPrice, hardCostOverride = hardCostPerSf) {
    const hardCosts = hardCostOverride * gfa
    const softCosts = hardCosts * softCostsPct
    const totalDevCost = landPrice + hardCosts + softCosts
    const financingCosts = totalDevCost * financingCostsPct
    const tdc = totalDevCost + financingCosts
    const equity = tdc * equityPct

    const resIncome = units * marketRentPerUnit * 12 * (1 - vacancyRate)
    const retailIncome = retailSf * marketRentPerSf * (1 - vacancyRate)
    const noi = (resIncome + retailIncome) * (1 - opexRatio)
    const exitValue = noi / exitCapRate

    // Simple IRR approximation over hold period
    const annualCashFlow = noi - (tdc * (1 - equityPct) * 0.065) // debt service approx
    const equityMultiple = (equity + annualCashFlow * holdPeriod + exitValue * equityPct) / equity

    // Approximate IRR using Newton's method
    let irr = 0.1
    for (let i = 0; i < 100; i++) {
      const npv = -equity + annualCashFlow * ((1 - Math.pow(1 + irr, -holdPeriod)) / irr) +
        (exitValue * equityPct) / Math.pow(1 + irr, holdPeriod)
      const dnpv = annualCashFlow * (Math.pow(1 + irr, -holdPeriod) * holdPeriod / irr -
        (1 - Math.pow(1 + irr, -holdPeriod)) / (irr * irr)) -
        holdPeriod * (exitValue * equityPct) / Math.pow(1 + irr, holdPeriod + 1)
      irr -= npv / dnpv
    }

    return { irr: irr * 100, equityMultiple }
  }

  function solveAtVariance(variance) {
    const adjustedHardCostPerSf = hardCostPerSf * (1 + variance)
    let lo2 = 0, hi2 = 50_000_000
    for (let i = 0; i < 60; i++) {
      const mid = (lo2 + hi2) / 2
      const { irr } = calcReturns(mid, adjustedHardCostPerSf)
      if (irr > targetIrr) hi2 = mid
      else lo2 = mid
    }
    return (lo2 + hi2) / 2
  }

  // Binary search for land price that hits target IRR
  let lo = 0, hi = 50_000_000
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const { irr } = calcReturns(mid)
    if (irr > targetIrr) hi = mid
    else lo = mid
  }

  const maxPrice = (lo + hi) / 2
  const finalReturns = calcReturns(maxPrice)

  return {
    maxPurchasePrice: Math.round(maxPrice / 1000) * 1000,
    irr: finalReturns.irr,
    equityMultiple: finalReturns.equityMultiple,
    sensitivityTable: [-0.1, 0, 0.1].map(v => ({
      constructionCostVariance: v,
      maxPrice: Math.round(solveAtVariance(v) / 1000) * 1000,
    })),
  }
}
