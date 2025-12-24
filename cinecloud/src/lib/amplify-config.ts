import { Amplify } from 'aws-amplify'
import type { ResourcesConfig } from 'aws-amplify'

// Validate required environment variables
const requiredEnvVars = {
  region: import.meta.env.VITE_AWS_REGION,
  userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
  userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID,
}

// Check if any required env vars are missing
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  console.error(
    `Missing required AWS Cognito environment variables: ${missingVars.join(', ')}\n` +
    'Please check your .env file and ensure all VITE_AWS_* variables are set.'
  )
}

const amplifyConfig: ResourcesConfig = {  
  Auth: {
    Cognito: {
      userPoolId: requiredEnvVars.userPoolId || '',
      userPoolClientId: requiredEnvVars.userPoolClientId || '',
      signUpVerificationMethod: 'code' as const,
    },
  },
}

// Add region to the config if available
if (requiredEnvVars.region) {
  amplifyConfig.Auth = {
    ...amplifyConfig.Auth,
    Cognito: {
      ...amplifyConfig.Auth.Cognito,
      // @ts-ignore - region is valid but not in type definition
      region: requiredEnvVars.region,
    },
  }
}

export function configureAmplify() {
  if (missingVars.length > 0) {
    console.warn('Amplify configuration incomplete. Authentication may not work properly.')
  }
  Amplify.configure(amplifyConfig)
}

export default amplifyConfig
