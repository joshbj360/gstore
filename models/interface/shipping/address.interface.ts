export interface ShippingAddressInterface {
  id?: number
  name: string;
  address: string;
  localGovernmentArea?: string;
  state: string;
  phoneNumber: string;
  postalCode?: string;
  country: string;
  email?: string;
  city: string;
}

export const defaultShippingAddress: ShippingAddressInterface = {
   name: '',
  address: '',
  postalCode: '',
  country: '',
  city: '',
  state: '',
  phoneNumber: '',
}