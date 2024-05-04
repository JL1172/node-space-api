import { execSync } from 'child_process';
import * as fs from 'fs';
import 'dotenv/config';

class Env {
  //field instances
  private static readonly envVariableErrorResponses: string[] = [
    'DATABASE_URL',
    'DB_PASS',
    'GMAIL',
    'GMAIL_PASS',
    'JWT_SECRET',
  ] as const;
  private static readonly blacklistedFiles: string[] = [
    '.env',
    // 'scripts/pre-commit.ts',
  ] as const;
  private static readonly backlistedPatterns: RegExp[] = [
    new RegExp(process.env.DATABASE_URL),
    new RegExp(process.env.DB_PASS),
    new RegExp(process.env.GMAIL),
    new RegExp(process.env.GMAIL_PASS),
    new RegExp(process.env.JWT_SECRET),
  ] as const;
  //avoid computing more than once
  private static readonly n = this.envVariableErrorResponses.length - 1;
  public static getEnvErrorMessage(idx: number): string | number {
    if (idx < 0 || idx > this.n) return -1;
    return this.envVariableErrorResponses[idx];
  }
  public static isFileBlacklisted(file: string): boolean {
    return this.blacklistedFiles.includes(file);
  }
  public static isCodeBlacklisted(codeSnippit: string): boolean {
    const n = this.backlistedPatterns.length;
    for (let i: number = 0; i < n; i++) {
      if (this.backlistedPatterns[i].test(codeSnippit)) {
        return true;
      }
    }
    return false;
  }
}
async function preCommitTestScript(): Promise<void> {
  try {
    const envVariables: string[] = [
      process.env.DATABASE_URL,
      process.env.DB_PASS,
      process.env.GMAIL,
      process.env.GMAIL_PASS,
      process.env.JWT_SECRET,
    ];
    const n = envVariables.length;
    for (let i: number = 0; i < n; i++) {
      if (!envVariables[i]) {
        const envVarMissing: string | number = Env.getEnvErrorMessage(i);
        throw new Error(`Environment variable ${envVarMissing} is undefined.`);
      }
    }
    const STAGED_FILES: string[] = execSync('git diff --staged --name-only', {
      encoding: 'utf-8',
    })
      .split('\n')
      .filter((n) => n);
    const stagedFileArrLength: number = STAGED_FILES.length;
    for (let i: number = 0; i < stagedFileArrLength; i++) {
      const fileContent = fs.readFileSync(STAGED_FILES[i], {
        encoding: 'utf-8',
      });
      if (Env.isCodeBlacklisted(fileContent) === true) {
        throw new Error(
          `File ${STAGED_FILES[i]} contains disallowed patterns. Verify no env variables are being leaked.`,
        );
      }
      if (Env.isFileBlacklisted(STAGED_FILES[i]) === true) {
        throw new Error(
          `File: ${STAGED_FILES[i]} disallowed from being staged.`,
        );
      }
    }
  } catch (err) {
    console.error('An Unexpected Error Occurred: ', err);
    process.exit(1);
  }
}

preCommitTestScript();
