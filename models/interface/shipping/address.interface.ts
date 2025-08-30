export interface ShippingAddressInterface {
  id?: number
  userId: string;
  name: string;
  address: string;
  county?: string;
  state: string;
  phone: string;
  zipCode?: string;
  country: string;
  city: string;
  created_at: Date;
  updated_at: Date;
}

export const defaultShippingAddress: ShippingAddressInterface = {
  userId: '',
  name: 'customer name',
  address: 'customer address',
  zipCode: 'customer zip code',
  country: 'customer country',
  city: 'customer city',
  state: 'customer state',
  phone: 'customer phone',
  county: 'LGA/County',
  created_at: new Date(),
  updated_at: new Date(),

}