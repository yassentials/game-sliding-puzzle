export class GameResultWinEvent extends CustomEvent<void> {
  public static name = "game-result-win";
  public constructor() {
    super(GameResultWinEvent.name);
  }
}
