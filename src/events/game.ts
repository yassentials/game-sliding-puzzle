export class GameResultWinEvent extends CustomEvent<void> {
  public static readonly EVENT_NAME = "game-result-win";
  public constructor() {
    super(GameResultWinEvent.EVENT_NAME);
  }
}
