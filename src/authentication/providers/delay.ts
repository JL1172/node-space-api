export enum SLEEP {
  ONE,
  ONE_FIFTY,
  TWO,
  TWO_FIFTY,
}
export class Timing {
  private static readonly sleep_times: Record<SLEEP, number> = {
    [SLEEP.ONE]: 100,
    [SLEEP.ONE_FIFTY]: 150,
    [SLEEP.TWO]: 200,
    [SLEEP.TWO_FIFTY]: 250,
  } as const;
  public static async delay(sleep_time: SLEEP): Promise<void> {
    return await new Promise((resolve) =>
      setTimeout(resolve, this.sleep_times[sleep_time]),
    );
  }
  public static async random_delay(
    lower: number,
    upper: number,
  ): Promise<void> {
    const randomNumber = Math.random() * upper + lower;
    return await new Promise((resolve) => setTimeout(resolve, randomNumber));
  }
}
