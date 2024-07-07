import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import * as crypto from 'crypto';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

interface Transaction {
  transactionId: string;
  userId: string;
  transactionDetails: {
    amount: number;
    currency: string;
    transactionDate: string;
    paymentMethod: string;
    merchantDetails: {
      merchantId: string;
      name: string;
      category: string;
      countryCode: string;
    };
  };
  userDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    billingAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  additionalInfo: {
    deviceIp: string;
    userAgent: string;
  };
}

const secretKey = 'your_secret_key';

const anonymizeUserDetails = (userDetails: any) => {
  const hash = crypto.createHmac('sha256', secretKey)
    .update(userDetails.email)
    .digest('hex');
  return {
    ...userDetails,
    firstName: 'Anonymous',
    lastName: 'User',
    email: hash,
    phone: crypto.createHash('sha256').update(userDetails.phone).digest('hex'),
  };
};

const encryptData = (data: any) => {
  const algorithm = 'aes-256-ctr';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex')
  };
};

const calculateRiskScore = (transactionDetails: any) => {
  let riskScore = 0;
  if (transactionDetails.amount > 1000) riskScore += 20;
  if (transactionDetails.currency !== 'USD') riskScore += 10;
  // Add more risk assessment criteria here...
  return riskScore;
};

export const processTransaction: APIGatewayProxyHandler = async (event, _context) => {
  const body: Transaction = JSON.parse(event.body);

  const anonymizedUserDetails = anonymizeUserDetails(body.userDetails);
  const riskScore = calculateRiskScore(body.transactionDetails);

  const record = {
    transactionId: uuidv4(),
    anonymizedUserDetails: encryptData(anonymizedUserDetails),
    riskScore,
    transactionDetails: body.transactionDetails,
    additionalInfo: body.additionalInfo
  };

  const params = {
    TableName: 'Transactions',
    Item: record
  };

  await dynamoDb.put(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Transaction processed successfully',
      transactionId: record.transactionId,
    }),
  };
};
