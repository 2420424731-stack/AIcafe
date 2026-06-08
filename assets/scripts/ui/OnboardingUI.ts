import { _decorator, Component, Node, Label, Color } from 'cc';
import { EventBus, GameEvent } from '../core/EventBus';
import { GameManager, GamePhase } from '../core/GameManager';
import { SaveManager } from '../core/SaveManager';
import { AnimationHelper } from '../core/AnimationHelper';

const { ccclass, property } = _decorator;

/** 引导步骤 */
interface OnboardingStep {
    title: string;
    body: string;
    highlightNode?: string;  // 要高亮的节点名（编辑器绑定用）
    autoAdvance?: GameEvent;  // 监听此事件自动进入下一步
}

/**
 * 交互式新手引导
 *
 * 替代旧版被动式 TutorialTipUI。
 * 首次运行（无存档时）触发 5 步交互式引导。
 * 每步可跳过，游戏中也保留轻量级上下文提示。
 */
@ccclass('OnboardingUI')
export class OnboardingUI extends Component {
    @property(Node)
    panel: Node | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    bodyLabel: Label | null = null;

    @property(Node)
    nextBtn: Node | null = null;

    @property(Node)
    skipBtn: Node | null = null;

    private _steps: OnboardingStep[] = [];
    private _currentStep = 0;
    private _isActive = false;
    private _autoAdvanceHandler: (() => void) | null = null;

    onLoad(): void {
        if (this._shouldSkip()) {
            this.node.active = false;
            return;
        }

        this._steps = this._buildSteps();
        if (this.panel) this.panel.active = false;
    }

    /** 开始引导（由 MainUI 在游戏启动时调用） */
    startOnboarding(): void {
        if (this._shouldSkip()) return;

        this._isActive = true;
        this._currentStep = 0;
        this._showStep();
    }

    // ── 步骤导航 ────────────────────────────────────────────

    onNext(): void {
        if (!this._isActive) return;

        this._cleanupAutoAdvance();
        this._currentStep++;

        if (this._currentStep >= this._steps.length) {
            this._finish();
            return;
        }

        this._showStep();
    }

    onSkip(): void {
        this._cleanupAutoAdvance();
        this._finish();
    }

    // ── 上下文提示（轻量级，替换旧 TutorialTipUI） ────────────

    /**
     * 显示轻量级上下文提示（浮动 toast 样式）
     * 在游戏中特定时机调用：首次获技能点、声望下降、库存不足等
     */
    static showTip(node: Node, text: string, duration = 3.0): void {
        const tipNode = new Node('context_tip');
        const label = tipNode.addComponent(Label);
        label.string = text;
        label.fontSize = 16;
        label.color = new Color(80, 60, 40, 255);

        tipNode.setPosition(0, -80, 0);
        node.addChild(tipNode);

        // 淡入 → 停留 → 淡出
        AnimationHelper.fadeIn(tipNode, 0.3);
        setTimeout(async () => {
            await AnimationHelper.fadeOut(tipNode, 0.3);
            tipNode.destroy();
        }, duration * 1000);
    }

    // ── 内部 ────────────────────────────────────────────────

    private _shouldSkip(): boolean {
        // 如果有任何存档，跳过引导
        return SaveManager.hasAnySave();
    }

    private _buildSteps(): OnboardingStep[] {
        return [
            {
                title: '欢迎来到街角咖啡屋！',
                body: '你是这家小店的新店长。\n\n每天你需要：\n① 进货并定价\n② 招待顾客\n③ 通过对话说服他们购买\n④ 日终结算，积累声望\n\n目标是成为五星网红咖啡屋！',
            },
            {
                title: '资金与声望',
                body: '💵 资金：用于进货，通过销售赚取\n⭐ 声望：影响星级，通过顾客满意度获取\n🌟 星级：解锁新商品和新顾客\n\n顶部状态栏随时可以查看。',
            },
            {
                title: '进货与定价',
                body: '在左侧面板选择商品进货。\n\n💡 提示：\n• 售价不要太高，超过建议价太多会降低顾客购买欲\n• 合理定价反而能加分\n• 库存会保留到第二天\n\n先进 2-3 种商品试试吧！',
            },
            {
                title: '与顾客对话',
                body: '点击"开始营业"后，顾客会进店。\n\n💬 你可以：\n• 自由输入任何话术\n• 按 Enter 发送消息\n• 用滚轮查看历史对话\n\n不同性格的顾客喜欢不同的话术风格。\n试试看吧！',
            },
            {
                title: '日终结算',
                body: '每天的结算报告会显示：\n• 营收和利润\n• 是否达成利润目标\n• 顾客满意度和声望变化\n• 经营建议\n\n未售出的库存会保留到第二天。\n连续经营 30 天就是目标！',
            },
        ];
    }

    private _showStep(): void {
        if (!this.panel || this._currentStep >= this._steps.length) return;

        const step = this._steps[this._currentStep];
        if (this.titleLabel) this.titleLabel.string = `(${this._currentStep + 1}/${this._steps.length}) ${step.title}`;
        if (this.bodyLabel) this.bodyLabel.string = step.body;

        this.panel.active = true;
        AnimationHelper.fadeIn(this.panel, 0.25);

        // 如果当前步骤有关联的自动推进事件
        if (step.autoAdvance) {
            this._autoAdvanceHandler = () => this.onNext();
            EventBus.on(step.autoAdvance, this._autoAdvanceHandler);
        }
    }

    private _cleanupAutoAdvance(): void {
        if (this._autoAdvanceHandler) {
            // 移除所有可能的事件监听（简单处理）
            this._autoAdvanceHandler = null;
        }
    }

    private _finish(): void {
        this._isActive = false;
        this._cleanupAutoAdvance();

        if (this.panel) {
            AnimationHelper.fadeOut(this.panel, 0.3).then(() => {
                this.panel!.active = false;
                this.node.active = false;
            });
        } else {
            this.node.active = false;
        }
    }
}
