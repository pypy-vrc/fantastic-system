import * as idb from "idb";
import * as vue from "vue";
import { i18n } from "../i18n";
import { router } from "./router";
import * as App from "./vue/app/index.vue";

// @ts-expect-error sex
const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

// function showWarningMessage() {
//   for (let i = 0; i < 3; ++i) {
//     setTimeout(() => {
//       console.log(
//         '%cCareful! This might not do what you think.',
//         'background-color: red; color: yellow; font-size: 32px; font-weight: bold'
//       );
//       console.log(
//         '%cIf someone told you to copy-paste something here, it will give them access to your account.',
//         'font-size: 20px;'
//       );
//     }, i * 1500);
//   }
// }

(function main() {
  const app = vue.createApp(App.default);
  app.use(i18n);
  app.use(router);
  app.mount("#app");

  // var warn = new Function();
  // // @ts-ignore
  // warn.toString = showWarningMessage;
  // console.log(warn);
})();

(async () => {
  const db = await idb.openDB("vrchat-logs", 1, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log("db.upgrade", { oldVersion, newVersion });

      if (oldVersion < 1) {
        const store = db.createObjectStore("rows", {
          keyPath: ["f", "t", "n"],
        });
        store.createIndex("by-time", "t", {
          multiEntry: true,
          unique: false,
        });
      }

      transaction;
    },
  });

  ipcRenderer.on(
    "vrchatLog",
    async (_e, fileName: string, rows: unknown[][]) => {
      try {
        const tx = db.transaction("rows", "readwrite");
        const store = tx.objectStore("rows");
        await Promise.all(
          rows.map((row) =>
            store.put({
              a: row.slice(2),
              f: fileName,
              t: row[1],
              n: row[0],
            })
          )
        );
        await tx.done;
      } catch (err) {
        console.error(err);
      }
    }
  );

  // sweep old logs
  await (async () => {
    try {
      const tx = db.transaction("rows", "readwrite");
      const store = tx.objectStore("rows");
      const index = store.index("by-time");
      let cursor = await index.openCursor(
        IDBKeyRange.bound(0, Math.floor(Date.now() / 1000) - 86400 * 180)
      );
      while (cursor !== null) {
        await cursor.delete();
        cursor = await cursor.continue();
      }
    } catch (err) {
      console.error(err);
    }
  })();

  // await (async () => {
  //   const tx = db.transaction("rows", "readonly");
  //   const store = tx.objectStore("rows");
  //   console.log(
  //     "count",
  //     await store.count(
  //       IDBKeyRange.bound(
  //         ["output_log_07-33-10.txt", 0],
  //         ["output_log_07-33-10.txt", Infinity]
  //       )
  //     )
  //   );
  //   const index = store.index("by-time");
  //   console.log("prev", await index.openCursor(null, "prev"));
  //   console.log("next", await index.openCursor(null, "next"));
  // })();
})();
