import { injectable } from 'tsyringe';
import { GameFileName } from '../config/game-data';
import { environment } from '../environment/environment';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface User {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
  public_flags: number;
  premium_type: number;
  flags: number;
  banner: any;
  accent_color: any;
  global_name: any;
  avatar_decoration_data: any;
  banner_color: any;
  mfa_enabled: any;
  locale: string;
}

@injectable()
export class AuthService {
  user: User | null = null;

  constructor() {}

  async getUser(): Promise<any> {
    try {
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');

      if (!accessToken || !tokenType) {
        console.log('invalid token');
        // Reject the promise if access token or token type is missing
        return Promise.reject(new Error('Invalid token'));
      }

      const response = await fetch(environment.url + '/auth/discord/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            access_token: accessToken,
            token_type: tokenType,
          },
        }),
      });

      if (response.ok) {
        // Parse and return the JSON data
        return response.json();
      } else {
        console.error('Error:', response.statusText);
        // Reject the promise with an error message
        return Promise.reject(new Error(response.statusText));
      }
    } catch (error: any) {
      console.error('Error:', error.message);
      // Reject the promise with the caught error
      return Promise.reject(error);
    }
  }

  async login(): Promise<void> {
    try {
      const response = await fetch(environment.url + '/auth/discord/login', {
        method: 'GET',
      });

      response.json().then((data) => {
        overwolf.utils.openUrlInDefaultBrowser(data.url);
      });
    } catch (error: any) {
      console.error('Error:', error.message);
    }
  }
}
