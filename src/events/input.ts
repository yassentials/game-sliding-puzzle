export class MouseLeftClickEvent extends CustomEvent<{ x: number; y: number }> {
  public static readonly name = "mouse-left-click";
  public constructor(x: number, y: number) {
    super(MouseLeftClickEvent.name, {
      detail: {
        x,
        y,
      },
    });
  }
}
