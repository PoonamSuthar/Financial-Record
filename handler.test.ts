import { anonymizeUserDetails, encryptData, calculateRiskScore } from './handler';

test('anonymizeUserDetails', () => {
  const userDetails = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+11234567890',
  };
  const anonymized = anonymizeUserDetails(userDetails);
  expect(anonymized.firstName).toBe('Anonymous');
  expect(anonymized.lastName).toBe('User');
  expect(anonymized.email).not.toBe(userDetails.email);
  expect(anonymized.phone).not.toBe(userDetails.phone);
});

test('encryptData', () => {
  const data = { foo: 'bar' };
  const encrypted = encryptData(data);
  expect(encrypted.iv).toBeDefined();
  expect(encrypted.content).toBeDefined();
});

test('calculateRiskScore', () => {
  const transactionDetails = {
    amount: 2000,
    currency: 'USD',
    transactionDate: '2024-04-18T12:34:56Z',
    paymentMethod: 'CreditCard',
    merchantDetails: {
      merchantId: 'MERCHANT12345',
      name: 'Example Merchant',
      category: 'Electronics',
      countryCode: 'US'
    }
  };
  const riskScore = calculateRiskScore(transactionDetails);
  expect(riskScore).toBeGreaterThan(0);
});

