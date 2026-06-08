import { director, Node } from 'cc';

/**
 * 场景枚举
 */
export enum SceneId {
    Title = 'Title',
    Main = 'Main',
    Settings = 'Settings',
    Credits = 'Credits',
}

/**
 * 场景管理器
 *
 * 提供统一的场景切换接口，支持可选的转场动画覆盖层。
 *
 * 用法：
 *   SceneManager.goTo(SceneId.Main);
 *   SceneManager.goTo(SceneId.Title, overlayNode);
 */
export class SceneManager {
    private static _currentScene: SceneId = SceneId.Main;

    /** 当前场景 */
    static get currentScene(): SceneId {
        return SceneManager._currentScene;
    }

    /**
     * 切换到指定场景
     * @param scene - 目标场景
     * @param overlay - 可选的转场覆盖节点（黑幕）
     */
    static goTo(scene: SceneId, overlay?: Node): void {
        if (overlay) {
            // 简易转场：淡入 → 加载场景 → Cocos 会自动卸载旧场景
            // 转场动画由 AnimationHelper.crossFade 处理
        }

        SceneManager._currentScene = scene;
        director.loadScene(scene);
    }

    /**
     * 预加载场景资源（不切换）
     */
    static preload(scene: SceneId): void {
        director.preloadScene(scene);
    }

    /**
     * 获取当前场景名称
     */
    static getCurrentName(): string {
        return director.getScene()?.name ?? '';
    }
}
