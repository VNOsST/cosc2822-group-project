import { Amplify } from 'aws-amplify'
import type { ResourcesConfig } from 'aws-amplify'

// Environment variables
const envVars = {
  region: import.meta.env.VITE_AWS_REGION,
  userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
  userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID,
  apiEndpoint: import.meta.env.VITE_API_ENDPOINT,
}

// Validate required environment variables
const requiredVars = ['region', 'userPoolId', 'userPoolClientId'] as const
const missingVars = requiredVars.filter((key) => !envVars[key])

if (missingVars.length > 0) {
  console.error(
    `Missing required AWS environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all VITE_AWS_* variables are set.',
  )
}

const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: envVars.userPoolId || '',
      userPoolClientId: envVars.userPoolClientId || '',
      signUpVerificationMethod: 'code' as const,
    },
  },
  API: {
    REST: {
      CineCloudApi: {
        endpoint: envVars.apiEndpoint || '',
        region: envVars.region || '',
      },
    },
  },
}

// Add region to Cognito config if available
if (envVars.region) {
  amplifyConfig.Auth = {
    ...amplifyConfig.Auth,
    Cognito: {
      ...amplifyConfig.Auth!.Cognito!,
      // @ts-ignore - region is valid but not in type definition
      region: envVars.region,
    },
  }
}

export function configureAmplify() {
  if (missingVars.length > 0) {
    console.warn(
      'Amplify configuration incomplete. Authentication may not work properly.',
    )
  }
  if (!envVars.apiEndpoint) {
    console.warn('API endpoint not configured. API calls may fail.')
  }
  Amplify.configure(amplifyConfig)
}

export default amplifyConfig
