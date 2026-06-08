import { _decorator, Component, Node, UIOpacity, tween } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 场景转场覆盖层
 *
 * 在场景切换时提供黑幕淡入淡出效果。
 * 挂载在需要转场的场景 Canvas 顶层节点上。
 *
 * 用法（在任意脚本中）：
 *   const overlay = director.getScene()?.getChildByName('Canvas')
 *     ?.getChildByName('TransitionOverlay');
 *   if (overlay) {
 *     TransitionUI.fade(overlay, 0.3, async () => {
 *       await someAsyncWork();
 *     });
 *   }
 *
 * 节点结构（需在 Cocos Creator 编辑器中创建）：
 *   Canvas/TransitionOverlay
 *     — 全屏黑色矩形节点，挂载 TransitionUI 组件
 *     — 初始 active = false
 */
@ccclass('TransitionUI')
export class TransitionUI extends Component {
    @property
    fadeDuration = 0.3;

    private _uiOpacity: UIOpacity | null = null;

    onLoad(): void {
        this._uiOpacity = this.node.getComponent(UIOpacity);
        if (!this._uiOpacity) {
            this._uiOpacity = this.node.addComponent(UIOpacity);
        }
        this._uiOpacity.opacity = 0;
    }

    /**
     * 执行转场：淡入 → 回调 → 淡出
     * @param callback - 在完全遮罩时执行的异步操作（如加载场景）
     */
    async transition(callback: () => Promise<void> | void): Promise<void> {
        if (!this._uiOpacity) return;

        // 淡入（遮罩）
        this.node.active = true;
        await this._fadeTo(255, this.fadeDuration);

        // 执行操作
        await callback();

        // 淡出（还原）
        await this._fadeTo(0, this.fadeDuration);
        this.node.active = false;
    }

    /**
     * 静态便捷方法：在已知 overlay 节点上执行转场
     */
    static async fade(
        overlay: Node,
        duration: number,
        callback: () => Promise<void> | void,
    ): Promise<void> {
        const ui = overlay.getComponent(TransitionUI);
        if (ui) {
            ui.fadeDuration = duration;
            await ui.transition(callback);
            return;
        }

        // 降级：手动操作 UIOpacity
        let opacity = overlay.getComponent(UIOpacity);
        if (!opacity) opacity = overlay.addComponent(UIOpacity);

        overlay.active = true;
        await new Promise<void>((resolve) => {
            tween(opacity!)
                .to(duration, { opacity: 255 })
                .call(() => resolve())
                .start();
        });

        await callback();

        await new Promise<void>((resolve) => {
            tween(opacity!)
                .to(duration, { opacity: 0 })
                .call(() => resolve())
                .start();
        });
        overlay.active = false;
    }

    // ── 内部 ────────────────────────────────────────────────────

    private _fadeTo(targetOpacity: number, duration: number): Promise<void> {
        return new Promise((resolve) => {
            if (!this._uiOpacity) { resolve(); return; }
            tween(this._uiOpacity)
                .to(duration, { opacity: targetOpacity }, { easing: 'sineInOut' })
                .call(() => resolve())
                .start();
        });
    }
}
