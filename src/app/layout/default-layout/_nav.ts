import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    badge: {
      color: 'info',
      text: 'NEW'
    }
  },
  {
    title: true,
    name: 'Menu'
  },
  {
    name: 'Orders',
    url: '/invoice/orders',
    iconComponent: { name: 'cil-puzzle' },
  },
  {
    name: 'Customers',
    url: '/invoice/customers',
    iconComponent: { name: 'cil-cursor' },
  },
  {
    name: 'Products',
    url: '/invoice/products',
    iconComponent: { name: 'cil-notes' },
  },
  {
    name: 'Billing',
    url: '/invoice/billing',
    iconComponent: { name: 'cil-chart-pie' },
  },
  {
    name: 'Reports',
    url: '/invoice/reports',
    iconComponent: { name: 'cil-star' },
  },
];
