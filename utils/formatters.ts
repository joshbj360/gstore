const formatPrice = (price: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price / 100);
const formatNumber = (num: number) => new Intl.NumberFormat().format(num);

export { formatPrice, formatNumber };