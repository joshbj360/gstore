export interface MeasurementInterface {
    length?: number
    width?: number
    height?: number
    weight?: number
    unit?: string
}

export const defaultMeasurement: MeasurementInterface = {
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    unit: 'cm'
}

// export interface SizeInterface  {
//     value: string
//     stock?: number
// } 