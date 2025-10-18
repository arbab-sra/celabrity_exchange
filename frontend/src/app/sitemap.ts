
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  
  return [
    {
      url: 'https://exchange.arbab.fun',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://exchange.arbab.fun/markets',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: 'https://exchange.arbab.fun/account',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: 'https://exchange.arbab.fun/leaderboard',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: 'https://exchange.arbab.fun/market',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
    },
    {
      url: 'https://exchange.arbab.fun/creator-earnings',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.3,
    },

  ]
}
