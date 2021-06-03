import * as path from 'path';
import * as electron from 'electron';
import * as BetterSqlite3 from 'better-sqlite3';

let sqlite: BetterSqlite3.Database | undefined = void 0;

export function open(): void {
  if (sqlite !== void 0) {
    return;
  }

  sqlite = BetterSqlite3(
    path.join(electron.app.getPath('userData'), './data.sqlite3')
  );

  exec('PRAGMA locking_mode=EXCLUSIVE');
  exec('PRAGMA synchronous=NORMAL');
  exec('PRAGMA journal_mode=WAL');
  exec('PRAGMA wal_checkpoint(TRUNCATE)');
}

export function close(): void {
  if (sqlite === void 0) {
    return;
  }

  try {
    sqlite.close();
  } catch (err) {
    console.error(err);
  }

  sqlite = void 0;
}

export function exec(sql: string): boolean {
  if (sqlite === void 0) {
    return false;
  }

  try {
    sqlite.exec(sql);
    return true;
  } catch (err) {
    console.error(err);
  }

  return false;
}

export function query(sql: string, ...params: any[]): any[] | undefined {
  if (sqlite === void 0) {
    return;
  }

  try {
    let statement = sqlite.prepare(sql);

    if (params.length === 0) {
      return statement.all();
    }

    return statement.all(...params);
  } catch (err) {
    console.error(err);
  }
}

electron.ipcMain.handle('sqlite:exec', (_event, sql: string) => exec(sql));

electron.ipcMain.handle(
  'sqlite:query',
  (_event, sql: string, ...params: any[]) => query(sql, ...params)
);
