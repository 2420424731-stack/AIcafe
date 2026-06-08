import { Node, Label, Vec3, tween, Color, UIOpacity } from 'cc';

/**
 * 动画工具类
 *
 * 提供常用的 UI 动效预设，用于提升游戏的交互反馈和视觉体验。
 * 所有方法均为静态，可直接调用，无需挂载组件。
 */
export class AnimationHelper {
    // ── 聊天气泡 ──────────────────────────────────────────────

    /** 气泡弹出：缩放入 + 轻微上滑 */
    static animateBubbleIn(node: Node, duration = 0.25): void {
        node.setScale(0.8, 0.8, 1);
        const targetPos = node.position.clone();
        const startPos = targetPos.clone();
        startPos.y -= 15;
        node.setPosition(startPos);

        tween(node)
            .parallel(
                tween(node).to(duration, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }),
                tween(node).to(duration, { position: targetPos }, { easing: 'sineOut' }),
            )
            .start();
    }

    // ── 成就弹出 ──────────────────────────────────────────────

    /** 成就弹窗：弹出 + 弹跳 */
    static animateAchievementPopup(node: Node): void {
        node.setScale(0, 0, 1);
        tween(node)
            .to(0.3, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
            .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'sineIn' })
            .delay(2.0)
            .to(0.3, { scale: new Vec3(0, 0, 1) }, { easing: 'backIn' })
            .start();
    }

    // ── 面板滑动 ──────────────────────────────────────────────

    /** 面板滑入（从右侧或底部） */
    static animatePanelSlideIn(node: Node, direction: 'left' | 'right' | 'bottom' = 'right', duration = 0.35): void {
        const target = node.position.clone();
        const start = target.clone();

        switch (direction) {
            case 'right': start.x += 200; break;
            case 'left': start.x -= 200; break;
            case 'bottom': start.y -= 100; break;
        }

        node.setPosition(start);
        tween(node)
            .to(duration, { position: target }, { easing: 'sineOut' })
            .start();
    }

    // ── 按钮反馈 ──────────────────────────────────────────────

    /** 按钮按压：短暂缩小后恢复 */
    static animateButtonPress(node: Node): void {
        tween(node)
            .to(0.05, { scale: new Vec3(0.95, 0.95, 1) })
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    // ── 数字变动 ────────────────────────────────────────────

    /** 浮动文字：从指定位置飘起并淡出 */
    static animateFloatingText(
        parent: Node,
        text: string,
        color: Color,
        startPos: Vec3,
        duration = 1.2,
    ): void {
        const node = new Node('floating_text');
        node.setPosition(startPos);
        parent.addChild(node);

        const label = node.addComponent(Label);
        label.string = text;
        label.color = color;
        label.fontSize = 20;

        const uiOpacity = node.addComponent(UIOpacity);
        uiOpacity.opacity = 255;

        const targetPos = startPos.clone();
        targetPos.y += 40;

        tween(node)
            .parallel(
                tween(node).to(duration, { position: targetPos }, { easing: 'sineOut' }),
                tween(uiOpacity).to(duration * 0.7, { opacity: 255 })
                    .to(duration * 0.3, { opacity: 0 }),
            )
            .call(() => node.destroy())
            .start();
    }

    // ── 淡入淡出 ──────────────────────────────────────────────

    /** 节点淡入 */
    static fadeIn(node: Node, duration = 0.3): void {
        let uiOpacity = node.getComponent(UIOpacity);
        if (!uiOpacity) uiOpacity = node.addComponent(UIOpacity);
        uiOpacity.opacity = 0;
        tween(uiOpacity)
            .to(duration, { opacity: 255 }, { easing: 'sineOut' })
            .start();
    }

    /** 节点淡出 */
    static fadeOut(node: Node, duration = 0.3): Promise<void> {
        return new Promise((resolve) => {
            let uiOpacity = node.getComponent(UIOpacity);
            if (!uiOpacity) uiOpacity = node.addComponent(UIOpacity);
            tween(uiOpacity)
                .to(duration, { opacity: 0 }, { easing: 'sineIn' })
                .call(() => resolve())
                .start();
        });
    }

    // ── 打字机效果 ──────────────────────────────────────────

    /**
     * 打字机效果：逐字显示文本
     * @param label - Cocos Label 组件
     * @param fullText - 完整文本
     * @param speed - 每字间隔（毫秒），instant=0, normal=40, typewriter=80
     */
    static async typewriter(label: Label, fullText: string, speed: number): Promise<void> {
        if (speed <= 0) {
            label.string = fullText;
            return;
        }

        label.string = '';
        for (let i = 0; i < fullText.length; i++) {
            label.string += fullText[i];
            await AnimationHelper._delay(speed);
        }
    }

    // ── 转场 ──────────────────────────────────────────────────

    /** 黑幕转场：淡入 → 回调 → 淡出 */
    static async crossFade(
        overlay: Node,
        duration = 0.3,
        callback: () => Promise<void> | void,
    ): Promise<void> {
        await AnimationHelper.fadeIn(overlay, duration);
        await callback();
        await AnimationHelper.fadeOut(overlay, duration);
    }

    // ── 内部 ────────────────────────────────────────────────

    private static _delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
