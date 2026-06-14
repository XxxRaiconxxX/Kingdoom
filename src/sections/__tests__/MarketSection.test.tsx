import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MarketSection } from '../MarketSection'
import * as marketRotation from '../../features/market/market.rotation'
import { MARKET_CATEGORIES } from '../../data/market'

const cat1 = MARKET_CATEGORIES[0].id
const cat2 = MARKET_CATEGORIES[1].id
const cat3 = MARKET_CATEGORIES[2].id

const mockItems = [
  { id: '1', name: 'Item Potion', category: cat1, price: 10, rarity: 'common', featured: false, stockStatus: 'available' },
  { id: '2', name: 'Item Sword', category: cat2, price: 100, rarity: 'epic', featured: false, stockStatus: 'available' },
  { id: '3', name: 'Item Armor', category: cat3, price: 50, rarity: 'rare', featured: false, stockStatus: 'available' },
]

const mockSWR = vi.fn()
vi.mock('swr', () => ({
  default: (...args: any[]) => mockSWR(...args)
}))

const mockIsNativeApp = vi.fn()
vi.mock('../../utils/platform', () => ({
  isNativeApp: () => mockIsNativeApp()
}))

vi.mock('../../components/MarketItemCard', () => ({
  MarketItemCard: ({ item }: any) => <div data-testid={`item-card-${item.id}`}>{item.name} - {item.price} - {item.rarity}</div>
}))

describe('MarketSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsNativeApp.mockReturnValue(false)
    mockSWR.mockReturnValue({ data: { items: mockItems } })
    window.localStorage.clear()

    vi.spyOn(marketRotation, 'getMarketRotationState').mockReturnValue({
      items: mockItems as any,
      windowId: 0,
      nextRefreshAt: 0,
      nextRefreshLabel: "1h",
      activeRarities: ['common', 'rare', 'epic', 'mythic']
    })
  })

  it('renders the section header', () => {
    render(<MarketSection />)
    expect(screen.getByText('Catalogos del reino')).toBeInTheDocument()
  })

  it('displays all items initially', () => {
    render(<MarketSection />)
    expect(screen.getByTestId('item-card-1')).toBeInTheDocument()
    expect(screen.getByTestId('item-card-2')).toBeInTheDocument()
    expect(screen.getByTestId('item-card-3')).toBeInTheDocument()
  })

  it('filters by category', () => {
    render(<MarketSection />)

    const firstCategoryTab = screen.getByText(MARKET_CATEGORIES[0].title, { selector: 'button' })
    fireEvent.click(firstCategoryTab)

    expect(screen.queryByTestId('item-card-2')).not.toBeInTheDocument()
    expect(screen.getByTestId('item-card-1')).toBeInTheDocument()
  })

  it('filters by rarity and sorts by price', () => {
    render(<MarketSection />)

    const filterToggle = screen.getByText(/Ver filtros/i, { selector: 'button' })
    fireEvent.click(filterToggle)

    const rareFilter = screen.getByText('Raro', { selector: 'button' })
    fireEvent.click(rareFilter)

    expect(screen.queryByTestId('item-card-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('item-card-2')).not.toBeInTheDocument()
    expect(screen.getByTestId('item-card-3')).toBeInTheDocument()

    // Reset
    fireEvent.click(screen.getByText('Todas', { selector: 'button' }))
    expect(screen.getByTestId('item-card-1')).toBeInTheDocument()

    // Sort by price: click "Menor precio"
    const lowPriceSort = screen.getByText('Menor precio', { selector: 'button' })
    fireEvent.click(lowPriceSort)

    const cards = screen.getAllByTestId(/item-card-\d/)
    expect(cards.length).toBe(3)
  })

  it('changes tavern mode when clicked', () => {
    render(<MarketSection />)

    // There are multiple spans with 'Cofres' (mobile/desktop versions)
    const chestsModeSpans = screen.getAllByText('Cofres')

    // We get the first span and find its parent button
    const chestButton = chestsModeSpans[0].closest('button')!
    fireEvent.click(chestButton)

    // The description should now reflect the selected game
    const infoBtn = screen.getByText(/Info del modo/i).closest('button')!
    fireEvent.click(infoBtn)

    // Expect the Cofres specific text
    expect(screen.getByText('Doble o nada con cofres malditos y recompensas inmediatas.')).toBeInTheDocument()
  })

  it('shows liveHunt option in native app mode', () => {
    mockIsNativeApp.mockReturnValue(true)
    render(<MarketSection />)

    // "Comunal" is the shortLabel for liveHunt
    const liveHuntModeSpans = screen.getAllByText('Comunal')
    expect(liveHuntModeSpans.length).toBeGreaterThan(0)
  })

  it('hides liveHunt option in non-native app mode', () => {
    mockIsNativeApp.mockReturnValue(false)
    render(<MarketSection />)

    const liveHuntModeSpans = screen.queryAllByText('Comunal')
    // Comunal shouldn't render as a mode option
    expect(liveHuntModeSpans.length).toBe(0)
  })
})
