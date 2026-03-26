import { GoogleGenAI } from '@google/genai'
import { getSettings } from '../store/settings'

function getClient() {
  const { geminiApiKey } = getSettings()
  return new GoogleGenAI({ apiKey: geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY })
}

async function callGemini(prompt, maxTokens) {
  const { geminiApiKey } = getSettings()
  if (!geminiApiKey && !import.meta.env.VITE_GEMINI_API_KEY) throw new Error('Gemini API key not configured. Go to Settings.')
  const client = getClient()
  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: { maxOutputTokens: maxTokens },
  })
  return response.text
}

export async function detectDealType({ zoning, currentUse, lotSize, description }) {
  const prompt = `Given these property details, classify the deal type as one of: multifamily, commercial, mixed_use, single_family.\nZoning: ${zoning}, Current Use: ${currentUse}, Lot Size: ${lotSize} sf, Description: ${description}\nRespond with just the deal type key, nothing else.`
  const text = await callGemini(prompt, 100)
  return text.trim()
}

export async function generateModelAssumptions({ dealType, propertyFacts, lat, lng, inputs }) {
  const prompt = `You are a commercial real estate underwriting assistant. Given the following deal details, provide market-based assumptions for financial modeling.

Deal Type: ${dealType}
Property Facts: ${JSON.stringify(propertyFacts)}
Location: lat ${lat}, lng ${lng}
User Inputs: ${JSON.stringify(inputs)}

Respond with a JSON object containing these fields:
- marketRentPerUnit: estimated monthly market rent per unit (for multifamily)
- marketRentPerSf: estimated annual market rent per square foot (for commercial)
- vacancyRate: stabilized vacancy rate as a decimal (e.g. 0.05 for 5%)
- hardCostPerSf: construction hard cost per square foot
- softCostsPct: soft costs as a percentage of hard costs (decimal)
- exitCapRate: exit capitalization rate as a decimal
- financingCostsPct: total financing costs as a percentage of loan amount (decimal)
- opexRatio: operating expense ratio as a decimal
- sources: an object with a label and url for each assumption:
  {
    "marketRentPerUnit": { "label": "HUD FMR", "url": "https://www.huduser.gov/portal/datasets/fmr.html" },
    "marketRentPerSf": { "label": "Census CBP", "url": "https://www.census.gov/programs-surveys/cbp.html" },
    "vacancyRate": { "label": "Census ACS", "url": "https://data.census.gov" },
    "hardCostPerSf": { "label": "RSMeans", "url": "https://www.rsmeans.com" },
    "softCostsPct": { "label": "ULI Benchmark", "url": "https://uli.org" },
    "exitCapRate": { "label": "Gemini estimate", "url": null },
    "financingCostsPct": { "label": "Federal Reserve", "url": "https://www.federalreserve.gov/releases/h15/" },
    "opexRatio": { "label": "IREM", "url": "https://www.irem.org" }
  }

Respond with only valid JSON, no markdown or explanation.`
  const text = await callGemini(prompt, 1000)
  return JSON.parse(text)
}

export async function solveForPrice({ dealType, propertyFacts, inputs, assumptions, targetIrr, targetEquityMultiple }) {
  const prompt = `You are a commercial real estate underwriting assistant. Calculate the maximum land/acquisition price to hit target returns.

Deal Type: ${dealType}
Property Facts: ${JSON.stringify(propertyFacts)}
User Inputs: ${JSON.stringify(inputs)}
Market Assumptions: ${JSON.stringify(assumptions)}
Target IRR: ${targetIrr}%
Target Equity Multiple: ${targetEquityMultiple}x

Calculate the maximum purchase price that achieves the target returns. Respond with a JSON object:
{
  "maxPurchasePrice": <number>,
  "sensitivityTable": [
    { "constructionCostVariance": -10, "maxPrice": <number>, "irr": <number> },
    { "constructionCostVariance": 0, "maxPrice": <number>, "irr": <number> },
    { "constructionCostVariance": 10, "maxPrice": <number>, "irr": <number> }
  ],
  "reasoning": "<brief explanation of key assumptions and calculation methodology>"
}

Respond with only valid JSON, no markdown or explanation.`
  const text = await callGemini(prompt, 500)
  return JSON.parse(text)
}

export async function inferZoningStandards({ zoningCode, municipality, lotSize }) {
  const prompt = `You are a zoning and land use expert. Given the following zoning information, provide the development standards.

Zoning Code: ${zoningCode}
Municipality: ${municipality}
Lot Size: ${lotSize} sf

Respond with a JSON object:
{
  "maxHeightStories": <number>,
  "maxHeightFeet": <number>,
  "frontSetbackFt": <number>,
  "rearSetbackFt": <number>,
  "sideSetbackFt": <number>,
  "groundFloorUseRequired": "<use requirement or null>",
  "parkingRequired": "<parking requirement description>",
  "notes": "<any important notes about this zoning>"
}

Respond with only valid JSON, no markdown or explanation.`
  const text = await callGemini(prompt, 400)
  return JSON.parse(text)
}

export async function draftBrokerEmail({ contact, deal, outputs, userName }) {
  const prompt = `Draft a professional real estate outreach email from ${userName} to ${contact.name} (${contact.role} at ${contact.company}).

Property: ${deal.address}
Deal Type: ${deal.dealType}
Key Outputs: ${JSON.stringify(outputs)}

Write 3-4 short paragraphs, concise and professional. The email should introduce the sender, mention the specific property and deal opportunity, reference relevant financial metrics from the outputs, and include a clear call to action.`
  return await callGemini(prompt, 600)
}
