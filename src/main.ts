import 'reflect-metadata';
import { container, injectable } from 'tsyringe';
import gameData from './config/game-data';
import { GEPService } from './services/gep-service';
import { GameDetectionService } from './services/game-detection-service';
import {
  GameClosedEvent,
  GameLaunchedEvent,
  PostGameEvent,
} from './interfaces/running-game';
import { GEPConsumer } from './services/gep-consumer';
import { AuthService } from './services/auth-service';

// -----------------------------------------------------------------------------
@injectable()
export class Main {
  loginButton = document.getElementById('discord-button');
  userGreeting = document.getElementById('userGreeting');
  server: any;

  public constructor(
    private readonly gepService: GEPService,
    private readonly gepConsumer: GEPConsumer,
    private readonly gameDetectionService: GameDetectionService,
    private readonly authService: AuthService,
  ) {
    this.loginButton?.addEventListener('click', () => {
      this.authService.login();
    });
    this.createServer();
    this.init();
  }

  createServer(): void {
    const _port = 61234;

    overwolf.web.createServer(_port, (serverInfo) => {
      if (serverInfo.error) {
        console.log('Failed to create server');
      } else {
        this.server = serverInfo.server;

        if (!this.server) {
          return;
        }

        // it is always good practice to removeListener before adding it
        this.server.onRequest.removeListener(this.onRequest.bind(this));
        this.server.onRequest.addListener(this.onRequest.bind(this));

        this.server.listen((info: any) => {
          console.log(`Server listening status on port ${_port} : ${info}`);
        });
      }
    });
  }

  onRequest(info: { url: string }) {
    const urlString = info.url;
    const url = new URL(urlString);
    const searchParams = url.searchParams;

    // eslint-disable-next-line camelcase
    const access_token = searchParams.get('access_token');
    // eslint-disable-next-line camelcase
    const token_type = searchParams.get('token_type');

    // eslint-disable-next-line camelcase
    if (access_token && token_type) {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('token_type', token_type);
      this.authService.getUser().then((data) => {
        const user = data.user;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.loginButton?.style.display = 'none';
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.userGreeting?.innerText = `Hi, ${user.username}. Enjoy playing games.`;
      });
    }
  }

  /**
   * Initializes this app
   */
  public init(): void {
    // Register for the `gameLaunched` event from the game detection service
    this.gameDetectionService.on(
      'gameLaunched',
      (gameLaunch: GameLaunchedEvent) => {
        console.log(`Game was launched: ${gameLaunch.name} ${gameLaunch.id}`);
        // Get the configured data for the launched game
        const gameConfig = gameData[gameLaunch.id];
        // If the detected game exists
        if (gameConfig) {
          this.gepService.gameLaunchId = gameLaunch.id;
          // Run the game launched logic of the gep service
          this.gepService.onGameLaunched(gameConfig.interestedInFeatures);
        }
      },
    );
    // Register for the `gameClosed` event from the gameDetectionService
    this.gameDetectionService.on(
      'gameClosed',
      (gameClosed: GameClosedEvent) => {
        console.log(`Game was closed: ${gameClosed.name}`);
        // Run game closed cleanup of the gep service
        this.gepService.onGameClosed();
      },
    );
    // Register for the `postGame` event from the gameDetectionService
    this.gameDetectionService.on('postGame', (postGame: PostGameEvent) => {
      console.log(`Running post-game logic for game: ${postGame.name}`);
    });

    // Register for the `gameEvent`, `infoUpdate`, and `error` gepService events
    this.gepService.on('gameEvent', this.gepConsumer.onNewGameEvent);
    this.gepService.on('infoUpdate', this.gepConsumer.onGameInfoUpdate);
    this.gepService.on('error', this.gepConsumer.onGEPError);

    // Handle Events to write data into database
    this.gepService.on('gameEvent', this.gepService.onNewGameEvent);
    this.gepService.on('infoUpdate', this.gepService.onGameInfoUpdate);

    // Initialize the game detection service
    this.gameDetectionService.init();
  }
}

container.resolve(Main);
