import OpenAI from 'openai'
import { getSettings } from '../store/settings'
import { inferZoningStandards } from './claude'

function getClient() {
  const { openaiApiKey } = getSettings()
  return new OpenAI({
    apiKey: openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  })
}

export async function generateConceptRender({ dealType, description, propertyFacts, municipality }) {
  const zoning = await inferZoningStandards({
    zoningCode: propertyFacts.zoning,
    municipality,
    lotSize: propertyFacts.lotSize,
  })

  const client = getClient()

  const dealTypeDescriptions = {
    multifamily: 'multifamily residential apartment building',
    commercial: 'commercial retail/office building',
    mixed_use: 'mixed-use building with ground floor commercial and residential above',
    single_family: 'single family home or ADU',
  }

  const prompt = `Architectural rendering of a ${dealTypeDescriptions[dealType] || 'building'}.
${description ? `Project: ${description}.` : ''}
Building constraints: maximum ${zoning.maxHeightStories} stories (${zoning.maxHeightFeet} feet tall).
${zoning.groundFloorUseRequired ? `Ground floor: ${zoning.groundFloorUseRequired}.` : ''}
Style: modern urban infill, realistic architectural rendering, street-level perspective, daytime, high quality, photorealistic.
No text or labels in the image.`

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  })

  return {
    url: response.data[0].url,
    zoningContext: zoning,
    prompt,
  }
}
