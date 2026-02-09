import { CRAFT_DADDY_LOGO_URL } from './assets/brand';

export const INDIAN_STATES = [
  { name: 'Delhi', code: '07' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Karnataka', code: '29' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Gujarat', code: '24' },
  { name: 'West Bengal', code: '19' },
  { name: 'Telangana', code: '36' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Haryana', code: '06' },
];

export const CRAFT_DADDY_LOGO_SVG = CRAFT_DADDY_LOGO_URL;

export const INITIAL_USER_PROFILE = {
  companyName: 'Craft Daddy',
  logoUrl: CRAFT_DADDY_LOGO_URL,
  address: {
    street: 'E-167, West Vinod Nagar, I.P.Extension',
    city: 'Delhi',
    state: 'Delhi',
    stateCode: '07',
    pincode: '110092',
    country: 'India',
  },
  gstin: '07CCDPK8228H1ZI',
  pan: 'CCDPK8228H',
  bankAccounts: [
    {
      accountName: 'CRAFT DADDY',
      accountNumber: '768501010050325',
      ifscCode: 'UBIN0576859',
      bankName: 'UNION BANK OF INDIA',
      branchName: 'I.P. Extension',
      accountType: 'Current'
    },
  ],
};