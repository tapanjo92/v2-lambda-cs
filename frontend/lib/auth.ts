import { CognitoUser } from 'amazon-cognito-identity-js';
import { userPool } from './cognito';

export function getCurrentUserSession(): Promise<any | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) return resolve(null);

    user.getSession((err: any, session: any) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
      } else {
        resolve(session);
      }
    });
  });
}

// New function to get JWT token
export async function getAccessToken(): Promise<string | null> {
  const session = await getCurrentUserSession();
  return session ? session.getAccessToken().getJwtToken() : null;
}

