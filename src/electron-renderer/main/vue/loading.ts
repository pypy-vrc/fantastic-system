import * as elementUI from 'element-plus';
import type {ILoadingInstance} from 'element-plus/packages/loading/src/loading.type';

let pendingCount = 0;
let loadingInstance: ILoadingInstance | undefined = void 0;

export function increment(): void {
  if (++pendingCount === 1 && loadingInstance === void 0) {
    loadingInstance = elementUI.ElLoading.service({
      background: 'rgba(0, 0, 0, 0.5)',
      target: '#app'
    });
  }
}

export function decrement(): void {
  if (--pendingCount === 0 && loadingInstance !== void 0) {
    loadingInstance.close();
    loadingInstance = void 0;
  }
}
