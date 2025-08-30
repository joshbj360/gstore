export interface ZoneRateInterface {
    id: string
    cost: number
    countries: string[]
    states: string[]
}

export interface ShippingZoneInterface {
    id: string
    name: string
    isDefault: boolean
    rates: ZoneRateInterface[]
}