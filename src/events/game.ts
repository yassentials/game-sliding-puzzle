export class GameResultWinEvent extends CustomEvent<void> {
  public static readonly name = "game-result-win";
  public constructor() {
    super(GameResultWinEvent.name);
  }
}
