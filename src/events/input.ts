export class MouseLeftClickEvent extends CustomEvent<{ x: number; y: number }> {
  public static readonly EVENT_NAME = "mouse-left-click";
  public constructor(x: number, y: number) {
    super(MouseLeftClickEvent.EVENT_NAME, {
      detail: {
        x,
        y,
      },
    });
  }
}
