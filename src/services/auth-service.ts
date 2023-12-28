import { injectable } from 'tsyringe';
import { GameFileName } from '../config/game-data';
import { environment } from '../environment/environment';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

@injectable()
export class AuthService {
  constructor() {}

  getUser(): void {}

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
