export enum SLEEP {
  ONE,
  ONE_FIFTY,
  TWO,
  TWO_FIFTY,
  FIVE,
  SIX,
  FIVE_SECONDS,
}
export class Timing {
  private static readonly sleep_times: Record<SLEEP, number> = {
    [SLEEP.ONE]: 100,
    [SLEEP.ONE_FIFTY]: 150,
    [SLEEP.TWO]: 200,
    [SLEEP.TWO_FIFTY]: 250,
    [SLEEP.FIVE]: 500,
    [SLEEP.SIX]: 600,
    [SLEEP.FIVE_SECONDS]: 5000,
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
  public static async timeoutDelay(sleep_time: SLEEP): Promise<void> {
    return await new Promise((resolve, reject) =>
      setTimeout(() => {
        reject('Request Timeout');
      }, this.sleep_times[sleep_time]),
    );
  }
}
